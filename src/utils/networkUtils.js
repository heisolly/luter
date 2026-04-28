// Network utility functions for better error handling and connectivity checks

/**
 * Check if the user has an active internet connection
 */
export async function checkNetworkConnectivity() {
  try {
    // Try to fetch a small request to a reliable endpoint
    const response = await fetch('https://httpbin.org/json', {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache'
    })
    return true
  } catch (error) {
    console.warn('Network connectivity check failed:', error)
    return false
  }
}

/**
 * Check if Supabase is reachable
 */
export async function checkSupabaseConnectivity(supabaseUrl) {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'HEAD',
      mode: 'cors',
      cache: 'no-cache'
    })
    return response.ok
  } catch (error) {
    console.warn('Supabase connectivity check failed:', error)
    return false
  }
}

/**
 * Get detailed network information
 */
export function getNetworkInfo() {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
  
  return {
    online: navigator.onLine,
    effectiveType: connection?.effectiveType || 'unknown',
    downlink: connection?.downlink || 'unknown',
    rtt: connection?.rtt || 'unknown',
    saveData: connection?.saveData || false
  }
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  let lastError = null
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      if (attempt === maxRetries - 1) {
        break
      }
      
      const delay = baseDelay * Math.pow(2, attempt)
      console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, error)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError
}

/**
 * Create a network-aware fetch wrapper
 */
export function createNetworkAwareFetch(baseFetch = fetch) {
  return async function(url, options = {}) {
    // Check network connectivity first
    const isOnline = navigator.onLine
    if (!isOnline) {
      throw new Error('No internet connection available')
    }
    
    // Add default timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
    
    try {
      const response = await baseFetch(url, {
        ...options,
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error.name === 'AbortError') {
        throw new Error('Request timed out after 30 seconds')
      }
      
      throw error
    }
  }
}
