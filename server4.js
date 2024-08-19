import express from "express";
import { spawn } from "child_process";

const app = express();
const port = process.env.PORT || 3000;

let ffmpeg;
let isStreaming = false;
let retryCount = 0;
const maxRetries = 5;
const retryDelay = 5000; // 5 seconds delay before retrying

// Function to start streaming
function startStreaming(m3u8Url, telegramRtmpUrl) {
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
    "veryfast", // Use a faster preset to reduce CPU load
    "-tune",
    "zerolatency", // Reduces latency
    "-g",
    "60", // Adjusted keyframe interval
    "-r",
    "30", // Set frame rate to 30 fps
    "-bufsize",
    "5000k", // Decreased buffer size for lower latency
    "-b:v",
    "3500k", // Adjusted video bitrate for a balance between quality and performance
    "-maxrate",
    "3500k", // Set max bitrate
    "-c:a",
    "aac",
    "-b:a",
    "128k", // Lowered audio bitrate to reduce overall bandwidth
    "-ac",
    "2", // Stereo audio
    "-f",
    "flv",
    "-threads",
    "4", // Increase thread usage if the server has multiple cores
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
    retryStream(m3u8Url, telegramRtmpUrl); // Attempt to restart the stream
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
    ffmpeg.kill("SIGINT"); // Gracefully stop the FFmpeg process
    isStreaming = false;
    retryCount = maxRetries; // Prevent retries after manual stop
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
