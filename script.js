/* ============================================================
   WeatherX AI — Main Script
   APIs: Open-Meteo (weather) + Nominatim OSM (geocoding)
   Both are 100% free with no API key required.
   Author: Ammar Bin Yasir
   ============================================================ */

'use strict';

/* ── CONFIG — No API keys needed! ── */
const CONFIG = {
  METEO_BASE:   'https://api.open-meteo.com/v1/forecast',
  NOMINATIM:    'https://nominatim.openstreetmap.org',
  DEFAULT_CITY: 'London',
  CACHE_TTL:    10 * 60 * 1000,
};

/* ── WMO Weather Code → description + emoji + OWM-like ID for bg ── */
const WMO = {
  0:  { desc:'Clear Sky',           icon:'☀️',  id:800 },
  1:  { desc:'Mainly Clear',        icon:'🌤️', id:801 },
  2:  { desc:'Partly Cloudy',       icon:'⛅',  id:802 },
  3:  { desc:'Overcast',            icon:'☁️',  id:804 },
  45: { desc:'Foggy',               icon:'🌫️', id:741 },
  48: { desc:'Icy Fog',             icon:'🌫️', id:741 },
  51: { desc:'Light Drizzle',       icon:'🌦️', id:300 },
  53: { desc:'Drizzle',             icon:'🌦️', id:301 },
  55: { desc:'Heavy Drizzle',       icon:'🌧️', id:302 },
  61: { desc:'Light Rain',          icon:'🌧️', id:500 },
  63: { desc:'Moderate Rain',       icon:'🌧️', id:501 },
  65: { desc:'Heavy Rain',          icon:'🌧️', id:502 },
  66: { desc:'Freezing Rain',       icon:'🌨️', id:511 },
  67: { desc:'Heavy Freezing Rain', icon:'🌨️', id:511 },
  71: { desc:'Light Snow',          icon:'❄️',  id:600 },
  73: { desc:'Moderate Snow',       icon:'❄️',  id:601 },
  75: { desc:'Heavy Snow',          icon:'❄️',  id:602 },
  77: { desc:'Snow Grains',         icon:'🌨️', id:611 },
  80: { desc:'Light Showers',       icon:'🌦️', id:520 },
  81: { desc:'Moderate Showers',    icon:'🌧️', id:521 },
  82: { desc:'Heavy Showers',       icon:'⛈️',  id:522 },
  85: { desc:'Snow Showers',        icon:'🌨️', id:621 },
  86: { desc:'Heavy Snow Showers',  icon:'🌨️', id:622 },
  95: { desc:'Thunderstorm',        icon:'⛈️',  id:211 },
  96: { desc:'Thunderstorm + Hail', icon:'⛈️',  id:212 },
  99: { desc:'Heavy Thunderstorm',  icon:'⛈️',  id:221 },
};

function getWMO(code, isNight=false) {
  const w = WMO[code] || { desc:'Unknown', icon:'🌡️', id:800 };
  if ((code===0||code===1) && isNight) return {...w, icon:'🌙'};
  return w;
}

/* ── STATE ── */
const state = {
  unit:           localStorage.getItem('wxUnit')  || 'metric',
  theme:          localStorage.getItem('wxTheme') || 'dark',
  lat:            null,
  lon:            null,
  cityName:       '',
  countryCode:    '',
  currentWeather: null,
  map:            null,
  mapMarker:      null,
  deferredPrompt: null,
};

