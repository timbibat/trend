import { state, rebuildTrendsDataset, playSound } from './state.js';

// Toggle bookmark state and update local storage
export function toggleBookmark(trendId, renderCallback) {
  const bookmarkIdx = state.bookmarks.indexOf(trendId);
  if (bookmarkIdx > -1) {
    state.bookmarks.splice(bookmarkIdx, 1);
  } else {
    state.bookmarks.push(trendId);
  }
  
  localStorage.setItem('trendpulse_bookmarks', JSON.stringify(state.bookmarks));
  
  if (renderCallback) {
    renderCallback();
  }
}

// Delete custom simulated trends
export function deleteCustomTrend(trendId, renderCallback) {
  state.customTrends = state.customTrends.filter(t => t.id !== trendId);
  localStorage.setItem('trendpulse_custom_trends', JSON.stringify(state.customTrends));
  
  // Also delete from bookmarks if favorited
  state.bookmarks = state.bookmarks.filter(id => id !== trendId);
  localStorage.setItem('trendpulse_bookmarks', JSON.stringify(state.bookmarks));
  
  rebuildTrendsDataset();
  
  if (renderCallback) {
    renderCallback();
  }
}
