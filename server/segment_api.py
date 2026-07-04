"""
Local two-stage room texture replacement pipeline
Wrapped as a FastAPI Microservice
GTX 1650 compatible (4GB VRAM)
"""
import os
import time
import uuid
import cv2
import numpy as np
import torch
import urllib.request
import tempfile
from PIL import Image
from transformers import SegformerForSemanticSegmentation, SegformerImageProcessor
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.staticfiles import StaticFiles

# ── Config ─────────────────────────────────────────────────────────
SEG_MODEL   = "nvidia/segformer-b2-finetuned-ade-512-512"
DEVICE      = "cuda" if torch.cuda.is_available() else "cpu"

ADE20K_ZONES = {
    0:  "wall", 3: "floor", 5: "ceiling",
    8:  "window", 14: "door", 12: "stairs", 17: "column"
}

# Ensure temp directory exists
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "temp")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Pre-load SegFormer model and processor globally on server boot
print(f"[Segmentation] Pre-loading SegFormer model '{SEG_MODEL}' on {DEVICE}...")
PROCESSOR = SegformerImageProcessor.from_pretrained(SEG_MODEL, local_files_only=False)
MODEL     = SegformerForSemanticSegmentation.from_pretrained(SEG_MODEL, local_files_only=False)
MODEL.eval().to(DEVICE)
print("[Segmentation] Model pre-loaded successfully!")

app = FastAPI(title="Arteffects Local AI API")
app.mount("/temp", StaticFiles(directory=UPLOAD_DIR), name="temp")

def load_image(path_or_url):
    if path_or_url.startswith("http://") or path_or_url.startswith("https://"):
        print(f"[Loader] Downloading remote image: {path_or_url}")
        fd, temp_path = tempfile.mkstemp(suffix=".jpg")
        try:
            # Add user agent headers to prevent blocking by some websites/CDNs
            req = urllib.request.Request(
                path_or_url, 
                headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
            )
            with urllib.request.urlopen(req) as response, open(temp_path, 'wb') as out_file:
                out_file.write(response.read())
            img = cv2.imread(temp_path)
            if img is None:
                raise ValueError("Failed to decode downloaded image")
            return img, temp_path
        finally:
            os.close(fd)
    else:
        # Local file path
        if not os.path.exists(path_or_url):
            raise FileNotFoundError(f"Local file not found: {path_or_url}")
        img = cv2.imread(path_or_url)
        if img is None:
            raise ValueError("Failed to read local image")
        return img, None

class SegmentRequest(BaseModel):
    image_path: str

class GenerateRequest(BaseModel):
    image_path: str
    zone: str
    texture_prompt: str
    texture_image_path: str = None


# ── Stage 1: Segmentation ───────────────────────────────────────────
def get_segmentation_map(img_bgr):
    h, w    = img_bgr.shape[:2]
    pil_img = Image.fromarray(cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB))
    inputs  = PROCESSOR(images=pil_img, return_tensors="pt").to(DEVICE)

    with torch.no_grad():
        logits = MODEL(**inputs).logits

    upsampled = torch.nn.functional.interpolate(
        logits, size=(h, w), mode="bilinear", align_corners=False
    )
    pred = upsampled.argmax(dim=1).squeeze(0).cpu().numpy()

    return pred, h, w

def run_segmentation_for_mask(img_bgr, target_zone):
    pred, h, w = get_segmentation_map(img_bgr)
    
    # build binary mask for target zone
    try:
        zone_id = next(k for k, v in ADE20K_ZONES.items() if v == target_zone)
    except StopIteration:
        # Fallback if zone not mapped
        zone_id = 0
        
    mask = ((pred == zone_id).astype(np.uint8) * 255)
    pct = np.sum(mask > 0) / (h * w) * 100
    print(f"    {target_zone} detected: {pct:.1f}% of image")
    
    return mask

