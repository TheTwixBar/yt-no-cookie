# cookiefree · a privacy-focused YouTube player

A minimal, single-file YouTube player that embeds videos through `youtube-nocookie.com`, keeping you tracking-free while you watch. No ads, no analytics, no cookies unless you hit play.

**Live at → [youtubenocookie.netlify.app](https://youtubenocookie.netlify.app)**

---

## Features

**Playback**
- Paste any YouTube URL or video ID to play instantly
- Autoplay, loop, and queue auto-advance toggles
- Option to hide related videos after playback ends
- Keyboard shortcut: press `T` to toggle light/dark theme

**Search**
- Full YouTube search with filters for duration (any / <4m / 4–20m / >20m) and sort order (relevant / newest / popular)
- Browse a channel's videos by clicking any channel name in search results
- Load more results with pagination
- Switch between two API keys on the fly (API Key 1 / API Key 2) — useful for staying within daily quota limits

**Queue**
- Build a play queue from search results or the currently playing video
- Tracks the active video and auto-advances when queue advance is enabled
- Clear the entire queue in one click

**Favorites**
- Star any video from search results or the player to save it
- Export favorites as a JSON file for backup

**Watch History**
- Automatically logs every video you play, stored only in your browser
- Export or import history as JSON
- Clear all history at any time

**Download**
- One-click download option for the currently playing video (via a Netlify backend function)

---

## Privacy

- Videos load through `youtube-nocookie.com` — YouTube's own privacy-enhanced embed mode. No cookies are set unless you interact with the player.
- All data (history, favorites, queue) lives exclusively in your browser's `localStorage`. Nothing is sent to any server.
- No third-party analytics, no ads, no external scripts beyond the YouTube embed itself.

---

## Deployment

The entire app is a single `index.html` file. Host it anywhere that serves static files.

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
3. Navigate to **APIs & Services → Library**, search for **YouTube Data API v3**, and enable it
4. Go to **APIs & Services → Credentials → Create Credentials → API Key**
5. Copy the key

### Free quota

The free tier grants **10,000 units/day**. Each search costs 100 units (~100 searches/day). Having two keys effectively doubles your daily limit.

### Restricting your key (recommended)

In **Credentials → your key → Application restrictions**, add your site's domain (e.g. `https://youtubenocookie.netlify.app`) to prevent unauthorized use.

### Adding your keys to the app

At the top of the `<script>` block in `index.html`:

```js
const API_KEYS = ['YOUR_FIRST_KEY', 'YOUR_SECOND_KEY'];
```

Keys are never exposed in the page UI — the selector only shows "API Key 1" and "API Key 2".

---

## License

Do whatever you want with it. No attribution required.

---

*twix's fun projects*
