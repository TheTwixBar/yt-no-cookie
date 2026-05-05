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

  const COBALT = "https://cobalt.meowing.de";
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  // Request multiple quality options from cobalt
  const qualities = ["max", "1080", "720", "480", "360"];
  const formats = [];
  let title = null;

  for (const quality of qualities) {
    try {
      const res = await fetch(`${COBALT}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          url: videoUrl,
          videoQuality: quality,
          filenameStyle: "pretty",
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) continue;
      const data = await res.json();

      if (data.status === "error") continue;

      // "stream" or "redirect" = single download link
      if (
        (data.status === "stream" || data.status === "redirect") &&
        data.url
      ) {
        // Avoid duplicates (cobalt may return same URL for close qualities)
        if (!formats.find((f) => f.url === data.url)) {
          formats.push({
            type: "video",
            quality: quality === "max" ? "Best available" : `${quality}p`,
            url: data.url,
          });
        }
      }

      // "picker" = cobalt returned multiple streams (e.g. separate video+audio)
      if (data.status === "picker" && Array.isArray(data.picker)) {
        for (const item of data.picker) {
          if (!item.url) continue;
          if (!formats.find((f) => f.url === item.url)) {
            formats.push({
              type: item.type === "audio" ? "audio" : "video",
              quality: item.quality || (quality === "max" ? "Best available" : `${quality}p`),
              url: item.url,
            });
          }
        }
      }

      if (!title && data.filename) {
        title = data.filename.replace(/\.[^.]+$/, "");
      }
    } catch (_) {
      continue;
    }
  }

  // Also fetch an audio-only option
  try {
    const res = await fetch(`${COBALT}/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        url: videoUrl,
        downloadMode: "audio",
        audioFormat: "mp3",
        filenameStyle: "pretty",
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (res.ok) {
      const data = await res.json();
      if (
        (data.status === "stream" || data.status === "redirect") &&
        data.url &&
        !formats.find((f) => f.url === data.url)
      ) {
        formats.push({ type: "audio", quality: "MP3 audio", url: data.url });
        if (!title && data.filename) {
          title = data.filename.replace(/\.[^.]+$/, "");
        }
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
