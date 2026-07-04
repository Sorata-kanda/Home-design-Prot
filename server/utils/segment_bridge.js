/**
 * Segment Bridge — Node.js ↔ Python SegFormer bridge
 * 
 * Downloads a Cloudinary image to a temp file, communicates with the
 * Python FastAPI microservice, and returns structured zone data.
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const axios = require('axios');

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000';

/**
 * Download image from URL to a temp file
 * @param {string} url - Image URL (typically Cloudinary)
 * @returns {Promise<string>} Path to downloaded temp file
 */
async function downloadToTemp(url) {
  const ext = path.extname(new URL(url).pathname) || '.jpg';
  const tmpPath = path.join(os.tmpdir(), `arteffects_seg_${Date.now()}${ext}`);

  const response = await axios({
    method: 'GET',
    url,
    responseType: 'stream',
    timeout: 30_000,
  });

  const writer = fs.createWriteStream(tmpPath);
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', () => resolve(tmpPath));
    writer.on('error', (err) => {
      fs.unlink(tmpPath, () => {});
      reject(err);
    });
  });
}

/**
 * Run Python segmentation and return zone data
 * @param {string} imageUrl - Cloudinary URL of the room photo
 * @returns {Promise<{zones: Array, image_size: {width: number, height: number}}>}
 */
async function segmentImage(imageUrl) {
  let tmpPath = null;

  try {
    console.log(`[SegBridge] Sending request to Python API (${PYTHON_API_URL}/segment)...`);
    const response = await axios.post(`${PYTHON_API_URL}/segment`, {
      image_path: imageUrl
    }, {
      timeout: 30000 // Fast timeout, inference should take < 1s
    });

    const result = response.data;
    console.log(`[SegBridge] Detected ${result.zones?.length || 0} zones`);
    return result;

  } catch (err) {
    if (err.response) {
      throw new Error(`Python API Error: ${err.response.data?.detail || err.message}`);
    } else if (err.code === 'ECONNREFUSED') {
      throw new Error('Python segmentation API is not running. Did you start it with uvicorn?');
    }
    throw err;
  }
}

/**
 * Call Python FastAPI for SD/Texture Mapping Generation
 * @param {string} imageUrl - Remote URL to the base image
 * @param {string} zone - The zone to replace
 * @param {string} texturePrompt - The texture prompt
 * @param {string} textureImageUrl - Remote URL of the product texture
 * @returns {Promise<object>} The result containing renderedUrl
 */
async function generateImage(imageUrl, zone, texturePrompt, textureImageUrl = null) {
  console.log(`[SegBridge] Sending request to Python API (${PYTHON_API_URL}/generate)...`);
  try {
    const response = await axios.post(`${PYTHON_API_URL}/generate`, {
      image_path: imageUrl,
      zone: zone,
      texture_prompt: texturePrompt,
      texture_image_path: textureImageUrl
    }, {
      timeout: 300000 // 5 minutes
    });
    
    // Convert relative uvicorn path (/temp/render_xxx.jpg) to a fully qualified URL
    const data = response.data;
    if (data.renderedUrl && data.renderedUrl.startsWith('/')) {
      data.renderedUrl = `${PYTHON_API_URL}${data.renderedUrl}`;
    }
    return data;
  } catch (err) {
    if (err.response) {
      throw new Error(`Python API Error: ${err.response.data?.detail || err.message}`);
    } else if (err.code === 'ECONNREFUSED') {
      throw new Error('Python generation API is not running. Did you start it with uvicorn?');
    }
    throw err;
  }
}

module.exports = { segmentImage, generateImage, downloadToTemp };
