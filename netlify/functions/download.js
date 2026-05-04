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

  // Try a few public Invidious instances in case one is down
  const instances = [
    "https://invidious.privacyredirect.com",
    "https://inv.nadeko.net",
    "https://invidious.nerdvpn.de",
  ];

  for (const instance of instances) {
    try {
      const res = await fetch(`${instance}/api/v1/videos/${videoId}`, {
        headers: { "User-Agent": "cookiefree/1.0" },
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) continue;
      const data = await res.json();

      const formats = [];

      // Combined adaptive formats
      for (const f of (data.adaptiveFormats || [])) {
        if (!f.url) continue;
        formats.push({
          format_id: f.itag?.toString() || "",
          ext: f.container || f.type?.split("/")?.[1]?.split(";")?.[0] || "mp4",
          quality: f.qualityLabel || f.audioQuality || "",
          resolution: f.qualityLabel || (f.audioQuality ? "audio only" : ""),
          filesize: f.clen ? parseInt(f.clen) : null,
          vcodec: f.encoding || (f.qualityLabel ? "h264" : "none"),
          acodec: f.audioQuality ? "aac" : "none",
          url: f.url,
          has_video: !!f.qualityLabel,
          has_audio: !!f.audioQuality,
        });
      }

      // formatStreams = combined video+audio
      for (const f of (data.formatStreams || [])) {
        if (!f.url) continue;
        formats.push({
          format_id: f.itag?.toString() || "",
          ext: f.container || "mp4",
          quality: f.qualityLabel || "",
          resolution: f.qualityLabel || "",
          filesize: null,
          vcodec: "h264",
          acodec: "aac",
          url: f.url,
          has_video: true,
          has_audio: true,
        });
      }

      formats.sort((a, b) => {
        if (a.has_video && a.has_audio && !(b.has_video && b.has_audio)) return -1;
        if (b.has_video && b.has_audio && !(a.has_video && a.has_audio)) return 1;
        return (parseInt(b.resolution) || 0) - (parseInt(a.resolution) || 0);
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ title: data.title, formats }),
      };

    } catch (_) { continue; }
  }

  return {
    statusCode: 500,
    headers,
    body: JSON.stringify({ error: "All download sources failed. Try again later." }),
  };
};
