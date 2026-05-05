// Netlify Edge Function — calls cobalt fresh at download time and streams
// the result directly to the browser. This avoids the tunnel-URL expiry
// problem where pre-fetched URLs go stale before the user clicks GET.
//
// Accessed as: /download-proxy?v=<videoId>&mode=<video|audio>&quality=<max|720>

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

export default async (request) => {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("v");
  const mode = searchParams.get("mode") || "video"; // "video" or "audio"
  const quality = searchParams.get("quality") || "max"; // "max" or "720"

  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return new Response("Invalid or missing video ID", { status: 400 });
  }

  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  const cobaltBody = mode === "audio"
    ? { url: videoUrl, downloadMode: "audio", audioFormat: "mp3", audioBitrate: "128", filenameStyle: "pretty" }
    : { url: videoUrl, videoQuality: quality, youtubeVideoCodec: "h264", downloadMode: "auto", filenameStyle: "pretty" };

  // Try each cobalt instance until one returns a usable tunnel/redirect URL
  let tunnelUrl = null;
  let filename = videoId;

  for (const instance of COBALT_INSTANCES) {
    try {
      const res = await fetch(`https://${instance}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(cobaltBody),
        signal: AbortSignal.timeout(12000),
      });
      if (!res.ok) continue;
      const data = await res.json();
      console.log(`Cobalt ${instance} response:`, JSON.stringify(data).slice(0, 200));
      if (data.status === "error") continue;
      if ((data.status === "tunnel" || data.status === "redirect" || data.status === "stream") && data.url) {
        tunnelUrl = data.url;
        if (data.filename) filename = data.filename;
        break;
      }
    } catch (_) {
      continue;
    }
  }

  if (!tunnelUrl) {
    return new Response("All cobalt instances failed to process this video.", { status: 502 });
  }

  // Immediately fetch and stream the tunnel URL — it's fresh so it won't be expired
  try {
    console.log("Fetching tunnel URL:", tunnelUrl);
    const upstream = await fetch(tunnelUrl);
    console.log("Tunnel response status:", upstream.status);
    console.log("Tunnel content-type:", upstream.headers.get("content-type"));
    console.log("Tunnel content-length:", upstream.headers.get("content-length"));
    if (!upstream.ok) {
      return new Response(`Cobalt tunnel error: ${upstream.status}`, { status: upstream.status });
    }

    const contentType = upstream.headers.get("content-type") || "application/octet-stream";
    const contentLength = upstream.headers.get("content-length");

    const headers = new Headers({
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    });
    if (contentLength) headers.set("Content-Length", contentLength);

    return new Response(upstream.body, { status: 200, headers });
  } catch (err) {
    return new Response(`Stream error: ${err.message}`, { status: 502 });
  }
};

export const config = { path: "/download-proxy" };
