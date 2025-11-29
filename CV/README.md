# CMU Tour Guide - Computer Vision Pipeline

Building recognition system using CLIP and pgvector for similarity search. Works well with just a few example images per building.

## Why CLIP + pgvector

- CLIP is pretrained on 400M image-text pairs, so no training needed
- pgvector gives fast cosine similarity search in PostgreSQL
- Easy to add new buildings by just adding images
- Ready for production use

## Architecture

1. **CLIP ViT-L/14**: Pretrained vision transformer that encodes images into 768-dimensional embeddings
2. **PostgreSQL + pgvector**: Stores building embeddings and does fast similarity search
3. **FastAPI**: REST API for image recognition

## Prerequisites

- Python 3.8+
- Docker and Docker Compose
- pip

## Quick Start

### 1. Setup Environment

```bash
pip install -r requirements.txt
docker-compose up -d postgres
# Wait ~10 seconds for database to start
```

### 2. Prepare Your Data

Organize building images in the `data/` directory:

```
data/
├── hunt_library/
│   ├── hunt1.jpg
│   ├── hunt2.jpg
│   └── ...
├── wean_hall/
│   ├── wean1.jpg
│   └── ...
```

Tips:

- 3-10 images per building from different angles
- Daytime photos with good lighting work best
- Capture distinctive architectural features

### 3. Generate Embeddings

```bash
python src/generate_embeddings.py

# Or specify custom data directory
python src/generate_embeddings.py /path/to/data
```

This scans the data directory, computes CLIP embeddings for each building, averages them if you have multiple images per building, and stores them in PostgreSQL.

### 4. Start API Server

```bash
# Development mode with auto-reload
uvicorn src.api_server:app --reload

# Production mode
uvicorn src.api_server:app --host 0.0.0.0 --port 8000
```

API available at `http://localhost:8000`

## API Endpoints

### POST `/search`

Recognize a building from an uploaded image.

**Request:**

```bash
curl -X POST "http://localhost:8000/search" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@path/to/image.jpg"
```

**Response:**

```json
{
  "building": "Hunt Library",
  "confidence": 0.9234,
  "description": "Building at Carnegie Mellon University",
  "image_path": "data/hunt_library/hunt1.jpg"
}
```

### GET `/buildings`

List all buildings in the database.

### GET `/health`

Health check endpoint.

### GET `/`

Root endpoint with service info.

## Configuration

### Database Connection

Set `DATABASE_URL` environment variable or it defaults to:

```
postgresql://cmu_tour:cmu_tour_pass@localhost:5433/cmu_tour_db
```

Note: Uses port 5433 to avoid conflicts with local PostgreSQL on 5432.

### Similarity Threshold

Adjust in `api_server.py`:

```python
results = db.search_similar(embedding.tolist(), limit=1, threshold=0.6)
```

- Lower threshold (0.5-0.6) = more results, less strict
- Higher threshold (0.8-0.9) = fewer results, more strict

## Testing

### Standalone Script

```bash
python src/inference.py data/hunt_library/hunt1.jpg
```

### API

```bash
curl -X POST "http://localhost:8000/search" \
  -F "file=@data/hunt_library/hunt1.jpg"
```

## Performance

- Embedding generation: ~0.1-0.3 seconds per image (CPU)
- Similarity search: <10ms with pgvector index
- API latency: ~100-300ms end-to-end (depends on image size)

## Database Management

### View All Buildings

```python
from src.database import BuildingDB
db = BuildingDB()
buildings = db.get_all_buildings()
print(buildings)
```

### Clear Database

```python
from src.database import BuildingDB
db = BuildingDB()
db.clear_buildings()
```

### Add Building Manually

```python
from src.database import BuildingDB
from src.model import BuildingRecognizer

recognizer = BuildingRecognizer()
embedding = recognizer.encode_image("path/to/image.jpg")

db = BuildingDB()
db.insert_building(
    name="New Building",
    embedding=embedding.tolist(),
    description="Description here",
    image_path="path/to/image.jpg"
)
```

## Troubleshooting

### Database Connection Error

```bash
docker-compose ps
docker-compose logs postgres
docker-compose restart postgres
```

### CLIP Model Download Issues

CLIP downloads automatically on first use. If it fails:

- Check internet connection
- Model is ~350MB, make sure you have disk space

### Low Accuracy

1. Add more images per building (5-10 from different angles)
2. Use clear, well-lit photos
3. Lower similarity threshold to 0.5-0.6 for testing
4. Make sure `generate_embeddings.py` completed successfully

## Project Structure

```
cv 2/
├── src/
│   ├── model.py              # CLIP model wrapper
│   ├── database.py            # PostgreSQL + pgvector operations
│   ├── generate_embeddings.py # Generate and store embeddings
│   ├── api_server.py          # FastAPI server
│   ├── inference.py           # Standalone inference script
│   └── utils.py               # Utility functions
├── data/                      # Building images
├── docker-compose.yml         # PostgreSQL setup
├── requirements.txt           # Python dependencies
└── README.md
```

## How It Works

1. CLIP encodes images into 768-dimensional vectors
2. Embeddings are normalized to unit vectors for cosine similarity
3. Each building gets an averaged embedding stored in PostgreSQL
4. When querying, cosine similarity is computed using pgvector
5. Results are ranked by similarity and filtered by threshold

## Adding New Buildings

1. Add images to `data/new_building_name/`
2. Run `python src/generate_embeddings.py`
3. New building is automatically added to database

## Additional Resources

- [CLIP Paper](https://arxiv.org/abs/2103.00020)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
