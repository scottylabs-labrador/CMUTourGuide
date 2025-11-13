"""
Generate embeddings for building images and store them in PostgreSQL.
"""
import sys
import numpy as np
from pathlib import Path
from model import BuildingRecognizer
from database import BuildingDB
from tqdm import tqdm

def scan_directory(data_dir: str):
    """
    Scan data directory for building images.
    Expected structure: data/building_name/image.jpg
    
    Returns:
        List of tuples (building_name, image_path)
    """
    buildings = []
    data_path = Path(data_dir)
    
    if not data_path.exists():
        print(f"❌ Data directory not found: {data_dir}")
        return []
    
    for building_dir in data_path.iterdir():
        if building_dir.is_dir():
            building_name = building_dir.name.replace("_", " ").title()
            
            # Find all images in the building directory
            # Support both lowercase and uppercase extensions
            for ext in ["*.jpg", "*.jpeg", "*.png", "*.JPG", "*.JPEG", "*.PNG"]:
                for img_file in building_dir.glob(ext):
                    buildings.append((building_name, str(img_file)))
    
    return buildings

def generate_and_store_embeddings(data_dir: str = "data", 
                                  batch_size: int = 8):
    """
    Generate embeddings for all building images and store in database.
    
    Args:
        data_dir: Directory containing building images
        batch_size: Batch size for processing images
    """
    print("🔍 Scanning for building images...")
    building_images = scan_directory(data_dir)
    
    if not building_images:
        print("❌ No building images found!")
        return
    
    print(f"📸 Found {len(building_images)} images")
    
    # Initialize model and database
    print("🤖 Loading CLIP model...")
    recognizer = BuildingRecognizer()
    
    print("🗄️  Connecting to database...")
    db = BuildingDB()
    
    # Group images by building name
    building_groups = {}
    for building_name, img_path in building_images:
        if building_name not in building_groups:
            building_groups[building_name] = []
        building_groups[building_name].append(img_path)
    
    print(f"🏛️  Processing {len(building_groups)} buildings...")
    
    # Process each building
    all_buildings = []
    
    for building_name, image_paths in tqdm(building_groups.items(), desc="Processing"):
        # Compute average embedding for all images of this building
        embeddings = []
        
        # Process in batches
        for i in range(0, len(image_paths), batch_size):
            batch = image_paths[i:i+batch_size]
            batch_embeddings = recognizer.encode_image_batch(batch)
            embeddings.append(batch_embeddings)
        
        # Average all embeddings for this building
        all_embeddings = np.vstack(embeddings)
        avg_embedding = all_embeddings.mean(axis=0)
        # Normalize
        avg_embedding = avg_embedding / np.linalg.norm(avg_embedding)
        
        # Store building with average embedding
        description = f"Building at Carnegie Mellon University"
        all_buildings.append((
            building_name,
            avg_embedding.tolist(),
            description,
            image_paths[0] if image_paths else None
        ))
    
    # Batch insert into database
    print("💾 Storing embeddings in database...")
    db.insert_buildings_batch(all_buildings)
    
    # Create IVFFlat index after data is loaded (requires data to exist)
    print("🔧 Creating vector index for fast similarity search...")
    try:
        import psycopg2
        conn = psycopg2.connect(db.conn_str)
        cur = conn.cursor()
        
        # Drop existing index if any
        cur.execute("DROP INDEX IF EXISTS buildings_embedding_idx;")
        
        # Create IVFFlat index (requires at least some data)
        num_buildings = len(all_buildings)
        lists = max(10, min(100, num_buildings // 10))  # Adaptive list size
        
        cur.execute(f"""
            CREATE INDEX buildings_embedding_idx 
            ON buildings USING ivfflat (embedding vector_cosine_ops)
            WITH (lists = {lists});
        """)
        conn.commit()
        cur.close()
        conn.close()
        print("✅ Vector index created successfully!")
    except Exception as e:
        print(f"⚠️  Could not create vector index: {e}")
        print("   Similarity search will still work, but may be slower")
    
    print(f"✅ Successfully processed {len(all_buildings)} buildings!")
    print(f"📊 Database now contains {len(db.get_all_buildings())} buildings")

if __name__ == "__main__":
    data_dir = sys.argv[1] if len(sys.argv) > 1 else "data"
    generate_and_store_embeddings(data_dir)

