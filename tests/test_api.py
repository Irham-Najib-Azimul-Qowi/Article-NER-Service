import pytest
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)

def test_extract_entities_valid_article():
    """Kasus 1: Input artikel normal menghasilkan status 200 dan skema JSON sesuai."""
    payload = {
        "title": "Anwar Ibrahim attends Kuala Lumpur economic forum",
        "body": "Prime Minister Anwar Ibrahim emphasized the importance of AI governance in Malaysia during his keynote address."
    }
    res = client.post("/extract-entities", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "entities" in data
    assert "meta" in data
    assert isinstance(data["entities"], list)
    assert data["meta"]["entity_count"] == len(data["entities"])
    assert "model" in data["meta"]
    assert data["meta"]["char_count"] == len(f"{payload['title']}\n\n{payload['body']}")

def test_extract_entities_empty_input_rejected():
    """Kasus 2: Input kosong atau hanya whitespace wajib ditolak (HTTP 400)."""
    res1 = client.post("/extract-entities", json={"title": "   ", "body": "Konten berita valid dan panjang."})
    assert res1.status_code == 400

    res2 = client.post("/extract-entities", json={"title": "Judul Valid", "body": "   "})
    assert res2.status_code == 400

    res3 = client.post("/extract-entities", json={"title": "", "body": ""})
    assert res3.status_code == 400

def test_extract_entities_length_boundaries():
    """Kasus 3: Input di luar batas panjang karakter wajib ditolak (HTTP 400)."""
    # Title too short (< 3 chars)
    res_short_title = client.post("/extract-entities", json={"title": "AB", "body": "Konten berita yang memenuhi syarat panjang."})
    assert res_short_title.status_code == 400

    # Body too short (< 10 chars)
    res_short_body = client.post("/extract-entities", json={"title": "Judul Valid", "body": "Pendek"})
    assert res_short_body.status_code == 400

    # Title exceeds 500 chars
    long_title = "A" * 501
    res_long_title = client.post("/extract-entities", json={"title": long_title, "body": "Konten berita yang memenuhi syarat panjang."})
    assert res_long_title.status_code == 400

def test_extract_entities_malformed_json():
    """Kasus 4: Payload bukan JSON valid ditolak dengan aman (HTTP 400)."""
    res = client.post("/extract-entities", content="bukan json", headers={"Content-Type": "application/json"})
    assert res.status_code == 400

def test_character_offset_accuracy():
    """Kasus 5: Memastikan indeks start dan end akurat 100% terhadap string full_text gabungan."""
    title = "Kuala Lumpur Summit"
    body = "The event will be organized in Malaysia."
    payload = {"title": title, "body": body}
    res = client.post("/extract-entities", json=payload)
    assert res.status_code == 200

    full_text = f"{title}\n\n{body}"
    for ent in res.json()["entities"]:
        start = ent["start"]
        end = ent["end"]
        assert full_text[start:end] == ent["text"], f"Offset mismatch: '{full_text[start:end]}' != '{ent['text']}'"

def test_extract_entities_no_entities_found():
    """Kasus 6: Teks tanpa entitas menghasilkan array entities kosong tanpa error."""
    payload = {
        "title": "nothing here",
        "body": "it is what it is and always has been so forever and ever."
    }
    res = client.post("/extract-entities", json=payload)
    assert res.status_code == 200
    assert res.json()["entities"] == []
    assert res.json()["meta"]["entity_count"] == 0

def test_extract_entities_batch():
    """Kasus 7: Batch extraction endpoint memproses multi artikel dengan sukses."""
    batch_payload = {
        "articles": [
            {
                "title": "MHC reschedules matches",
                "body": "The Malaysian Hockey Confederation announced changes."
            },
            {
                "title": "Bursa Malaysia updates",
                "body": "Maybank and CIMB Group reported earnings in Kuala Lumpur."
            }
        ]
    }
    res = client.post("/extract-entities/batch", json=batch_payload)
    assert res.status_code == 200
    data = res.json()
    assert data["total_articles"] == 2
    assert len(data["results"]) == 2

def test_health_and_index():
    """Kasus 8: Endpoint health dan index HTML berfungsi normal."""
    res_health = client.get("/health")
    assert res_health.status_code == 200
    assert "status" in res_health.json()

    res_index = client.get("/")
    assert res_index.status_code == 200
    assert "Article Named-Entity Recognition" in res_index.text
