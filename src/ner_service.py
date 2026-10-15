import os
import spacy
from typing import List, Dict, Any, Tuple
from src.config import MODEL_DIR

class NERService:
    def __init__(self, model_path: str = str(MODEL_DIR)):
        self.model_path = model_path
        self.model_name = "unknown"
        self.nlp = self._load_model()

    def _load_model(self):
        # 1. Cek artefak hasil fine-tuning
        if os.path.exists(self.model_path) and os.path.isdir(self.model_path):
            try:
                print(f"[INFO] Memuat fine-tuned model dari: {self.model_path}")
                nlp = spacy.load(self.model_path)
                self.model_name = "spacy-finetuned-news"
                return nlp
            except Exception as e:
                print(f"[WARNING] Gagal memuat custom model: {e}")

        # 2. Fallback otomatis ke en_core_web_sm
        try:
            print("[INFO] Memuat fallback model: en_core_web_sm...")
            nlp = spacy.load("en_core_web_sm")
            self.model_name = "en_core_web_sm-fallback"
            return nlp
        except Exception:
            print("[WARNING] Model belum terpasang, menginisialisasi pipeline blank 'en'...")
            nlp = spacy.blank("en")
            self.model_name = "spacy-blank-en-fallback"
            return nlp

    def reload_model(self):
        """Muat ulang model secara manual (misal setelah proses training selesai)."""
        self.nlp = self._load_model()

    def extract_entities(self, title: str, body: str) -> Tuple[List[Dict[str, Any]], Dict[str, Any], str]:
        # Penggabungan deterministik judul & body
        full_text = f"{title}\n\n{body}"
        doc = self.nlp(full_text)

        entities = []
        for ent in doc.ents:
            entities.append({
                "text": ent.text,
                "label": ent.label_,
                "start": ent.start_char,
                "end": ent.end_char
            })

        meta = {
            "entity_count": len(entities),
            "model": self.model_name,
            "char_count": len(full_text)
        }
        return entities, meta, full_text

ner_engine = NERService()
