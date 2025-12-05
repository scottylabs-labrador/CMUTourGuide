import sys
import datetime
import numpy as np
from pathlib import Path
from model import BuildingRecognizer
from tqdm import tqdm
import joblib
from sklearn.linear_model import LogisticRegression

def scan_directory(data_dir: str):
    """
    Scan data directory for building images.
    
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
            if building_dir.name.lower() == "todo":
                continue
            building_name = building_dir.name.replace("_", " ").title()
            for ext in ["*.jpg", "*.jpeg", "*.png", "*.JPG", "*.JPEG", "*.PNG"]:
                for img_file in building_dir.glob(ext):
                    buildings.append((building_name, str(img_file)))
    
    return buildings

def train_model(data_dir: str = "data"):
    print("🔍 Scanning for building images...")
    building_images = scan_directory(data_dir)
    
    if not building_images:
        print("❌ No building images found!")
        return
    
    print(f"📸 Found {len(building_images)} images")
    
    print("🤖 Loading CLIP model...")
    recognizer = BuildingRecognizer()
    
    # Group images by building name
    building_groups = {}
    for building_name, img_path in building_images:
        if building_name not in building_groups:
            building_groups[building_name] = []
        building_groups[building_name].append(img_path)

    X_train = []
    y_train_labels = []
    
    print(f"🏛️  Processing {len(building_groups)} buildings...")
    for building_name, image_paths in tqdm(building_groups.items(), desc="Processing"):
        
        # Process all images for the specific building
        embeddings = recognizer.encode_images(image_paths)
        # ensure 2D
        if embeddings.ndim == 1:
            embeddings = embeddings[None, :]

        for emb in embeddings:
            X_train.append(emb)
            y_train_labels.append(building_name)

    print("\n🧠 Training Linear Probe Classifier...")
    X = np.array(X_train)

    unique_buildings = sorted(list(set(y_train_labels)))
    label_map = {name: i for i, name in enumerate(unique_buildings)}
    inverse_label_map = {i: name for i, name in enumerate(unique_buildings)}

    y = np.array([label_map[label] for label in y_train_labels])

    classifier = LogisticRegression(random_state=42, solver='lbfgs', max_iter=1000, C=100.0)
    classifier.fit(X, y)

    acc = classifier.score(X, y)
    print(f"🎯 Accuracy: {acc:.2f}")

    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M")
    model_path = f"src/cmu_building_classifier_{timestamp}.pkl"
    joblib.dump({
        "model": classifier,
        "labels": inverse_label_map
    }, model_path)

    print(f"💾 Saved trained model to {model_path}")

if __name__ == "__main__":
    data_dir = sys.argv[1] if len(sys.argv) > 1 else "data"
    train_model(data_dir)
