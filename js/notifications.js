import { state, getPlatformIcon } from './state.js';

export function startNotificationSystem() {
  // Start randomly popping up notifications every 10-25 seconds
  setTimeout(scheduleNextNotification, 5000);
}

function scheduleNextNotification() {
  spawnNotification();
  const delay = Math.random() * 15000 + 10000; // 10s to 25s
  setTimeout(scheduleNextNotification, delay);
}

function spawnNotification() {
  if (!state.baseTrendsData || state.baseTrendsData.length === 0) return;
  
  // Pick a random trend
  const randomTrend = state.baseTrendsData[Math.floor(Math.random() * state.baseTrendsData.length)];
  
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'w-80 bg-slate-900/95 border border-purple-500/40 rounded-xl p-4 shadow-[0_10px_30px_rgba(168,85,247,0.25)] backdrop-blur-md transform transition-all duration-500 translate-y-10 opacity-0 pointer-events-auto cursor-pointer hover:border-purple-400 z-50';
  
  toast.innerHTML = `
    <div class="flex items-start gap-3">
      <div class="w-10 h-10 rounded-full bg-purple-900/50 border border-purple-500/50 flex items-center justify-center text-purple-400 shrink-0">
        <i class="fa-solid fa-bolt animate-pulse"></i>
      </div>
      <div>
        <h5 class="text-[10px] font-black uppercase tracking-widest text-purple-400 flex items-center gap-1">
          <span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span> Live Breakout
        </h5>
        <h4 class="text-sm font-bold text-white mt-1 line-clamp-1">${randomTrend.title}</h4>
        <div class="flex items-center gap-2 mt-2">
          <span class="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800 flex items-center gap-1">
             <i class="${getPlatformIcon(randomTrend.platform)}"></i> ${randomTrend.platform}
          </span>
          <span class="text-[10px] font-bold text-emerald-400">${randomTrend.growth}</span>
        </div>
      </div>
    </div>
  `;

  // Click to view in modal
  toast.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('openTrendModal', { detail: randomTrend.id }));
    removeToast(toast);
  });

  container.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-10', 'opacity-0');
  });

  // Auto remove after 6 seconds
  setTimeout(() => {
    if(container.contains(toast)) {
      removeToast(toast);
    }
  }, 6000);
}

function removeToast(toast) {
  toast.classList.add('translate-y-10', 'opacity-0');
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 500);
}
