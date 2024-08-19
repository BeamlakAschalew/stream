import { spawn } from "child_process";
import axios from "axios";

// Replace with your Telegram RTMP URL
// Replace with your Telegram RTMP URL
const TELEGRAM_RTMP_URL =
  "rtmps://dc4-1.rtmp.t.me/s/1949099143:QQN1e5SShF0SqnyMeTC56A";
const M3U8_URL = "https://live.tv247us.com/hls/discovery.m3u8";

// Function to stream m3u8 to Telegram Live using FFmpeg
async function streamToTelegram() {
  try {
    // Check if the m3u8 URL is accessible
    const response = await axios.get(M3U8_URL);
    if (response.status === 200) {
      console.log("Streaming started...");

      // Spawn FFmpeg process
      const ffmpeg = spawn("ffmpeg", [
        "-re",
        "-i",
        M3U8_URL,
        "-c",
        "copy",
        "-f",
        "flv",
        TELEGRAM_RTMP_URL,
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