# ── Stage 2: Mask post-processing ──────────────────────────────────
def prepare_mask(mask, img_shape):
    print("[Mask Prep] Preparing mask...")
    # dilate edges for natural blending
    kernel = np.ones((12, 12), np.uint8)
    mask   = cv2.dilate(mask, kernel, iterations=1)
    # smooth edges
    mask   = cv2.GaussianBlur(mask, (21, 21), 0)
    _, mask = cv2.threshold(mask, 127, 255, cv2.THRESH_BINARY)
    return mask


# ── Stage 3: Texture Mapping ────────────────────────────────────────


# ── Stage 4: Composite ──────────────────────────────────────────────
def composite(original_bgr, inpainted_pil, mask):
    print("[Composite] Compositing final image...")
    inpainted_bgr = cv2.cvtColor(np.array(inpainted_pil), cv2.COLOR_RGB2BGR)

    # soft blend using mask as alpha
    mask_3ch  = cv2.cvtColor(mask, cv2.COLOR_GRAY2BGR).astype(float) / 255.0
    blended   = (inpainted_bgr * mask_3ch + original_bgr * (1 - mask_3ch)).astype(np.uint8)
    return blended


# ── API Endpoints ────────────────────────────────────────────────────

@app.post("/segment")
def segment_endpoint(req: SegmentRequest):
    """Returns all detected zones and their coverages (used for UI)."""
    temp_file = None
    try:
        img, temp_file = load_image(req.image_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to load image: {str(e)}")

    try:
        pred, h, w = get_segmentation_map(img)
        
        zones = []
        for label_id, zone_name in ADE20K_ZONES.items():
            mask = (pred == label_id).astype(np.uint8) * 255
            pixel_count = int(np.sum(mask > 0))
            if pixel_count == 0:
                continue

            rows = np.where(np.any(mask > 0, axis=1))[0]
            cols = np.where(np.any(mask > 0, axis=0))[0]
            coverage = pixel_count / (h * w)

            zones.append({
                "name": zone_name,
                "coverage": round(coverage, 4),
                "pixel_count": pixel_count,
                "bbox": {
                    "x": int(cols[0]),
                    "y": int(rows[0]),
                    "w": int(cols[-1] - cols[0]),
                    "h": int(rows[-1] - rows[0])
                }
            })

        zones.sort(key=lambda z: z["coverage"], reverse=True)

        return {
            "zones": zones,
            "image_size": {"width": w, "height": h}
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if temp_file and os.path.exists(temp_file):
            try:
                os.remove(temp_file)
            except Exception as e:
                print(f"[Loader] Error removing temp file: {e}")


def run_texture_mapping(img_bgr, mask, texture_path):
    print(f"[Texture Map] Loading actual product texture: {texture_path}")
    texture_img = cv2.imread(texture_path)
    if texture_img is None:
        raise ValueError("Failed to load texture image")

    # Find bounding box of the mask
    y_indices, x_indices = np.where(mask > 0)
    if len(x_indices) == 0 or len(y_indices) == 0:
        return Image.fromarray(cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB))

    x_min, x_max = int(x_indices.min()), int(x_indices.max())
    y_min, y_max = int(y_indices.min()), int(y_indices.max())
    w_box = x_max - x_min + 1
    h_box = y_max - y_min + 1

    # Tile the texture image to cover the bounding box
    th, tw = texture_img.shape[:2]
    repeat_x = int(np.ceil(w_box / tw))
    repeat_y = int(np.ceil(h_box / th))
    tiled = np.tile(texture_img, (repeat_y, repeat_x, 1))
    tiled_cropped = tiled[0:h_box, 0:w_box]

    # Crop the original image corresponding to the bounding box
    orig_crop = img_bgr[y_min:y_max+1, x_min:x_max+1]
    mask_crop = mask[y_min:y_max+1, x_min:x_max+1]

    # Convert original crop to LAB to extract lighting
    orig_lab = cv2.cvtColor(orig_crop, cv2.COLOR_BGR2LAB)
    orig_L = orig_lab[:, :, 0].astype(float)

    # Compute mean lightness of the target masked area to use as baseline
    masked_pixels = orig_L[mask_crop > 0]
    mean_L = np.mean(masked_pixels) if len(masked_pixels) > 0 else 128.0
    if mean_L < 1.0:
        mean_L = 1.0  # prevent division by zero

    # Compute lighting ratio map
    lighting_ratio = orig_L / mean_L

    # Convert tiled texture to LAB and apply lighting ratio
    tex_lab = cv2.cvtColor(tiled_cropped, cv2.COLOR_BGR2LAB)
    tex_L = tex_lab[:, :, 0].astype(float)
    new_L = np.clip(tex_L * lighting_ratio, 0, 255).astype(np.uint8)
    tex_lab[:, :, 0] = new_L

    # Convert back to BGR
    mapped_bgr = cv2.cvtColor(tex_lab, cv2.COLOR_LAB2BGR)

    # Place back in full-sized canvas
    full_tiled_bgr = np.zeros_like(img_bgr)
    full_tiled_bgr[y_min:y_max+1, x_min:x_max+1] = mapped_bgr

    # Convert to RGB PIL Image so it matches SD output type for composite()
    return Image.fromarray(cv2.cvtColor(full_tiled_bgr, cv2.COLOR_BGR2RGB))


@app.post("/generate")
def generate_endpoint(req: GenerateRequest):
    """Runs the full pipeline to replace a texture in a specific zone."""
    temp_img = None
    temp_tex = None
    try:
        # Load main image (local or remote)
        try:
            img, temp_img = load_image(req.image_path)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to load base image: {str(e)}")

        start_time = time.time()
        
        # Run local pipeline
        mask = run_segmentation_for_mask(img, req.zone)
        mask = prepare_mask(mask, img.shape)
        
        # Load texture image (local or remote)
        if not req.texture_image_path:
            raise HTTPException(status_code=400, detail="Product texture image path is required.")
        
        try:
            if req.texture_image_path.startswith("http://") or req.texture_image_path.startswith("https://"):
                print(f"[Loader] Downloading remote texture: {req.texture_image_path}")
                fd, temp_tex = tempfile.mkstemp(suffix=".jpg")
                try:
                    # User agent header is important for Cloudinary images
                    req_obj = urllib.request.Request(
                        req.texture_image_path, 
                        headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
                    )
                    with urllib.request.urlopen(req_obj) as response, open(temp_tex, 'wb') as out_file:
                        out_file.write(response.read())
                    texture_path = temp_tex
                finally:
                    os.close(fd)
            else:
                if not os.path.exists(req.texture_image_path):
                    raise FileNotFoundError(f"Local texture path not found: {req.texture_image_path}")
                texture_path = req.texture_image_path
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to load texture image: {str(e)}")
            
        print(f"[Texture Map] Mapping actual product texture from: {texture_path}")
        inpainted = run_texture_mapping(img, mask, texture_path)
            
        result = composite(img, inpainted, mask)

        # Save to public temp folder
        filename = f"render_{uuid.uuid4().hex[:8]}.jpg"
        output_path = os.path.join(UPLOAD_DIR, filename)
        
        cv2.imwrite(output_path, result, [cv2.IMWRITE_JPEG_QUALITY, 95])
        
        duration = time.time() - start_time
        print(f"\nDone! Saved to {output_path} in {duration:.1f}s")
        
        # Return the public URL path
        return {
            "success": True,
            "renderedUrl": f"/temp/{filename}",
            "generationDuration": int(duration * 1000)
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Clean up all downloaded temp files
        for f in [temp_img, temp_tex]:
            if f and os.path.exists(f):
                try:
                    os.remove(f)
                except Exception as e:
                    print(f"[Loader] Error removing temp file: {e}")


@app.get("/health")
def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("segment_api:app", host="0.0.0.0", port=8000, reload=True)
