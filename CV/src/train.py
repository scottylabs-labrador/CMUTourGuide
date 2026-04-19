import sys
import datetime
import numpy as np
from pathlib import Path
from model import BuildingRecognizer
from tqdm import tqdm
import joblib
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedGroupKFold, cross_val_score, cross_val_predict
from sklearn.metrics import confusion_matrix, classification_report
from torchvision import transforms # NEW: For augmentation
from PIL import Image, ImageOps # NEW: For loading images manually

AUGS_PER_IMAGE = 5

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
            if building_dir.name.lower() == "_todo":
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
    groups = []  # one group id per source image; shared by its augmentations
    next_group_id = 0

    print(f"🏛️  Processing {len(building_images)} images...")

    for building_name, image_paths in tqdm(building_groups.items(), desc="Processing"):

        # We need to load PIL images manually now to augment them
        batch_images = []
        batch_groups = []  # group id per image in batch_images

        for img_path in image_paths:
            try:
                # 1. Load Original
                original_img = ImageOps.exif_transpose(Image.open(img_path)).convert("RGB")
                gid = next_group_id
                next_group_id += 1

                batch_images.append(original_img)
                batch_groups.append(gid)

                # 2. Generate Augmentations — same group id as the source so they
                # never split across train/val folds.
                for _ in range(AUGS_PER_IMAGE):
                    aug_img = augmenter(original_img)
                    batch_images.append(aug_img)
                    batch_groups.append(gid)

            except Exception as e:
                print(f"⚠️ Error reading {img_path}: {e}")
                continue

        # 3. Batch Encode (Much faster than one by one)
        # Your model.py's encode_images accepts PIL objects, so this works!
        embeddings = recognizer.encode_images(batch_images)

        # ensure 2D
        if embeddings.ndim == 1:
            embeddings = embeddings[None, :]

        for emb, gid in zip(embeddings, batch_groups):
            X_train.append(emb)
            y_train_labels.append(building_name)
            groups.append(gid)

    print(f"\n🧠 Training on {len(X_train)} embeddings (Original + Augmented)...")
    X = np.array(X_train)
    groups = np.array(groups)

    unique_buildings = sorted(list(set(y_train_labels)))
    label_map = {name: i for i, name in enumerate(unique_buildings)}
    inverse_label_map = {i: name for i, name in enumerate(unique_buildings)}

    y = np.array([label_map[label] for label in y_train_labels])

    classifier = LogisticRegression(
        random_state=42,
        solver='lbfgs',
        max_iter=1000,
        C=100.0)

    # GroupKFold prevents augmentations of the same source image from leaking
    # between train/val folds. Stratified variant keeps class balance per fold.
    n_groups = len(np.unique(groups))
    n_splits = min(5, n_groups)
    print(f"📊 Running {n_splits}-Fold Stratified Group Cross Validation "
          f"({n_groups} source images)...")
    cv = StratifiedGroupKFold(n_splits=n_splits, shuffle=True, random_state=42)
    cv_scores = cross_val_score(classifier, X, y, groups=groups, cv=cv)
    print(f"✅ Estimated Real-World Accuracy: {cv_scores.mean():.2f} "
          f"(+/- {cv_scores.std() * 2:.2f})")
    print(f"   per-fold: {[f'{s:.2f}' for s in cv_scores]}")

    # Out-of-fold predictions: each sample predicted by a model that never saw
    # its source image. Honest per-class numbers + confusion pairs.
    print("\n📈 Generating per-class report (out-of-fold predictions)...")
    y_pred = cross_val_predict(classifier, X, y, groups=groups, cv=cv)

    label_names = [inverse_label_map[i] for i in range(len(inverse_label_map))]
    print("\n--- Per-class performance ---")
    print(classification_report(y, y_pred, target_names=label_names, digits=2, zero_division=0))

    cm = confusion_matrix(y, y_pred, labels=list(range(len(label_names))))
    per_class_acc = cm.diagonal() / cm.sum(axis=1).clip(min=1)
    weakest = sorted(enumerate(per_class_acc), key=lambda x: x[1])[:8]
    print("--- Weakest classes (lowest recall) ---")
    for idx, acc_val in weakest:
        n = int(cm[idx].sum())
        print(f"  {label_names[idx]:<28} {acc_val*100:5.1f}%  ({n} samples)")

    pairs = []
    for i in range(len(label_names)):
        for j in range(len(label_names)):
            if i != j and cm[i, j] > 0:
                pairs.append((cm[i, j], label_names[i], label_names[j]))
    pairs.sort(reverse=True)
    print("\n--- Top confusion pairs (true -> predicted) ---")
    for count, true_name, pred_name in pairs[:10]:
        print(f"  {count:3d}x  {true_name}  ->  {pred_name}")
    print()

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
