import { stream } from "@netlify/functions";

const COBALT_INSTANCES = [
  "cobalt.alpha.wolfy.love",
  "subito-c.meowing.de",
  "nuko-c.meowing.de",
  "apicobalt.mgytr.top",
  "dog.kittycat.boo",
  "cobaltapi.kittycat.boo",
  "cobaltapi.squair.xyz",
  "cobalt.omega.wolfy.love",
  "api.dl.woof.monster",
  "lime.clxxped.lol",
  "grapefruit.clxxped.lol",
  "melon.clxxped.lol",
  "api.cobalt.liubquanti.click",
  "api.cobalt.blackcat.sweeux.org",
  "api.qwkuns.me",
  "cobaltapi.cjs.nz",
];

export default stream(async (req) => {
  const url = new URL(req.url);
  const videoId = url.searchParams.get("v");
  const mode = url.searchParams.get("mode") || "video";
  const quality = url.searchParams.get("quality") || "max";

  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return new Response("Invalid or missing video ID", { status: 400 });
  }

  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  const cobaltBody = mode === "audio"
    ? { url: videoUrl, downloadMode: "audio", audioFormat: "mp3", audioBitrate: "128", filenameStyle: "pretty" }
    : { url: videoUrl, videoQuality: quality, youtubeVideoCodec: "h264", downloadMode: "auto", filenameStyle: "pretty" };

  for (const instance of COBALT_INSTANCES) {
    let tunnelUrl = null;
    let filename = videoId;

    try {
      const apiRes = await fetch(`https://${instance}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(cobaltBody),
        signal: AbortSignal.timeout(12000),
      });
      if (!apiRes.ok) continue;
      const data = await apiRes.json();
      if (data.status === "error") continue;
      if ((data.status === "tunnel" || data.status === "redirect" || data.status === "stream") && data.url) {
        tunnelUrl = data.url;
        if (data.filename) filename = data.filename;
      } else {
        continue;
      }
    } catch (_) {
      continue;
    }

    // Fetch tunnel immediately from the same server/IP that called the API
    try {
      const tunnel = await fetch(tunnelUrl, {
        signal: AbortSignal.timeout(30000),
      });
      if (!tunnel.ok || !tunnel.body) continue;

      const contentType = tunnel.headers.get("content-type") || "application/octet-stream";
      const contentLength = tunnel.headers.get("content-length");

      const headers = new Headers({
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      });
      if (contentLength) headers.set("Content-Length", contentLength);

      return new Response(tunnel.body, { status: 200, headers });
    } catch (_) {
      continue;
    }
  }

  return new Response("All cobalt instances failed to process this video.", { status: 502 });
});
