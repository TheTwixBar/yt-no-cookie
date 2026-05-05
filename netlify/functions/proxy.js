// Proxies cobalt tunnel URLs back to the browser.
// Cobalt tunnel URLs are IP-locked to the requester — if the browser hits them
// directly it gets 0 bytes because its IP differs from the Netlify function's IP.
// This function fetches the tunnel on the server side and streams it through.

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: { "Access-Control-Allow-Origin": "*" },
    };
  }

  const rawUrl = event.queryStringParameters?.url;
  if (!rawUrl) {
    return { statusCode: 400, body: "Missing url parameter" };
  }

  let targetUrl;
  try {
    targetUrl = new URL(rawUrl);
  } catch {
    return { statusCode: 400, body: "Invalid url parameter" };
  }

  // Only allow proxying to https URLs (no internal network access)
  if (targetUrl.protocol !== "https:") {
    return { statusCode: 403, body: "Only https URLs are allowed" };
  }

  const filename = event.queryStringParameters?.filename || "download";

  try {
    const upstream = await fetch(targetUrl.toString(), {
      headers: {
        // Forward a browser-like UA so cobalt doesn't reject the proxy request
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(30000),
    });

    if (!upstream.ok) {
      return {
        statusCode: upstream.status,
        body: `Upstream returned ${upstream.status}`,
      };
    }

    // Read the full body — Netlify synchronous functions buffer anyway.
    // For very large files this may hit the 6MB limit; in that case the
    // user should use cobalt.tools directly (the UI already suggests this).
    const buffer = await upstream.arrayBuffer();
    const contentType =
      upstream.headers.get("content-type") || "application/octet-stream";

    return {
      statusCode: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(buffer.byteLength),
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store",
      },
      body: Buffer.from(buffer).toString("base64"),
      isBase64Encoded: true,
    };
  } catch (err) {
    return {
      statusCode: 502,
      body: `Proxy error: ${err.message}`,
    };
  }
};