/* ── DOM REFS ── */
const $ = id => document.getElementById(id);
const el = {
  body:           document.body,
  canvas:         $('bg-canvas'),
  loader:         $('loader'),
  error:          $('error-msg'),
  errorText:      $('error-text'),
  retryBtn:       $('retry-btn'),
  main:           $('main-content'),
  clock:          $('live-clock'),
  unitToggle:     $('unit-toggle'),
  themeToggle:    $('theme-toggle'),
  searchInput:    $('search-input'),
  searchBtn:      $('search-btn'),
  locateBtn:      $('locate-btn'),
  autocomplete:   $('autocomplete-list'),
  cityName:       $('city-name'),
  countryName:    $('country-name'),
  heroDate:       $('hero-date'),
  tempValue:      $('temp-value'),
  unitLabel:      $('unit-label'),
  conditionText:  $('condition-text'),
  feelsLike:      $('feels-like'),
  weatherIcon:    $('weather-icon-anim'),
  tempMax:        $('temp-max'),
  tempMin:        $('temp-min'),
  humidity:       $('humidity'),
  windSpeed:      $('wind-speed'),
  pressure:       $('pressure'),
  uvIndex:        $('uv-index'),
  visibility:     $('visibility'),
  sunrise:        $('sunrise'),
  sunset:         $('sunset'),
  windDir:        $('wind-dir'),
  alertBox:       $('alert-box'),
  alertText:      $('alert-text'),
  aiLoading:      $('ai-loading'),
  aiContent:      $('ai-content'),
  aiSummary:      $('ai-summary'),
  aiClothing:     $('ai-clothing'),
  aiActivity:     $('ai-activity'),
  aiHealth:       $('ai-health'),
  aiTip:          $('ai-tip'),
  refreshAI:      $('refresh-ai'),
  hourlySlider:   $('hourly-slider'),
  forecastList:   $('forecast-list'),
  installBanner:  $('install-banner'),
  installBtn:     $('install-btn'),
  dismissInstall: $('dismiss-install'),
};

/* ════════════════════════════════════
   INIT
════════════════════════════════════ */
function init() {
  applyTheme(state.theme);
  applyUnit(state.unit);
  startClock();
  bindEvents();
  registerServiceWorker();
  const last = localStorage.getItem('wxLastCity');
  if (last) fetchWeatherByCity(last);
  else geoLocate();
}

/* ── Clock ── */
function startClock() {
  const tick = () => {
    el.clock.textContent = new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',second:'2-digit'});
  };
  tick(); setInterval(tick, 1000);
}

/* ── Theme / Unit ── */
function applyTheme(t) {
  el.body.className = t;
  el.themeToggle.textContent = t==='dark' ? '🌙' : '☀️';
  localStorage.setItem('wxTheme', t);
}
function applyUnit(u) {
  state.unit = u;
  el.unitToggle.textContent = u==='metric' ? '°C' : '°F';
  el.unitLabel.textContent  = u==='metric' ? 'C'  : 'F';
  localStorage.setItem('wxUnit', u);
}
function toDisplay(c) { return state.unit==='imperial' ? Math.round(c*9/5+32) : Math.round(c); }
function windDisplay(kmh) { return state.unit==='imperial' ? Math.round(kmh*0.621371)+' mph' : Math.round(kmh)+' km/h'; }

/* ════════════════════════════════════
   GEOLOCATION
════════════════════════════════════ */
function geoLocate() {
  if (!navigator.geolocation) { fetchWeatherByCity(CONFIG.DEFAULT_CITY); return; }
  showLoader();
  navigator.geolocation.getCurrentPosition(
    p => fetchWeatherByCoords(p.coords.latitude, p.coords.longitude),
    () => fetchWeatherByCity(CONFIG.DEFAULT_CITY),
    { timeout: 10000 }
  );
}

/* ════════════════════════════════════
   NOMINATIM — 100% FREE, no key
════════════════════════════════════ */
async function geocodeCity(city) {
  const data = await apiFetch(`${CONFIG.NOMINATIM}/search?q=${encodeURIComponent(city)}&format=json&limit=1&addressdetails=1`);
  if (!data || !data.length) throw new Error(`City "${city}" not found.`);
  const r = data[0];
  return {
    lat:     parseFloat(r.lat),
    lon:     parseFloat(r.lon),
    name:    r.address?.city || r.address?.town || r.address?.village || r.name,
    country: r.address?.country_code?.toUpperCase() || '',
  };
}
async function reverseGeocode(lat, lon) {
  const r = await apiFetch(`${CONFIG.NOMINATIM}/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`);
  return {
    name:    r?.address?.city || r?.address?.town || r?.address?.village || r?.name || 'Unknown',
    country: r?.address?.country_code?.toUpperCase() || '',
  };
}
async function fetchAutocompleteSuggestions(query) {
  if (query.length < 2) { hideAC(); return; }
  try {
    const data = await apiFetch(`${CONFIG.NOMINATIM}/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1&featuretype=city`);
    if (!data || !data.length) { hideAC(); return; }
    el.autocomplete.innerHTML = '';
    data.forEach(r => {
      const name    = r.address?.city || r.address?.town || r.address?.village || r.name;
      const country = r.address?.country || '';
      const li = document.createElement('li');
      li.textContent = `${name}${country ? ', '+country : ''}`;
      li.addEventListener('click', () => {
        el.searchInput.value = name; hideAC();
        fetchWeatherByCoords(parseFloat(r.lat), parseFloat(r.lon), name, r.address?.country_code?.toUpperCase());
      });
      el.autocomplete.appendChild(li);
    });
    el.autocomplete.classList.remove('hidden');
  } catch (_) { hideAC(); }
}
function hideAC() { el.autocomplete.classList.add('hidden'); el.autocomplete.innerHTML = ''; }

