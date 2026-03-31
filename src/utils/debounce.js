/**
 * Debounce utility to prevent excessive API calls
 * Delays function execution until after specified wait time
 */

export function debounce(func, wait) {
  let timeout
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Debounce with immediate execution on first call
 */
export function debounceImmediate(func, wait) {
  let timeout
  let firstCall = true
  
  return function executedFunction(...args) {
    if (firstCall) {
      func(...args)
      firstCall = false
      return
    }
    
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function to limit execution rate
 */
export function throttle(func, limit) {
  let inThrottle
  
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}
