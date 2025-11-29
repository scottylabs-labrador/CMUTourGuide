"""
Modal deployment for CMU Tour Guide CV API.
Serverless deployment with auto-scaling and pay-per-use pricing.
"""
import modal
import io
from pathlib import Path
from collections import defaultdict

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
    .add_local_dir(".", remote_path="/root/src")
)

# Module-level cache for the recognizer (persists across requests in same container)
_recognizer_cache = None

@app.function(
    image=image,
    memory=4096,  # 4GB RAM for CLIP ViT-L/14 model
    timeout=300,   # 5 minutes
    container_idle_timeout=300,  # Keep container warm for 5 minutes
    secrets=[modal.Secret.from_name("tour_guide_supabase_url")],
)
@modal.fastapi_endpoint(method="POST")
async def recognize_building(request: dict) -> dict:
    """
    HTTP endpoint for building recognition.
    
    POST request with JSON body containing base64 image.
    Expected format: {"image": "base64_string"} or {"imageBase64": "base64_string"}
    
    Returns:
        Dictionary with building name, confidence, and description
    """
    import base64
    import sys
    from PIL import Image
    
    # Add src to path
    sys.path.insert(0, "/root/src")
    
    from model import BuildingRecognizer
    from database import BuildingDB
    
    # Use module-level cache for recognizer
    global _recognizer_cache
    
    # Parse request and decode base64 image
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
        # Load image from bytes
        image = Image.open(io.BytesIO(image_bytes))
        
        # Initialize model only once per container (cached)
        if _recognizer_cache is None:
            print("🤖 Loading CLIP model (first time in this container)...")
            _recognizer_cache = BuildingRecognizer()
        else:
            print("✅ Using cached CLIP model")
        
        recognizer = _recognizer_cache
        
        # Generate embedding
        print("📸 Encoding image...")
        embedding = recognizer.encode_image(image)
        
        # Search database
        print("🔍 Searching database...")
        db = BuildingDB()
        results = db.search_similar(embedding.tolist(), limit=5, threshold=0.7)
        if not results:
            return {
                "building": "Unknown",
                "confidence": 0.0,
                "description": "No matching building found",
                "error": None
            }
        
        print("Top 5 likely buildings:", results)

        building_confidence = defaultdict(list)
        building_metadata = {}  # Store description and image_path for each building
        
        for r in results:
            building_name = r["name"]
            building_confidence[building_name].append(r["similarity"])
            
            if building_name not in building_metadata:
                building_metadata[building_name] = {
                    "description": r.get("description", ""),
                    "image_path": r.get("image_path"),
                    "best_similarity": r["similarity"]
                }
            else:
                if r["similarity"] > building_metadata[building_name]["best_similarity"]:
                    building_metadata[building_name] = {
                        "description": r.get("description", ""),
                        "image_path": r.get("image_path"),
                        "best_similarity": r["similarity"]
                    }
        
        best_match = max(building_confidence.items(), key=lambda x: sum(x[1]))
        building_name = best_match[0]
        confidence = sum(best_match[1]) / len(best_match[1])  # Average confidence
        
        metadata = building_metadata[building_name]
        
        print(f"🏢 Best match: {building_name} with confidence {confidence}")
        return {
            "building": building_name,
            "confidence": confidence,
            "description": metadata["description"],
            "image_path": metadata["image_path"],
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
    secrets=[modal.Secret.from_name("tour_guide_supabase_url")],
)
@modal.fastapi_endpoint(method="GET")
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
            "model": "CLIP ViT-L/14",
            "buildings_count": len(buildings),
            "platform": "Modal Serverless"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }

# Local testing
@app.local_entrypoint()
def main():
    """
    Local testing entry point.
    Usage: modal run modal_app.py
    """
    import base64
    
    print("🧪 Testing Modal deployment locally...")
    
    # Test with a local image
    test_image_path = "../data/Tepper/Tepper_1.jpeg"
    
    if Path(test_image_path).exists():
        with open(test_image_path, "rb") as f:
            image_bytes = f.read()
        
        # Encode as base64 for the web endpoint
        image_base64 = base64.b64encode(image_bytes).decode('utf-8')
        
        print(f"Testing with: {test_image_path}")
        result = recognize_building.remote({"imageBase64": image_base64})
        print(f"\n✅ Result: {result}")
    else:
        print(f"⚠️  Test image not found: {test_image_path}")
        print("Skipping local test.")

