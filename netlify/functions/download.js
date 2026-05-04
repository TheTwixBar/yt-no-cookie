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

  const res = await fetch("https://cobalt.api.reichardd.dev/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({
      url: `https://www.youtube.com/watch?v=${videoId}`,
      videoQuality: "1080",
    }),
  });

  const data = await res.json();

  if (!res.ok || data.status === "error") {
    return { statusCode: 500, headers, body: JSON.stringify({ error: data?.error?.code || "Download failed" }) };
  }

  return { statusCode: 200, headers, body: JSON.stringify(data) };
};
