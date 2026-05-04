const { execFile } = require("child_process");
const path = require("path");

const YTDLP = process.env.YTDLP_PATH || path.join(__dirname, "bin", "yt-dlp");

function runYtDlp(args) {
  return new Promise((resolve, reject) => {
    execFile(YTDLP, args, { timeout: 25000 }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || err.message));
      resolve(stdout.trim());
    });
  });
}

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

  const url = `https://www.youtube.com/watch?v=${videoId}`;

  try {
    const raw = await runYtDlp([
      "--dump-json",
      "--no-playlist",
      "--no-warnings",
      "--extractor-args", "youtube:player_client=ios",
      "--user-agent", "com.google.ios.youtube/19.45.4 (iPhone16,2; U; CPU iOS 18_1_0 like Mac OS X;)",
      url,
    ]);

    const info = JSON.parse(raw);

    const formats = (info.formats || [])
      .filter((f) => f.url && f.ext !== "mhtml")
      .map((f) => ({
        format_id: f.format_id,
        ext: f.ext,
        quality: f.format_note || f.quality || "",
        resolution: f.resolution || (f.height ? `${f.height}p` : "audio only"),
        filesize: f.filesize || f.filesize_approx || null,
        vcodec: f.vcodec,
        acodec: f.acodec,
        url: f.url,
        has_video: f.vcodec && f.vcodec !== "none",
        has_audio: f.acodec && f.acodec !== "none",
      }))
      .sort((a, b) => {
        if (a.has_video && a.has_audio && !(b.has_video && b.has_audio)) return -1;
        if (b.has_video && b.has_audio && !(a.has_video && a.has_audio)) return 1;
        return (b.resolution?.replace("p", "") || 0) - (a.resolution?.replace("p", "") || 0);
      });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        title: info.title,
        thumbnail: info.thumbnail,
        duration: info.duration,
        formats,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
