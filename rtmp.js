import RTMPClient from "rtmp-client";
import axios from "axios";

const TELEGRAM_RTMP_URL =
  "rtmps://dc4-1.rtmp.t.me/s/1949099143:QQN1e5SShF0SqnyMeTC56A";
const M3U8_URL = "https://content.jwplatform.com/manifests/yp34SRmf.m3u8";

async function getM3U8Segments(url) {
  try {
    const response = await axios.get(url);
    if (response.status === 200) {
      // Extract segment URLs from the m3u8 file content
      const segments = response.data.match(/(https?:\/\/.*\.ts)/g) || [];
      return segments;
    } else {
      console.error(
        `Failed to fetch m3u8 file. Status code: ${response.status}`
      );
      return [];
    }
  } catch (error) {
    console.error(`Error fetching m3u8 file: ${error.message}`);
    return [];
  }
}

// Stream segments to the RTMP server
async function streamSegmentToRTMP(segmentUrl, rtmpUrl) {
  try {
    const response = await axios({
      url: segmentUrl,
      method: "GET",
      responseType: "arraybuffer",
    });

    const client = new RTMPClient(rtmpUrl);

    client.on("connected", () => {
      console.log("Connected to RTMP server");
      client.publishStream();
      client.sendData(response.data); // Send the raw segment data
    });

    client.on("streamPublished", () => {
      console.log("Stream published");
    });

    client.connect();
  } catch (error) {
    console.error(`Error streaming segment to RTMP: ${error.message}`);
  }
}

// Main function to stream m3u8 segments to RTMP
async function streamM3U8ToRTMP(m3u8Url, rtmpUrl) {
  const segments = await getM3U8Segments(m3u8Url);
  if (segments.length === 0) {
    console.error("No segments found to stream.");
    return;
  }

  for (const segment of segments) {
    await streamSegmentToRTMP(segment, rtmpUrl);
  }
}

streamM3U8ToRTMP(M3U8_URL, TELEGRAM_RTMP_URL);
