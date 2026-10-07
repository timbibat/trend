import { state, accentTheme, defaultTheme, rebuildTrendsDataset, playSound, getPlatformIcon, toggleSoundMute } from './state.js';
import { toggleBookmark, deleteCustomTrend } from './watchlist.js';
import { startScanMonitor } from './monitor.js';
import { initGame } from './game.js';
import { setupSimulatorPreview } from './simulator.js';
import { drawSparkline, renderMiniSparklineSVG, drawComparisonChart } from './chart.js';
import { startNotificationSystem } from './notifications.js';
import { startMapSync } from './map.js';

// DOM Elements Cache
const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');
const filterTabsContainer = document.getElementById('filter-tabs');
const platformFilterTabs = document.getElementById('platform-filter-tabs');
const trendsGrid = document.getElementById('trends-grid');
const noResultsDiv = document.getElementById('no-results');
const heroContainer = document.getElementById('hero-container');
const detailModal = document.getElementById('detail-modal');
const modalClosed = document.getElementById('modal-close');
const shareButton = document.getElementById('modal-share');
const modalSourceLink = document.getElementById('modal-source-link');
const modalShareX = document.getElementById('modal-share-x');
const modalExportJson = document.getElementById('modal-export-json');
const soundToggleBtn = document.getElementById('sound-toggle-btn');
const soundIcon = document.getElementById('sound-icon');
const syncTimeText = document.getElementById('sync-time-text');
const btnOpenCompare = document.getElementById('btn-open-compare');

// Compare Modal Elements
const compareModal = document.getElementById('compare-modal');
const compareCard = document.getElementById('compare-card');
const compareClose = document.getElementById('compare-close');
const compareSelectA = document.getElementById('compare-select-a');
const compareSelectB = document.getElementById('compare-select-b');
const compareStatsA = document.getElementById('compare-stats-a');
const compareStatsB = document.getElementById('compare-stats-b');
const compareWinnerBanner = document.getElementById('compare-winner-banner');

let activeModalTrend = null;

// On Load Lifecycle
document.addEventListener('DOMContentLoaded', () => {
  initSoundButton();
  loadTrends();
  setupEventListeners();
  startScanMonitor();
  setupSimulatorPreview(renderGrid, focusCategoryAndScroll);
  startNotificationSystem();
  startMapSync();
  startSyncTimer();
});

// Sound Toggle Button Setup
function initSoundButton() {
  if (!soundToggleBtn || !soundIcon) return;
  updateSoundIcon();

  soundToggleBtn.addEventListener('click', () => {
    const isMuted = toggleSoundMute();
    updateSoundIcon();
  });
}

function updateSoundIcon() {
  if (!soundIcon) return;
  if (state.isMuted) {
    soundIcon.className = 'fa-solid fa-volume-xmark text-xs text-slate-500';
    soundToggleBtn.setAttribute('title', 'Sound Effects: Muted (Click to Unmute)');
  } else {
    soundIcon.className = 'fa-solid fa-volume-high text-xs text-cyan-400';
    soundToggleBtn.setAttribute('title', 'Sound Effects: Active (Click to Mute)');
  }
}

// Relative Sync Timer Updater
function startSyncTimer() {
  updateSyncLabel();
  setInterval(updateSyncLabel, 30000); // Check every 30s
}

function updateSyncLabel() {
  if (!syncTimeText) return;
  if (!state.lastUpdated) {
    syncTimeText.textContent = 'Live Sync';
    return;
  }
  const diffSec = Math.floor((new Date() - state.lastUpdated) / 1000);
  if (diffSec < 60) {
    syncTimeText.textContent = 'Synced just now';
  } else if (diffSec < 3600) {
    const mins = Math.floor(diffSec / 60);
    syncTimeText.textContent = `Synced ${mins}m ago`;
  } else {
    const hrs = Math.floor(diffSec / 3600);
    syncTimeText.textContent = `Synced ${hrs}h ago`;
  }
}

