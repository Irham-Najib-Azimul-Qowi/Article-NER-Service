from pydantic import BaseModel, Field, field_validator
from typing import List
from src.config import MAX_TITLE_LENGTH, MAX_BODY_LENGTH, MIN_TITLE_LENGTH, MIN_BODY_LENGTH

class EntityItem(BaseModel):
    text: str = Field(..., description="Teks entitas terdeteksi")
    label: str = Field(..., description="Kategori label entitas (PERSON, ORG, LOC, dll)")
    start: int = Field(..., description="Zero-based character start offset relative to full_text")
    end: int = Field(..., description="Exclusive character end offset relative to full_text")

class MetaData(BaseModel):
    entity_count: int = Field(..., description="Jumlah entitas yang berhasil dideteksi")
    model: str = Field(..., description="Nama atau pengenal model yang digunakan")
    char_count: int = Field(..., description="Jumlah karakter dalam full_text yang dianalisis")

class ArticleRequest(BaseModel):
    title: str = Field(..., description="Judul berita")
    body: str = Field(..., description="Isi badan berita")

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        if not isinstance(v, str):
            raise ValueError("Judul harus berupa string.")
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Judul (title) tidak boleh kosong atau hanya whitespace.")
        if len(cleaned) < MIN_TITLE_LENGTH:
            raise ValueError(f"Judul minimal {MIN_TITLE_LENGTH} karakter.")
        if len(v) > MAX_TITLE_LENGTH:
            raise ValueError(f"Judul melebihi batas maksimal {MAX_TITLE_LENGTH} karakter.")
        return cleaned

    @field_validator("body")
    @classmethod
    def validate_body(cls, v: str) -> str:
        if not isinstance(v, str):
            raise ValueError("Isi berita harus berupa string.")
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Isi berita (body) tidak boleh kosong atau hanya whitespace.")
        if len(cleaned) < MIN_BODY_LENGTH:
            raise ValueError(f"Isi berita minimal {MIN_BODY_LENGTH} karakter.")
        if len(v) > MAX_BODY_LENGTH:
            raise ValueError(f"Isi berita melebihi batas maksimal {MAX_BODY_LENGTH} karakter.")
        return cleaned

class ArticleResponse(BaseModel):
    entities: List[EntityItem]
    meta: MetaData

class BatchArticleRequest(BaseModel):
    articles: List[ArticleRequest] = Field(..., min_length=1, max_length=50, description="Daftar artikel untuk dianalisis sekaligus")

class BatchArticleResponseItem(BaseModel):
    index: int
    entities: List[EntityItem]
    meta: MetaData

class BatchArticleResponse(BaseModel):
    results: List[BatchArticleResponseItem]
    total_articles: int
