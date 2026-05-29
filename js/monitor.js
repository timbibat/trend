import { playSound } from './state.js';

let isScanning = true;
let scanIntervalId = null;

const sampleLogs = [
  { type: 'SCAN', msg: 'Crawling TikTok Audio Library IDs for "Synth Nostalgia"...' },
  { type: 'SCAN', msg: 'Reading Reddit JSON hot feeds for conversational keywords...' },
  { type: 'SPIKE', msg: 'Algorithm spike: "Mayo Clinic" searches surged 4.2x in 6 hours.' },
  { type: 'FLOW', msg: 'Ingesting 1,480 tokens/sec into Digital Anthropological Metrics Engine.' },
  { type: 'SYSTEM', msg: 'Local Watchlist persistent localStorage sync complete.' },
  { type: 'SPIKE', msg: 'Spike detected: Gaming category volume surged +15%.' },
  { type: 'SCAN', msg: 'Parsing Google RSS Geo-US trend indices...' },
  { type: 'FLOW', msg: 'Direct memory buffer consumption stable at 24.5 MB.' },
  { type: 'ALERT', msg: 'Critical velocity cluster found on "AI Slop" memes.' },
  { type: 'SYSTEM', msg: 'Algorithmic sentiment coefficients recalibrated.' }
];

export function startScanMonitor() {
  const scanTerminal = document.getElementById('scan-terminal');
  const scanToggleBtn = document.getElementById('scan-toggle');
  const scanToggleIcon = document.getElementById('scan-toggle-icon');
  
  if (!scanTerminal) return;

  function addScanLog() {
    const log = sampleLogs[Math.floor(Math.random() * sampleLogs.length)];
    const time = new Date().toLocaleTimeString();
    const logEl = document.createElement('div');
    logEl.className = 'log-enter text-[10px] leading-relaxed';
    
    let colorClass = 'text-cyan-400';
    if (log.type === 'SPIKE') colorClass = 'text-emerald-400 font-bold text-glow-emerald';
    if (log.type === 'ALERT') colorClass = 'text-pink-500 font-bold text-glow-pink';
    if (log.type === 'SYSTEM') colorClass = 'text-purple-400 text-glow-purple';
    if (log.type === 'FLOW') colorClass = 'text-amber-400';
    
    logEl.innerHTML = `<span class="text-slate-600 font-mono">[${time}]</span> <span class="${colorClass}">${log.type}</span>: ${log.msg}`;
    
    scanTerminal.appendChild(logEl);
    scanTerminal.scrollTop = scanTerminal.scrollHeight;
    
    // Cap lines
    while (scanTerminal.children.length > 50) {
      scanTerminal.removeChild(scanTerminal.firstChild);
    }
  }

  // Pre-seed some logs
  for (let i = 0; i < 4; i++) {
    addScanLog();
  }

  // Set running logs interval
  if (scanIntervalId) clearInterval(scanIntervalId);
  scanIntervalId = setInterval(() => {
    if (isScanning) {
      addScanLog();
    }
  }, 4000);

  // Bind toggle action
  if (scanToggleBtn) {
    // Remove potential duplicate event listeners
    const newToggleBtn = scanToggleBtn.cloneNode(true);
    scanToggleBtn.parentNode.replaceChild(newToggleBtn, scanToggleBtn);
    
    newToggleBtn.addEventListener('click', () => {
      isScanning = !isScanning;
      playSound('click');
      const icon = document.getElementById('scan-toggle-icon');
      if (icon) {
        icon.className = isScanning ? 'fa-solid fa-pause text-[8px]' : 'fa-solid fa-play text-[8px]';
      }
      if (isScanning) {
        addScanLog();
      }
    });
  }
}
