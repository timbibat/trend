import { state, accentTheme, defaultTheme, rebuildTrendsDataset, playSound, getPlatformIcon } from './state.js';
import { toggleBookmark, deleteCustomTrend } from './watchlist.js';
import { startScanMonitor } from './monitor.js';
import { initGame } from './game.js';
import { setupSimulatorPreview } from './simulator.js';
import { drawSparkline } from './chart.js';
import { startNotificationSystem } from './notifications.js';
import { startMapSync } from './map.js';

// DOM Elements Cache
const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');
const filterTabsContainer = document.getElementById('filter-tabs');
const trendsGrid = document.getElementById('trends-grid');
const noResultsDiv = document.getElementById('no-results');
const heroContainer = document.getElementById('hero-container');
const detailModal = document.getElementById('detail-modal');
const modalClosed = document.getElementById('modal-close');
const shareButton = document.getElementById('modal-share');

// On Load Lifecycle
document.addEventListener('DOMContentLoaded', () => {
  loadTrends();
  setupEventListeners();
  startScanMonitor();
  
  // Initialize Simulator with callbacks to trigger grid re-rendering and tab focusing
  setupSimulatorPreview(renderGrid, focusCategoryAndScroll);

  // Initialize new features
  startNotificationSystem();
  startMapSync();
});