/* ════════════════════════════════════
   FETCH WEATHER — Open-Meteo FREE
════════════════════════════════════ */
async function fetchWeatherByCity(city) {
  showLoader();
  try {
    const geo = await geocodeCity(city);
    await fetchWeatherByCoords(geo.lat, geo.lon, geo.name, geo.country);
  } catch(e) { showError(e.message); }
}

async function fetchWeatherByCoords(lat, lon, cityOverride, countryOverride) {
  state.lat = lat; state.lon = lon;
  showLoader();
  try {
    let geo = { name: cityOverride, country: countryOverride };
    if (!cityOverride) geo = await reverseGeocode(lat, lon);
    state.cityName    = geo.name    || 'Unknown';
    state.countryCode = geo.country || '';
    localStorage.setItem('wxLastCity', state.cityName);

    const params = [
      `latitude=${lat}`, `longitude=${lon}`,
      'current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,uv_index,visibility,is_day',
      'hourly=temperature_2m,weather_code,precipitation_probability',
      'daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max',
      'wind_speed_unit=kmh', 'forecast_days=7', 'timezone=auto',
    ].join('&');

    const data = await apiFetch(`${CONFIG.METEO_BASE}?${params}`);
    state.currentWeather = data;
    renderAll(data, geo);
  } catch(e) { showError(e.message || 'Failed to fetch weather.'); }
}

/* ════════════════════════════════════
   RENDER
════════════════════════════════════ */
function renderAll(data, geo) {
  const c   = data.current;
  const wmo = getWMO(c.weather_code, c.is_day===0);

  hideLoader(); hideError();
  el.main.classList.remove('hidden');
  el.main.classList.add('fade-in');

  el.cityName.textContent     = geo.name    || state.cityName;
  el.countryName.textContent  = geo.country || state.countryCode;
  el.heroDate.textContent     = new Date().toLocaleDateString([],{weekday:'long',month:'long',day:'numeric'});
  el.tempValue.textContent    = toDisplay(c.temperature_2m);
  el.conditionText.textContent= wmo.desc;
  el.feelsLike.textContent    = toDisplay(c.apparent_temperature);
  el.weatherIcon.textContent  = wmo.icon;
  el.tempMax.textContent      = toDisplay(data.daily?.temperature_2m_max?.[0] ?? c.temperature_2m);
  el.tempMin.textContent      = toDisplay(data.daily?.temperature_2m_min?.[0] ?? c.temperature_2m);

  el.humidity.textContent     = c.relative_humidity_2m + '%';
  el.windSpeed.textContent    = windDisplay(c.wind_speed_10m);
  el.pressure.textContent     = Math.round(c.surface_pressure) + ' hPa';
  el.uvIndex.textContent      = c.uv_index != null ? Math.round(c.uv_index) : (data.daily?.uv_index_max?.[0] ?? '--');
  el.visibility.textContent   = c.visibility != null ? (c.visibility/1000).toFixed(1)+' km' : '--';
  el.windDir.textContent      = degToCompass(c.wind_direction_10m);

  const sr = data.daily?.sunrise?.[0];
  const ss = data.daily?.sunset?.[0];
  el.sunrise.textContent = sr ? new Date(sr).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) : '--';
  el.sunset.textContent  = ss ? new Date(ss).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) : '--';

  renderHourly(data.hourly);
  renderForecast(data.daily);
  animateBackground(wmo.id, c.is_day===0);
  initMap(state.lat, state.lon, geo.name, toDisplay(c.temperature_2m));
  generateLocalAIInsights(c, data.daily, geo.name);
}

