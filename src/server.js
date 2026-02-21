import express from "express";
import { getTrackById } from "./spotify.js";

const app = express();
const port = Number(process.env.PORT || 3000);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/spotify/track/:id", async (req, res) => {
  try {
    const track = await getTrackById(req.params.id);
    res.json(track);
  } catch (error) {
    res.status(500).json({
      error: "spotify_request_failed",
      message: error.message,
    });
  }
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
