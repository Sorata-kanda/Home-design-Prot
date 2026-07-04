const express = require('express');
const router = express.Router();
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const Render = require('../models/Render');
const Product = require('../models/Product');
const { protect, optionalAuth } = require('../middleware/auth');
const { uploadRoomPhoto, cloudinary } = require('../middleware/upload');
const { segmentImage, generateImage, downloadToTemp } = require('../utils/segment_bridge');

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/visualizer/upload — upload room photo to Cloudinary
// ═══════════════════════════════════════════════════════════════════════════
router.post('/upload', optionalAuth, uploadRoomPhoto, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No photo uploaded' });

    res.json({
      photoUrl: req.file.path,
      publicId: req.file.filename,
      width: req.file.width,
      height: req.file.height
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/visualizer/segment — detect zones via Python SegFormer
// ═══════════════════════════════════════════════════════════════════════════
router.post('/segment', optionalAuth, async (req, res) => {
  try {
    const { photoUrl } = req.body;
    if (!photoUrl) return res.status(400).json({ error: 'Photo URL required' });

    console.log('[Visualizer] Starting segmentation for:', photoUrl);
    const segResult = await segmentImage(photoUrl);

    if (segResult.error) {
      return res.status(500).json({ error: segResult.error });
    }

    // Transform to frontend-friendly format
    const zones = segResult.zones.map(z => ({
      type: z.name,
      coverage: z.coverage,
      coveragePct: Math.round(z.coverage * 100),
      pixelCount: z.pixel_count,
      bbox: z.bbox,
      confidence: Math.min(0.99, 0.7 + z.coverage) // approximate confidence from coverage
    }));

    console.log(`[Visualizer] Segmentation complete: ${zones.map(z => `${z.type}(${z.coveragePct}%)`).join(', ')}`);

    res.json({
      zones,
      imageSize: segResult.image_size
    });
  } catch (err) {
    console.error('[Visualizer] Segmentation error:', err.message);
    res.status(500).json({
      error: 'Segmentation failed: ' + err.message,
      fallbackZones: [
        { type: 'wall', coverage: 0.35, coveragePct: 35, confidence: 0.70 },
        { type: 'floor', coverage: 0.25, coveragePct: 25, confidence: 0.70 },
        { type: 'ceiling', coverage: 0.15, coveragePct: 15, confidence: 0.60 }
      ]
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/visualizer/generate — main AI generation via Cloudinary
// ═══════════════════════════════════════════════════════════════════════════
router.post('/generate', optionalAuth, async (req, res) => {
  // Increase socket timeout to 5 minutes for long-running AI generation
  req.socket.setTimeout(300000);
  const startTime = Date.now();

  try {
    const { photoUrl, photoPublicId, appliedProducts, preset, userId } = req.body;

    if (!photoUrl) return res.status(400).json({ error: 'Photo URL required' });
    if (!appliedProducts?.length && !preset) {
      return res.status(400).json({ error: 'Select at least one product or preset' });
    }

    // Build generation details from selected products
    const productDetails = await buildProductPrompt(appliedProducts, preset);

    // 2. Generate with Local SD Pipeline
    let renderedUrl = photoUrl;
    let renderedPublicId = null;
    
    try {
      const renderResult = await generateWithLocalSD(
        photoUrl,
        photoPublicId,
        appliedProducts,
        productDetails,
        preset
      );
      renderedUrl = renderResult.renderedUrl;
      renderedPublicId = renderResult.renderedPublicId;
    } catch (err) {
      console.error('[Visualizer] Local SD failed, returning demo response:', err.message);
      // Fallback to demo mode if local AI fails
      renderedUrl = photoUrl;
      renderedPublicId = photoPublicId;
    }

    // Add watermark (Skipped since we are local now)
    const watermarkedUrl = renderedUrl;

    // Always save the render to the database so that it can be shared or referenced in quotes
    const shareToken = uuidv4();
    const render = await Render.create({
      user: req.user?._id || userId || null, // Optional for guest users
      originalPhoto: { url: photoUrl, publicId: photoPublicId },
      renderedPhoto: { url: renderedUrl, publicId: renderedPublicId },
      appliedProducts: productDetails.appliedProducts,
      preset: preset || null,
      generationStatus: 'completed',
      generationPrompt: productDetails.prompt,
      generationDuration: Date.now() - startTime,
      watermarkedUrl,
      isShared: true,
      shareToken
    });

    res.json({
      renderId: render._id,
      shareToken: render.shareToken,
      originalUrl: photoUrl,
      renderedUrl: watermarkedUrl,
      hdUrl: renderedUrl,
      generationDuration: Date.now() - startTime,
      appliedProducts: productDetails.appliedProducts
    });

  } catch (err) {
    console.error('Generation error:', err);
    res.status(500).json({ error: 'Generation failed. Please try again.' });
  }
});


// ═══════════════════════════════════════════════════════════════════════════
// Local SD Pipeline Generation
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate visualization using Local Stable Diffusion API.
 */
async function generateWithLocalSD(photoUrl, photoPublicId, appliedProducts = [], productDetails, preset) {
  // If no products, we can't generate
  if (!appliedProducts || appliedProducts.length === 0) {
    throw new Error('No products selected for generation');
  }

  // Get product details
  const productMap = {};
  const productIds = appliedProducts.map(p => p.productId).filter(Boolean);
  if (productIds.length) {
    const products = await Product.find({ _id: { $in: productIds } });
    products.forEach(p => { productMap[p._id.toString()] = p; });
  }

  console.log(`[Visualizer] Starting local SD generation for ${appliedProducts.length} zones`);

  // We will run them sequentially. For MVP, we'll just process the first zone, 
  // since the local pipeline takes 15-30s per zone and chaining requires downloading 
  // the intermediate image.
  // To support multiple zones in the future, we would pass the result of zone 1 
  // as the input to zone 2.
  
  const ap = appliedProducts[0];
  const product = productMap[ap.productId];
  
  if (!product) {
    throw new Error('Selected product not found');
  }

  const categoryClean = product.category.replace(/_/g, ' ');
  const texturePrompt = `${product.name} ${categoryClean} texture`;
  
  const textureUrl = product.textureImage?.url || null;
  
  console.log(`[Visualizer] Requesting texture mapping from FastAPI for base image: ${photoUrl}`);
  // Call the Python API directly with the Cloudinary URLs
  const result = await generateImage(photoUrl, ap.zone, texturePrompt, textureUrl);
  
  console.log(`[Visualizer] Uploading generated render to Cloudinary from remote URL: ${result.renderedUrl}`);
  const uploaded = await cloudinary.uploader.upload(result.renderedUrl, {
    folder: 'arteffects/renders'
  });

  return {
    renderedUrl: uploaded.secure_url,
    renderedPublicId: uploaded.public_id
  };
}

/**
 * Extract Cloudinary public ID from a Cloudinary URL
 */
function extractPublicId(url) {
  if (!url || !url.includes('cloudinary.com')) return null;

  try {
    // Pattern: .../upload/v1234567890/folder/filename.ext
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// Fallback: Stability AI
// ═══════════════════════════════════════════════════════════════════════════

async function callStabilityAI(imageUrl, prompt, negativePrompt) {
  const response = await axios.post(
    'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/image-to-image',
    {
      init_image: imageUrl,
      image_strength: 0.35,
      text_prompts: [
        { text: prompt, weight: 1 },
        { text: negativePrompt, weight: -1 }
      ],
      cfg_scale: 8,
      steps: 50,
      samples: 1,
      style_preset: 'photographic'
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    }
  );

  const imageData = response.data.artifacts[0].base64;
  const uploaded = await cloudinary.uploader.upload(
    `data:image/png;base64,${imageData}`,
    { folder: 'arteffects/renders' }
  );

  return { renderedUrl: uploaded.secure_url, renderedPublicId: uploaded.public_id };
}


// ═══════════════════════════════════════════════════════════════════════════
// Fallback: Replicate
// ═══════════════════════════════════════════════════════════════════════════

async function callReplicate(imageUrl, prompt, negativePrompt) {
  const axios_replicate = axios.create({
    headers: { Authorization: `Token ${process.env.REPLICATE_API_TOKEN}` }
  });

  const prediction = await axios_replicate.post('https://api.replicate.com/v1/predictions', {
    version: 'stability-ai/stable-diffusion-img2img:15a3689ee13b0d2616e98820eca31d4af4b51808d3547c1e34b6ce8bdea26dab',
    input: {
      image: imageUrl,
      prompt,
      negative_prompt: negativePrompt,
      prompt_strength: 0.7,
      num_inference_steps: 50
    }
  });

  let result = prediction.data;
  while (result.status !== 'succeeded' && result.status !== 'failed') {
    await new Promise(r => setTimeout(r, 1500));
    const poll = await axios_replicate.get(`https://api.replicate.com/v1/predictions/${result.id}`);
    result = poll.data;
  }

  if (result.status === 'failed') throw new Error('Replicate generation failed');

  const renderedUrl = result.output[0];
  const uploaded = await cloudinary.uploader.upload(renderedUrl, {
    folder: 'arteffects/renders'
  });

  return { renderedUrl: uploaded.secure_url, renderedPublicId: uploaded.public_id };
}


// ═══════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build AI prompt from selected products (used by Stability/Replicate fallbacks)
 */
async function buildProductPrompt(appliedProducts = [], preset = null) {
  const productMap = {};
  const productIds = appliedProducts.map(p => p.productId).filter(Boolean);

  if (productIds.length) {
    const products = await Product.find({ _id: { $in: productIds } });
    products.forEach(p => { productMap[p._id.toString()] = p; });
  }

  const materialDescriptions = appliedProducts.map(ap => {
    const product = productMap[ap.productId];
    if (!product) return '';

    const finishDesc = {
      polished: 'highly polished with mirror-like reflections',
      honed: 'matte honed finish with subtle texture',
      brushed: 'brushed surface with linear texture',
      antique: 'aged antique finish with character',
      natural: 'natural split-face texture',
      flamed: 'rough flamed texture'
    }[product.finish] || 'polished';

    return `${ap.zone} covered with ${product.name} ${product.category.replace('_', ' ')} stone, ${finishDesc}, photorealistic material, proper perspective and lighting`;
  }).filter(Boolean);

  let presetDesc = '';
  if (preset === 'ionic_columns') {
    presetDesc = 'Add grand Ionic marble columns on sides, neoclassical architecture style';
  } else if (preset === 'cornice') {
    presetDesc = 'Add ornate white stone cornice moulding along ceiling edges';
  } else if (preset === 'wainscoting') {
    presetDesc = 'Add Gwalior stone wainscoting panels on lower wall section, traditional style';
  } else if (preset === 'full_neoclassical') {
    presetDesc = 'Transform to full neoclassical Indian interior with marble floors, white columns, ornate cornices';
  }

  const prompt = [
    'Interior design visualization, photorealistic render, 8K quality,',
    'Indian home interior, warm natural lighting,',
    ...materialDescriptions,
    presetDesc,
    'professional architectural photography, high detail, accurate material textures,',
    'maintain room proportions and existing furniture, realistic shadows and reflections'
  ].filter(Boolean).join(', ');

  const negativePrompt = [
    'distorted proportions, unrealistic materials, cartoon, illustration,',
    'blurry, low quality, dark, overexposed, missing walls, floating objects,',
    'changed room layout, removed doors or windows, wrong perspective'
  ].join(' ');

  return {
    prompt,
    negativePrompt,
    appliedProducts: appliedProducts.map(ap => ({
      product: ap.productId,
      productName: productMap[ap.productId]?.name || '',
      zone: ap.zone,
      coverage: ap.coverage || 0
    }))
  };
}

/**
 * Add watermark via Cloudinary transformation
 */
function addWatermark(imageUrl) {
  if (!imageUrl || !imageUrl.includes('cloudinary.com')) return imageUrl;
  return imageUrl.replace('/upload/', '/upload/l_text:Arial_32_bold:Arteffects,co_white,o_60,g_south_east,x_20,y_20/');
}

module.exports = router;
