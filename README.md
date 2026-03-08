# cookiefree, a no cookie yt player

A minimal, privacy-focused YouTube player that embeds videos via `youtube-nocookie.com`, keeping you tracking-free while you watch.

Built as a single HTML file.

---

## Deployment

This is a single `index.html` file. Just host it anywhere that serves static HTML.

### Netlify (recommended)
1. Go to [netlify.com](https://netlify.com) and sign up for free
2. Click **Add new site → Deploy manually**
3. Drag and drop `index.html` onto the page
4. Done, you'll get a free `yoursite.netlify.app` URL instantly
5. **My instance is at https://ytnocookie.netlify.app**

---

## YouTube API Key

Video search requires a free YouTube Data API v3 key.

### Getting a key
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project
3. Go to **APIs & Services → Library**, search for **YouTube Data API v3** and enable it
4. Go to **APIs & Services → Credentials**, click **Create Credentials → API Key**
5. Copy the key

### Free quota
The free tier gives you **10,000 units/day**. Each search costs 100 units, so that's ~100 searches per day at no cost.

### Restricting your key (recommended)
To prevent unauthorized use of your key, go to **Credentials → your key → Application restrictions** and add your site's domain (e.g. `https://yoursite.netlify.app`).

---

## Customization

The API key is hardcoded at the top of the `<script>` block:

```js
const API_KEY = 'YOUR_API_KEY';
```
---

## Privacy

- Videos are embedded via `youtube-nocookie.com` — YouTube's own privacy-enhanced embed mode, which does not set cookies unless you interact with the video
- Watch history is stored only in your browser's `localStorage` and never sent anywhere
- No analytics, no ads, no tracking of any kind

---

## License

Do whatever you want with it. No attribution required.

---

*twix's fun projects*
