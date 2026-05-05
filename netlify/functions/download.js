// Cobalt instances sorted by score (from cobalt.directory, May 2026).
// YouTube-working instances are listed first, then others as fallback.
// The function tries each in order until one succeeds for all three request types.
const COBALT_INSTANCES = [
  // 96% score, YouTube confirmed working
  "cobalt.alpha.wolfy.love",
  "subito-c.meowing.de",
  "nuko-c.meowing.de",
  "apicobalt.mgytr.top",
  // 91% score, YouTube confirmed working
  "dog.kittycat.boo",
  "cobaltapi.kittycat.boo",
  "cobaltapi.squair.xyz",
  // 83% score, YouTube working
  "cobalt.omega.wolfy.love",
  // 78% score, YouTube working
  "api.dl.woof.monster",
  // fallbacks with login error on YT (may still work depending on instance config)
  "lime.clxxped.lol",
  "grapefruit.clxxped.lol",
  "melon.clxxped.lol",
  "api.cobalt.liubquanti.click",
  "api.cobalt.blackcat.sweeux.org",
  "api.qwkuns.me",
  "cobaltapi.cjs.nz",
];

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

  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  // Try to get results from a single cobalt instance.
  // Returns { title, formats } on success, or null on failure.
  async function tryInstance(instance) {
    const formats = [];
    let title = null;
    let anySuccess = false;

    async function cobaltRequest(body) {
      const res = await fetch(`https://${instance}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(12000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      // Treat cobalt-level errors as failures so we can try the next instance
      if (data.status === "error") throw new Error(data.error?.code || "cobalt error");
      return data;
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

      if (
        (data.status === "tunnel" || data.status === "redirect" || data.status === "stream") &&
        data.url
      ) {
        formats.push({
          type: "video",
          quality: "Best quality",
          url: data.url,
          tunnel: data.status === "tunnel" || data.status === "stream",
          filename: data.filename || null,
        });
        anySuccess = true;
      } else if (data.status === "picker" && Array.isArray(data.picker)) {
        for (const item of data.picker) {
          if (item.url) {
            formats.push({
              type: item.type === "audio" ? "audio" : "video",
              quality: item.quality || "video",
              url: item.url,
              tunnel: false,
              filename: data.filename || null,
            });
            anySuccess = true;
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

      if (
        (data.status === "tunnel" || data.status === "redirect" || data.status === "stream") &&
        data.url
      ) {
        if (!formats.find((f) => f.url === data.url)) {
          formats.push({
            type: "video",
            quality: "720p",
            url: data.url,
            tunnel: data.status === "tunnel" || data.status === "stream",
            filename: data.filename || null,
          });
          anySuccess = true;
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

      if (
        (data.status === "tunnel" || data.status === "redirect" || data.status === "stream") &&
        data.url
      ) {
        if (!formats.find((f) => f.url === data.url)) {
          formats.push({
            type: "audio",
            quality: "MP3 audio",
            url: data.url,
            tunnel: data.status === "tunnel" || data.status === "stream",
            filename: data.filename || null,
          });
          anySuccess = true;
        }
      }
    } catch (_) {}

    if (!anySuccess) return null;
    return { title: title || videoId, formats };
  }

  // Try each instance in order until one works
  for (const instance of COBALT_INSTANCES) {
    const result = await tryInstance(instance);
    if (result) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result),
      };
    }
  }

  return {
    statusCode: 500,
    headers,
    body: JSON.stringify({
      error: "Download unavailable. All cobalt instances failed to process this video.",
    }),
  };
};