/* ── Hourly ── */
function renderHourly(hourly) {
  if (!hourly) return;
  const now      = new Date();
  const curHour  = now.getHours();
  const todayStr = now.toISOString().slice(0,10);
  let idx = hourly.time.findIndex(t => t.startsWith(todayStr) && parseInt(t.slice(11,13)) >= curHour);
  if (idx < 0) idx = 0;

  el.hourlySlider.innerHTML = '';
  hourly.time.slice(idx, idx+12).forEach((timeStr, i) => {
    const ri   = idx + i;
    const wmo  = getWMO(hourly.weather_code[ri]);
    const rain = hourly.precipitation_probability?.[ri] ?? 0;
    const h    = new Date(timeStr);
    const div  = document.createElement('div');
    div.className = 'hourly-item' + (i===0?' active':'');
    div.innerHTML = `
      <div class="hourly-time">${i===0?'Now':h.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div>
      <div class="hourly-icon">${wmo.icon}</div>
      <div class="hourly-temp">${toDisplay(hourly.temperature_2m[ri])}°</div>
      ${rain>20?`<div style="font-size:0.7rem;color:#72c3ff">💧${rain}%</div>`:''}
    `;
    el.hourlySlider.appendChild(div);
  });
}

/* ── 7-Day ── */
function renderForecast(daily) {
  if (!daily) return;
  el.forecastList.innerHTML = '';
  daily.time.forEach((dateStr, i) => {
    const wmo  = getWMO(daily.weather_code[i]);
    const div  = document.createElement('div');
    div.className = 'forecast-item';
    div.innerHTML = `
      <span class="forecast-day">${i===0?'Today':new Date(dateStr+'T12:00').toLocaleDateString([],{weekday:'short',month:'short',day:'numeric'})}</span>
      <span class="forecast-icon">${wmo.icon}</span>
      <span class="forecast-desc">${wmo.desc}</span>
      <span class="forecast-rain">🌧 ${daily.precipitation_probability_max?.[i]??0}%</span>
      <span class="forecast-temps"><span class="f-hi">${toDisplay(daily.temperature_2m_max[i])}°</span><span class="f-lo">${toDisplay(daily.temperature_2m_min[i])}°</span></span>
    `;
    el.forecastList.appendChild(div);
  });
}

/* ════════════════════════════════════
   MAP — Leaflet + OSM (free, no key)
════════════════════════════════════ */
function initMap(lat, lon, city, temp) {
  if (!state.map) {
    state.map = L.map('map',{zoomControl:true,scrollWheelZoom:true}).setView([lat,lon],10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
      attribution:'© OpenStreetMap contributors', maxZoom:18
    }).addTo(state.map);
    state.map.on('click', e => fetchWeatherByCoords(e.latlng.lat, e.latlng.lng));
  } else {
    state.map.setView([lat,lon],10);
  }
  if (state.mapMarker) state.mapMarker.remove();
  const icon = L.divIcon({
    className:'',
    html:`<div style="background:var(--accent);color:#fff;padding:6px 12px;border-radius:20px;font-family:var(--font-display);font-weight:700;font-size:0.85rem;white-space:nowrap;box-shadow:0 4px 16px rgba(123,97,255,0.5);">${temp}° ${city}</div>`,
    iconAnchor:[40,16],
  });
  state.mapMarker = L.marker([lat,lon],{icon}).addTo(state.map);
}

