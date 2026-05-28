// Constants & Global State
let trendsData = [];
let activeCategory = 'all';
let searchQuery = '';
let sortCriteria = 'growth-desc';

// Tailwind accent map matching categories
const accentTheme = {
  'Tech & AI': {
    border: 'border-purple-500/20',
    borderHover: 'hover:border-purple-500/50',
    badge: 'bg-purple-950 text-purple-300 border-purple-800/40',
    glow: 'hover:shadow-[0_15px_30px_-10px_rgba(168,85,247,0.25)]',
    colorClass: 'brand-purple',
    icon: 'fa-microchip'
  },
  'Pop Culture': {
    border: 'border-pink-500/20',
    borderHover: 'hover:border-pink-500/50',
    badge: 'bg-pink-950 text-pink-300 border-pink-800/40',
    glow: 'hover:shadow-[0_15px_30px_-10px_rgba(236,72,153,0.25)]',
    colorClass: 'brand-pink',
    icon: 'fa-compact-disc'
  },
  'Gaming': {
    border: 'border-cyan-500/20',
    borderHover: 'hover:border-cyan-500/50',
    badge: 'bg-cyan-950 text-cyan-300 border-cyan-800/40',
    glow: 'hover:shadow-[0_15px_30px_-10px_rgba(6,182,212,0.25)]',
    colorClass: 'brand-cyan',
    icon: 'fa-gamepad'
  },
  'Memes': {
    border: 'border-emerald-500/20',
    borderHover: 'hover:border-emerald-500/50',
    badge: 'bg-emerald-950 text-emerald-300 border-emerald-800/40',
    glow: 'hover:shadow-[0_15px_30px_-10px_rgba(16,185,129,0.25)]',
    colorClass: 'brand-emerald',
    icon: 'fa-face-laugh-squint'
  },
  'Web Lore': {
    border: 'border-amber-500/20',
    borderHover: 'hover:border-amber-500/50',
    badge: 'bg-amber-950 text-amber-300 border-amber-800/40',
    glow: 'hover:shadow-[0_15px_30px_-10px_rgba(245,158,11,0.25)]',
    colorClass: 'brand-amber',
    icon: 'fa-book-open'
  }
};

// Fallback template configurations
const defaultTheme = {
  border: 'border-slate-800',
  borderHover: 'hover:border-slate-700',
  badge: 'bg-slate-900 text-slate-300 border-slate-700',
  glow: 'hover:shadow-2xl',
  colorClass: 'slate-300',
  icon: 'fa-hashtag'
};

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
});

// Fetch and Load JSON Data
async function loadTrends() {
  try {
    const response = await fetch('data/data.json');
    if (!response.ok) {
      throw new Error(`Data fetch failed with status: ${response.status}`);
    }
    trendsData = await response.json();
    
    // Render Dashboard components
    renderHero();
    renderGrid();
  } catch (error) {
    console.error("Critical Dashboard Error:", error);
    heroContainer.innerHTML = `
      <div class="p-8 text-center text-red-400 bg-slate-900/60 rounded-3xl border border-red-500/30">
        <i class="fa-solid fa-triangle-exclamation text-3xl mb-3"></i>
        <h3 class="font-bold text-lg text-white">Database Synchronization Failed</h3>
        <p class="text-sm text-slate-400 mt-1 max-w-md mx-auto">
          Please host this directory using a local web server (e.g. VS Code Live Server, python http, or npm http-server) so index.html can fetch data.json.
        </p>
      </div>
    `;
    trendsGrid.innerHTML = `
      <div class="col-span-full py-16 text-center text-slate-500 bg-slate-900/25 border border-slate-800/50 rounded-3xl">
        <i class="fa-solid fa-cloud-slash text-4xl mb-4 text-slate-700"></i>
        <p>A CORS or loading issue occurred. Run a local web server to dynamically see current culture cards.</p>
      </div>
    `;
  }
}

