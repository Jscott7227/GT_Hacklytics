import numpy as np
from sentence_transformers import SentenceTransformer

_model = None


def get_embedder():
    global _model
    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


def embed_lyrics(lyrics: str) -> list[float]:
    """Return a 384-dim normalized embedding vector."""
    return get_embedder().encode(lyrics, normalize_embeddings=True).tolist()


def cosine_similarity(a: list[float], b: list[float]) -> float:
    a, b = np.array(a), np.array(b)
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))


def find_similar(query_lyrics: str, song_library: list[dict], top_k: int = 5) -> list[dict]:
    """
    Find songs with similar lyric content from a library of Firestore docs.
    Each doc must have an 'embedding' field.
    """
    query_vec = embed_lyrics(query_lyrics)
    scored = [
        {
            "artist": s["artist"],
            "title": s["title"],
            "emotions": s.get("emotions", []),
            "similarity": round(cosine_similarity(query_vec, s["embedding"]), 4),
        }
        for s in song_library
        if "embedding" in s
    ]
    return sorted(scored, key=lambda x: x["similarity"], reverse=True)[:top_k]
