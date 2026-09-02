"""Out-of-fold confidence analysis to pick VISION_MIN_CONFIDENCE for Back/src/app/routers/vision.py.
Mirrors train.py (same augs, folds, classifier) but keeps predict_proba. Run: python src/eval_confidence.py"""
import sys, numpy as np, torch
from pathlib import Path
from PIL import Image, ImageOps
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedGroupKFold, cross_val_predict

CV = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(CV / 'src'))
import train  # noqa: E402  (reuse scan_directory + augmenter)
from model import BuildingRecognizer  # noqa: E402

# view folders -> one building, same as the client's buildingIdMap
CANON = {'Highmark Side': 'Highmark', 'Margaret Morrison Back': 'Margaret Morrison',
         'Margaret Morrison Side': 'Margaret Morrison', 'Porter Back': 'Porter',
         'Uc Back': 'Uc', 'Uc Front': 'Uc', 'Uc Side': 'Uc', 'Uc Side 2': 'Uc'}
canon = lambda n: CANON.get(n, n)

dev = torch.device('mps' if torch.backends.mps.is_available() else 'cpu')
rec = BuildingRecognizer(device=dev)
load = lambda p: ImageOps.exif_transpose(Image.open(p)).convert('RGB')

def embed_dir(data_dir):
    X, y, groups, is_orig = [], [], [], []
    gid = 0
    for name, path in train.scan_directory(data_dir):
        try: img = load(path)
        except Exception as e: print('skip', path, e); continue
        batch = [img] + [train.augmenter(img) for _ in range(train.AUGS_PER_IMAGE)]
        for i, e in enumerate(rec.encode_images(batch)):
            X.append(e); y.append(name); groups.append(gid); is_orig.append(i == 0)
        gid += 1
    return np.array(X), np.array(y), np.array(groups), np.array(is_orig)

print('embedding training set...')
X, y_names, groups, is_orig = embed_dir(str(CV / 'data'))
labels = sorted(set(y_names)); lab2i = {l: i for i, l in enumerate(labels)}
y = np.array([lab2i[n] for n in y_names])
clf = LogisticRegression(random_state=42, solver='lbfgs', max_iter=1000, C=100.0)
cv = StratifiedGroupKFold(n_splits=5, shuffle=True, random_state=42)
print('cross-validating...')
P = cross_val_predict(clf, X, y, groups=groups, cv=cv, method='predict_proba')
pred = P.argmax(1); conf = P.max(1)
correct_lbl = pred == y
correct_bld = np.array([canon(labels[p]) == canon(labels[t]) for p, t in zip(pred, y)])

# Out-of-distribution: buildings the model has never seen (data/_todo)
clf.fit(X, y)
todo = [p for d in (CV / 'data' / '_todo').iterdir() if d.is_dir() for p in d.iterdir() if p.suffix.lower() in ('.jpg', '.jpeg', '.png')]
ood_conf = clf.predict_proba(rec.encode_images([load(p) for p in todo])).max(1) if todo else np.array([])

def report(mask, title):
    c, ok = conf[mask], correct_bld[mask]
    print(f'\n== {title}: n={mask.sum()}  building-level acc={ok.mean():.3f}  label-level acc={correct_lbl[mask].mean():.3f}')
    print(f'   conf when correct: median={np.median(c[ok]):.2f} p10={np.percentile(c[ok],10):.2f}')
    print(f'   conf when wrong:   median={np.median(c[~ok]):.2f} p90={np.percentile(c[~ok],90):.2f}' if (~ok).any() else '   no wrong predictions')
    print(f'   {"thr":>4} {"accept%":>8} {"prec@acc":>9} {"correct kept%":>14} {"wrong passed%":>14} {"OOD passed%":>12}')
    for t in [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]:
        acc = c >= t
        prec = ok[acc].mean() if acc.any() else float('nan')
        print(f'   {t:>4.1f} {acc.mean()*100:>7.1f}% {prec*100:>8.1f}% {(ok & acc).sum()/ok.sum()*100:>13.1f}% '
              f'{((~ok) & acc).sum()/max((~ok).sum(),1)*100:>13.1f}% {(ood_conf >= t).mean()*100 if len(ood_conf) else float("nan"):>11.1f}%')

report(is_orig, 'ORIGINALS ONLY (closest to real scans)')
report(np.ones_like(is_orig), 'ALL (originals + augs)')
print(f'\nOOD ({len(ood_conf)} unseen-building images): conf median={np.median(ood_conf):.2f} max={ood_conf.max():.2f}')
print('   per-image:', np.round(np.sort(ood_conf)[::-1], 2).tolist())

# Weakest classes at building level among originals
print('\n== lowest-confidence correct originals by building ==')
for l in labels:
    m = is_orig & (y == lab2i[l]) & correct_bld
    if m.any(): print(f'   {l:<24} n={m.sum():>3}  median conf={np.median(conf[m]):.2f}  min={conf[m].min():.2f}')