// Fetch and Load JSON Data
async function loadTrends() {
  try {
    let response = await fetch('data/data.json');
    if (!response.ok) {
      response = await fetch('data.json');
    }
    if (!response.ok) {
      throw new Error(`Data fetch failed with status: ${response.status}`);
    }
    state.baseTrendsData = await response.json();
    
    // Merge standard trends with custom simulated trends
    rebuildTrendsDataset();
    updateSyncLabel();
    
    // Render Dashboard components
    renderHero();
    renderGrid();
    initGame();
    setupCompareModal();
  } catch (error) {
    console.error("Critical Dashboard Error:", error);
    if (heroContainer) {
      heroContainer.innerHTML = `
        <div class="p-8 text-center text-red-400 bg-slate-900/60 rounded-3xl border border-red-500/30">
          <i class="fa-solid fa-triangle-exclamation text-3xl mb-3"></i>
          <h3 class="font-bold text-lg text-white">Database Synchronization Failed</h3>
          <p class="text-sm text-slate-400 mt-1 max-w-md mx-auto">
            Please host this directory using a local web server so index.html can fetch data.json.
          </p>
        </div>
      `;
    }
    if (trendsGrid) {
      trendsGrid.innerHTML = `
        <div class="col-span-full py-16 text-center text-slate-500 bg-slate-900/25 border border-slate-800/50 rounded-3xl">
          <i class="fa-solid fa-cloud-slash text-4xl mb-4 text-slate-700"></i>
          <p>A loading issue occurred. Run a local web server to dynamically see current culture cards.</p>
        </div>
      `;
    }
  }
}