// Set Up Interactive Page Event Listeners
function setupEventListeners() {
  // Keyup search with instant rendering
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    renderGrid();
  });

  // Keyboard Shortcut listener (focus search input on '/' or '⌘K')
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== searchInput) {
      e.preventDefault();
      searchInput.focus();
      searchInput.select();
    }
  });

  // Handle Category Filter tab switching
  filterTabsContainer.addEventListener('click', (e) => {
    const targetBtn = e.target.closest('button[data-category]');
    if (!targetBtn) return;

    // Reset previous active tabs styling
    Array.from(filterTabsContainer.querySelectorAll('button')).forEach(btn => {
      btn.className = "px-4 py-2 bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800/80 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2 whitespace-nowrap";
    });

    // Set clicked tab to selected style
    targetBtn.className = "px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold tracking-wide shadow-[0_0_15px_rgba(168,85,247,0.35)] border border-purple-500/25 transition-all duration-300 flex items-center gap-2 whitespace-nowrap";

    activeCategory = targetBtn.getAttribute('data-category');
    renderGrid();
  });

  // Handle Sorting Change
  sortSelect.addEventListener('change', (e) => {
    sortCriteria = e.target.value;
    renderGrid();
  });

  // Modal Close Event Listeners
  modalClosed.addEventListener('click', closeModal);
  detailModal.addEventListener('click', (e) => {
    if (e.target === detailModal) closeModal();
  });

  // Close modal on escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // Share confirmation toast
  shareButton.addEventListener('click', () => {
    const shareTitle = document.getElementById('modal-title').textContent;
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(`Trending now on TrendPulse: ${shareTitle} - Check stats at ${currentUrl}`)
      .then(() => {
        const origHTML = shareButton.innerHTML;
        shareButton.innerHTML = `<i class="fa-solid fa-check text-emerald-400"></i> Copied!`;
        shareButton.classList.add('border-emerald-500/50');
        setTimeout(() => {
          shareButton.innerHTML = origHTML;
          shareButton.classList.remove('border-emerald-500/50');
        }, 2000);
      })
      .catch(err => {
        console.error("Unable to copy share content", err);
      });
  });
}

