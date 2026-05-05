exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers };

  const videoId = event.queryStringParameters?.v;
  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Invalid or missing video ID" }),
    };
  }

  const COBALT = "subito-c.meowing.de";
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const formats = [];
  let title = null;

  async function cobaltRequest(body) {
    const res = await fetch(`${COBALT}/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  function extractFilename(data) {
    if (data.filename) return data.filename.replace(/\.[^.]+$/, "");
    return null;
  }

  // --- video (best quality, h264 for broad compatibility) ---
  try {
    const data = await cobaltRequest({
      url: videoUrl,
      videoQuality: "max",
      youtubeVideoCodec: "h264",
      downloadMode: "auto",
      filenameStyle: "pretty",
    });

    if (!title) title = extractFilename(data);

    if ((data.status === "tunnel" || data.status === "redirect" || data.status === "stream") && data.url) {
      formats.push({ type: "video", quality: "Best quality", url: data.url });
    } else if (data.status === "picker" && Array.isArray(data.picker)) {
      for (const item of data.picker) {
        if (item.url) {
          formats.push({
            type: item.type === "audio" ? "audio" : "video",
            quality: item.quality || "video",
            url: item.url,
          });
        }
      }
    }
  } catch (_) {}

  // --- 720p fallback ---
  try {
    const data = await cobaltRequest({
      url: videoUrl,
      videoQuality: "720",
      youtubeVideoCodec: "h264",
      downloadMode: "auto",
      filenameStyle: "pretty",
    });

    if (!title) title = extractFilename(data);

    if ((data.status === "tunnel" || data.status === "redirect" || data.status === "stream") && data.url) {
      if (!formats.find((f) => f.url === data.url)) {
        formats.push({ type: "video", quality: "720p", url: data.url });
      }
    }
  } catch (_) {}

  // --- audio only (mp3) ---
  try {
    const data = await cobaltRequest({
      url: videoUrl,
      downloadMode: "audio",
      audioFormat: "mp3",
      audioBitrate: "128",
      filenameStyle: "pretty",
    });

    if (!title) title = extractFilename(data);

    if ((data.status === "tunnel" || data.status === "redirect" || data.status === "stream") && data.url) {
      if (!formats.find((f) => f.url === data.url)) {
        formats.push({ type: "audio", quality: "MP3 audio", url: data.url });
      }
    }
  } catch (_) {}

  if (!formats.length) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Download unavailable. cobalt.meowing.de could not process this video.",
      }),
    };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ title: title || videoId, formats }),
  };
};
