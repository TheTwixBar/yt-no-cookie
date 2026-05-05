// Netlify Edge Function — streams cobalt tunnel URLs to the browser.
// Unlike regular Netlify functions, edge functions support true streaming
// responses with no 6MB body limit, which is required for video files.
//
// Accessed as: /.netlify/edge-functions/proxy?url=<encoded-cobalt-url>&filename=<name>

export default async (request) => {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get("url");
  const filename = searchParams.get("filename") || "download";

  if (!rawUrl) {
    return new Response("Missing url parameter", { status: 400 });
  }

  let targetUrl;
  try {
    targetUrl = new URL(rawUrl);
  } catch {
    return new Response("Invalid url parameter", { status: 400 });
  }

  if (targetUrl.protocol !== "https:") {
    return new Response("Only https URLs are allowed", { status: 403 });
  }

  try {
    const upstream = await fetch(targetUrl.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
    });

    if (!upstream.ok) {
      return new Response(`Upstream error: ${upstream.status}`, {
        status: upstream.status,
      });
    }

    const contentType =
      upstream.headers.get("content-type") || "application/octet-stream";
    const contentLength = upstream.headers.get("content-length");

    const headers = new Headers({
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store",
    });

    if (contentLength) headers.set("Content-Length", contentLength);

    // Stream the body directly — no buffering
    return new Response(upstream.body, { status: 200, headers });
  } catch (err) {
    return new Response(`Proxy error: ${err.message}`, { status: 502 });
  }
};

export const config = { path: "/.netlify/edge-functions/proxy" };
