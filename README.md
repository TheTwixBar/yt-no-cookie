# cookiefree · a privacy-focused YouTube player

A YouTube player that embeds videos through `youtube-nocookie.com`, removing tracking. There's no ads, no analytics, no cookies unless you hit play.

**Live at [youtubenocookie.netlify.app](https://youtubenocookie.netlify.app)**

---

## Features:

**Playback**
- Paste any YouTube URL or video ID to play instantly
- Autoplay, loop, and queue auto-advance toggles
- Option to hide related videos after playback ends

**Search**
- Full YouTube search with filters; (any / <4m / 4–20m / >20m) and  order (relevant / newest / popular)
- Browse a channel's videos by clicking any channel name in search results
- Load more results with pagination
- Switch between two API keys on the fly (API Key 1 / API Key 2), to stay within daily quotas

**Queue**
- Make a playlist from search results or the currently playing video
- Tracks the active video and auto-advances when queue advance is enabled
- Clear the entire queue in one click
- If you skip ahead in the video, the next video will take the time skipped longer to load

**Favorites**
- Star any video from search results or the player to save it
- Export favorites as a json  for backup

**Watch History**
- Automatically logs every video you play, stored only in your browser
- Export or import history as json
- Clear all history at any time

---

## Privacy

- Videos load through `youtube-nocookie.com` — YouTube's own privacy-enhanced embed mode. No cookies are set unless you interact with the player.
- All data (history, favorites, queue) lives exclusively in your browser's `localStorage`. Nothing is sent to any server.
- No third-party analytics, no ads, no external scripts beyond the YouTube embed itself.

---

## Deployment

The entire app is essentially a single `index.html` file. Host it anywhere that serves static files.

### Netlify (recommended)

1. Sign up at [netlify.com](https://netlify.com) (free)
2. Click **Add new site → Deploy manually**
3. Drag and drop the project folder (or just `index.html`) onto the page
4. You'll get a live `yoursite.netlify.app` URL instantly

The included `netlify.toml` and `netlify/` directory power the optional download feature. Deploy the full folder to keep it.

---

## YouTube API Key

Search requires a free YouTube Data API v3 key. The app supports two keys and lets you switch between them in the search UI — handy for spreading load across quota limits.

### Getting a key

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project
3. Navigate to **APIs & Services, then Library**, search for **YouTube Data API v3**, and enable it
4. Go to **APIs & Services -> Credentials -> Create Credentials -> API Key**

### Quota/day

The free tier allows **10,000 units/day**. Each search costs around 100 units (so, 100 searches/day). Having two keys effectively doubles your daily limit.

### Restricting your key (recommended)

In **Credentials -> your key -> Application restrictions**, add your site's domain (e.g. `https://youtubenocookie.netlify.app`) to prevent unauthorized use.

---

## License

Do whatever you want with it. No attribution required.

---

*twix's fun projects*
