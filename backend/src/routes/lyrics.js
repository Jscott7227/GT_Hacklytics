import { Router } from "express";
import { getLyrics } from "../services/lyrics.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const artist = String(req.query.artist || "");
    const title = String(req.query.title || "");
    const result = await getLyrics(artist, title);

    if (!result.lyrics) {
      res.status(404).json({
        error: "lyrics_not_found",
        message: `No lyrics found for "${title}" by "${artist}".`,
      });
      return;
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: "lyrics_request_failed",
      message: error.message,
    });
  }
});

export default router;
