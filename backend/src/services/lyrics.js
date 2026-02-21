const LRCLIB_API_BASE = "https://lrclib.net/api";
const LYRICS_OVH_BASE = "https://api.lyrics.ovh/v1";

function cleanTrackTitle(title) {
  return title
    .replace(/\(feat\.[^)]+\)/gi, "")
    .replace(/\(ft\.[^)]+\)/gi, "")
    .replace(/\[[^\]]*remaster[^\]]*\]/gi, "")
    .replace(/\([^)]+remaster[^)]*\)/gi, "")
    .replace(/\s+-\s+remaster(ed)?\b.*$/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeLyrics(lyrics, artist, title) {
  const text = String(lyrics || "").trim();
  if (!text) return null;

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return null;

  const firstLine = lines[0].toLowerCase();
  const normalizedArtist = String(artist || "").toLowerCase().trim();
  const normalizedTitle = String(title || "").toLowerCase().trim();
  const hasLyricsWord = /lyrics|paroles|letra|songtext|liedtext|tekst|chanson/.test(firstLine);
  const mentionsArtist = normalizedArtist && firstLine.includes(normalizedArtist);
  const mentionsTitle = normalizedTitle && firstLine.includes(normalizedTitle);

  if (hasLyricsWord && (mentionsArtist || mentionsTitle)) {
    lines.shift();
  }

  const cleaned = lines
    .filter((line) => !/^you might also like$/i.test(line))
    .map((line) => line.replace(/\d*Embed$/i, "").trim())
    .filter(Boolean)
    .join("\n")
    .trim();

  return cleaned || null;
}

async function requestFromLrcLib(artist, title) {
  const response = await fetch(
    `${LRCLIB_API_BASE}/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`
  );

  if (response.status === 404) return null;
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`LrcLib request failed (${response.status}): ${text}`);
  }

  const data = await response.json();
  return data?.plainLyrics || data?.syncedLyrics || null;
}

async function requestFromLyricsOvh(artist, title) {
  const response = await fetch(
    `${LYRICS_OVH_BASE}/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`
  );

  if (response.status === 404) return null;
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`lyrics.ovh request failed (${response.status}): ${text}`);
  }

  const data = await response.json();
  return data?.lyrics || null;
}

async function requestLyrics(artist, title) {
  const fromLrcLib = await requestFromLrcLib(artist, title);
  if (fromLrcLib) return sanitizeLyrics(fromLrcLib, artist, title);

  const fromLyricsOvh = await requestFromLyricsOvh(artist, title);
  if (fromLyricsOvh) return sanitizeLyrics(fromLyricsOvh, artist, title);

  return null;
}

export async function getLyrics(artist, title) {
  const cleanArtist = String(artist || "").trim();
  const cleanTitle = String(title || "").trim();
  if (!cleanArtist || !cleanTitle) {
    throw new Error("artist and title are required");
  }

  const titleVariants = [cleanTitle];
  const normalizedTitle = cleanTrackTitle(cleanTitle);
  if (normalizedTitle && normalizedTitle !== cleanTitle) {
    titleVariants.push(normalizedTitle);
  }

  for (const variant of titleVariants) {
    const lyrics = await requestLyrics(cleanArtist, variant);
    if (lyrics) {
      return {
        artist: cleanArtist,
        title: variant,
        lyrics,
      };
    }
  }

  return {
    artist: cleanArtist,
    title: cleanTitle,
    lyrics: null,
  };
}
