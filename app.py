import os
import io
import base64
from datetime import datetime
from flask import Flask, render_template, request, send_from_directory, flash
from werkzeug.utils import secure_filename
from utils.enhancer import enhance_with_gfpgan
from rembg import remove, new_session
from PIL import Image

# ----------------------------
# Config
# ----------------------------
ENHANCE_UPLOAD = os.path.join("uploads", "enhance")
ENHANCE_RESULT = os.path.join("results", "enhance")
BG_UPLOAD = os.path.join("uploads", "bgremove")
BG_RESULT = os.path.join("results", "bgremove")

ALLOWED_EXTS = {"png", "jpg", "jpeg", "webp"}

# Ensure directories exist
for folder in [ENHANCE_UPLOAD, ENHANCE_RESULT, BG_UPLOAD, BG_RESULT]:
    os.makedirs(folder, exist_ok=True)

app = Flask(__name__)
app.secret_key = "dev-secret"  # Change in production

# Load background remover model once
session = new_session(model_name="isnet-general-use")


# ----------------------------
# Helpers
# ----------------------------
def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTS


# ----------------------------
# Image Enhancer Routes
# ----------------------------
@app.route("/", methods=["GET", "POST"])
def index():
    original_filename = None
    enhanced_filename = None

    if request.method == "POST":
        file = request.files.get("image")
        upscale = request.form.get("upscale")               
        model_version = request.form.get("model_version")   

        # Log selections to console
        print(f"[INFO] Selected Upscale: {upscale}, Model Version: {model_version}")

        # Check if file is uploaded
        if not file or file.filename == "":
            flash("Please upload an image.")
            return render_template("index.html")

        # Check if dropdowns are selected
        if not upscale or not model_version:
            flash("Please select both Upscale and Model options.")
            return render_template("index.html")

        if not allowed_file(file.filename):
            flash("Unsupported file type.")
            return render_template("index.html")

        # Convert upscale to int
        upscale = int(upscale)

        # Save original
        filename = secure_filename(file.filename)
        stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        in_name = f"{stamp}_{filename}"
        in_path = os.path.join(ENHANCE_UPLOAD, in_name)
        file.save(in_path)
        original_filename = in_name

        # Save result
        out_name = f"{in_name.rsplit('.', 1)[0]}_enhanced.png"
        out_path = os.path.join(ENHANCE_RESULT, out_name)

        try:
            # Call enhancer dynamically
            enhance_with_gfpgan(in_path, out_path, upscale=upscale, model_version=model_version)
            enhanced_filename = out_name
        except Exception as e:
            flash(str(e))

    return render_template(
        "index.html",
        original=original_filename,
        enhanced=enhanced_filename
    )


@app.route("/uploads/enhance/<path:filename>")
def uploaded_file(filename):
    return send_from_directory(ENHANCE_UPLOAD, filename)


@app.route("/results/enhance/<path:filename>")
def result_file(filename):
    return send_from_directory(ENHANCE_RESULT, filename)


# ----------------------------
# Background Remover Routes
# ----------------------------
@app.route("/bgremove")
def bgremove_page():
    return render_template("bgremove.html")


@app.route("/remove-bg", methods=["POST"])
def remove_bg():
    image_file = request.files['image']
    filename = secure_filename(image_file.filename)
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    in_name = f"{stamp}_{filename}"
    in_path = os.path.join(BG_UPLOAD, in_name)
    image_file.save(in_path)

    input_image = Image.open(in_path).convert("RGBA")
    output_image = remove(input_image, session=session)

    # Save result
    out_name = f"{in_name.rsplit('.', 1)[0]}_removebg.png"
    out_path = os.path.join(BG_RESULT, out_name)
    output_image.save(out_path, format="PNG")

    # Base64 preview
    buffered = io.BytesIO()
    output_image.save(buffered, format="PNG")
    buffered.seek(0)
    img_base64 = base64.b64encode(buffered.read()).decode('utf-8')

    return {
        'preview': f"data:image/png;base64,{img_base64}",
        'filename': out_name
    }


@app.route("/uploads/bgremove/<path:filename>")
def uploaded_bg_file(filename):
    return send_from_directory(BG_UPLOAD, filename)


@app.route("/results/bgremove/<path:filename>")
def result_bg_file(filename):
    return send_from_directory(BG_RESULT, filename)


# ----------------------------
# Run
# ----------------------------
if __name__ == "__main__":
    app.run(debug=True)
