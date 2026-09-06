# GuitarApp — Use on Phone & Desktop Guide

Your guitar lessons are now accessible on both phone and desktop. Here's how to use them anywhere.

## 🖥️ **Desktop Instructions**

### Step 1: Deploy to GitHub Pages
1. Go to your GuitarApp repo on GitHub
2. Settings → Pages
3. Source: Select "GitHub Actions"
4. Push a commit (we just did this)
5. Wait 1-2 minutes for deployment
6. Your public URL appears in Pages settings (e.g., `https://yourusername.github.io/GuitarApp/`)

### Step 2: Open in Browser
- Visit the GitHub Pages URL on any computer
- Works in Chrome, Safari, Firefox, Edge
- All 25 lessons with audio playback
- Full practice drills with listening engine
- Feedback button to report issues

### Step 3: Audio Works Instantly
- Audio files are m4a format (small, fast)
- Plays on any desktop browser
- Streaming is instant even on slower connections

---

## 📱 **Phone Instructions**

### Install as App (Recommended)

**iPhone (Safari):**
1. Open the GitHub Pages URL in Safari
2. Tap Share (bottom right, or top right menu)
3. Scroll down → "Add to Home Screen"
4. Name: "GuitarApp"
5. Tap "Add"
6. App appears on home screen like a native app

**Android (Chrome):**
1. Open the GitHub Pages URL in Chrome
2. Tap ⋮ (three dots, top right)
3. "Install app" or "Add to Home screen"
4. Confirm
5. App appears on home screen

### Use Like Any App
- Tap home screen icon to launch
- Works full-screen like an app
- Audio plays instantly
- No browser bar (standalone mode)

### Works Offline
- First load downloads all lessons to your phone
- Service worker caches lessons + audio
- Open app later without internet
- Lessons stay on your phone until you uninstall

---

## ✅ **Verified Working On**

- **Desktop:** Chrome, Safari, Firefox, Edge (all OS)
- **iPhone:** iOS 13+ (Safari, add-to-home-screen)
- **Android:** Android 7+ (Chrome, install-app)
- **Tablet:** iPad, Android tablets (full layout)
- **Offline:** Lessons cache automatically; use without WiFi after first load

---

## 🎸 **Features Available Everywhere**

### Lessons (L01-L25)
- ✅ Watch step-by-step with audio guidance
- ✅ Sage teaches you guitar concepts
- ✅ Copy adapts to your age/experience (if you answer the onboarding)
- ✅ Audio plays in browser on any device

### Practice
- ✅ 8 practice drill types (Anchor, Count Out Loud, Metronome, etc.)
- ✅ Listening engine verifies your chord accuracy
- ✅ Drill results save to your phone
- ✅ Coach gives feedback after drills (when server is running)

### Your Profile
- ✅ First time: 30-second onboarding (age, experience, goals)
- ✅ Lessons personalize based on your profile
- ✅ Stored locally on your device

### Feedback
- ✅ Red "Feedback" button (bottom right during lessons)
- ✅ Report: Confusing / Too fast / Too slow / Broke
- ✅ Logged so we can improve

---

## 🔌 **Audio Requirements**

- **Minimum**: 1 Mbps connection (m4a files are small)
- **Optimal**: 5+ Mbps (instant playback)
- **Offline**: Works if already cached (see Offline section above)

---

## ⚡ **Troubleshooting**

### "Audio isn't playing"
- Check your phone volume (not muted)
- Refresh the page (browser or app)
- Check internet connection (WiFi or cellular)
- Clear cache: Settings → [App] → Storage → Clear Cache

### "Service Worker didn't load"
- This is OK — lessons still work, just not offline
- Refresh page and wait 10 seconds for SW to register
- On iPhone, add to home screen for best PWA support

### "Lessons load slow on mobile"
- First load is slowest (caching all 25 lessons + audio)
- Subsequent loads are instant
- Use WiFi for first load to cache everything
- Lessons stay on phone even if you go offline

### "Feedback button not sending"
- Feedback queues locally (will send when PocketBase is live)
- Check that you're connected to the internet
- Refresh and try again

---

## 📊 **What Gets Saved Where**

| What | Saved Where | Offline? |
|------|-------------|----------|
| Lessons (text) | Browser cache | Yes |
| Audio (m4a) | Browser cache | Yes |
| Your profile (age, experience) | Phone localStorage | Yes |
| Drill results (scores, weak chords) | Phone localStorage | Yes |
| Feedback you submit | Queued locally, sent when PocketBase is up | Yes |

All data stays on YOUR device. Nothing leaves your phone unless you tap "feedback."

---

## 🚀 **First Time Setup**

1. **Open app** (desktop browser or phone home screen)
2. **See banner**: "New here? Tell Sage about you"
3. **Answer 30 seconds**: age band, experience, goal, minutes per day
4. **Done** — lessons now personalize to you
5. **Or skip** if you want to explore first

---

## 📲 **Phone vs Desktop Differences**

| Feature | Desktop | Phone |
|---------|---------|-------|
| Screen size | Full width (nice for reading) | Optimized for portrait |
| Audio | Plays in any browser | Plays anywhere, even offline |
| Install as app | Not needed (use browser) | Recommended (see above) |
| Offline support | If cached | Automatic via service worker |
| Feedback button | Bottom right | Bottom right (optimized) |

Both get the exact same lessons and features. The layout just adapts to your screen.

---

## 💡 **Tips**

- **Download at home**: On phone, load the app once on WiFi so all 25 lessons + audio cache
- **Then go anywhere**: After caching, you can practice with no internet
- **Portrait mode**: Phone layout is portrait; rotate to landscape to see full lesson
- **Bookmark on desktop**: Save the URL as a bookmark for quick access
- **Tell us what breaks**: Use the Feedback button if audio stops or lessons don't load

---

**You're all set.** Open the link on your phone or desktop and start learning. 🎸
