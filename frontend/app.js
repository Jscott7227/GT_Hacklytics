const form = document.getElementById("searchForm");
const queryInput = document.getElementById("query");
const statusEl = document.getElementById("status");
const suggestionsEl = document.getElementById("suggestions");
const lyricsTitleEl = document.getElementById("lyricsTitle");
const lyricsArtistEl = document.getElementById("lyricsArtist");
const lyricsBodyEl = document.getElementById("lyricsBody");
const lyricsSpotifyLinkEl = document.getElementById("lyricsSpotifyLink");
const emotionsSectionEl = document.getElementById("emotionsSection");
const emotionBarsEl = document.getElementById("emotionBars");

let debounceTimer = null;
let searchRequestId = 0;
let tracksCache = [];
let selectedTrackId = null;

function setStatus(text) {
  statusEl.textContent = text;
}

function firstArtist(artists) {
  const [name] = String(artists || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return name || "";
}

function clearSuggestions() {
  suggestionsEl.innerHTML = "";
}

function setLyricsPanel({ title, artist, lyrics, spotifyUrl }) {
  lyricsTitleEl.textContent = title;
  lyricsArtistEl.textContent = artist;
  lyricsBodyEl.textContent = lyrics;

  if (spotifyUrl) {
    lyricsSpotifyLinkEl.href = spotifyUrl;
    lyricsSpotifyLinkEl.hidden = false;
  } else {
    lyricsSpotifyLinkEl.hidden = true;
  }
}

function clearEmotions() {
  emotionsSectionEl.hidden = true;
  emotionBarsEl.innerHTML = "";
}

function renderEmotions(emotions) {
  if (!emotions || !emotions.length) {
    clearEmotions();
    return;
  }

  emotionBarsEl.innerHTML = "";
  emotions.slice(0, 6).forEach(({ label, score }) => {
    const row = document.createElement("div");
    row.className = "emotion-row";

    const labelEl = document.createElement("span");
    labelEl.className = "emotion-label";
    labelEl.textContent = label;

    const track = document.createElement("div");
    track.className = "emotion-track";
    const fill = document.createElement("div");
    fill.className = "emotion-fill";
    fill.style.width = `${Math.round(score * 100)}%`;
    track.append(fill);

    const scoreEl = document.createElement("span");
    scoreEl.className = "emotion-score";
    scoreEl.textContent = `${Math.round(score * 100)}%`;

    row.append(labelEl, track, scoreEl);
    emotionBarsEl.append(row);
  });

  emotionsSectionEl.hidden = false;
}

async function loadEmotions(artist, title, lyrics) {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ artist, title, lyrics }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.emotions || null;
}

async function loadLyrics(artist, title) {
  const params = new URLSearchParams({ artist, title });
  const response = await fetch(`/api/lyrics?${params.toString()}`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    let message = "Lyrics lookup failed.";
    try {
      const data = await response.json();
      message = data.message || message;
    } catch {
      // Keep fallback message.
    }
    throw new Error(message);
  }

  const data = await response.json();
  return data.lyrics || null;
}

async function searchTracks(query) {
  const response = await fetch(`/api/spotify/search?q=${encodeURIComponent(query)}&limit=8`);
  if (!response.ok) {
    let message = "Search failed.";
    try {
      const data = await response.json();
      message = data.message || message;
    } catch {
      // Keep fallback message.
    }
    throw new Error(message);
  }

  return response.json();
}

function markActiveSuggestion() {
  const items = suggestionsEl.querySelectorAll(".suggestion-item");
  items.forEach((item) => {
    const isActive = item.dataset.trackId === selectedTrackId;
    item.classList.toggle("is-active", isActive);
  });
}

async function selectTrack(track) {
  selectedTrackId = track.id;
  markActiveSuggestion();

  const artist = firstArtist(track.artists) || track.artists;
  setLyricsPanel({
    title: track.name,
    artist,
    lyrics: "Loading lyrics...",
    spotifyUrl: track.spotifyUrl,
  });
  clearEmotions();

  try {
    const lyrics = await loadLyrics(artist, track.name);
    const lyricsText = lyrics || "Lyrics unavailable for this track.";
    setLyricsPanel({
      title: track.name,
      artist,
      lyrics: lyricsText,
      spotifyUrl: track.spotifyUrl,
    });

    if (lyrics) {
      const emotions = await loadEmotions(artist, track.name, lyrics);
      renderEmotions(emotions);
    }
  } catch (error) {
    setLyricsPanel({
      title: track.name,
      artist,
      lyrics: error.message,
      spotifyUrl: track.spotifyUrl,
    });
  }
}

function renderSuggestions(tracks) {
  clearSuggestions();

  if (!tracks.length) {
    setStatus("No songs found. Try another song or artist.");
    return;
  }

  const list = document.createElement("div");
  list.className = "suggestion-list";

  tracks.forEach((track) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "suggestion-item";
    button.dataset.trackId = track.id;

    if (track.image) {
      const img = document.createElement("img");
      img.className = "suggestion-cover";
      img.alt = `${track.name} album art`;
      img.src = track.image;
      button.append(img);
    }

    const meta = document.createElement("div");
    meta.className = "suggestion-meta";

    const title = document.createElement("p");
    title.className = "suggestion-title";
    title.textContent = track.name;

    const sub = document.createElement("p");
    sub.className = "suggestion-sub";
    sub.textContent = `${track.artists}${track.album ? ` • ${track.album}` : ""}`;

    meta.append(title, sub);
    button.append(meta);

    button.addEventListener("click", () => selectTrack(track));
    list.append(button);
  });

  suggestionsEl.append(list);
  setStatus("Click a song to view lyrics.");
}

async function runLiveSearch(query) {
  const currentId = ++searchRequestId;
  setStatus("Searching...");

  try {
    const tracks = await searchTracks(query);
    if (currentId !== searchRequestId) {
      return;
    }

    tracksCache = tracks;
    selectedTrackId = null;
    renderSuggestions(tracks);
  } catch (error) {
    if (currentId !== searchRequestId) {
      return;
    }

    clearSuggestions();
    setStatus(error.message);
  }
}

queryInput.addEventListener("input", () => {
  const query = queryInput.value.trim();

  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  if (!query) {
    searchRequestId += 1;
    tracksCache = [];
    selectedTrackId = null;
    clearSuggestions();
    setStatus("Start typing to search songs.");
    setLyricsPanel({
      title: "Select a song",
      artist: "Click any search result to load lyrics.",
      lyrics: "Lyrics will appear here.",
      spotifyUrl: "",
    });
    clearEmotions();
    return;
  }

  debounceTimer = setTimeout(() => {
    runLiveSearch(query);
  }, 280);
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const query = queryInput.value.trim();

  if (!query) {
    setStatus("Enter a song title or artist first.");
    return;
  }

  await runLiveSearch(query);

  if (tracksCache.length) {
    selectTrack(tracksCache[0]);
  }
});

setStatus("Start typing to search songs.");
queryInput.focus();
