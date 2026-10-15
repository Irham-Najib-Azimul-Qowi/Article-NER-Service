from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
# Look for dataset either inside project or in parent (workspace root)
DATASET_DIR = BASE_DIR / "dataset" if (BASE_DIR / "dataset").exists() else BASE_DIR.parent / "dataset"
DATA_DIR = BASE_DIR / "data"
MODEL_DIR = BASE_DIR / "model" / "model-best"
STATIC_DIR = BASE_DIR / "src" / "static"

MAX_TITLE_LENGTH = 500
MAX_BODY_LENGTH = 50000
MIN_TITLE_LENGTH = 3
MIN_BODY_LENGTH = 10
