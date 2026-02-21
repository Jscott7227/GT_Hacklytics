from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from classifier import classify_lyrics
from embedder import embed_lyrics

app = FastAPI(title="PulseSearch ML Service")


class SongRequest(BaseModel):
    artist: str
    title: str
    lyrics: str


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze")
def analyze(song: SongRequest):
    if not song.lyrics.strip():
        raise HTTPException(status_code=400, detail="lyrics cannot be empty")
    return {
        "artist": song.artist,
        "title": song.title,
        "emotions": classify_lyrics(song.lyrics),
        "embedding": embed_lyrics(song.lyrics),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