// Set Up Interactive Page Event Listeners
function setupEventListeners() {
  // Keyup search with instant rendering
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.toLowerCase().trim();
      renderGrid();
    });
  }

  // Keyboard Shortcut listener (focus search input on '/')
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== searchInput && document.activeElement.tagName !== 'INPUT') {
      e.preventDefault();
      searchInput.focus();
      searchInput.select();
    }
  });

  // Handle Category Filter tab switching
  if (filterTabsContainer) {
    filterTabsContainer.addEventListener('click', (e) => {
      const targetBtn = e.target.closest('button[data-category]');
      if (!targetBtn) return;
      playSound('click');

      // Reset previous active tabs styling
      Array.from(filterTabsContainer.querySelectorAll('button')).forEach(btn => {
        btn.className = "px-4 py-2 bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800/80 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2 whitespace-nowrap";
      });

      // Set clicked tab to selected style
      if (targetBtn.getAttribute('data-category') === 'watchlist') {
        targetBtn.className = "px-4 py-2 bg-pink-600 text-white rounded-xl text-sm font-semibold tracking-wide shadow-[0_0_15px_rgba(236,72,153,0.35)] border border-pink-500/25 transition-all duration-300 flex items-center gap-2 whitespace-nowrap";
      } else {
        targetBtn.className = "px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold tracking-wide shadow-[0_0_15px_rgba(168,85,247,0.35)] border border-purple-500/25 transition-all duration-300 flex items-center gap-2 whitespace-nowrap";
      }

      state.activeCategory = targetBtn.getAttribute('data-category');
      renderGrid();
    });
  }

  // Handle Platform Filter tab switching
  if (platformFilterTabs) {
    platformFilterTabs.addEventListener('click', (e) => {
      const targetBtn = e.target.closest('button[data-platform]');
      if (!targetBtn) return;
      playSound('click');

      Array.from(platformFilterTabs.querySelectorAll('button')).forEach(btn => {
        btn.className = "px-2.5 py-1 bg-slate-900/60 hover:bg-slate-850 text-slate-400 hover:text-white border border-slate-800 rounded-lg whitespace-nowrap transition-all";
      });

      targetBtn.className = "px-2.5 py-1 bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 rounded-lg font-medium whitespace-nowrap transition-all";
      state.activePlatform = targetBtn.getAttribute('data-platform');
      renderGrid();
    });
  }

  // Handle Sorting Change
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      state.sortCriteria = e.target.value;
      renderGrid();
    });
  }

  // Modal Close Event Listeners
  if (modalClosed) modalClosed.addEventListener('click', closeModal);
  if (detailModal) {
    detailModal.addEventListener('click', (e) => {
      if (e.target === detailModal) closeModal();
    });
  }

  // Compare Modal Close Event Listeners
  if (compareClose) compareClose.addEventListener('click', closeCompareModal);
  if (compareModal) {
    compareModal.addEventListener('click', (e) => {
      if (e.target === compareModal) closeCompareModal();
    });
  }
  if (btnOpenCompare) {
    btnOpenCompare.addEventListener('click', () => {
      playSound('click');
      openCompareModal();
    });
  }

  // Close modals on escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
      closeCompareModal();
    }
  });

  // Share Card as Image (html2canvas)
  if (shareButton) {
    shareButton.addEventListener('click', async () => {
      const modalContent = document.getElementById('modal-card');
      if (!modalContent) return;
      
      const origHTML = shareButton.innerHTML;
      shareButton.innerHTML = `<i class="fa-solid fa-spinner animate-spin text-purple-400"></i> Rendering...`;
      
      try {
        const canvas = await html2canvas(modalContent, {
          backgroundColor: '#030712',
          scale: 2
        });
        
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `TrendPulse_${activeModalTrend?.title.replace(/[^a-z0-9]/gi, '_') || 'Export'}.png`;
        link.href = dataUrl;
        link.click();
        
        shareButton.innerHTML = `<i class="fa-solid fa-check text-emerald-400"></i> Saved!`;
      } catch (err) {
        console.error("Export failed", err);
        shareButton.innerHTML = `<i class="fa-solid fa-xmark text-red-400"></i> Failed`;
      }
      
      setTimeout(() => {
        shareButton.innerHTML = origHTML;
      }, 2000);
    });
  }

  // Share formatted Tweet to X
  if (modalShareX) {
    modalShareX.addEventListener('click', () => {
      if (!activeModalTrend) return;
      const text = `🔥 "${activeModalTrend.title}" is surging at ${activeModalTrend.growth} growth!\n📈 Category: ${activeModalTrend.category}\n🌐 Platform: ${activeModalTrend.platform}\n\nTracked via TrendPulse #TrendPulse #CultureMetrics`;
      
      navigator.clipboard.writeText(text).then(() => {
        modalShareX.innerHTML = `<i class="fa-solid fa-check text-emerald-400"></i> Copied!`;
        setTimeout(() => {
          modalShareX.innerHTML = `<i class="fa-brands fa-x-twitter"></i> Copy Tweet`;
        }, 2000);
      });

      // Also open Twitter intent
      const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
      window.open(tweetUrl, '_blank', 'noopener,noreferrer');
    });
  }

  // Export JSON file for researchers
  if (modalExportJson) {
    modalExportJson.addEventListener('click', () => {
      if (!activeModalTrend) return;
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activeModalTrend, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `trend_${activeModalTrend.id}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      
      modalExportJson.innerHTML = `<i class="fa-solid fa-check text-emerald-400"></i> Saved!`;
      setTimeout(() => {
        modalExportJson.innerHTML = `<i class="fa-solid fa-download"></i> JSON`;
      }, 2000);
    });
  }

  // Listen for Notification clicks and map pin clicks
  document.addEventListener('openTrendModal', (e) => {
    openModal(e.detail);
  });
}

// Modal Control: Open and Load Dynamic Stats
function openModal(trendId) {
  const trend = state.trendsData.find(t => t.id === trendId);
  if (!trend) return;
  activeModalTrend = trend;

  const theme = accentTheme[trend.category] || defaultTheme;

  // Update contents
  document.getElementById('modal-category').textContent = trend.category;
  document.getElementById('modal-category').className = `px-3 py-1 text-xs font-bold rounded-lg uppercase tracking-wider ${theme.badge}`;
  
  const platIcon = getPlatformIcon(trend.platform);
  document.getElementById('modal-platform').innerHTML = `<i class="${platIcon}"></i> Platform: ${trend.platform}`;
  document.getElementById('modal-title').textContent = trend.title;
  document.getElementById('modal-description').textContent = trend.description;
  
  document.getElementById('modal-growth').textContent = trend.growth;
  document.getElementById('modal-volume').textContent = trend.volume;
  document.getElementById('modal-sentiment').textContent = trend.sentiment;
  document.getElementById('modal-duration').textContent = trend.trendDuration;

  // Direct source URL link
  if (modalSourceLink) {
    modalSourceLink.href = trend.url || '#';
    modalSourceLink.innerHTML = `<i class="fa-solid fa-arrow-up-right-from-square"></i> View on ${trend.platform}`;
  }

  // Draw SVG Sparkline Velocity Chart
  drawSparkline(trend.history);

  // Open Modal Animations
  detailModal.classList.remove('pointer-events-none', 'opacity-0');
  detailModal.classList.add('opacity-100');
  document.getElementById('modal-card').classList.remove('scale-95');
  document.getElementById('modal-card').classList.add('scale-100');
  document.body.style.overflow = 'hidden';
}

// Modal Control: Close
function closeModal() {
  detailModal.classList.add('opacity-0', 'pointer-events-none');
  detailModal.classList.remove('opacity-100');
  document.getElementById('modal-card').classList.add('scale-95');
  document.getElementById('modal-card').classList.remove('scale-100');
  document.body.style.overflow = 'auto';
  activeModalTrend = null;
}

// Render "Trend of the Week" Hero Section
function renderHero() {
  const heroTrend = state.trendsData.find(t => t.hero) || state.trendsData[0];
  if (!heroTrend || !heroContainer) return;

  const theme = accentTheme[heroTrend.category] || defaultTheme;

  heroContainer.innerHTML = `
    <div class="relative flex flex-col lg:flex-row items-stretch lg:items-center justify-between p-6 md:p-10 lg:p-12 gap-8 bg-slate-900/40 rounded-[23px] z-10 backdrop-blur-md">
      
      <!-- Content Left -->
      <div class="flex-1 space-y-4">
        <!-- Badges -->
        <div class="flex flex-wrap items-center gap-3">
          <span class="px-3.5 py-1 text-[10px] sm:text-xs font-black tracking-widest uppercase bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-full shadow-[0_0_15px_rgba(168,85,247,0.4)] border border-purple-400/30 animate-pulse">
            🔥 Trend of the Week
          </span>
          <span class="px-3 py-1 text-[10px] sm:text-xs font-bold rounded-lg uppercase tracking-wider ${theme.badge}">
            ${heroTrend.category}
          </span>
        </div>

        <!-- Title -->
        <h1 class="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight">
          ${heroTrend.title}
        </h1>

        <!-- Description -->
        <p class="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl font-light">
          ${heroTrend.description}
        </p>

        <!-- Metrics indicators -->
        <div class="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2 text-slate-400 text-xs sm:text-sm">
          <span class="flex items-center gap-2">
            <i class="fa-solid fa-chart-line text-emerald-400"></i>
            Weekly Spike: <strong class="text-emerald-400 font-bold">${heroTrend.growth}</strong>
          </span>
          <span class="w-1.5 h-1.5 rounded-full bg-slate-800 hidden sm:inline"></span>
          <span class="flex items-center gap-2">
            <i class="${getPlatformIcon(heroTrend.platform)} text-cyan-400"></i>
            Primary Source: <strong class="text-white">${heroTrend.platform}</strong>
          </span>
          <span class="w-1.5 h-1.5 rounded-full bg-slate-800 hidden sm:inline"></span>
          <a href="${heroTrend.url}" target="_blank" rel="noopener noreferrer" class="text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1.5">
            <i class="fa-solid fa-arrow-up-right-from-square text-xs"></i> Visit Source Feed
          </a>
        </div>
      </div>

      <!-- Interaction Right -->
      <div class="lg:w-80 flex flex-col justify-center gap-4 p-6 bg-slate-950/70 border border-slate-800/80 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
        <h3 class="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center justify-between">
          Real-Time Metrics <span>LIVE <span class="h-2 w-2 rounded-full bg-emerald-500 inline-block ml-1 animate-ping"></span></span>
        </h3>
        
        <div class="space-y-3">
          <div>
            <span class="text-[10px] text-slate-500 font-bold uppercase block tracking-wider">Algorithmic Sentiment</span>
            <span class="text-sm font-extrabold text-white flex items-center gap-2 mt-0.5">
              <i class="fa-solid fa-wand-magic-sparkles text-purple-400"></i>
              ${heroTrend.sentiment}
            </span>
          </div>
          <div class="w-full h-px bg-slate-850"></div>
          <div>
            <span class="text-[10px] text-slate-500 font-bold uppercase block tracking-wider">Trend Duration Index</span>
            <span class="text-sm font-extrabold text-cyan-400 text-glow-cyan flex items-center gap-2 mt-0.5">
              <i class="fa-solid fa-hourglass-half animate-spin text-cyan-400 text-xs" style="animation-duration: 10s"></i>
              ${heroTrend.trendDuration}
            </span>
          </div>
        </div>

        <!-- Buttons -->
        <div class="grid grid-cols-2 gap-2 mt-2">
          <button 
            id="btn-hero-analyze"
            class="py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs tracking-wide rounded-xl shadow-[0_4px_15px_rgba(168,85,247,0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
          >
            <i class="fa-solid fa-chart-pie"></i> Inspect
          </button>
          <button 
            id="btn-hero-compare"
            class="py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 hover:text-white font-bold text-xs tracking-wide rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
          >
            <i class="fa-solid fa-code-compare text-cyan-400"></i> Compare
          </button>
        </div>
      </div>

    </div>
  `;

  const heroAnalyze = document.getElementById('btn-hero-analyze');
  if (heroAnalyze) {
    heroAnalyze.onclick = () => openModal(heroTrend.id);
  }
  const heroCompare = document.getElementById('btn-hero-compare');
  if (heroCompare) {
    heroCompare.onclick = () => openCompareModal(heroTrend.id);
  }
}

// Render Multi-column responsive grid
export function renderGrid() {
  if (!trendsGrid) return;

  // 1. Filter Data
  let filtered = state.trendsData;

  // Category Pill filter
  if (state.activeCategory === 'watchlist') {
    filtered = filtered.filter(t => state.bookmarks.includes(t.id));
  } else if (state.activeCategory !== 'all') {
    filtered = filtered.filter(t => t.category === state.activeCategory);
  }

  // Platform Filter
  if (state.activePlatform && state.activePlatform !== 'all') {
    const pf = state.activePlatform.toLowerCase();
    filtered = filtered.filter(t => {
      if (pf === 'custom') return t.isCustom === true;
      return (t.platform || '').toLowerCase().includes(pf);
    });
  }

  // Input Search filter
  if (state.searchQuery !== '') {
    filtered = filtered.filter(t => 
      t.title.toLowerCase().includes(state.searchQuery) ||
      t.category.toLowerCase().includes(state.searchQuery) ||
      t.description.toLowerCase().includes(state.searchQuery) ||
      (t.platform && t.platform.toLowerCase().includes(state.searchQuery))
    );
  }

  // 2. Sort Data
  filtered.sort((a, b) => {
    if (state.sortCriteria === 'growth-desc') {
      return (b.growthNumeric || 0) - (a.growthNumeric || 0);
    } else if (state.sortCriteria === 'growth-asc') {
      return (a.growthNumeric || 0) - (b.growthNumeric || 0);
    } else if (state.sortCriteria === 'alpha-asc') {
      return a.title.localeCompare(b.title);
    }
    return 0;
  });

  // 3. Render output
  trendsGrid.innerHTML = '';
  
  if (filtered.length === 0) {
    if (state.activeCategory === 'watchlist') {
      trendsGrid.innerHTML = `
        <div class="col-span-full py-16 text-center text-slate-500 bg-slate-900/25 border border-slate-800/50 rounded-3xl">
          <i class="fa-solid fa-heart-crack text-4xl mb-4 text-pink-500/60 animate-bounce"></i>
          <h4 class="text-sm font-bold text-slate-300">Your Watchlist is Empty</h4>
          <p class="text-xs text-slate-400 mt-1 max-w-xs mx-auto">Click the heart button on standard trend cards to track them in real-time here!</p>
        </div>
      `;
      noResultsDiv.classList.add('hidden');
    } else {
      noResultsDiv.classList.remove('hidden');
    }
    return;
  } else {
    noResultsDiv.classList.add('hidden');
  }

  filtered.forEach((trend, idx) => {
    const theme = accentTheme[trend.category] || defaultTheme;
    const iconClass = theme.icon || 'fa-hashtag';
    const cardElement = document.createElement('div');
    const isBookmarked = state.bookmarks.includes(trend.id);
    const miniSparklineHtml = renderMiniSparklineSVG(trend.history, theme.strokeColor);
    
    cardElement.className = `group card-enter relative flex flex-col justify-between p-5 bg-slate-900/40 rounded-2xl border ${theme.border} ${theme.borderHover} ${theme.glow} transition-all duration-300 hover:-translate-y-2 cursor-pointer`;
    cardElement.dataset.id = trend.id;

    // Card Internal HTML
    cardElement.innerHTML = `
      <div>
        <!-- Bookmark & Action buttons overlay -->
        <div class="absolute top-4 right-4 flex items-center gap-1.5 z-10">
          <button class="compare-card-btn text-slate-500 hover:text-cyan-400 hover:scale-110 active:scale-95 transition-all p-1.5 bg-slate-950/40 hover:bg-slate-950/90 rounded-lg border border-slate-800/60" data-id="${trend.id}" title="Compare with another trend">
            <i class="fa-solid fa-code-compare text-xs"></i>
          </button>
          <button class="bookmark-btn text-slate-500 hover:text-pink-500 hover:scale-110 active:scale-95 transition-all p-1.5 bg-slate-950/40 hover:bg-slate-950/90 rounded-lg border border-slate-800/60" data-id="${trend.id}" title="Add to watchlist">
            <i class="${isBookmarked ? 'fa-solid text-pink-500 heart-burst' : 'fa-regular'} fa-heart text-xs"></i>
          </button>
        </div>

        <!-- Category, Mini-Sparkline, and Growth Header -->
        <div class="flex items-center justify-between gap-2 mb-3 pr-16">
          <span class="px-2.5 py-0.5 text-[10px] font-bold rounded-lg tracking-wider uppercase ${theme.badge}">
            <i class="fa-solid ${iconClass} text-[9px] mr-1"></i> ${trend.category}
          </span>
          <span class="px-2 py-0.5 text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/40 rounded-full flex items-center gap-1 shadow-[0_0_10px_rgba(16,185,129,0.15)]">
            <i class="fa-solid fa-arrow-trend-up text-[9px]"></i> ${trend.growth}
          </span>
        </div>

        <!-- Title -->
        <h3 class="text-base sm:text-lg font-bold text-white group-hover:text-purple-400 transition-colors duration-200 leading-snug line-clamp-1 mb-2">
          ${trend.title}
        </h3>

        <!-- Description / Origin -->
        <p class="text-xs sm:text-sm text-slate-400 leading-relaxed font-light line-clamp-3 mb-4">
          ${trend.description}
        </p>
      </div>

      <!-- Bottom: Inline Velocity Sparkline, Source & Analyze Action -->
      <div class="pt-3 border-t border-slate-800/60 mt-2 space-y-2">
        <div class="flex items-center justify-between gap-2">
          <span class="text-[10px] font-mono text-slate-500 flex items-center gap-1">
            <i class="fa-solid fa-wave-square text-[9px] text-purple-400"></i> Velocity:
          </span>
          ${miniSparklineHtml}
        </div>

        <div class="flex items-center justify-between pt-1">
          <a 
            href="${trend.url || '#'}" 
            target="_blank" 
            rel="noopener noreferrer" 
            class="source-link-btn text-[11px] text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-1" 
            title="Open direct viral source feed"
          >
            <i class="${getPlatformIcon(trend.platform)} text-xs"></i>
            <span class="max-w-[110px] truncate">${trend.platform}</span>
            <i class="fa-solid fa-arrow-up-right-from-square text-[8px] opacity-70"></i>
          </a>

          <div class="flex items-center gap-2">
            ${trend.isCustom ? `
              <button class="delete-custom-btn text-slate-600 hover:text-red-400 text-xs transition-colors p-1" data-id="${trend.id}">
                <i class="fa-regular fa-trash-can"></i>
              </button>
            ` : ''}
            <span class="text-[11px] text-slate-300 group-hover:text-purple-400 transition-colors font-semibold flex items-center gap-1">
              Analyze <i class="fa-solid fa-chevron-right text-[8px] group-hover:translate-x-0.5 transition-transform"></i>
            </span>
          </div>
        </div>
      </div>
    `;

    // Click on card opens analytics details
    cardElement.addEventListener('click', () => openModal(trend.id));
    
    // Heart/Bookmark button handler
    const bookmarkBtn = cardElement.querySelector('.bookmark-btn');
    bookmarkBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      playSound('click');
      toggleBookmark(trend.id, renderGrid);
    });

    // Compare button handler
    const compareBtn = cardElement.querySelector('.compare-card-btn');
    if (compareBtn) {
      compareBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        playSound('click');
        openCompareModal(trend.id);
      });
    }

    // Direct Source link click shouldn't trigger modal
    const sourceLinkBtn = cardElement.querySelector('.source-link-btn');
    if (sourceLinkBtn) {
      sourceLinkBtn.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }

    // Delete custom trend handler
    if (trend.isCustom) {
      const deleteBtn = cardElement.querySelector('.delete-custom-btn');
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        playSound('incorrect');
        deleteCustomTrend(trend.id, renderGrid);
      });
    }
    
    trendsGrid.appendChild(cardElement);
    
    setTimeout(() => {
      cardElement.classList.add('card-enter-active');
    }, idx * 25);
  });
}

// Compare Modal Implementation
function setupCompareModal() {
  if (!compareSelectA || !compareSelectB) return;

  const populateOptions = (selectEl, selectedId) => {
    selectEl.innerHTML = '';
    state.trendsData.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = `[${t.category}] ${t.title}`;
      if (t.id === selectedId) opt.selected = true;
      selectEl.appendChild(opt);
    });
  };

  const defaultIdA = state.trendsData[0]?.id || '1';
  const defaultIdB = state.trendsData[1]?.id || '2';

  populateOptions(compareSelectA, defaultIdA);
  populateOptions(compareSelectB, defaultIdB);

  compareSelectA.addEventListener('change', updateCompareView);
  compareSelectB.addEventListener('change', updateCompareView);
}

function openCompareModal(preselectedId = null) {
  if (!compareModal || !compareCard) return;
  setupCompareModal();

  if (preselectedId && compareSelectA) {
    compareSelectA.value = preselectedId;
    if (compareSelectB && compareSelectB.value === preselectedId) {
      const alt = state.trendsData.find(t => t.id !== preselectedId);
      if (alt) compareSelectB.value = alt.id;
    }
  }

  updateCompareView();

  compareModal.classList.remove('opacity-0', 'pointer-events-none');
  compareModal.classList.add('opacity-100');
  compareCard.classList.remove('scale-95');
  compareCard.classList.add('scale-100');
  document.body.style.overflow = 'hidden';
}

function closeCompareModal() {
  if (!compareModal || !compareCard) return;
  compareModal.classList.add('opacity-0', 'pointer-events-none');
  compareModal.classList.remove('opacity-100');
  compareCard.classList.add('scale-95');
  compareCard.classList.remove('scale-100');
  document.body.style.overflow = 'auto';
}

function updateCompareView() {
  const idA = compareSelectA.value;
  const idB = compareSelectB.value;
  const trendA = state.trendsData.find(t => t.id === idA);
  const trendB = state.trendsData.find(t => t.id === idB);
  if (!trendA || !trendB) return;

  // Stats Card A
  compareStatsA.innerHTML = `
    <div class="flex items-center justify-between">
      <span class="text-slate-400">Growth:</span>
      <strong class="text-emerald-400">${trendA.growth}</strong>
    </div>
    <div class="flex items-center justify-between">
      <span class="text-slate-400">Volume:</span>
      <strong class="text-white">${trendA.volume}</strong>
    </div>
    <div class="flex items-center justify-between">
      <span class="text-slate-400">Platform:</span>
      <strong class="text-purple-300">${trendA.platform}</strong>
    </div>
    <div class="flex items-center justify-between">
      <span class="text-slate-400">Sentiment:</span>
      <strong class="text-slate-200">${trendA.sentiment}</strong>
    </div>
  `;

  // Stats Card B
  compareStatsB.innerHTML = `
    <div class="flex items-center justify-between">
      <span class="text-slate-400">Growth:</span>
      <strong class="text-emerald-400">${trendB.growth}</strong>
    </div>
    <div class="flex items-center justify-between">
      <span class="text-slate-400">Volume:</span>
      <strong class="text-white">${trendB.volume}</strong>
    </div>
    <div class="flex items-center justify-between">
      <span class="text-slate-400">Platform:</span>
      <strong class="text-cyan-300">${trendB.platform}</strong>
    </div>
    <div class="flex items-center justify-between">
      <span class="text-slate-400">Sentiment:</span>
      <strong class="text-slate-200">${trendB.sentiment}</strong>
    </div>
  `;

  // Draw shared dual chart
  drawComparisonChart(trendA, trendB);

  // Takeaway winner
  const valA = trendA.growthNumeric || 0;
  const valB = trendB.growthNumeric || 0;
  if (valA > valB) {
    const diff = Math.round(((valA - valB) / Math.max(valB, 1)) * 100);
    compareWinnerBanner.innerHTML = `👑 <strong class="text-purple-400">${trendA.title}</strong> leads momentum with higher velocity (+${diff}% ahead).`;
  } else if (valB > valA) {
    const diff = Math.round(((valB - valA) / Math.max(valA, 1)) * 100);
    compareWinnerBanner.innerHTML = `👑 <strong class="text-cyan-400">${trendB.title}</strong> leads momentum with higher velocity (+${diff}% ahead).`;
  } else {
    compareWinnerBanner.innerHTML = `🤝 Both trends share equal velocity parameters.`;
  }
}

// Callback: focus filter tabs and scroll back to matching category
function focusCategoryAndScroll(categoryName) {
  const correspondingTab = Array.from(filterTabsContainer.querySelectorAll('button[data-category]'))
    .find(btn => btn.getAttribute('data-category') === categoryName);
    
  if (correspondingTab) {
    correspondingTab.click();
  }
}
