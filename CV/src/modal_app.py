"""
Modal deployment for CMU Tour Guide CV API.
Serverless deployment with auto-scaling and pay-per-use pricing.
"""
import modal
import io
from pathlib import Path

# Resolve src/ relative to this file so deploys work regardless of cwd.
SRC_DIR = Path(__file__).resolve().parent

# Create Modal app
app = modal.App("cmu-tour-guide-cv")

# Minimal 1x1 PNG (base64) for keep-warm pings - avoids loading real images in cron
TINY_PNG_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="

# Web URL for keep-warm pings (set VISION_WEB_URL in Modal Secrets if your workspace differs)
VISION_WEB_URL = "https://ncdev1919--cmu-tour-guide-cv-recognize-building-lp.modal.run"

# Define container image with all dependencies
image = (
    modal.Image.debian_slim(python_version="3.11")
    # Install git first (needed for CLIP installation)
    .apt_install("git", "ca-certificates")
    .pip_install(
        "torch>=2.0.0",
        "torchvision>=0.15.0",
        "ftfy",
        "regex",
        "tqdm",
        "Pillow>=10.0.0",
        "numpy>=1.24.0",
        "fastapi[standard]>=0.100.0",  # Required for Modal web endpoints
        "scikit-learn==1.7.2",  # must match the version that pickled the classifier
        "joblib>=1.3.0"
    )
    # Install CLIP from GitHub (requires git)
    .pip_install("git+https://github.com/openai/CLIP.git")
    # Bundle ONLY what the container needs at runtime: source modules and the
    # latest classifier .pkl. Mounts CV/src/ -> /root/src/. Excludes venv/,
    # data/, __pycache__/, .git/, etc. that were ballooning the image to ~30k
    # files and ~500MB on the previous deploy.
    .add_local_dir(
        str(SRC_DIR),
        remote_path="/root/src",
        ignore=["__pycache__", "*.pyc", ".DS_Store"],
    )
)

# Module-level cache for the recognizer (persists across requests in same container)
_recognizer_cache = None
_classifier_cache = None

@app.function(
    image=image,
    memory=4096,
    timeout=300,
    scaledown_window=1800,  # 30 min - container stays warm longer between requests
)
@modal.fastapi_endpoint(method="POST")
async def recognize_building_LP(request: dict) -> dict:
    """
    New Linear Probe endpoint. 
    Faster and more accurate, but requires cmu_building_classifier_{timestamp}.pkl to be present.
    """
    import base64
    import joblib
    from PIL import Image
    import sys
    
    # Add src to path
    sys.path.insert(0, "/root/src")
    
    from model import BuildingRecognizer
    
    # Use global caches
    global _recognizer_cache, _classifier_cache

    if "image" in request:
        image_data = request["image"]
    elif "imageBase64" in request:
        image_data = request["imageBase64"]
    else:
        return {
            "building": "Error",
            "confidence": 0.0,
            "description": "No image provided. Send 'image' or 'imageBase64' in JSON body",
            "error": "NO_IMAGE_PROVIDED"
        }

    # Decode base64
    if isinstance(image_data, str):
        # Remove data URL prefix if present (e.g., "data:image/jpeg;base64,...")
        if "," in image_data:
            image_data = image_data.split(",")[1]
        try:
            image_bytes = base64.b64decode(image_data)
        except Exception as e:
            return {
                "building": "Error",
                "confidence": 0.0,
                "description": f"Failed to decode base64 image: {str(e)}",
                "error": "DECODE_ERROR"
            }
    else:
        return {
            "building": "Error",
            "confidence": 0.0,
            "description": "Image must be a base64 string",
            "error": "INVALID_FORMAT"
        }

    try:
        # Initialize model only once per container (cached)
        if _recognizer_cache is None:
            print("🤖 Loading CLIP model (first time in this container)...")
            _recognizer_cache = BuildingRecognizer()

        if _classifier_cache is None:
            print("🤖 Loading linear probe (first time in this container)...")
            import glob, os
            candidates = sorted(glob.glob("/root/src/cmu_building_classifier_*.pkl"))
            if not candidates:
                raise FileNotFoundError("No cmu_building_classifier_*.pkl bundled in image")
            latest = candidates[-1]  # filenames sort lexicographically by timestamp
            print(f"   using {os.path.basename(latest)}")
            _classifier_cache = joblib.load(latest)
        
        recognizer = _recognizer_cache
        classifier = _classifier_cache

        image = Image.open(io.BytesIO(image_bytes))
        embedding = recognizer.encode_image(image)
        if embedding.ndim == 1:
            embedding = embedding.reshape(1, -1)
        
        clf = classifier["model"]
        labels = classifier["labels"]

        probs = clf.predict_proba(embedding)[0]
        best_idx = probs.argmax()
        
        confidence = float(probs[best_idx])
        building_name = labels[best_idx]
        print(f"🏢 Identified: {building_name} ({confidence:.2f})")
        
        return {
            "building": building_name,
            "confidence": confidence,
            "method": "Linear Probe",
            "error": None
        }
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return {"error": "PROCESSING_ERROR", "description": str(e)}


@app.function(
    schedule=modal.Period(minutes=29),
    image=modal.Image.debian_slim().pip_install("httpx"),
)
def keep_warm():
    """Ping the recognizer web endpoint every 29 min so its container stays warm (avoids cold starts)."""
    import os
    import httpx
    url = os.environ.get("VISION_WEB_URL", VISION_WEB_URL)
    try:
        httpx.post(url, json={"imageBase64": TINY_PNG_BASE64}, timeout=30.0)
    except Exception as e:
        print(f"keep_warm ping failed: {e}")

