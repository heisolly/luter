/**
 * Utility to clear all Luter-related caches from localStorage.
 * This is useful after onboarding, logout, or when data is suspected to be stale.
 */
export const clearLuterCaches = () => {
  if (typeof localStorage === 'undefined') return;

  const keysToClear = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('luter:') || key.startsWith('luter-'))) {
      keysToClear.push(key);
    }
  }

  keysToClear.forEach(key => {
    try {
      localStorage.removeItem(key);
      console.log(`[Cache] Cleared: ${key}`);
    } catch (e) {
      console.warn(`[Cache] Failed to clear: ${key}`, e);
    }
  });

  // Specifically clear the universal workspace store if it exists
  try {
    localStorage.removeItem('luter-universal-workspace');
  } catch (e) {}
};
