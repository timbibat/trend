import { state, accentTheme, defaultTheme } from './state.js';

// Realistic geographic pin mapping on world.svg (950 x 620 projection)
const GEO_LOCATIONS = {
  'US': [
    { name: 'New York, US', x: 26, y: 38 },
    { name: 'Silicon Valley, US', x: 16, y: 39 },
    { name: 'Chicago, US', x: 22, y: 36 },
    { name: 'Austin, US', x: 21, y: 44 }
  ],
  'GB': [
    { name: 'London, UK', x: 49, y: 28 },
    { name: 'Manchester, UK', x: 48, y: 26 },
    { name: 'Edinburgh, UK', x: 48, y: 24 }
  ],
  'CA': [
    { name: 'Toronto, CA', x: 25, y: 34 },
    { name: 'Vancouver, CA', x: 16, y: 30 },
    { name: 'Montreal, CA', x: 27, y: 32 }
  ],
  'AU': [
    { name: 'Sydney, AU', x: 86, y: 76 },
    { name: 'Melbourne, AU', x: 84, y: 80 },
    { name: 'Brisbane, AU', x: 87, y: 72 }
  ],
  'GLOBAL': [
    { name: 'Tokyo, JP', x: 84, y: 39 },
    { name: 'Seoul, KR', x: 80, y: 38 },
    { name: 'Berlin, DE', x: 53, y: 28 },
    { name: 'Singapore, SG', x: 75, y: 56 },
    { name: 'São Paulo, BR', x: 33, y: 73 },
    { name: 'Stockholm, SE', x: 54, y: 21 },
    { name: 'Mumbai, IN', x: 68, y: 46 },
    { name: 'Sydney, AU', x: 86, y: 76 },
    { name: 'Silicon Valley, US', x: 16, y: 39 },
    { name: 'London, UK', x: 49, y: 28 }
  ]
};

export function startMapSync() {
  setInterval(spawnMapPing, 2200);
  
  // Initial burst of 3 pings
  for (let i = 0; i < 3; i++) {
    setTimeout(spawnMapPing, i * 400);
  }
}

function spawnMapPing() {
  if (!state.trendsData || state.trendsData.length === 0) return;
  const mapLayer = document.getElementById('map-points-layer');
  if (!mapLayer) return;

  // Pick a random trend from the current active trends
  const trend = state.trendsData[Math.floor(Math.random() * state.trendsData.length)];
  const geoCode = trend.geo || 'GLOBAL';
  const locationPool = GEO_LOCATIONS[geoCode] || GEO_LOCATIONS['GLOBAL'];
  const loc = locationPool[Math.floor(Math.random() * locationPool.length)];

  // Add subtle organic jitter (+/- 1.2%)
  const jitterX = (Math.random() - 0.5) * 2.4;
  const jitterY = (Math.random() - 0.5) * 2.4;
  const posX = Math.max(5, Math.min(95, loc.x + jitterX));
  const posY = Math.max(5, Math.min(95, loc.y + jitterY));

  const theme = accentTheme[trend.category] || defaultTheme;
  const ringColor = theme.strokeColor || '#06b6d4';

  const ping = document.createElement('div');
  ping.className = 'absolute flex h-6 w-6 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 group transition-all duration-300';
  ping.style.left = `${posX}%`;
  ping.style.top = `${posY}%`;

  ping.innerHTML = `
    <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style="background-color: ${ringColor}"></span>
    <span class="relative inline-flex rounded-full h-2.5 w-2.5 m-auto" style="background-color: ${ringColor}; box-shadow: 0 0 12px ${ringColor}"></span>
    
    <!-- Rich Floating Hover Tooltip -->
    <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[220px] p-2 bg-slate-950/95 border border-slate-700/80 rounded-xl text-[10px] text-white opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 shadow-2xl backdrop-blur-md z-30">
      <div class="flex items-center justify-between gap-2 pb-1 border-b border-slate-800 text-[9px]">
        <span class="text-slate-400 font-mono flex items-center gap-1">
          <i class="fa-solid fa-location-dot text-cyan-400"></i> ${loc.name}
        </span>
        <span class="text-emerald-400 font-bold">${trend.growth}</span>
      </div>
      <p class="font-bold text-slate-100 line-clamp-1 mt-1">${trend.title}</p>
      <div class="text-[9px] text-slate-400 mt-0.5 flex items-center justify-between">
        <span>${trend.platform}</span>
        <span class="text-purple-400 font-medium">Click to inspect</span>
      </div>
    </div>
  `;

  // Open detail modal when clicking on the map pin
  ping.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('openTrendModal', { detail: trend.id }));
  });

  mapLayer.appendChild(ping);

  // Fade out after 5-7 seconds
  setTimeout(() => {
    ping.classList.add('opacity-0');
    setTimeout(() => {
      if (mapLayer.contains(ping)) {
        mapLayer.removeChild(ping);
      }
    }, 500);
  }, 4500 + Math.random() * 2000);
}
