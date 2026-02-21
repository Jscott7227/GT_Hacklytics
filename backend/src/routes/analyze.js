import { Router } from "express";
import { analyzeSong } from "../services/ml.js";

const router = Router();

router.post("/", async (req, res) => {
  const { artist = "", title = "", lyrics = "" } = req.body;

  if (!lyrics.trim()) {
    res.status(400).json({ error: "lyrics_required" });
    return;
  }

  try {
    const result = await analyzeSong(artist, title, lyrics);
    res.json(result);
  } catch (err) {
    res.status(503).json({ error: "ml_service_unavailable", message: err.message });
  }
});

export default router;