// Modal Control: Open and Load Dynamic Stats
function openModal(trendId) {
  const trend = trendsData.find(t => t.id === trendId);
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
  const heroTrend = trendsData.find(t => t.hero) || trendsData[0];
  if (!heroTrend) return;

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
          onclick="openModal('${heroTrend.id}')"
          class="w-full mt-2 py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold text-sm tracking-wide rounded-xl shadow-[0_4px_20px_rgba(168,85,247,0.3)] hover:shadow-[0_6px_25px_rgba(6,182,212,0.4)] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
        >
          <i class="fa-solid fa-chart-pie"></i> Analyze Trend Architecture
        </button>
      </div>

    </div>
  `;
}

// Render Multi-column responsive grid
function renderGrid() {
  // 1. Filter Data
  let filtered = trendsData;

  // Category Pill filter
  if (activeCategory !== 'all') {
    filtered = filtered.filter(t => t.category === activeCategory);
  }

  // Input Search filter
  if (searchQuery !== '') {
    filtered = filtered.filter(t => 
      t.title.toLowerCase().includes(searchQuery) ||
      t.category.toLowerCase().includes(searchQuery) ||
      t.description.toLowerCase().includes(searchQuery)
    );
  }

  // 2. Sort Data
  filtered.sort((a, b) => {
    if (sortCriteria === 'growth-desc') {
      return b.growthNumeric - a.growthNumeric;
    } else if (sortCriteria === 'growth-asc') {
      return a.growthNumeric - b.growthNumeric;
    } else if (sortCriteria === 'alpha-asc') {
      return a.title.localeCompare(b.title);
    }
    return 0;
  });

  // 3. Render output
  trendsGrid.innerHTML = '';
  
  if (filtered.length === 0) {
    noResultsDiv.classList.remove('hidden');
    return;
  } else {
    noResultsDiv.classList.add('hidden');
  }

  filtered.forEach((trend, idx) => {
    const theme = accentTheme[trend.category] || defaultTheme;
    const iconClass = theme.icon || 'fa-hashtag';
    const cardElement = document.createElement('div');
    
    cardElement.className = `group card-enter relative flex flex-col justify-between p-5 bg-slate-900/40 rounded-2xl border ${theme.border} ${theme.borderHover} ${theme.glow} transition-all duration-300 hover:-translate-y-2 cursor-pointer`;
    cardElement.dataset.id = trend.id;

    // Set card internal HTML
    cardElement.innerHTML = `
      <div>
        <!-- Category and Growth Header -->
        <div class="flex items-center justify-between gap-2 mb-4">
          <span class="px-2.5 py-0.5 text-[10px] font-bold rounded-lg tracking-wider uppercase ${theme.badge}">
            <i class="fa-solid ${iconClass} text-[9px] mr-1"></i> ${trend.category}
          </span>
          <span class="px-2 py-0.5 text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/40 rounded-full flex items-center gap-1 shadow-[0_0_10px_rgba(16,185,129,0.15)]">
            <i class="fa-solid fa-arrow-trend-up text-[9px]"></i> ${trend.growth}
          </span>
        </div>

        <!-- Title -->
        <h3 class="text-lg font-bold text-white group-hover:text-purple-400 transition-colors duration-200 leading-tight line-clamp-1 mb-2">
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
        <span class="text-[11px] text-slate-300 group-hover:text-purple-400 transition-colors font-semibold flex items-center gap-1">
          Analyze <i class="fa-solid fa-chevron-right text-[8px] group-hover:translate-x-0.5 transition-transform"></i>
        </span>
      </div>
    `;

    // Click handler to open analytics details
    cardElement.addEventListener('click', () => openModal(trend.id));
    
    trendsGrid.appendChild(cardElement);
    
    // Stagger animation entering grid cards
    setTimeout(() => {
      cardElement.classList.add('card-enter-active');
    }, idx * 40);
  });
}

// Render interactive SVG Sparkline Chart inside Modal
function drawSparkline(history) {
  const svg = document.getElementById('modal-chart-svg');
  const line = document.getElementById('chart-line');
  const area = document.getElementById('chart-area');
  
  const width = 500;
  const height = 100;
  const paddingX = 15;
  const paddingY = 10;
  
  const maxVal = Math.max(...history);
  const minVal = Math.min(...history);
  const range = maxVal - minVal || 1;
  
  const points = [];
  const len = history.length;
  
  for (let i = 0; i < len; i++) {
    // Calculate dynamic relative coordinates in grid bounds
    const x = paddingX + (i / (len - 1)) * (width - 2 * paddingX);
    const y = (height - paddingY) - ((history[i] - minVal) / range) * (height - 2 * paddingY);
    points.push({x, y});
  }
  
  // Form points string for polyline
  const linePointsStr = points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  line.setAttribute('points', linePointsStr);
  
  // Form points string for shaded area underneath (closes path at bottom)
  const areaPointsStr = `
    ${points[0].x.toFixed(1)},${height} 
    ${linePointsStr} 
    ${points[len - 1].x.toFixed(1)},${height}
  `;
  area.setAttribute('d', `M ` + areaPointsStr + ` Z`);

  // Add dynamic nodes/circles for value tooltips
  // Clear previous circles
  const oldCircles = svg.querySelectorAll('circle');
  oldCircles.forEach(c => c.remove());
  
  points.forEach((p, idx) => {
    // Highlight only initial start, high points, and peak (today)
    if (idx === 0 || idx === len - 1 || history[idx] === maxVal) {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', p.x.toFixed(1));
      circle.setAttribute('cy', p.y.toFixed(1));
      circle.setAttribute('r', idx === len - 1 ? '5' : '4');
      circle.setAttribute('fill', idx === len - 1 ? '#ec4899' : '#06b6d4');
      circle.setAttribute('stroke', '#030712');
      circle.setAttribute('stroke-width', '2');
      
      // Hover effect tooltip
      circle.classList.add('transition-all', 'duration-300', 'cursor-pointer', 'hover:r-6');
      svg.appendChild(circle);
    }
  });
}

// Helper: Map platform names to social media icons
function getPlatformIcon(platform) {
  const lower = platform.toLowerCase();
  if (lower.includes('tiktok')) return 'fa-brands fa-tiktok';
  if (lower.includes('twitter') || lower.includes('x ')) return 'fa-brands fa-x-twitter';
  if (lower.includes('reddit')) return 'fa-brands fa-reddit-alien';
  if (lower.includes('youtube')) return 'fa-brands fa-youtube';
  if (lower.includes('facebook')) return 'fa-brands fa-facebook-f';
  if (lower.includes('instagram')) return 'fa-brands fa-instagram';
  return 'fa-solid fa-share-nodes';
}
