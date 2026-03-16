# ⚡ WeatherX AI

> A premium, AI-powered weather web app with real-time forecasts, intelligent insights, animated weather effects, interactive maps, and full PWA support — built with pure HTML, CSS, and JavaScript.

---

## 📸 Screenshots

> *(Add screenshots to `/screenshots/` folder and update paths below)*

| Desktop | Mobile |
|--------|--------|
| ![Desktop](screenshots/desktop.png) | ![Mobile](screenshots/mobile.png) |

---

## ✨ Features

### 🌍 Core Weather
- **Auto location detection** via Geolocation API (falls back to London)
- **Real-time data** from OpenWeatherMap API
- Current temperature, condition, humidity, wind speed & direction
- Pressure, visibility, feels like, UV index, sunrise & sunset
- **7-day forecast** with daily high/low and rain probability
- **Hourly forecast** slider for the next 12 hours
- Weather alerts display when available
- **°C / °F toggle** with instant re-fetch

### 🤖 AI-Powered Insights
Powered by Claude (Anthropic API), WeatherX AI generates:
- **Smart weather summaries** — natural language descriptions of current conditions
- **Clothing recommendations** — what to wear based on temp, humidity, and conditions
- **Activity suggestions** — outdoor/indoor recommendations tailored to weather
- **Health advice** — UV warnings, hydration reminders, cold-weather tips
- **Pro weather tips** — clever insights and tricks

> If the Anthropic API key is not configured, the app gracefully falls back to locally-generated smart insights using the weather data.

### 🎨 UI & Animations
- **Glassmorphism** design with frosted-glass cards
- **Dynamic animated canvas backgrounds:**
  - 🌧️ Rain streaks + ⛈️ lightning flashes for storms
  - ❄️ Drifting snowflakes for snow
  - ⭐ Twinkling stars for clear nights
  - ☀️ Pulsing sun glow for clear days
  - ☁️ Drifting clouds for overcast weather
- Floating weather cards with hover lift effect
- Smooth fade & slide transitions on load
- Micro-interactions on all buttons
- Responsive, mobile-first layout

### 🌙 Dark / Light Mode
- Toggle with a single click
- Saved to `localStorage` — persists across sessions
- Smooth CSS variable transition

### 🕐 Live Clock
- Auto-updating clock in the header (updates every second)

### 🗺️ Interactive Map
- Powered by **Leaflet.js** + OpenStreetMap
- Shows current location with a temperature badge marker
- **Click anywhere on the map** to fetch weather for that point
- Auto-pans to new locations

### 📡 PWA Support
- **Installable** on desktop and mobile (Add to Home Screen)
- **Offline support** — cached app shell + cached API responses
- Service Worker with network-first (API) and cache-first (assets) strategy
- App manifest with icons, theme colors, and shortcuts

---

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/AmmarBinYasir-1/weatherx-ai.git
cd weatherx-ai
```

### 2. No API Keys Needed! 🎉

WeatherX AI uses **100% free APIs with no registration required**:

| API | Purpose | Cost |
|-----|---------|------|
| [Open-Meteo](https://open-meteo.com) | Weather data | Free forever, no key |
| [Nominatim OSM](https://nominatim.openstreetmap.org) | Geocoding + search | Free forever, no key |
| [OpenStreetMap / Leaflet](https://leafletjs.com) | Interactive map | Free forever, no key |

Simply open the app and it works immediately — no sign-ups, no credit cards.

### 4. Add App Icons
Create an `icons/` folder and add:
- `icon-192.png` — 192×192px PNG
- `icon-512.png` — 512×512px PNG

Use any weather/lightning themed icon you like.

### 5. Serve the App

Use any static file server:

```bash
# Python
python -m http.server 8080

# Node.js (http-server)
npx http-server . -p 8080

# VS Code: Live Server extension
```

Then open `http://localhost:8080`

> ⚠️ HTTPS is required for Geolocation API and Service Worker. For local dev, `localhost` is treated as secure by browsers.

---

## 📲 PWA Installation Steps

### On Desktop (Chrome / Edge)
1. Open the app in a browser
2. Look for the **install icon** in the address bar (or the banner that appears)
3. Click **Install WeatherX AI**

### On Mobile (Android)
1. Open in Chrome
2. Tap the **⋮ menu** → *Add to Home Screen*
3. Tap **Install**

### On iOS (Safari)
1. Open in Safari
2. Tap the **Share button** (↑)
3. Tap **Add to Home Screen**

---

## 📁 Folder Structure

```
weatherx-ai/
├── index.html          # Main HTML — app structure & layout
├── style.css           # All styles — glassmorphism, animations, responsive
├── script.js           # All logic — weather fetch, AI, map, canvas, PWA
├── service-worker.js   # PWA offline caching strategy
├── manifest.json       # PWA manifest — icons, theme, shortcuts
├── README.md           # This file
├── icons/
│   ├── icon-192.png    # PWA icon (192×192)
│   └── icon-512.png    # PWA icon (512×512)
└── screenshots/        # Add your own app screenshots here
    ├── desktop.png
    └── mobile.png
```

---

## 🛠️ Technologies Used

| Technology | Purpose |
|---|---|
| HTML5 | Semantic structure |
| CSS3 | Glassmorphism, animations, responsive grid |
| Vanilla ES6+ JavaScript | All app logic |
| OpenWeatherMap API | Real-time weather + geo + forecast data |
| Anthropic Claude API | AI-powered weather insights |
| Leaflet.js | Interactive map |
| OpenStreetMap | Map tiles |
| Canvas API | Animated weather backgrounds |
| Web Geolocation API | Auto location detection |
| Service Worker + Cache API | PWA offline support |
| Web App Manifest | PWA installability |
| Google Fonts (Syne + DM Sans) | Typography |
| localStorage / sessionStorage | Preferences + response caching |

---

## ⚙️ Configuration Reference

```js
const CONFIG = {
  OWM_KEY: '...',         // OpenWeatherMap API key (required)
  ANTHROPIC_KEY: '...',   // Claude API key (optional, has fallback)
  OWM_BASE: '...',        // OWM REST base URL
  OWM_GEO: '...',         // OWM Geocoding API URL
  DEFAULT_CITY: 'London', // Fallback city if geolocation denied
  CACHE_TTL: 600000,      // API cache duration in ms (10 min)
};
```

---

## 🔐 Security Note

> **Never expose your Anthropic API key in a public frontend.**
> For production deployments, create a simple backend proxy (Node.js, Cloudflare Worker, etc.) that forwards requests to the Anthropic API — and call your proxy from the frontend instead.

---

## 📄 License

MIT License © 2025 Ammar Bin Yasir

Permission is hereby granted, free of charge, to any person obtaining a copy of this software to use, copy, modify, merge, and distribute it, subject to the following conditions: the above copyright notice shall be included in all copies.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.

---

## 👨‍💻 Author

**Ammar Bin Yasir**

- 𝕏 Twitter: [@AmmarBinYasir_1](https://x.com/AmmarBinYasir_1)
- GitHub: [AmmarBinYasir-1](https://github.com/AmmarBinYasir-1)

---

*Made with ❤️ by Ammar Bin Yasir*
