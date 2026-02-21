import os
import numpy as np
from transformers import pipeline

# Use fine-tuned model if it exists (produced by the training notebook),
# otherwise fall back to the pre-trained go_emotions model.
_FINE_TUNED_PATH = os.path.join(os.path.dirname(__file__), "go_emotions_model")
_FALLBACK_MODEL = "SamLowe/roberta-base-go_emotions"

_classifier = None


def _load_classifier():
    if os.path.isdir(_FINE_TUNED_PATH):
        print(f"Loading fine-tuned model from {_FINE_TUNED_PATH}")
        return pipeline(
            "text-classification",
            model=_FINE_TUNED_PATH,
            top_k=None,
            truncation=True,
            max_length=128,
        )
    print(f"Fine-tuned model not found — using {_FALLBACK_MODEL}")
    return pipeline(
        "text-classification",
        model=_FALLBACK_MODEL,
        top_k=None,
        truncation=True,
        max_length=512,
    )


def get_classifier():
    global _classifier
    if _classifier is None:
        _classifier = _load_classifier()
    return _classifier


def chunk_lyrics(lyrics: str, max_words: int = 80) -> list[str]:
    lines = lyrics.strip().split("\n")
    chunks, current, current_len = [], [], 0

    for line in lines:
        n = len(line.split())
        if current_len + n > max_words:
            if current:
                chunks.append(" ".join(current))
            current, current_len = [line], n
        else:
            current.append(line)
            current_len += n

    if current:
        chunks.append(" ".join(current))

    return chunks or [lyrics]


def classify_lyrics(lyrics: str, min_score: float = 0.10) -> list[dict]:
    """
    Classify emotions in song lyrics.
    Splits into chunks, averages scores across chunks,
    and returns emotions above min_score sorted by score desc.
    """
    classifier = get_classifier()
    chunks = chunk_lyrics(lyrics)
    all_results = classifier(chunks)

    label_scores: dict[str, list[float]] = {}
    for chunk_result in all_results:
        for item in chunk_result:
            label_scores.setdefault(item["label"], []).append(item["score"])

    averaged = [
        {"label": label, "score": round(float(np.mean(scores)), 4)}
        for label, scores in label_scores.items()
    ]

    filtered = [e for e in averaged if e["score"] >= min_score]
    return sorted(filtered, key=lambda x: x["score"], reverse=True)
