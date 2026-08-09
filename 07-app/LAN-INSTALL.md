# Install the Guitar App on your phone (free, no app store)

You're getting Heidi's guitar app on your phone. It costs nothing, there's no
signup, and you don't go to any app store. It's a "web app" that installs itself
onto your home screen and works even without internet once added.

## What you need
- A phone (iPhone or Android).
- To be on the **same Wi-Fi** as Heidi's computer (the one running the app).
  Hotel/guest Wi-Fi that separates devices won't work — use the same home network.

## Steps

### 1. Heidi starts the app on her computer
Heidi double-clicks **`start-lan.bat`** (a tiny file in the app folder). A black
window opens and shows a line like:

```
Open on your phone: http://192.168.1.42:8080/?dogfood=1
```

She reads you that address (the numbers will be different).
**Keep that window open** while you use the app — closing it stops the app.

### 2. Join the same Wi-Fi
Make sure your phone is connected to the **same Wi-Fi network** as Heidi's computer.

### 3. Open the URL Heidi gave you
In your phone's browser, type the address exactly as printed, **including the
`?dogfood=1` at the end**, for example:

```
http://192.168.1.42:8080/?dogfood=1
```

> ⚠️ **Important:** you must open it **WITH `?dogfood=1`** (don't leave that part
> off). That's what unlocks the full free access for you and the other friends.
> If you forget it, tap the app's feedback link or just re-open the full URL.

### 4. Add it to your home screen (this "installs" it)
- **iPhone (Safari):** tap the **Share** button (the square with an arrow ↑),
  scroll down, and tap **"Add to Home Screen"**, then **Add**.
- **Android (Chrome):** tap the **⋮** menu (three dots, top right) and tap
  **"Add to Home Screen"** (or "Install app"), then **Add/Install**.

A guitar-app icon now sits on your home screen, just like a normal app.

### 5. You're done — it works offline too
Tap the new icon to open it. Because it's a proper install, it keeps working even
if the Wi-Fi blips or Heidi's computer is off (it saved itself to your phone).
When she re-opens `start-lan.bat` you'll get the latest version.

## Sending Heidi feedback
Inside the app (when opened with `?dogfood=1`) there's a small **feedback** link.
Tap it to rate the app and tell Heidi what was confusing or what you liked. It
stays on your phone — no account, no server.

## Troubleshooting
- **"Can't connect" / page won't load:** confirm you're on the *same* Wi-Fi as
  Heidi, and that her `start-lan.bat` window is still open. Re-type the exact URL
  including `?dogfood=1`.
- **Only one lesson shows / a 🔒 lock appears:** you opened the URL *without*
  `?dogfood=1`. Close the tab and re-open the full printed link.
- **Browser says "not secure":** that's normal on a home LAN — it's a local
  connection between your phone and Heidi's computer, not the public internet.
