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

const PYTHON_API_URL = (process.env.PYTHON_API_URL || 'http://localhost:8000').replace(/\/+$/, '');

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
      timeout: 60000 // 60 seconds to allow for network transfer
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
 * @param {Array} appliedZones - Array of objects {zone, texture_image_path}
 * @param {string} preset - Optional preset like 'wainscoting'
 * @returns {Promise<object>} The result containing renderedUrl
 */
async function generateImage(imageUrl, appliedZones, preset = null) {
  console.log(`[SegBridge] Sending request to Python API (${PYTHON_API_URL}/generate)...`);
  try {
    const response = await axios.post(`${PYTHON_API_URL}/generate`, {
      image_path: imageUrl,
      applied_zones: appliedZones,
      preset: preset
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
      const detail = err.response.data?.detail;
      const errorMsg = typeof detail === 'object' ? JSON.stringify(detail) : detail || err.message;
      throw new Error(`Python API Error: ${errorMsg}`);
    } else if (err.code === 'ECONNREFUSED') {
      throw new Error('Python generation API is not running. Did you start it with uvicorn?');
    }
    throw err;
  }
}

module.exports = { segmentImage, generateImage, downloadToTemp };