/* ════════════════════════════════════
   AI INSIGHTS — Smart local engine
════════════════════════════════════ */
function generateLocalAIInsights(c, daily, city) {
  el.aiLoading.classList.remove('hidden');
  el.aiContent.classList.add('hidden');

  const temp  = c.temperature_2m;
  const hum   = c.relative_humidity_2m;
  const wind  = c.wind_speed_10m;
  const uv    = c.uv_index ?? daily?.uv_index_max?.[0] ?? 0;
  const code  = c.weather_code;
  const night = c.is_day === 0;

  const isThunder = code >= 95;
  const isSnow    = (code>=71 && code<=77) || code===85 || code===86;
  const isRain    = (code>=51 && code<=67) || (code>=80 && code<=82);
  const isFog     = code===45 || code===48;
  const isClear   = code===0 || code===1;
  const isCloudy  = code===2 || code===3;

  const isHot   = temp >= 32;
  const isWarm  = temp >= 20;
  const isMild  = temp >= 10 && temp < 20;
  const isCold  = temp >= 0  && temp < 10;
  const isFrost = temp < 0;

  const summary =
    isThunder       ? `Thunderstorms are rolling over ${city} at ${toDisplay(temp)}°. Stay indoors and away from open areas — lightning is active.` :
    isSnow          ? `Snow is falling in ${city} at ${toDisplay(temp)}°. Roads may be slippery — allow extra travel time and take care outdoors.` :
    isRain && isHot ? `Warm and rainy in ${city} at ${toDisplay(temp)}°. A tropical feel with ${hum}% humidity making it feel heavy.` :
    isRain          ? `A rainy day in ${city} with ${toDisplay(temp)}° and ${hum}% humidity. The ${getWMO(code).desc.toLowerCase()} is expected to persist.` :
    isFog           ? `Foggy conditions in ${city} at ${toDisplay(temp)}°. Reduced visibility — drive with dipped headlights and allow extra time.` :
    isClear&&isHot  ? `Brilliantly sunny in ${city} at ${toDisplay(temp)}°! Ideal for outdoor adventures — but stay sun-safe during peak hours.` :
    isClear&&night  ? `Clear night over ${city} at ${toDisplay(temp)}°. Minimal cloud cover — perfect conditions for stargazing.` :
    isClear         ? `Beautiful clear skies in ${city} at ${toDisplay(temp)}°. A wonderful day to get outdoors and enjoy fresh air!` :
    isCloudy        ? `Overcast skies in ${city} today at ${toDisplay(temp)}°. Dry but cloudy — comfortable for most activities.` :
    `Current conditions in ${city}: ${getWMO(code).desc} at ${toDisplay(temp)}° (feels like ${toDisplay(c.apparent_temperature)}°).`;

  const clothing =
    isFrost         ? 'Heavy winter coat, thermal base layers, waterproof gloves, warm hat, and insulated boots.' :
    isCold && isRain? 'Warm waterproof jacket, fleece mid-layer, waterproof boots, and carry an umbrella.' :
    isCold          ? 'A warm coat, scarf, and light gloves. Layering is key for comfort today.' :
    isMild && isRain? 'Waterproof rain jacket and ankle boots. Keep a compact umbrella handy.' :
    isMild          ? 'A light jacket or cardigan. Comfortable jeans or trousers work perfectly.' :
    isWarm && isRain? 'Light quick-dry clothes and a slim waterproof layer. Skip the open sandals.' :
    isWarm          ? 'Light breathable clothing. A sunhat is a nice touch for afternoon outings.' :
    isHot           ? 'Light linen or cotton in loose fits. Sun hat, UV sunglasses, and open shoes.' :
    isSnow          ? 'Insulated waterproof jacket, thermal base layers, snow boots, gloves, and a warm hat.' :
    'Comfortable, adaptable layers to handle any shifts throughout the day.';

  const activity =
    isThunder       ? '⚡ Stay indoors. Read, stream shows, cook a new recipe, or enjoy a board game session.' :
    isSnow          ? '⛷️ Skiing, sledding, or snowball fights! Indoors: hot drinks, movies, or a cozy bake-off.' :
    isRain          ? '🏠 Museums, galleries, indoor markets, cafés, or catch up on that home project you have been delaying.' :
    isFog           ? '🌁 Keep it local. A slow foggy morning walk can be magical — just be careful near roads.' :
    isClear&&isHot  ? '🏊 Swimming, beach trips, or water sports. Best outdoor window: before 10am or after 5pm.' :
    isClear&&night  ? '🔭 Stargazing, rooftop dinner, an evening cycle, or a night walk through the city.' :
    isClear         ? '🚴 Hiking, cycling, outdoor dining, photography, or exploring a new neighbourhood on foot.' :
    '🏙️ City sightseeing, outdoor cafés, a park walk, or a light run — no sun glare and pleasant temps.';

  const health =
    uv >= 8         ? `🔴 Extreme UV (${Math.round(uv)}) — SPF 50+ every 2 hours, UV sunglasses, and avoid 11am–3pm direct sun.` :
    uv >= 6         ? `🟠 High UV (${Math.round(uv)}) — sunscreen required. Reapply every 90 min and cover up.` :
    uv >= 3         ? `🟡 Moderate UV (${Math.round(uv)}) — sunscreen advised for extended time outdoors.` :
    isHot&&hum>70   ? '🌡️ Hot and humid — dehydration risk is high. Drink 3L+ water and rest in shade regularly.' :
    isHot           ? '☀️ Stay hydrated throughout the day. Carry water and rest in cool spots frequently.' :
    isFrost         ? '🧊 Frostbite risk on exposed skin. Warm up properly before any outdoor exertion.' :
    isCold          ? '🧣 Cold air strains lungs and heart. Warm up before exercise and breathe through your nose.' :
    isThunder       ? '⚡ Seek solid shelter immediately. Avoid trees, open fields, and metal structures.' :
    wind > 50       ? `💨 Strong winds (${Math.round(wind)} km/h) — protect eyes from debris and be careful cycling.` :
    hum > 80        ? '💧 High humidity can aggravate respiratory conditions. Keep inhalers handy and stay dry.' :
    hum < 25        ? '🌵 Low humidity dries skin and airways. Drink extra water and use a moisturiser.' :
    '✅ Comfortable conditions — a good day for 30 minutes of light outdoor activity!';

  const tips = [
    isRain          && '💡 A compact umbrella in your bag weighs almost nothing and saves you every time.',
    isSnow          && '💡 Rub petroleum jelly on car door seals to stop them freezing shut overnight.',
    isHot           && '💡 A bowl of ice in front of a fan works as a surprisingly effective budget air conditioner.',
    isFrost         && '💡 Cover your windscreen with cardboard the night before to skip the morning scrape.',
    wind>30         && '💡 Wind chill can make it feel up to 8° colder than the thermometer actually reads.',
    isClear&&!night && '💡 UV peaks around midday — check the index hourly on sunny days, not just in summer.',
    night           && '💡 Eyes need 20 minutes to fully adapt to darkness — wait before a stargazing session.',
    isCloudy        && '💡 Up to 80% of UV rays still penetrate cloud cover — sunscreen is worth it today.',
    isFog           && '💡 Use dipped headlights in fog — full beam reflects back and actually worsens visibility.',
    hum>75          && '💡 High humidity makes sweating less effective. Loose, lightweight fabrics help a lot.',
    '💡 Forecasts are most accurate within 24 hours — check again in the morning for the best plans.',
  ].filter(Boolean);
  const tip = tips[0] || tips[tips.length-1];

  setTimeout(() => {
    el.aiSummary.textContent  = summary;
    el.aiClothing.textContent = clothing;
    el.aiActivity.textContent = activity;
    el.aiHealth.textContent   = health;
    el.aiTip.textContent      = tip;
    el.aiLoading.classList.add('hidden');
    el.aiContent.classList.remove('hidden');
  }, 800);
}

