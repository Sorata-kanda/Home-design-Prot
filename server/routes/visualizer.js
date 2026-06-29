const express = require('express');
const router = express.Router();
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const Render = require('../models/Render');
const Product = require('../models/Product');
const { protect, optionalAuth } = require('../middleware/auth');
const { uploadRoomPhoto, cloudinary } = require('../middleware/upload');

// POST /api/visualizer/upload — upload room photo
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

// POST /api/visualizer/segment — detect zones in uploaded photo
router.post('/segment', optionalAuth, async (req, res) => {
  try {
    const { photoUrl } = req.body;
    if (!photoUrl) return res.status(400).json({ error: 'Photo URL required' });

    // Call Replicate's segmentation model (SAM or similar)
    // Returns detected zones: floor, wall, ceiling, pillars, etc.
    const zones = await detectZones(photoUrl);
    res.json({ zones });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/visualizer/generate — main AI generation
router.post('/generate', optionalAuth, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { photoUrl, photoPublicId, appliedProducts, preset, userId } = req.body;
    
    if (!photoUrl) return res.status(400).json({ error: 'Photo URL required' });
    if (!appliedProducts?.length && !preset) {
      return res.status(400).json({ error: 'Select at least one product or preset' });
    }

    // Build generation prompt from selected products
    const productDetails = await buildProductPrompt(appliedProducts, preset);
    
    // Call AI image generation (Stability AI / Replicate)
    const { renderedUrl, renderedPublicId } = await generateVisualization(
      photoUrl,
      productDetails.prompt,
      productDetails.negativePrompt
    );

    // Add watermark
    const watermarkedUrl = addWatermark(renderedUrl);
    
    // Save render to DB (requires auth for persistence, otherwise ephemeral)
    let render = null;
    const userIdToUse = req.user?._id || userId;
    
    if (userIdToUse) {
      render = await Render.create({
        user: userIdToUse,
        originalPhoto: { url: photoUrl, publicId: photoPublicId },
        renderedPhoto: { url: renderedUrl, publicId: renderedPublicId },
        appliedProducts: productDetails.appliedProducts,
        preset: preset || null,
        generationStatus: 'completed',
        generationPrompt: productDetails.prompt,
        generationDuration: Date.now() - startTime,
        watermarkedUrl
      });
    }

    res.json({
      renderId: render?._id,
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

// Helper: Build AI prompt from selected products
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

// Helper: Call Stability AI or Replicate for img2img
async function generateVisualization(imageUrl, prompt, negativePrompt) {
  // Using Stability AI img2img API
  // Replace with Replicate or other provider as needed
  
  try {
    if (process.env.STABILITY_API_KEY) {
      return await callStabilityAI(imageUrl, prompt, negativePrompt);
    } else if (process.env.REPLICATE_API_TOKEN) {
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

async function callReplicate(imageUrl, prompt, negativePrompt) {
  const axios_replicate = axios.create({
    headers: { Authorization: `Token ${process.env.REPLICATE_API_TOKEN}` }
  });

  // Start prediction
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

  // Poll for result
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

// Helper: Add watermark via Cloudinary transformation
function addWatermark(imageUrl) {
  if (!imageUrl.includes('cloudinary.com')) return imageUrl;
  return imageUrl.replace('/upload/', '/upload/l_text:Arial_32_bold:Arteffects,co_white,o_60,g_south_east,x_20,y_20/');
}

// Helper: Detect zones using SAM or similar
async function detectZones(photoUrl) {
  // Simplified zone detection
  // In production, use Meta SAM via Replicate or a custom segmentation model
  return [
    { type: 'wall', confidence: 0.92, description: 'Main walls detected' },
    { type: 'floor', confidence: 0.95, description: 'Floor area detected' },
    { type: 'ceiling', confidence: 0.78, description: 'Ceiling detected' }
  ];
}

module.exports = router;
