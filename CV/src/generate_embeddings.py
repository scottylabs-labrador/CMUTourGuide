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

    total_images_processed = 0
    
    print(f"🏛️  Processing {len(building_groups)} buildings...")
    
    for building_name, image_paths in tqdm(building_groups.items(), desc="Processing"):
        all_rows = []
        
        # Process in batches
        for i in range(0, len(image_paths), batch_size):
            batch_paths = image_paths[i:i + batch_size]
            batch_embeddings = recognizer.encode_image_batch(batch_paths)
            # ensure 2D
            if batch_embeddings.ndim == 1:
                batch_embeddings = batch_embeddings[None, :]

            for img_path, emb in zip(batch_paths, batch_embeddings):
                all_rows.append((
                    building_name,
                    emb.tolist(),
                    "Building at Carnegie Mellon University",
                    str(img_path)
                ))
                total_images_processed += 1

        
        if all_rows:
            print(f"💾 Storing {len(all_rows)} image embeddings for {building_name}...")
            for name, embedding, description, image_path in all_rows:
                db.insert_image(name, embedding, description, image_path)

        
    print("🔧 Creating vector index for fast similarity search...")
    try:
        import psycopg2
        conn = psycopg2.connect(db.conn_str)
        cur = conn.cursor()
        
        # Drop existing index if any
        cur.execute("DROP INDEX IF EXISTS buildings_embedding_idx;")
        
        # Count how many image rows we have
        cur.execute("SELECT COUNT(*) FROM buildings;")
        (num_rows,) = cur.fetchone()
        
        # Choose number of lists based on number of image rows
        lists = max(10, min(100, max(1, num_rows // 10)))
        
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

    print(f"✅ Successfully processed {total_images_processed} images!")

if __name__ == "__main__":
    data_dir = sys.argv[1] if len(sys.argv) > 1 else "data"
    generate_and_store_embeddings(data_dir)

