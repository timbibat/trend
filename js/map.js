import { state } from './state.js';

export function startMapSync() {
  // Start pulsing random locations on the SVG map to simulate global hotspots
  setInterval(spawnMapPing, 2000);
  
  // Initial burst
  for(let i=0; i<3; i++) {
    setTimeout(spawnMapPing, i * 300);
  }
}

function spawnMapPing() {
  if (!state.baseTrendsData || state.baseTrendsData.length === 0) return;
  const mapLayer = document.getElementById('map-points-layer');
  if (!mapLayer) return;

  // The SVG is roughly 1000x500. We want pings to mostly land on landmasses,
  // but to keep it lightweight without a complex geoJSON lookup, we can 
  // bias points towards standard continental coordinates roughly matching the SVG projection.
  
  const regions = [
    { x: 15, y: 35, w: 20, h: 30 }, // North America
    { x: 22, y: 65, w: 10, h: 20 }, // South America
    { x: 45, y: 30, w: 15, h: 20 }, // Europe
    { x: 50, y: 50, w: 15, h: 25 }, // Africa
    { x: 65, y: 30, w: 25, h: 30 }, // Asia
    { x: 80, y: 70, w: 10, h: 10 }, // Australia
  ];
  
  const region = regions[Math.floor(Math.random() * regions.length)];
  const x = region.x + Math.random() * region.w;
  const y = region.y + Math.random() * region.h;

  const ping = document.createElement('div');
  ping.className = 'absolute flex h-5 w-5 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 hover:scale-125 transition-transform duration-200';
  ping.style.left = `${x}%`;
  ping.style.top = `${y}%`;
  
  // Choose random color theme
  const colors = [
    { bg: 'bg-purple-500', ring: 'bg-purple-400', shadow: 'rgba(168,85,247,0.5)' },
    { bg: 'bg-cyan-500', ring: 'bg-cyan-400', shadow: 'rgba(6,182,212,0.5)' },
    { bg: 'bg-emerald-500', ring: 'bg-emerald-400', shadow: 'rgba(16,185,129,0.5)' },
    { bg: 'bg-pink-500', ring: 'bg-pink-400', shadow: 'rgba(236,72,153,0.5)' }
  ];
  const theme = colors[Math.floor(Math.random() * colors.length)];
  
  // Pick a random trend to show on hover (optional enhancement)
  const randomTrend = state.baseTrendsData[Math.floor(Math.random() * state.baseTrendsData.length)];

  ping.innerHTML = `
    <span class="animate-ping absolute inline-flex h-full w-full rounded-full ${theme.ring} opacity-60"></span>
    <span class="relative inline-flex rounded-full h-2 w-2 m-auto ${theme.bg}" style="box-shadow: 0 0 10px ${theme.shadow}"></span>
    <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-slate-900 border border-slate-700 rounded text-[9px] font-bold text-white opacity-0 pointer-events-none transition-opacity duration-200 shadow-xl group-hover:opacity-100 z-20">
      ${randomTrend.title}
    </div>
  `;
  
  // Make the tooltip appear on hover by adding group class
  ping.classList.add('group');

  ping.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('openTrendModal', { detail: randomTrend.id }));
  });

  mapLayer.appendChild(ping);

  // Fade out and remove
  setTimeout(() => {
    ping.classList.add('opacity-0');
    setTimeout(() => {
      if(mapLayer.contains(ping)) mapLayer.removeChild(ping);
    }, 500);
  }, 4000 + Math.random() * 2000); // Live for 4-6 seconds
}
