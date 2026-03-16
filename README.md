# ⚡ WeatherX AI

> A premium, AI-powered weather web app with real-time forecasts, intelligent insights, animated weather effects, interactive maps, and full PWA support — built with pure HTML, CSS, and JavaScript.


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



### 1. Clone the Repository
```bash
git clone https://github.com/AmmarBinYasir-1/weatherx-ai.git
cd weatherx-ai
