import { spawn } from "child_process";
import axios from "axios";

// Replace with your Telegram RTMP URL
// Replace with your Telegram RTMP URL
const TELEGRAM_RTMP_URL =
  "rtmps://dc4-1.rtmp.t.me/s/2198776956:nZwbOPKP_HysUsnjE0S0Ng";
const M3U8_URL = "https://xcdn.bong.ink/hls/bong1.m3u8";

// Function to stream m3u8 to Telegram Live using FFmpeg
async function streamToTelegram() {
  try {
    // Check if the m3u8 URL is accessible
    const response = await axios.get(M3U8_URL);
    if (response.status === 200) {
      console.log("Streaming started...");

      // Spawn FFmpeg process
      // const ffmpeg = spawn("ffmpeg", [
      //   "-re",
      //   "-i",
      //   M3U8_URL,
      //   "-c",
      //   "copy",
      //   "-f",
      //   "flv",
      //   TELEGRAM_RTMP_URL,
      // ]);

      const ffmpeg = spawn("ffmpeg", [
        "-i",
        M3U8_URL, // Input m3u8 URL
        "-c:v",
        "copy", // Copy video codec without re-encoding
        "-c:a",
        "copy", // Copy audio codec without re-encoding
        "-f",
        "flv", // Format for streaming to RTMP
        TELEGRAM_RTMP_URL, // Telegram RTMP URL
      ]);

      ffmpeg.stdout.on("data", (data) => {
        console.log(`stdout: ${data}`);
      });

      ffmpeg.stderr.on("data", (data) => {
        console.error(`stderr: ${data}`);
      });

      ffmpeg.on("close", (code) => {
        console.log(`FFmpeg process exited with code ${code}`);
      });
    } else {
      console.error("Failed to fetch m3u8 URL");
    }
  } catch (error) {
    console.error("Error fetching m3u8 URL:", error);
  }
}

// Start the streaming
streamToTelegram();