/* ════════════════════════════════════
   ANIMATED CANVAS BACKGROUND
════════════════════════════════════ */
const canvas = el.canvas;
const ctx    = canvas.getContext('2d');
let particles = [], animationId, bgMode = 'clear';

function animateBackground(id, isNight) {
  cancelAnimationFrame(animationId);
  particles = [];
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  bgMode = id>=200&&id<300 ? 'thunder' :
           id>=300&&id<600 ? 'rain'    :
           id>=600&&id<700 ? 'snow'    :
           id>=700&&id<800 ? 'fog'     :
           id===800&&isNight ? 'stars' :
           id===800         ? 'sun'   : 'clouds';

  if (bgMode==='rain'||bgMode==='thunder') spawnRain(180);
  else if (bgMode==='snow')   spawnSnow(130);
  else if (bgMode==='stars')  spawnStars(220);
  else if (bgMode==='clouds') spawnClouds(7);
  else if (bgMode==='sun')    particles.push({type:'sun',pulse:0});
  else if (bgMode==='fog')    spawnFog();
  drawBG();
}

function spawnRain(n) {
  for (let i=0;i<n;i++) particles.push({x:Math.random()*canvas.width,y:Math.random()*canvas.height,len:Math.random()*18+8,speed:Math.random()*10+12,opacity:Math.random()*0.5+0.2});
}
function spawnSnow(n) {
  for (let i=0;i<n;i++) particles.push({x:Math.random()*canvas.width,y:Math.random()*canvas.height,r:Math.random()*3+1,speed:Math.random()*1.5+0.4,drift:Math.random()*0.8-0.4,opacity:Math.random()*0.6+0.3});
}
function spawnStars(n) {
  for (let i=0;i<n;i++) particles.push({x:Math.random()*canvas.width,y:Math.random()*canvas.height,r:Math.random()*1.5+0.3,twinkle:Math.random()*Math.PI*2,speed:Math.random()*0.03+0.01});
}
function spawnClouds(n) {
  for (let i=0;i<n;i++) particles.push({x:Math.random()*canvas.width,y:Math.random()*canvas.height*0.55,r:Math.random()*80+40,speed:Math.random()*0.35+0.1,opacity:Math.random()*0.08+0.03});
}
function spawnFog() {
  for (let i=0;i<12;i++) particles.push({x:Math.random()*canvas.width,y:Math.random()*canvas.height,w:Math.random()*300+150,h:Math.random()*80+40,speed:Math.random()*0.3+0.1,opacity:Math.random()*0.05+0.02});
}

