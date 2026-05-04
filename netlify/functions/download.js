exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers };

  const videoId = event.queryStringParameters?.v;
  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid or missing video ID" }) };
  }

  const qualities = ["1080", "720", "480", "360"];
  const results = [];

  for (const q of qualities) {
    try {
      const res = await fetch("https://api.cobalt.tools/", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          url: `https://www.youtube.com/watch?v=${videoId}`,
          videoQuality: q,
        }),
      });
      const data = await res.json();
      if (data.status === "tunnel" || data.status === "redirect") {
        results.push({ quality: q + "p", url: data.url, type: "video" });
      }
    } catch (_) {}
  }

  // Audio only
  try {
    const res = await fetch("https://api.cobalt.tools/", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        url: `https://www.youtube.com/watch?v=${videoId}`,
        downloadMode: "audio",
      }),
    });
    const data = await res.json();
    if (data.status === "tunnel" || data.status === "redirect") {
      results.push({ quality: "audio only", url: data.url, type: "audio" });
    }
  } catch (_) {}

  if (!results.length) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "No downloadable formats found." }) };
  }

  return { statusCode: 200, headers, body: JSON.stringify({ formats: results }) };
};
