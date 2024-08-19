import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);

// Input M3U8 stream URL
const m3u8Url = "https://xcdn.bong.ink/hls/bong1.m3u8"; // Replace with your M3U8 stream URL

// Telegram RTMP URL
const telegramStreamKey = "2198776956:nZwbOPKP_HysUsnjE0S0Ng"; // Replace with your Telegram stream key
const telegramRtmpUrl = `rtmps://dc4-1.rtmp.t.me/s/${telegramStreamKey}`;

// Start FFmpeg process to restream
ffmpeg(m3u8Url)
  .inputOptions(["-re", "-fflags +genpts"]) // Read input at native frame rate
  .outputOptions([
    "-c:v libx264", // Re-encode video using H.264
    "-b:v 1500k", // Set video bitrate
    "-c:a aac", // Encode audio as AAC
    "-b:a 128k", // Audio bitrate
    "-f flv",
    "-bufsize 3M", // Set buffer size
    "-maxrate 4M",
    "-preset veryfast",
  ])
  .output(telegramRtmpUrl)
  .on("start", (commandLine) => {
    console.log("FFmpeg command: " + commandLine);
  })
  .on("stderr", (stderrLine) => {
    console.log("FFmpeg stderr output: " + stderrLine);
  })
  .on("error", (err, stdout, stderr) => {
    console.error("Error: " + err.message);
    console.error("FFmpeg stderr: " + stderr);
  })
  .on("end", () => {
    console.log("Streaming finished");
  })
  .run();
