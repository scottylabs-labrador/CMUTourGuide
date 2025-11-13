"""
Modal deployment for CMU Tour Guide CV API.
Serverless deployment with auto-scaling and pay-per-use pricing.
"""
import modal
import io
from pathlib import Path

# Create Modal app
app = modal.App("cmu-tour-guide-cv")

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
        "psycopg2-binary>=2.9.0",
        "fastapi[standard]>=0.100.0",  # Required for Modal web endpoints
    )
    # Install CLIP from GitHub (requires git)
    .pip_install("git+https://github.com/openai/CLIP.git")
    # Add source code to image (Modal 1.0 pattern)
    .add_local_dir("src", remote_path="/root/src")
)


@app.function(
    image=image,
    memory=2048,  # 2GB RAM for CLIP model
    timeout=300,   # 5 minutes
    secrets=[modal.Secret.from_name("tour_guide_supabase_url")],
)
def recognize_building(image_bytes: bytes) -> dict:
    """
    Recognize a building from image bytes.
    
    Args:
        image_bytes: Raw image bytes
        
    Returns:
        Dictionary with building name, confidence, and description
    """
    import sys
    import os
    from PIL import Image
    
    # Add src to path
    sys.path.insert(0, "/root/src")
    
    from model import BuildingRecognizer
    from database import BuildingDB
    
    try:
        # Load image from bytes
        image = Image.open(io.BytesIO(image_bytes))
        
        # Initialize model (cached after first call)
        print("🤖 Loading CLIP model...")
        recognizer = BuildingRecognizer()
        
        # Generate embedding
        print("📸 Encoding image...")
        embedding = recognizer.encode_image(image)
        
        # Search database
        print("🔍 Searching database...")
        db = BuildingDB()
        results = db.search_similar(embedding.tolist(), limit=1, threshold=0.6)
        
        if not results:
            return {
                "building": "Unknown",
                "confidence": 0.0,
                "description": "No matching building found",
                "error": None
            }
        
        best_match = results[0]
        return {
            "building": best_match["name"],
            "confidence": round(best_match["similarity"], 4),
            "description": best_match.get("description", ""),
            "image_path": best_match.get("image_path"),
            "error": None
        }
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return {
            "building": "Error",
            "confidence": 0.0,
            "description": "Error processing image",
            "error": str(e)
        }


@app.function(
    image=image,
    memory=2048,
    secrets=[modal.Secret.from_name("tour_guide_supabase_url")],
)
@modal.web_endpoint(method="POST")
def search(request: dict):
    """
    HTTP endpoint for building recognition.
    
    POST request with multipart/form-data image upload.
    """
    import base64
    
    # Handle both base64 and raw bytes
    if "image" in request:
        # Base64 encoded
        if isinstance(request["image"], str):
            image_bytes = base64.b64decode(request["image"])
        else:
            image_bytes = request["image"]
    elif "file" in request:
        # File upload
        image_bytes = request["file"]
    else:
        return {
            "error": "No image provided. Send 'image' (base64) or 'file' (bytes)"
        }
    
    # Call recognition function
    result = recognize_building.remote(image_bytes)
    return result


@app.function(
    image=image,
    secrets=[modal.Secret.from_name("tour_guide_supabase_url")],
)
@modal.web_endpoint(method="GET")
def health():
    """Health check endpoint."""
    import sys
    sys.path.insert(0, "/root/src")
    
    try:
        from database import BuildingDB
        db = BuildingDB()
        buildings = db.get_all_buildings()
        
        return {
            "status": "healthy",
            "service": "CMU Tour Guide CV API (Modal)",
            "model": "CLIP ViT-B/32",
            "buildings_count": len(buildings),
            "platform": "Modal Serverless"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }


@app.function(
    image=image,
    secrets=[modal.Secret.from_name("tour_guide_supabase_url")],
)
@modal.web_endpoint(method="GET")
def buildings():
    """List all buildings in the database."""
    import sys
    sys.path.insert(0, "/root/src")
    
    try:
        from database import BuildingDB
        db = BuildingDB()
        all_buildings = db.get_all_buildings()
        
        return {
            "buildings": all_buildings,
            "count": len(all_buildings)
        }
    except Exception as e:
        return {
            "error": str(e)
        }


# Local testing
@app.local_entrypoint()
def main():
    """
    Local testing entry point.
    Usage: modal run modal_app.py
    """
    print("🧪 Testing Modal deployment locally...")
    
    # Test with a local image
    test_image_path = "data/Tepper/Tepper_1.jpeg"
    
    if Path(test_image_path).exists():
        with open(test_image_path, "rb") as f:
            image_bytes = f.read()
        
        print(f"Testing with: {test_image_path}")
        result = recognize_building.remote(image_bytes)
        print(f"\n✅ Result: {result}")
    else:
        print(f"⚠️  Test image not found: {test_image_path}")
        print("Skipping local test.")

