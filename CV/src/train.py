import sys
import datetime
import numpy as np
from pathlib import Path
from model import BuildingRecognizer
from tqdm import tqdm
import joblib
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_score
from torchvision import transforms # NEW: For augmentation
from PIL import Image # NEW: For loading images manually

augmenter = transforms.Compose([
    transforms.RandomHorizontalFlip(p=0.5),      # Mirroring (good for symmetry)
    transforms.RandomRotation(degrees=15),       # Simulate holding phone crooked
    transforms.ColorJitter(brightness=0.2, contrast=0.2), # Simulate different weather
    transforms.RandomResizedCrop(
        size=(224, 224), 
        scale=(0.8, 1.0), 
        ratio=(0.9, 1.1)
    ) # Simulate zooming/cropping
])

def scan_directory(data_dir: str):
    """
    Scan data directory for building images.
    
    Returns:
        List of tuples (building_name, image_path)
    """
    images = []
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
                    images.append((building_name, str(img_file)))
    
    return images

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
    
    print(f"🏛️  Processing {len(building_images)} images...")

    for building_name, image_paths in tqdm(building_groups.items(), desc="Processing"):
        
        # We need to load PIL images manually now to augment them
        batch_images = []
        
        for img_path in image_paths:
            try:
                # 1. Load Original
                original_img = Image.open(img_path).convert("RGB")
                batch_images.append(original_img)
                
                # 2. Generate Augmentations (e.g., 5 per image)
                # Only augment if you have < 100 images per class to prevent explosion
                for _ in range(5):
                    aug_img = augmenter(original_img)
                    batch_images.append(aug_img)
                    
            except Exception as e:
                print(f"⚠️ Error reading {img_path}: {e}")
                continue

        # 3. Batch Encode (Much faster than one by one)
        # Your model.py's encode_images accepts PIL objects, so this works!
        embeddings = recognizer.encode_images(batch_images)
        
        # ensure 2D
        if embeddings.ndim == 1:
            embeddings = embeddings[None, :]

        for emb in embeddings:
            X_train.append(emb)
            y_train_labels.append(building_name) # Label repeats for all augmented versions

    print(f"\n🧠 Training on {len(X_train)} embeddings (Original + Augmented)...")
    X = np.array(X_train)

    unique_buildings = sorted(list(set(y_train_labels)))
    label_map = {name: i for i, name in enumerate(unique_buildings)}
    inverse_label_map = {i: name for i, name in enumerate(unique_buildings)}

    y = np.array([label_map[label] for label in y_train_labels])

    classifier = LogisticRegression(
        random_state=42, 
        solver='lbfgs', 
        max_iter=1000, 
        C=100.0)

    print("📊 Running 5-Fold Cross Validation...")
    cv_scores = cross_val_score(classifier, X, y, cv=5)
    print(f"✅ Estimated Real-World Accuracy: {cv_scores.mean():.2f} (+/- {cv_scores.std() * 2:.2f})")

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
