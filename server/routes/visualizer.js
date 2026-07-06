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

    // Add Cloudinary watermark as requested
    const watermarkedUrl = addWatermark(renderedUrl);

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
    throw new Error('Please select at least one product material to apply.');
  }

  // Get product details
  const productMap = {};
  const productIds = appliedProducts.map(p => p.productId).filter(Boolean);
  if (productIds.length) {
    const products = await Product.find({ _id: { $in: productIds } }).lean();
    products.forEach(p => { productMap[p._id.toString()] = p; });
  }

  // Build the array of zones and textures
  const appliedZones = appliedProducts.map(ap => {
    const product = productMap[ap.productId];
    return {
      zone: ap.zone,
      texture_image_path: product?.textureImage?.url || null
    };
  }).filter(z => z.texture_image_path);

  if (appliedZones.length === 0) {
    throw new Error('No valid textures found for selected products');
  }

  console.log(`[Visualizer] Starting local multi-zone mapping for ${appliedZones.length} zones`);

  // Call the Python API directly with the Cloudinary URLs
  const result = await generateImage(photoUrl, appliedZones, preset);
  
  console.log(`[Visualizer] Downloading render from Python API: ${result.renderedUrl}`);
  const localTempPath = await downloadToTemp(result.renderedUrl);
  
  console.log(`[Visualizer] Uploading generated render to Cloudinary`);
  const uploaded = await cloudinary.uploader.upload(localTempPath, {
    folder: 'arteffects/renders'
  });
  
  require('fs').unlinkSync(localTempPath);

  return {
    renderedUrl: uploaded.secure_url,
    renderedPublicId: uploaded.public_id
  };
}

// Helper: Call Stability AI or Replicate for img2img
async function generateVisualization(imageUrl, prompt, negativePrompt) {
  const stabilityKey = process.env.STABILITY_API_KEY;
  const replicateToken = process.env.REPLICATE_API_TOKEN;
  
  const hasStability = stabilityKey && stabilityKey !== 'your_stability_ai_key' && stabilityKey.trim() !== '';
  const hasReplicate = replicateToken && replicateToken !== 'your_replicate_token' && replicateToken.trim() !== '';

  try {
    if (hasStability) {
      return await callStabilityAI(imageUrl, prompt, negativePrompt);
    } else if (hasReplicate) {
      return await callReplicate(imageUrl, prompt, negativePrompt);
    } else {
      // Demo mode: return original image with demo watermark
      console.warn('No AI API key configured, returning demo response');
      return { renderedUrl: imageUrl, renderedPublicId: null };
    }
  } catch (err) {
    throw new Error(`AI generation failed: ${err.message}`);
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// Fallback: Stability AI
// ═══════════════════════════════════════════════════════════════════════════

async function callStabilityAI(imageUrl, prompt, negativePrompt) {
  // Download the init_image as an arraybuffer
  const imgResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
  const blob = new Blob([imgResponse.data], { type: 'image/png' });

  const formData = new FormData();
  formData.append('init_image', blob, 'init_image.png');
  formData.append('image_strength', '0.35');
  formData.append('text_prompts[0][text]', prompt);
  formData.append('text_prompts[0][weight]', '1');
  formData.append('text_prompts[1][text]', negativePrompt);
  formData.append('text_prompts[1][weight]', '-1');
  formData.append('cfg_scale', '8');
  formData.append('steps', '50');
  formData.append('samples', '1');
  formData.append('style_preset', 'photographic');

  const response = await axios.post(
    'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/image-to-image',
    formData,
    {
      headers: {
        Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
        Accept: 'application/json'
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
  while (result.status !== 'succeeded' && result.status !== 'failed' && result.status !== 'canceled') {
    await new Promise(r => setTimeout(r, 1500));
    const poll = await axios_replicate.get(`https://api.replicate.com/v1/predictions/${result.id}`);
    result = poll.data;
  }

  if (result.status === 'failed' || result.status === 'canceled') {
    throw new Error(`Replicate generation ${result.status}`);
  }

  const renderedUrl = result.output[0];
  const uploaded = await cloudinary.uploader.upload(renderedUrl, {
    folder: 'arteffects/renders'
  });

  return { renderedUrl: uploaded.secure_url, renderedPublicId: uploaded.public_id };
}

// Helper: Add watermark via Cloudinary transformation
function addWatermark(imageUrl) {
  if (!imageUrl.includes('cloudinary.com')) return imageUrl;
  const watermarkText = encodeURIComponent(process.env.WATERMARK_TEXT || 'Arteffects');
  return imageUrl.replace('/upload/', `/upload/l_text:Arial_32_bold:${watermarkText},co_white,o_60,g_south_east,x_20,y_20/`);
}

/**
 * Add watermark via Cloudinary transformation
 */
function addWatermark(imageUrl) {
  if (!imageUrl || !imageUrl.includes('cloudinary.com')) return imageUrl;
  const watermarkText = encodeURIComponent(process.env.WATERMARK_TEXT || 'Arteffects');
  return imageUrl.replace('/upload/', `/upload/l_text:Arial_32_bold:${watermarkText},co_white,o_60,g_south_east,x_20,y_20/`);
}

module.exports = router;
