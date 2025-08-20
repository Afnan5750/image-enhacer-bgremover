import os
import cv2
from PIL import Image
from gfpgan import GFPGANer

def enhance_with_gfpgan(in_path: str, out_path: str, upscale: int, model_version: str):
    # Determine model path based on selected version
    model_file = f"GFPGANv{model_version}.pth"
    MODEL_PATH = os.path.join("models", model_file)

    if not os.path.isfile(MODEL_PATH):
        raise FileNotFoundError(f"GFPGAN model not found at {MODEL_PATH}")

    restorer = GFPGANer(
        model_path=MODEL_PATH,
        upscale=upscale,
        arch="clean",
        channel_multiplier=2,
        bg_upsampler=None
    )

    img = cv2.imread(in_path, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not read input image.")

    cropped_faces, restored_faces, restored_img = restorer.enhance(
        img, has_aligned=False, only_center_face=False, paste_back=True
    )

    Image.fromarray(cv2.cvtColor(restored_img, cv2.COLOR_BGR2RGB)).save(out_path)
    return out_path
