const TOKEN_URL = "https://accounts.spotify.com/api/token";
const API_BASE = "https://api.spotify.com/v1";

let cachedToken = null;
let tokenExpiresAt = 0;

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function fetchAccessToken() {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt) {
    return cachedToken;
  }

  const clientId = getRequiredEnv("SPOTIFY_CLIENT_ID");
  const clientSecret = getRequiredEnv("SPOTIFY_CLIENT_SECRET");

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Spotify token request failed (${response.status}): ${text}`);
  }

  const data = await response.json();
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken;
}

export async function getTrackById(trackId) {
  const token = await fetchAccessToken();
  const response = await fetch(`${API_BASE}/tracks/${encodeURIComponent(trackId)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Spotify track request failed (${response.status}): ${text}`);
  }

  return response.json();
}

export async function searchTracks(query, limit = 8) {
  if (!query || !query.trim()) {
    return [];
  }

  const safeLimit = Math.min(Math.max(Number(limit) || 8, 1), 20);
  const token = await fetchAccessToken();
  const params = new URLSearchParams({
    q: query.trim(),
    type: "track",
    limit: String(safeLimit),
    market: "US",
  });

  const response = await fetch(`${API_BASE}/search?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Spotify search request failed (${response.status}): ${text}`);
  }

  const data = await response.json();
  return data?.tracks?.items ?? [];
}