function drawBG() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  if (bgMode==='rain'||bgMode==='thunder') {
    particles.forEach(p => {
      ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(p.x-p.len*0.15,p.y+p.len);
      ctx.strokeStyle=`rgba(180,210,255,${p.opacity})`; ctx.lineWidth=1; ctx.stroke();
      p.y+=p.speed; p.x-=0.8;
      if (p.y>canvas.height){p.y=-20;p.x=Math.random()*canvas.width;}
    });
    if (bgMode==='thunder'&&Math.random()<0.003){ctx.fillStyle='rgba(255,255,200,0.07)';ctx.fillRect(0,0,canvas.width,canvas.height);}
  } else if (bgMode==='snow') {
    particles.forEach(p => {
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle=`rgba(255,255,255,${p.opacity})`; ctx.fill();
      p.y+=p.speed; p.x+=p.drift;
      if (p.y>canvas.height){p.y=-5;p.x=Math.random()*canvas.width;}
    });
  } else if (bgMode==='stars') {
    particles.forEach(p => {
      p.twinkle+=p.speed;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle=`rgba(255,255,255,${(Math.sin(p.twinkle)+1)/2*0.8+0.1})`; ctx.fill();
    });
  } else if (bgMode==='clouds') {
    particles.forEach(p => {
      const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r);
      g.addColorStop(0,`rgba(255,255,255,${p.opacity})`); g.addColorStop(1,'rgba(255,255,255,0)');
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fillStyle=g; ctx.fill();
      p.x+=p.speed; if (p.x-p.r>canvas.width) p.x=-p.r;
    });
  } else if (bgMode==='sun') {
    const p=particles[0]; if(!p) { animationId=requestAnimationFrame(drawBG); return; }
    p.pulse+=0.02;
    const cx=canvas.width*0.85,cy=canvas.height*0.15,r=90+Math.sin(p.pulse)*10;
    const g=ctx.createRadialGradient(cx,cy,0,cx,cy,r*3);
    g.addColorStop(0,'rgba(255,220,60,0.18)'); g.addColorStop(0.4,'rgba(255,180,0,0.07)'); g.addColorStop(1,'rgba(255,140,0,0)');
    ctx.beginPath(); ctx.arc(cx,cy,r*3,0,Math.PI*2); ctx.fillStyle=g; ctx.fill();
  } else if (bgMode==='fog') {
    particles.forEach(p => {
      ctx.beginPath(); ctx.ellipse(p.x,p.y,p.w,p.h,0,0,Math.PI*2);
      ctx.fillStyle=`rgba(200,210,220,${p.opacity})`; ctx.fill();
      p.x+=p.speed; if (p.x-p.w>canvas.width) p.x=-p.w;
    });
  }
  animationId = requestAnimationFrame(drawBG);
}