// Fetch and Load JSON Data
async function loadTrends() {
  try {
    const response = await fetch('data/data.json');
    if (!response.ok) {
      throw new Error(`Data fetch failed with status: ${response.status}`);
    }
    state.baseTrendsData = await response.json();
    
    // Merge standard trends with custom simulated trends
    rebuildTrendsDataset();
    
    // Render Dashboard components
    renderHero();
    renderGrid();
    
    // Initialize mini game
    initGame();
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
          <p>A CORS or loading issue occurred. Run a local web server to dynamically see current culture cards.</p>
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

  // Keyboard Shortcut listener (focus search input on '/' or '⌘K')
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== searchInput) {
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

  // Close modal on escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // Share confirmation toast / Image Export
  if (shareButton) {
    shareButton.addEventListener('click', async () => {
      const modalContent = document.getElementById('modal-card');
      if (!modalContent) return;
      
      const origHTML = shareButton.innerHTML;
      shareButton.innerHTML = `<i class="fa-solid fa-spinner animate-spin text-purple-400"></i> Rendering...`;
      
      try {
        const canvas = await html2canvas(modalContent, {
          backgroundColor: '#030712', // match dark theme
          scale: 2
        });
        
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `TrendPulse_Export_${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
        
        shareButton.innerHTML = `<i class="fa-solid fa-check text-emerald-400"></i> Exported!`;
        shareButton.classList.add('border-emerald-500/50');
      } catch (err) {
        console.error("Export failed", err);
        shareButton.innerHTML = `<i class="fa-solid fa-xmark text-red-400"></i> Failed`;
      }
      
      setTimeout(() => {
        shareButton.innerHTML = origHTML;
        shareButton.classList.remove('border-emerald-500/50');
      }, 2000);
    });
  }

  // Listen for Notification clicks
  document.addEventListener('openTrendModal', (e) => {
    openModal(e.detail);
  });
}

// Modal Control: Open and Load Dynamic Stats
function openModal(trendId) {
  const trend = state.trendsData.find(t => t.id === trendId);
  if (!trend) return;

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
}

// Render "Trend of the Week" Hero Section
function renderHero() {
  const heroTrend = state.trendsData.find(t => t.hero) || state.trendsData[0];
  if (!heroTrend || !heroContainer) return;

  const theme = accentTheme[heroTrend.category] || defaultTheme;

  heroContainer.innerHTML = `
    <!-- High-fidelity backdrop blur glow layout -->
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
          <span class="flex items-center gap-2 font-mono">
            <i class="fa-solid fa-arrow-trend-up text-purple-400"></i>
            ${heroTrend.volume}
          </span>
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

        <!-- Analyze Trigger button -->
        <button 
          id="btn-hero-analyze"
          class="w-full mt-2 py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold text-sm tracking-wide rounded-xl shadow-[0_4px_20px_rgba(168,85,247,0.3)] hover:shadow-[0_6px_25px_rgba(6,182,212,0.4)] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
        >
          <i class="fa-solid fa-chart-pie"></i> Analyze Trend Architecture
        </button>
      </div>

    </div>
  `;

  // Bind the analyze button in the hero dynamically
  const heroAnalyze = document.getElementById('btn-hero-analyze');
  if (heroAnalyze) {
    heroAnalyze.onclick = () => openModal(heroTrend.id);
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

  // Input Search filter
  if (state.searchQuery !== '') {
    filtered = filtered.filter(t => 
      t.title.toLowerCase().includes(state.searchQuery) ||
      t.category.toLowerCase().includes(state.searchQuery) ||
      t.description.toLowerCase().includes(state.searchQuery)
    );
  }

  // 2. Sort Data
  filtered.sort((a, b) => {
    if (state.sortCriteria === 'growth-desc') {
      return b.growthNumeric - a.growthNumeric;
    } else if (state.sortCriteria === 'growth-asc') {
      return a.growthNumeric - b.growthNumeric;
    } else if (state.sortCriteria === 'alpha-asc') {
      return a.title.localeCompare(b.title);
    }
    return 0;
  });

  // 3. Render output
  trendsGrid.innerHTML = '';
  
  if (filtered.length === 0) {
    if (state.activeCategory === 'watchlist') {
      // Custom Watchlist Empty Blank State
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
    
    cardElement.className = `group card-enter relative flex flex-col justify-between p-5 bg-slate-900/40 rounded-2xl border ${theme.border} ${theme.borderHover} ${theme.glow} transition-all duration-300 hover:-translate-y-2 cursor-pointer`;
    cardElement.dataset.id = trend.id;

    // Set card internal HTML
    cardElement.innerHTML = `
      <div>
        <!-- Bookmark absolute overlay action button -->
        <button class="bookmark-btn absolute top-5 right-5 text-slate-500 hover:text-pink-500 hover:scale-110 active:scale-95 transition-all z-10 p-1 bg-slate-950/40 hover:bg-slate-950/80 rounded-lg border border-slate-800/60" data-id="${trend.id}">
          <i class="${isBookmarked ? 'fa-solid text-pink-500 heart-burst' : 'fa-regular'} fa-heart"></i>
        </button>

        <!-- Category and Growth Header -->
        <div class="flex items-center justify-between gap-2 mb-4">
          <span class="px-2.5 py-0.5 text-[10px] font-bold rounded-lg tracking-wider uppercase ${theme.badge}">
            <i class="fa-solid ${iconClass} text-[9px] mr-1"></i> ${trend.category}
          </span>
          <span class="px-2 py-0.5 text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/40 rounded-full flex items-center gap-1 shadow-[0_0_10px_rgba(16,185,129,0.15)] pr-8 sm:pr-2">
            <i class="fa-solid fa-arrow-trend-up text-[9px]"></i> ${trend.growth}
          </span>
        </div>

        <!-- Title -->
        <h3 class="text-lg font-bold text-white group-hover:text-purple-400 transition-colors duration-200 leading-tight line-clamp-1 mb-2 pr-8">
          ${trend.title}
        </h3>

        <!-- Description / Origin -->
        <p class="text-xs sm:text-sm text-slate-400 leading-relaxed font-light line-clamp-3 mb-4">
          ${trend.description}
        </p>
      </div>

      <!-- Bottom Indicators and Analyze Button -->
      <div class="pt-4 border-t border-slate-800/60 mt-2 flex items-center justify-between">
        <span class="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
          <i class="${getPlatformIcon(trend.platform)} text-slate-400 text-xs"></i>
          ${trend.platform}
        </span>
        <div class="flex items-center gap-3">
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
    `;

    // Click handler to open analytics details
    cardElement.addEventListener('click', () => openModal(trend.id));
    
    // Heart/Bookmark button handler
    const bookmarkBtn = cardElement.querySelector('.bookmark-btn');
    bookmarkBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      playSound('click');
      toggleBookmark(trend.id, renderGrid);
    });

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
    
    // Stagger animation entering grid cards
    setTimeout(() => {
      cardElement.classList.add('card-enter-active');
    }, idx * 40);
  });
}

// Callback: focus filter tabs and scroll back to matching category
function focusCategoryAndScroll(categoryName) {
  const correspondingTab = Array.from(filterTabsContainer.querySelectorAll('button[data-category]'))
    .find(btn => btn.getAttribute('data-category') === categoryName);
    
  if (correspondingTab) {
    correspondingTab.click();
  }
}
