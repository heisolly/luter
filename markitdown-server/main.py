import os
import tempfile
import logging
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from markitdown import MarkItDown

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("markitdown-server")

app = FastAPI(title="MarkItDown Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

md = MarkItDown()


@app.post("/convert")
async def convert_file(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        ext = os.path.splitext(file.filename or "file")[1].lower()

        supported = {
            ".pdf", ".docx", ".doc", ".pptx", ".ppt",
            ".xlsx", ".xls", ".csv",
            ".txt", ".html", ".htm", ".xml", ".json",
            ".epub", ".md", ".zip",
        }

        if ext not in supported:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {ext}. Supported: {', '.join(sorted(supported))}"
            )

        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            tmp.write(contents)
            tmp_path = tmp.name

        try:
            result = md.convert(tmp_path)
            text = result.text_content or ""
            if not text.strip():
                raise HTTPException(status_code=422, detail="No text could be extracted from this file")

            word_count = len(text.split())
            chunks = _chunk_text(text, chunk_size=2000)

            return {
                "success": True,
                "text": text,
                "chunks": chunks,
                "metadata": {
                    "filename": file.filename,
                    "format": ext,
                    "word_count": word_count,
                    "chunk_count": len(chunks),
                },
            }
        finally:
            os.unlink(tmp_path)

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Conversion failed")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    return {"status": "ok"}


def _chunk_text(text: str, chunk_size: int = 2000) -> list[dict]:
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size):
        chunk_words = words[i : i + chunk_size]
        chunks.append({
            "text": " ".join(chunk_words),
            "index": len(chunks),
        })
    return chunks


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
