import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import spotifyRouter from "./routes/spotify.js";
import lyricsRouter from "./routes/lyrics.js";
import analyzeRouter from "./routes/analyze.js";

const app = express();
app.use(express.json());
const port = Number(process.env.PORT || 3000);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const candidateStaticDirs = [
  path.join(__dirname, "../../frontend"),
  path.join(__dirname, "../../public"),
];
const staticDir = candidateStaticDirs.find((dir) => fs.existsSync(path.join(dir, "index.html")));

if (staticDir) {
  app.use(express.static(staticDir));
}

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/spotify", spotifyRouter);
app.use("/api/lyrics", lyricsRouter);
app.use("/api/analyze", analyzeRouter);

app.get("/", (_req, res) => {
  if (!staticDir) {
    res.status(500).json({
      error: "frontend_not_found",
      message: "Could not find index.html in frontend/ or public/.",
    });
    return;
  }
  res.sendFile(path.join(staticDir, "index.html"));
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