window.addEventListener('resize',()=>{canvas.width=window.innerWidth;canvas.height=window.innerHeight;});

/* ════════════════════════════════════
   API HELPER + SESSION CACHE
════════════════════════════════════ */
async function apiFetch(url) {
  const cached = cacheGet(url);
  if (cached) return cached;
  const res = await fetch(url,{headers:{'Accept':'application/json'}});
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  cacheSet(url,data);
  return data;
}
function cacheSet(k,v){try{sessionStorage.setItem('wx_'+k,JSON.stringify({ts:Date.now(),value:v}));}catch(_){}}
function cacheGet(k){try{const r=sessionStorage.getItem('wx_'+k);if(!r)return null;const{ts,value}=JSON.parse(r);if(Date.now()-ts>CONFIG.CACHE_TTL){sessionStorage.removeItem('wx_'+k);return null;}return value;}catch(_){return null;}}

/* ════════════════════════════════════
   EVENTS
════════════════════════════════════ */
function bindEvents() {
  el.themeToggle.addEventListener('click',()=>{state.theme=state.theme==='dark'?'light':'dark';applyTheme(state.theme);});
  el.unitToggle.addEventListener('click',()=>{
    applyUnit(state.unit==='metric'?'imperial':'metric');
    if (state.currentWeather) renderAll(state.currentWeather,{name:state.cityName,country:state.countryCode});
  });
  el.searchBtn.addEventListener('click',doSearch);
  el.searchInput.addEventListener('keydown',e=>{if(e.key==='Enter')doSearch();});
  el.locateBtn.addEventListener('click',geoLocate);
  let acTimer=null;
  el.searchInput.addEventListener('input',()=>{clearTimeout(acTimer);acTimer=setTimeout(()=>fetchAutocompleteSuggestions(el.searchInput.value.trim()),320);});
  document.addEventListener('click',e=>{if(!el.searchInput.contains(e.target)&&!el.autocomplete.contains(e.target))hideAC();});
  document.querySelectorAll('.city-tag').forEach(b=>b.addEventListener('click',()=>fetchWeatherByCity(b.dataset.city)));
  el.retryBtn.addEventListener('click',()=>{hideError();if(state.lat&&state.lon)fetchWeatherByCoords(state.lat,state.lon,state.cityName,state.countryCode);else geoLocate();});
  el.refreshAI.addEventListener('click',()=>{if(state.currentWeather)generateLocalAIInsights(state.currentWeather.current,state.currentWeather.daily,state.cityName);});
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();state.deferredPrompt=e;el.installBanner.classList.remove('hidden');});
  el.installBtn.addEventListener('click',async()=>{if(!state.deferredPrompt)return;state.deferredPrompt.prompt();await state.deferredPrompt.userChoice;state.deferredPrompt=null;el.installBanner.classList.add('hidden');});
  el.dismissInstall.addEventListener('click',()=>el.installBanner.classList.add('hidden'));
}

function doSearch(){const q=el.searchInput.value.trim();if(!q)return;hideAC();fetchWeatherByCity(q);}

/* ── UI Helpers ── */
function showLoader(){el.loader.classList.remove('hidden');el.main.classList.add('hidden');el.error.classList.add('hidden');}
function hideLoader(){el.loader.classList.add('hidden');}
function showError(msg){hideLoader();el.errorText.textContent=msg;el.error.classList.remove('hidden');el.main.classList.add('hidden');}
function hideError(){el.error.classList.add('hidden');}
function degToCompass(d){return['N','NE','E','SE','S','SW','W','NW'][Math.round(d/45)%8];}

/* ── Service Worker ── */
function registerServiceWorker(){if('serviceWorker'in navigator)navigator.serviceWorker.register('./service-worker.js').catch(()=>{});}

/* ── Boot ── */
init();
