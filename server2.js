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
  // ffmpeg = spawn("ffmpeg", [
  //   "-fflags",
  //   "+nobuffer",
  //   "-fflags",
  //   "discardcorrupt",
  //   "-reconnect",
  //   "1",
  //   "-reconnect_streamed",
  //   "1",
  //   "-reconnect_delay_max",
  //   "2",
  //   "-i",
  //   m3u8Url,
  //   "-c:v",
  //   "libx264",
  //   "-preset",
  //   "fast", // Using 'fast' preset for better quality while still optimizing for performance
  //   "-tune",
  //   "zerolatency", // Reduces latency, helpful for live streaming
  //   "-g",
  //   "50",
  //   "-bufsize",
  //   "10000k", // Increased buffer size
  //   "-b:v",
  //   "4000k", // Increased video bitrate for better quality
  //   "-r",
  //   "30", // Increased frame rate to 30 fps
  //   "-c:a",
  //   "aac",
  //   "-b:a",
  //   "192k", // Increased audio bitrate
  //   "-ac",
  //   "2", // Stereo audio
  //   "-f",
  //   "flv",
  //   "-threads",
  //   "2", // Utilize both cores
  //   telegramRtmpUrl,
  // ]);

  // ffmpeg = spawn("ffmpeg", [
  //   "-fflags", "+nobuffer",
  //   "-fflags", "discardcorrupt",
  //   "-reconnect", "1",
  //   "-reconnect_streamed", "1",
  //   "-reconnect_delay_max", "2",
  //   "-i", m3u8Url,
  //   "-c:v", "libx264",
  //   "-preset", "veryfast", // Use a faster preset to reduce CPU load
  //   "-tune", "zerolatency", // Reduces latency
  //   "-g", "60", // Adjusted keyframe interval
  //   "-r", "30", // Set frame rate to 30 fps
  //   "-bufsize", "5000k", // Decreased buffer size for lower latency
  //   "-b:v", "3500k", // Adjusted video bitrate for a balance between quality and performance
  //   "-maxrate", "3500k", // Set max bitrate
  //   "-c:a", "aac",
  //   "-b:a", "128k", // Lowered audio bitrate to reduce overall bandwidth
  //   "-ac", "2", // Stereo audio
  //   "-f", "flv",
  //   "-threads", "4", // Increase thread usage if the server has multiple cores
  //   telegramRtmpUrl,
  // ]);

  // ffmpeg = spawn("ffmpeg", [
  //   "-fflags", "+nobuffer",
  //   "-fflags", "discardcorrupt",
  //   "-reconnect", "1",
  //   "-reconnect_streamed", "1",
  //   "-reconnect_delay_max", "2",
  //   "-i", m3u8Url,
  //   "-c:v", "libx264",
  //   "-preset", "ultrafast", // Use 'ultrafast' preset for minimal CPU usage
  //   "-tune", "zerolatency", // Reduces latency for live streaming
  //   "-g", "60", // Keyframe interval (adjusted based on stream)
  //   "-r", "30", // Set frame rate to 30 fps
  //   "-bufsize", "3000k", // Decreased buffer size for lower latency
  //   "-b:v", "2500k", // Lower bitrate to reduce bandwidth usage
  //   "-maxrate", "2500k", // Max bitrate cap
  //   "-vf", "fps=30", // Ensures a consistent frame rate
  //   "-c:a", "aac",
  //   "-b:a", "128k", // Lower audio bitrate to reduce overall bandwidth
  //   "-ac", "2", // Stereo audio
  //   "-f", "flv",
  //   "-threads", "4", // Increase thread usage for better performance
  //   telegramRtmpUrl,
  // ]);

  // ffmpeg = spawn("ffmpeg", [
  //   "-fflags",
  //   "+nobuffer",
  //   "-fflags",
  //   "discardcorrupt",
  //   "-reconnect",
  //   "1",
  //   "-reconnect_streamed",
  //   "1",
  //   "-reconnect_delay_max",
  //   "2",
  //   "-i",
  //   m3u8Url,
  //   "-c:v",
  //   "libx264",
  //   "-preset",
  //   "ultrafast", // Adjust preset for faster encoding
  //   "-tune",
  //   "zerolatency",
  //   "-g",
  //   "50", // GOP size; adjust to match frame rate
  //   "-r",
  //   "25", // Set frame rate to 25 fps
  //   "-bufsize",
  //   "3000k",
  //   "-b:v",
  //   "2500k",
  //   "-maxrate",
  //   "2500k",
  //   "-c:a",
  //   "aac", // Convert ADTS to AAC
  //   "-ar",
  //   "44100", // Sample rate 44100 Hz
  //   "-b:a",
  //   "128k", // Set audio bitrate
  //   "-sample_fmt",
  //   "s16", // Change sample format to 16 bits per sample
  //   "-ac",
  //   "2", // Stereo audio
  //   "-f",
  //   "flv",
  //   "-threads",
  //   "4",
  //   telegramRtmpUrl,
  // ]);

  // ffmpeg = spawn("ffmpeg", [
  //   "-i",
  //   m3u8Url, // Input m3u8 URL
  //   "-c:v",
  //   "copy", // Copy video codec without re-encoding
  //   "-c:a",
  //   "copy", // Copy audio codec without re-encoding
  //   "-f",
  //   "flv", // Format for streaming to RTMP
  //   telegramRtmpUrl, // Telegram RTMP URL
  // ]);
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
