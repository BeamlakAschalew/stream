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
    "-fflags",
    "+nobuffer",
    "-fflags",
    "discardcorrupt",
    "-reconnect",
    "1",
    "-reconnect_streamed",
    "1",
    "-reconnect_delay_max",
    "2",
    "-i",
    m3u8Url,
    "-c:v",
    "libx264",
    "-preset",
    "fast", // Using 'fast' preset for better quality while still optimizing for performance
    "-tune",
    "zerolatency", // Reduces latency, helpful for live streaming
    "-g",
    "50",
    "-bufsize",
    "10000k", // Increased buffer size
    "-b:v",
    "4000k", // Increased video bitrate for better quality
    "-r",
    "30", // Increased frame rate to 30 fps
    "-c:a",
    "aac",
    "-b:a",
    "192k", // Increased audio bitrate
    "-ac",
    "2", // Stereo audio
    "-f",
    "flv",
    "-threads",
    "2", // Utilize both cores
    telegramRtmpUrl,
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
