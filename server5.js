import express from "express";
import { spawn } from "child_process";

const app = express();
const port = process.env.PORT || 3000;

let streams = {}; // Object to store streams by ID

function startStreaming(id, m3u8Url, telegramRtmpUrl) {
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

  streams[id] = { ffmpeg, isStreaming: true, retryCount: 0 };

  ffmpeg.stderr.on("data", (data) => {
    console.warn(`FFmpeg stderr [Stream ${id}]: ${data}`);
  });

  ffmpeg.on("close", (code) => {
    console.log(`FFmpeg process for stream ${id} closed with code ${code}`);
    if (streams[id]) {
      streams[id].isStreaming = false;
      retryStream(id, m3u8Url, telegramRtmpUrl);
    }
  });
}

// Function to retry streaming
function retryStream(id, m3u8Url, telegramRtmpUrl) {
  const maxRetries = 15;
  const retryDelay = 5000;

  if (streams[id] && streams[id].retryCount < maxRetries) {
    streams[id].retryCount++;
    console.log(
      `Retrying stream ${id}... Attempt ${streams[id].retryCount}/${maxRetries}`
    );
    setTimeout(() => {
      startStreaming(id, m3u8Url, telegramRtmpUrl);
    }, retryDelay);
  } else {
    console.log(
      `Max retry attempts reached for stream ${id}. Stream will not be restarted.`
    );
    delete streams[id]; // Clean up the stream after max retries
  }
}

app.get("/start-stream/:id", (req, res) => {
  const id = req.params.id;
  const m3u8Url = req.query.m3u8;
  const telegramKey = req.query.key;

  if (!m3u8Url || !telegramKey) {
    return res.status(400).send("Missing m3u8 URL or Telegram stream key");
  }

  if (streams[id] && streams[id].isStreaming) {
    return res.send(`Stream ${id} is already running.`);
  }

  const telegramRtmpUrl = `rtmps://dc4-1.rtmp.t.me/s/${telegramKey}`;

  startStreaming(id, m3u8Url, telegramRtmpUrl);

  res.send(`Streaming to Telegram started for stream ${id}.`);
});

app.get("/stop-stream/:id", (req, res) => {
  const id = req.params.id;

  if (streams[id] && streams[id].isStreaming) {
    streams[id].ffmpeg.kill("SIGINT"); // Gracefully stop the FFmpeg process
    streams[id].isStreaming = false;
    delete streams[id]; // Clean up the stream after stopping
    return res.send(`Streaming stopped for stream ${id}.`);
  }
  res.send(`No stream is currently running for stream ${id}.`);
});

app.get("/status/:id", (req, res) => {
  const id = req.params.id;

  if (streams[id] && streams[id].isStreaming) {
    return res.send(`Stream ${id} is running.`);
  } else {
    return res.send(`No active stream for stream ${id}.`);
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
