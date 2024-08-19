import express from "express";
import { spawn } from "child_process";

const app = express();
const port = process.env.PORT || 3000;

let ffmpeg;
let isStreaming = false;

app.get("/start-stream", (req, res) => {
  const m3u8Url = req.query.m3u8;
  const telegramKey = req.query.key;

  if (!m3u8Url || !telegramKey) {
    return res.status(400).send("Missing m3u8 URL or Telegram stream key");
  }

  if (isStreaming) {
    return res.send("Stream is already running.");
  }

  const telegramRtmpUrl = `rtmps://dc4-1.rtmp.t.me/s/${telegramKey}`;

  // Start the FFmpeg process
  ffmpeg = spawn("ffmpeg", [
    "-i",
    m3u8Url, // Input from the m3u8 stream
    "-c:v",
    "libx264", // Video codec
    "-preset",
    "veryfast", // Speed of encoding
    "-b:v",
    "3000k", // Bitrate
    "-c:a",
    "aac", // Audio codec
    "-b:a",
    "160k", // Audio bitrate
    "-f",
    "flv", // Output format
    telegramRtmpUrl, // Output to Telegram RTMP
  ]);

  isStreaming = true;

  // Log FFmpeg output
  ffmpeg.stderr.on("data", (data) => {
    console.error(`FFmpeg stderr: ${data}`);
  });

  ffmpeg.on("close", (code) => {
    console.log(`FFmpeg process closed with code ${code}`);
    isStreaming = false;
  });

  res.send("Streaming to Telegram started.");
});

app.get("/stop-stream", (req, res) => {
  if (isStreaming && ffmpeg) {
    ffmpeg.kill("SIGINT"); // Gracefully stop the FFmpeg process
    isStreaming = false;
    return res.send("Streaming stopped.");
  }
  res.send("No stream is currently running.");
});

app.get("/status", (req, res) => {
  if (isStreaming) {
    return res.send("Stream is running.");
  } else {
    return res.send("No active stream.");
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
