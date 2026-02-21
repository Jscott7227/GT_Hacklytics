# PulseSearch — Spotify Song Finder

Full-stack web app for searching Spotify tracks and viewing lyrics, with planned sentiment analysis and theme categorization.

## Project structure

```
GT_Hacklytics/
├── backend/          # Node.js + Express API server
│   ├── src/
│   │   ├── routes/   # Route handlers (spotify, lyrics)
│   │   ├── services/ # External API integrations (Spotify, lyrics providers)
│   │   └── server.js
│   ├── package.json
│   └── .env.example
├── frontend/         # Vanilla JS single-page app
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── notebooks/        # Jupyter notebooks — sentiment analysis & theme categorization
├── db/               # Database schema, migrations, seeds
└── .env              # Root env file (shared across services)
```

## Prerequisites

1. Install Node.js 20+ from `https://nodejs.org/`.
2. Verify install:

```bash
node -v
npm -v
```

## Setup

1. Create a Spotify app in Spotify Developer Dashboard.
2. Copy `backend/.env.example` to `.env` at the project root:

```bash
cp backend/.env.example .env
```

3. Put your API values in `.env`:

```env
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
PORT=3000
```

4. Install backend dependencies:

```bash
cd backend && npm install
```

5. Start the server:

```bash
npm start
```

## Open app

```bash
open http://localhost:3000
```

## API endpoints

```bash
curl "http://localhost:3000/api/spotify/search?q=blinding%20lights&limit=10"
curl "http://localhost:3000/api/spotify/track/11dFghVXANMlKmJXsNCbNl"
curl "http://localhost:3000/api/lyrics?artist=The%20Weeknd&title=Blinding%20Lights"
curl "http://localhost:3000/health"
```

`blinding lights`, `The Weeknd`, and the track ID above are example values only.
Replace them with any song/artist/track you want to query.

## Lyrics

- Type in the search bar to get live song results directly under it.
- Click any result to load lyrics in the lyrics panel beside the search results.
- Submitting search (`Enter`) auto-loads lyrics for the top result.
- Lyrics are requested through a provider fallback chain (`lrclib.net`, then `lyrics.ovh`).
- Some tracks may not return lyrics depending on provider coverage.

## Planned additions

- **`db/`** — database for storing tracks, lyrics, and analysis results
- **`notebooks/`** — Jupyter notebooks for sentiment analysis and theme categorization of lyrics
