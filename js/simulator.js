import { state, accentTheme, defaultTheme, rebuildTrendsDataset, playSound, getPlatformIcon } from './state.js';

// Setup Slider Event Listeners & Form Preview Updates
export function setupSimulatorPreview(renderCallback, focusCategoryCallback) {
  const simTitle = document.getElementById('sim-title');
  const simPlatform = document.getElementById('sim-platform');
  const simCategory = document.getElementById('sim-category');
  
  const simVirality = document.getElementById('sim-virality');
  const simVelocity = document.getElementById('sim-velocity');
  const simTraffic = document.getElementById('sim-traffic');
  
  const valVirality = document.getElementById('val-virality');
  const valVelocity = document.getElementById('val-velocity');
  const valTraffic = document.getElementById('val-traffic');
  
  const btnSimInject = document.getElementById('btn-sim-inject');

  if (!simTitle) return;

  // Real-time slider metrics
  simVirality.addEventListener('input', (e) => {
    if (valVirality) valVirality.textContent = `${e.target.value}%`;
    updateSimPreview();
  });
  simVelocity.addEventListener('input', (e) => {
    if (valVelocity) valVelocity.textContent = `${e.target.value}%`;
    updateSimPreview();
  });
  simTraffic.addEventListener('input', (e) => {
    if (valTraffic) valTraffic.textContent = `${parseInt(e.target.value).toLocaleString()}`;
    updateSimPreview();
  });

  // Real-time text changes
  simTitle.addEventListener('input', updateSimPreview);
  simPlatform.addEventListener('change', updateSimPreview);
  simCategory.addEventListener('change', updateSimPreview);
  
  // Action inject handler
  btnSimInject.onclick = () => runTrendProjection(renderCallback, focusCategoryCallback);
  
  // Initial draw
  updateSimPreview();
}

function updateSimPreview() {
  const simTitle = document.getElementById('sim-title');
  const simPlatform = document.getElementById('sim-platform');
  const simCategory = document.getElementById('sim-category');
  const simVirality = document.getElementById('sim-virality');
  const simVelocity = document.getElementById('sim-velocity');
  const simTraffic = document.getElementById('sim-traffic');

  const previewCategory = document.getElementById('preview-category');
  const previewGrowth = document.getElementById('preview-growth');
  const previewTitle = document.getElementById('preview-title');
  const previewDesc = document.getElementById('preview-desc');
  const previewPlatform = document.getElementById('preview-platform');
  const simCardPreview = document.getElementById('sim-card-preview');

  if (!simTitle) return;

  const titleVal = simTitle.value.trim() || "Custom Trend Concept";
  const catVal = simCategory.value;
  const platVal = simPlatform.value;
  
  const virVal = parseInt(simVirality.value);
  const velVal = parseInt(simVelocity.value);
  const traVal = parseInt(simTraffic.value);
  
  const computedGrowth = Math.round((virVal * velVal * traVal * 1.5) / 10);
  
  if (previewCategory) {
    previewCategory.textContent = catVal;
    const theme = accentTheme[catVal] || defaultTheme;
    previewCategory.className = `px-2.5 py-0.5 text-[9px] font-bold rounded-lg tracking-wider uppercase ${theme.badge}`;
    previewCategory.innerHTML = `<i class="fa-solid ${theme.icon} text-[9px] mr-1"></i> ${catVal}`;
  }
  
  if (previewGrowth) previewGrowth.textContent = `+${computedGrowth.toLocaleString()}%`;
  if (previewTitle) previewTitle.textContent = titleVal;
  
  if (previewDesc) {
    previewDesc.textContent = `Organic conceptual analysis. Running algorithmic scanners with seed virality (${virVal}%), velocity index (${velVal}%), and traffic volume (${traVal * 1000} queries).`;
  }
  
  if (previewPlatform) {
    const platIcon = getPlatformIcon(platVal);
    previewPlatform.innerHTML = `<i class="${platIcon} text-xs"></i> ${platVal}`;
  }
  
  if (simCardPreview) {
    const theme = accentTheme[catVal] || defaultTheme;
    simCardPreview.className = `p-5 bg-slate-900/40 border ${theme.border} rounded-xl space-y-4 select-none relative`;
  }
}

