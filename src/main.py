import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from src.schemas import ArticleRequest, ArticleResponse, BatchArticleRequest, BatchArticleResponse, BatchArticleResponseItem
from src.ner_service import ner_engine
from src.config import STATIC_DIR

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Model loaded via ner_engine singleton on startup
    print(f"[STARTUP] NER Engine aktif menggunakan model: {ner_engine.model_name}")
    yield
    print("[SHUTDOWN] NER Engine dihentikan.")

app = FastAPI(
    title="Article Named-Entity Recognition Service",
    description="API & Web Panel ekstraksi entitas artikel berita (News-Monitoring).",
    version="1.0.0",
    lifespan=lifespan
)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    msg = errors[0].get("msg", "Validasi input gagal.") if errors else "Validasi input gagal."
    # Strip any leading 'Value error, ' message from pydantic custom validators
    if msg.startswith("Value error, "):
        msg = msg[len("Value error, "):]
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"detail": f"Input tidak valid: {msg}"}
    )

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    # Handle bad JSON or request parsing errors cleanly
    if exc.status_code == 400 or exc.status_code == 422:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"detail": str(exc.detail)}
        )
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": str(exc.detail)}
    )

@app.get("/health", status_code=status.HTTP_200_OK)
async def health_check():
    return {
        "status": "ok",
        "model": ner_engine.model_name
    }

@app.post("/extract-entities", response_model=ArticleResponse, status_code=status.HTTP_200_OK)
async def extract_entities(payload: ArticleRequest):
    try:
        entities, meta, _ = ner_engine.extract_entities(payload.title, payload.body)
        return ArticleResponse(entities=entities, meta=meta)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Terjadi kesalahan internal inferensi: {str(e)}"
        )

@app.post("/extract-entities/batch", response_model=BatchArticleResponse, status_code=status.HTTP_200_OK)
async def extract_entities_batch(payload: BatchArticleRequest):
    try:
        results = []
        for idx, article in enumerate(payload.articles):
            entities, meta, _ = ner_engine.extract_entities(article.title, article.body)
            results.append(BatchArticleResponseItem(
                index=idx,
                entities=entities,
                meta=meta
            ))
        return BatchArticleResponse(
            results=results,
            total_articles=len(results)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Terjadi kesalahan internal batch: {str(e)}"
        )

# Mount Frontend Web Panel
if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/", response_class=HTMLResponse)
async def serve_index():
    index_file = STATIC_DIR / "index.html"
    if index_file.exists():
        with open(index_file, "r", encoding="utf-8") as f:
            return f.read()
    return "<h1>File static/index.html belum ditemukan.</h1>"
