let modalSparklinePoints = [];
let modalSparklineHistory = [];

// Draws dynamic sparkline chart inside Details Modal
export function drawSparkline(history) {
  const svg = document.getElementById('modal-chart-svg');
  const line = document.getElementById('chart-line');
  const area = document.getElementById('chart-area');
  
  if (!svg || !line || !area) return;

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
    const x = paddingX + (i / (len - 1)) * (width - 2 * paddingX);
    const y = (height - paddingY) - ((history[i] - minVal) / range) * (height - 2 * paddingY);
    points.push({x, y});
  }
  
  // Cache internally
  modalSparklinePoints = points;
  modalSparklineHistory = history;
  
  // Form points string for polyline
  const linePointsStr = points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  line.setAttribute('points', linePointsStr);
  
  // Form points string for shaded area underneath
  const areaPointsStr = `
    ${points[0].x.toFixed(1)},${height} 
    ${linePointsStr} 
    ${points[len - 1].x.toFixed(1)},${height}
  `;
  area.setAttribute('d', `M ` + areaPointsStr + ` Z`);

  // Add dynamic nodes/circles for value tooltips
  const oldCircles = svg.querySelectorAll('circle:not(#chart-guide-circle)');
  oldCircles.forEach(c => c.remove());
  
  points.forEach((p, idx) => {
    if (idx === 0 || idx === len - 1 || history[idx] === maxVal) {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', p.x.toFixed(1));
      circle.setAttribute('cy', p.y.toFixed(1));
      circle.setAttribute('r', idx === len - 1 ? '5' : '4');
      circle.setAttribute('fill', idx === len - 1 ? '#ec4899' : '#06b6d4');
      circle.setAttribute('stroke', '#030712');
      circle.setAttribute('stroke-width', '2');
      circle.classList.add('transition-all', 'duration-300', 'cursor-pointer', 'hover:r-6');
      svg.appendChild(circle);
    }
  });

  // Reset guides
  const guideLine = document.getElementById('chart-guide-line');
  const guideCircle = document.getElementById('chart-guide-circle');
  const tooltip = document.getElementById('chart-tooltip');
  
  if (guideLine) guideLine.setAttribute('opacity', '0');
  if (guideCircle) guideCircle.setAttribute('opacity', '0');
  if (tooltip) tooltip.style.opacity = '0';
}

// Sparkline SVG mouse hover explorer guides
export function handleChartHover(e) {
  if (!modalSparklinePoints.length) return;
  
  const svg = document.getElementById('modal-chart-svg');
  const guideLine = document.getElementById('chart-guide-line');
  const guideCircle = document.getElementById('chart-guide-circle');
  const tooltip = document.getElementById('chart-tooltip');
  
  if (!svg || !guideLine || !guideCircle) return;

  const rect = svg.getBoundingClientRect();
  const scaleX = 500 / rect.width;
  
  const mouseX = (e.clientX - rect.left) * scaleX;
  
  let closestIdx = 0;
  let minDiff = Infinity;
  
  modalSparklinePoints.forEach((p, idx) => {
    const diff = Math.abs(p.x - mouseX);
    if (diff < minDiff) {
      minDiff = diff;
      closestIdx = idx;
    }
  });
  
  const activePt = modalSparklinePoints[closestIdx];
  const value = modalSparklineHistory[closestIdx];
  
  guideLine.setAttribute('x1', activePt.x.toFixed(1));
  guideLine.setAttribute('x2', activePt.x.toFixed(1));
  guideLine.setAttribute('opacity', '1');
  
  guideCircle.setAttribute('cx', activePt.x.toFixed(1));
  guideCircle.setAttribute('cy', activePt.y.toFixed(1));
  guideCircle.setAttribute('opacity', '1');
  
  if (tooltip) {
    const dayLabel = closestIdx === modalSparklineHistory.length - 1 ? 'Today (Peak)' : `Day ${closestIdx + 1}`;
    tooltip.innerHTML = `<strong class="text-cyan-400">${dayLabel}</strong>: +${value.toLocaleString()}% growth`;
    tooltip.style.opacity = '1';
    
    const tooltipWidth = tooltip.offsetWidth;
    const tooltipX = (activePt.x / 500) * rect.width - (tooltipWidth / 2);
    const tooltipY = (activePt.y / 100) * rect.height - 35;
    
    tooltip.style.left = `${tooltipX}px`;
    tooltip.style.top = `${tooltipY}px`;
  }
}

// Sparkline SVG mouse leave reset
export function handleChartHoverLeave() {
  const guideLine = document.getElementById('chart-guide-line');
  const guideCircle = document.getElementById('chart-guide-circle');
  const tooltip = document.getElementById('chart-tooltip');
  
  if (guideLine) guideLine.setAttribute('opacity', '0');
  if (guideCircle) guideCircle.setAttribute('opacity', '0');
  if (tooltip) tooltip.style.opacity = '0';
}

// Generates lightweight SVG mini-sparkline directly embedded in each dashboard card
export function renderMiniSparklineSVG(history = [], strokeColor = '#a855f7') {
  if (!history || history.length < 2) return '';
  const width = 80;
  const height = 24;
  const pad = 2;
  
  const maxVal = Math.max(...history);
  const minVal = Math.min(...history);
  const range = maxVal - minVal || 1;
  
  const pts = history.map((val, i) => {
    const x = pad + (i / (history.length - 1)) * (width - 2 * pad);
    const y = (height - pad) - ((val - minVal) / range) * (height - 2 * pad);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  
  const lastPt = pts[pts.length - 1].split(',');

  return `
    <svg viewBox="0 0 ${width} ${height}" class="w-16 h-5 shrink-0 overflow-visible opacity-80 group-hover:opacity-100 transition-opacity" preserveAspectRatio="none">
      <polyline fill="none" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" points="${pts.join(' ')}" />
      <circle cx="${lastPt[0]}" cy="${lastPt[1]}" r="2.5" fill="${strokeColor}" />
    </svg>
  `;
}

// Dual overlay chart for Trend Comparison Mode
export function drawComparisonChart(trendA, trendB) {
  const svg = document.getElementById('compare-chart-svg');
  const lineA = document.getElementById('compare-line-a');
  const lineB = document.getElementById('compare-line-b');
  if (!svg || !lineA || !lineB || !trendA || !trendB) return;

  const histA = trendA.history || [];
  const histB = trendB.history || [];
  const maxVal = Math.max(...histA, ...histB, 1);
  const minVal = Math.min(...histA, ...histB, 0);
  const range = maxVal - minVal || 1;

  const width = 500;
  const height = 120;
  const padX = 20;
  const padY = 15;

  const ptsA = histA.map((val, i) => {
    const x = padX + (i / (histA.length - 1)) * (width - 2 * padX);
    const y = (height - padY) - ((val - minVal) / range) * (height - 2 * padY);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const ptsB = histB.map((val, i) => {
    const x = padX + (i / (histB.length - 1)) * (width - 2 * padX);
    const y = (height - padY) - ((val - minVal) / range) * (height - 2 * padY);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  lineA.setAttribute('points', ptsA);
  lineB.setAttribute('points', ptsB);
}
