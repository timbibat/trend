// Central Global State Store
export const state = {
  baseTrendsData: [], // Standard parsed data.json trends
  trendsData: [],     // Merged active trends (custom + standard)
  activeCategory: 'all',
  searchQuery: '',
  sortCriteria: 'growth-desc',
  bookmarks: JSON.parse(localStorage.getItem('trendpulse_bookmarks')) || [],
  customTrends: JSON.parse(localStorage.getItem('trendpulse_custom_trends')) || []
};

// Web Audio Context for synthesized retro game sound FX
let audioCtx = null;

// Tailwind accent map matching categories
export const accentTheme = {
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
export const defaultTheme = {
  border: 'border-slate-800',
  borderHover: 'hover:border-slate-700',
  badge: 'bg-slate-900 text-slate-300 border-slate-700',
  glow: 'hover:shadow-2xl',
  colorClass: 'slate-300',
  icon: 'fa-hashtag'
};

// Merges standard trends and custom trends into the active state.trendsData array
export function rebuildTrendsDataset() {
  const parsedStandard = state.baseTrendsData.map(t => {
    t.isCustom = false;
    return t;
  });
  state.trendsData = [...state.customTrends, ...parsedStandard];
}

// Pure Web Audio Synthesizer sound waves generator
export function playSound(type) {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    const now = audioCtx.currentTime;
    if (type === 'correct') {
      // Ascending major chime chord
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
      osc.frequency.setValueAtTime(1046.50, now + 0.24); // C6
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === 'incorrect') {
      // Glissando drop buzz
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now); // A3
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.35); // E2
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === 'click') {
      // Short blip
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'success') {
      // Majestic chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.3); // D6
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    }
  } catch (e) {
    console.warn("Audio Context synthesis unsupported/blocked by browser.", e);
  }
}

// Helper: Map platform names to social media icons
export function getPlatformIcon(platform) {
  const lower = platform.toLowerCase();
  if (lower.includes('tiktok')) return 'fa-brands fa-tiktok';
  if (lower.includes('twitter') || lower.includes('x ')) return 'fa-brands fa-x-twitter';
  if (lower.includes('reddit')) return 'fa-brands fa-reddit-alien';
  if (lower.includes('youtube')) return 'fa-brands fa-youtube';
  if (lower.includes('facebook')) return 'fa-brands fa-facebook-f';
  if (lower.includes('instagram')) return 'fa-brands fa-instagram';
  return 'fa-solid fa-share-nodes';
}
