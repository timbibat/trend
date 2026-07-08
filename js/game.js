import { state, playSound } from './state.js';

let gameScore = 0;
let gameHighScore = parseInt(localStorage.getItem('trendpulse_game_highscore')) || 0;
let activeGameCardA = null;
let activeGameCardB = null;

// Advanced Arena Features
let comboStreak = 0;
let comboMultiplier = 1;

export function initGame() {
  const gameScoreEl = document.getElementById('game-score');
  const gameHighScoreEl = document.getElementById('game-highscore');
  const gamePlayView = document.getElementById('game-play-view');
  const gameGameOverView = document.getElementById('game-over-view');
  
  const btnHigher = document.getElementById('btn-higher');
  const btnLower = document.getElementById('btn-lower');
  const btnPlayAgain = document.getElementById('btn-play-again');

  if (!gameScoreEl) return;
  
  gameScore = 0;
  comboStreak = 0;
  comboMultiplier = 1;
  updateScoreDisplay();
  
  gameHighScoreEl.textContent = gameHighScore;
  
  gamePlayView.classList.remove('hidden');
  gameGameOverView.classList.add('hidden');
  
  activeGameCardA = null;
  activeGameCardB = null;
  
  drawNewGameRound();
  
  // Bind click handlers cleanly
  btnHigher.onclick = () => handleGameGuess(true);
  btnLower.onclick = () => handleGameGuess(false);
  btnPlayAgain.onclick = () => {
    playSound('click');
    initGame();
  };
}

export function drawNewGameRound() {
  if (!state.baseTrendsData || state.baseTrendsData.length < 2) return;
  
  const gameCardACategory = document.getElementById('game-card-a-category');
  const gameCardATitle = document.getElementById('game-card-a-title');
  const gameCardAGrowth = document.getElementById('game-card-a-growth');
  
  const gameCardBCategory = document.getElementById('game-card-b-category');
  const gameCardBTitle = document.getElementById('game-card-b-title');
  const gameCardBContainer = document.getElementById('game-card-b-container');

  // Pick Trend A
  if (!activeGameCardA) {
    activeGameCardA = state.baseTrendsData[Math.floor(Math.random() * state.baseTrendsData.length)];
  }
  
  // Pick Trend B (Must be different from A)
  let attempts = 0;
  do {
    activeGameCardB = state.baseTrendsData[Math.floor(Math.random() * state.baseTrendsData.length)];
    attempts++;
  } while (activeGameCardB.id === activeGameCardA.id && attempts < 50);

  // Set card contents
  if (gameCardACategory) gameCardACategory.textContent = activeGameCardA.category;
  if (gameCardATitle) gameCardATitle.textContent = activeGameCardA.title;
  if (gameCardAGrowth) gameCardAGrowth.textContent = activeGameCardA.growth + " Growth";
  
  if (gameCardBCategory) gameCardBCategory.textContent = activeGameCardB.category;
  if (gameCardBTitle) gameCardBTitle.textContent = activeGameCardB.title;
  
  if (gameCardBContainer) {
    gameCardBContainer.className = "p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl relative overflow-hidden game-card-transition-in";
  }
}

function handleGameGuess(guessedHigher) {
  playSound('click');
  
  const gamePlayView = document.getElementById('game-play-view');
  const gameGameOverView = document.getElementById('game-over-view');
  const gameCardBContainer = document.getElementById('game-card-b-container');
  const gameFinalScore = document.getElementById('game-final-score');

  const valA = activeGameCardA.growthNumeric || 0;
  const valB = activeGameCardB.growthNumeric || 0;
  
  const isBHigher = valB >= valA;
  const isCorrect = (guessedHigher && isBHigher) || (!guessedHigher && !isBHigher);
  
  if (isCorrect) {
    // WIN ROUND
    playSound('correct');
    if (gameCardBContainer) gameCardBContainer.classList.add('game-correct-flash');
    
    // Combo Logic
    comboStreak++;
    if (comboStreak >= 3) comboMultiplier = 2;
    if (comboStreak >= 7) comboMultiplier = 3;
    if (comboStreak >= 15) comboMultiplier = 5;
    
    gameScore += (1 * comboMultiplier);
    updateScoreDisplay();
    
    if (gameScore > gameHighScore) {
      gameHighScore = gameScore;
      const gameHighScoreEl = document.getElementById('game-highscore');
      if (gameHighScoreEl) gameHighScoreEl.textContent = gameHighScore;
      localStorage.setItem('trendpulse_game_highscore', gameHighScore);
    }
    
    // Cycle cards: B becomes the new A
    activeGameCardA = activeGameCardB;
    
    setTimeout(() => {
      drawNewGameRound();
    }, 600);
  } else {
    // LOSE ROUND
    playSound('incorrect');
    if (gameCardBContainer) gameCardBContainer.classList.add('game-incorrect-flash');
    
    comboStreak = 0;
    comboMultiplier = 1;
    
    setTimeout(() => {
      // Transition to game over view
      if (gamePlayView) gamePlayView.classList.add('hidden');
      if (gameGameOverView) gameGameOverView.classList.remove('hidden');
      if (gameFinalScore) gameFinalScore.textContent = gameScore;
      
      activeGameCardA = null;
      activeGameCardB = null;
    }, 600);
  }
}

function updateScoreDisplay() {
  const gameScoreEl = document.getElementById('game-score');
  if (!gameScoreEl) return;
  
  if (comboMultiplier > 1) {
    gameScoreEl.innerHTML = `${gameScore} <span class="text-[8px] px-1 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/50 inline-block ml-1 animate-pulse">x${comboMultiplier}</span>`;
  } else {
    gameScoreEl.textContent = gameScore;
  }
}