function runTrendProjection(renderCallback, focusCategoryCallback) {
  const simTitle = document.getElementById('sim-title');
  const simPlatform = document.getElementById('sim-platform');
  const simCategory = document.getElementById('sim-category');
  const simVirality = document.getElementById('sim-virality');
  const simVelocity = document.getElementById('sim-velocity');
  const simTraffic = document.getElementById('sim-traffic');
  const simProcessingOverlay = document.getElementById('sim-processing-overlay');

  if (!simTitle) return;

  const concept = simTitle.value.trim();
  if (!concept) {
    simTitle.classList.add('border-red-500');
    simTitle.focus();
    setTimeout(() => simTitle.classList.remove('border-red-500'), 1500);
    return;
  }
  
  playSound('click');
  
  if (simProcessingOverlay) {
    simProcessingOverlay.classList.remove('pointer-events-none');
    simProcessingOverlay.style.opacity = '1';
  }
  
  const virVal = parseInt(simVirality.value);
  const velVal = parseInt(simVelocity.value);
  const traVal = parseInt(simTraffic.value);
  
  const computedGrowth = Math.round((virVal * velVal * traVal * 1.5) / 10);
  
  setTimeout(() => {
    const newCustomTrendId = `custom_${Date.now()}`;
    const descText = `Projected viral concept engineered in Pulse Labs. Seeding has established ${virVal}% virality, ${velVal}% velocity, and ${traVal * 1000} base interactions.`;
    
    // Generate simulated 7-day sparkline history
    const history = [];
    for (let i = 0; i < 7; i++) {
      const dayFactor = (i / 6);
      const noise = 0.85 + Math.random() * 0.3;
      history.push(Math.round(computedGrowth * Math.pow(dayFactor, 1.8) * noise));
    }
    history[history.length - 1] = computedGrowth;
    
    const sentimentLabel = virVal > 80 ? "Chaotic Disruptor" : velVal > 85 ? "Hypervelocity Spike" : "Organic Wave";
    const durationLabel = velVal > 75 ? "Exploding" : "Rising";
    
    const newTrendObj = {
      id: newCustomTrendId,
      title: concept,
      category: simCategory.value,
      badgeColor: simCategory.value === 'Tech & AI' ? 'purple' : simCategory.value === 'Pop Culture' ? 'pink' : simCategory.value === 'Gaming' ? 'cyan' : simCategory.value === 'Memes' ? 'emerald' : 'amber',
      description: descText,
      growth: `+${computedGrowth.toLocaleString()}%`,
      growthNumeric: computedGrowth,
      platform: simPlatform.value,
      volume: `${Math.round(traVal * (virVal / 5)).toLocaleString()} views`,
      sentiment: sentimentLabel,
      trendDuration: durationLabel,
      history: history,
      isCustom: true,
      hero: false
    };
    
    // Ingest into custom list and persist
    state.customTrends.unshift(newTrendObj);
    localStorage.setItem('trendpulse_custom_trends', JSON.stringify(state.customTrends));
    
    // Refresh global list
    rebuildTrendsDataset();
    
    // Hide overlay
    if (simProcessingOverlay) {
      simProcessingOverlay.style.opacity = '0';
      simProcessingOverlay.classList.add('pointer-events-none');
    }
    
    // Reset Form
    simTitle.value = '';
    updateSimPreview();
    
    // Play alert sound and run grid rendering
    playSound('success');
    if (renderCallback) renderCallback();
    
    // Focus and highlight custom trend category
    if (focusCategoryCallback) {
      focusCategoryCallback(newTrendObj.category);
    }
    
    // Highlight the card
    setTimeout(() => {
      const injectedCard = document.querySelector(`[data-id="${newCustomTrendId}"]`);
      if (injectedCard) {
        injectedCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        injectedCard.classList.add('border-emerald-500/50', 'shadow-[0_0_30px_rgba(16,185,129,0.35)]');
        setTimeout(() => {
          injectedCard.classList.remove('border-emerald-500/50', 'shadow-[0_0_30px_rgba(16,185,129,0.35)]');
        }, 3000);
      }
    }, 500);
    
  }, 1500);
}
