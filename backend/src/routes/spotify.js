import { Router } from "express";
import { getTrackById, searchTracks } from "../services/spotify.js";

const router = Router();

router.get("/track/:id", async (req, res) => {
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

router.get("/search", async (req, res) => {
  try {
    const q = String(req.query.q || "");
    const limit = Number(req.query.limit || 8);
    const tracks = await searchTracks(q, limit);

    res.json(
      tracks.map((track) => ({
        id: track.id,
        name: track.name,
        artists: (track.artists || []).map((artist) => artist.name).join(", "),
        album: track.album?.name || "",
        image: track.album?.images?.[0]?.url || "",
        previewUrl: track.preview_url,
        spotifyUrl: track.external_urls?.spotify || "",
      }))
    );
  } catch (error) {
    res.status(500).json({
      error: "spotify_search_failed",
      message: error.message,
    });
  }
});

export default router;
