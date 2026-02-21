const ML_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

export async function analyzeSong(artist, title, lyrics) {
  const res = await fetch(`${ML_URL}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ artist, title, lyrics }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error("ml_service_error");
  return res.json();
}
