import express from "express";
import { spawn } from "child_process";
import path from "path";

const app = express();
const port = process.env.PORT || 3200;

let ffmpeg;
let isStreaming = false;
let retryCount = 0;
const maxRetries = 15;
const retryDelay = 5000; // 5 seconds delay before retrying
let stoppedStream = false;

// Function to start streaming
function startStreaming(m3u8Url, telegramRtmpUrl) {
  const fullLogoPath = path.resolve("logo.png");
  const ffmpeg = spawn("ffmpeg", [
    "-fflags",
    "+nobuffer",
    "-fflags",
    "discardcorrupt",
    "-reconnect",
    "1",
    "-reconnect_streamed",
    "1",
    "-reconnect_delay_max",
    "5", // Increased delay before reconnecting
    "-i",
    m3u8Url,
    "-i",
    fullLogoPath,
    "-filter_complex",
    "[1:v]scale=150:150[logo];[0:v][logo]overlay=W-w-10:H-h-10",
    "-c:v",
    "libx264",
    "-preset",
    "superfast", // Reduced preset to reduce CPU load
    "-tune",
    "zerolatency",
    "-g",
    "60",
    "-r",
    "30",
    "-bufsize",
    "7000k", // Increased buffer size
    "-b:v",
    "3000k", // Slightly reduced bitrate to ease the load
    "-maxrate",
    "3000k",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-ac",
    "2",
    "-f",
    "flv",
    "-threads",
    "4",
    telegramRtmpUrl,
  ]);

  isStreaming = true;

  // Log FFmpeg output
  ffmpeg.stderr.on("data", (data) => {
    console.warn(`FFmpeg stderr: ${data}`);
  });

  ffmpeg.on("close", (code) => {
    console.log(`FFmpeg process closed with code ${code}`);
    isStreaming = false;
    if (!stoppedStream) {
      retryStream(m3u8Url, telegramRtmpUrl); // Attempt to restart the stream
    }
  });
}

// Function to retry streaming
function retryStream(m3u8Url, telegramRtmpUrl) {
  retryCount = 0;
  if (retryCount < maxRetries) {
    retryCount++;
    console.log(`Retrying stream... Attempt ${retryCount}/${maxRetries}`);
    setTimeout(() => {
      startStreaming(m3u8Url, telegramRtmpUrl);
    }, retryDelay);
  } else {
    console.log("Max retry attempts reached. Stream will not be restarted.");
  }
}

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
  retryCount = 0; // Reset retry count on a new start

  startStreaming(m3u8Url, telegramRtmpUrl);

  res.send("Streaming to Telegram started.");
});

app.get("/stop-stream", (req, res) => {
  if (isStreaming && ffmpeg) {
    stoppedStream = true;
    ffmpeg.kill("SIGINT"); // Gracefully stop the FFmpeg process
    isStreaming = false;
    retryCount = maxRetries; // Prevent retries after manual stop
    return res.send("Streaming stopped.");
  }
  res.send("No stream is currently running.");
});

app.get("/status", (req, res) => {
  console.log("Status checked");
  if (isStreaming) {
    return res.send("Stream is running.");
  } else {
    return res.send("No active stream.");
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
