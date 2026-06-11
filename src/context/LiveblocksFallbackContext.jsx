import React, { createContext, useContext, useState, useCallback } from 'react'

const LiveblocksFallbackContext = createContext({
  isFallback: true,
  setFallback: () => {},
  reconnect: () => {},
})

export function LiveblocksFallbackProvider({ children }) {
  const [isFallback, setFallback] = useState(true)

  const reconnect = useCallback(() => {
    setFallback(false)
  }, [])

  return (
    <LiveblocksFallbackContext.Provider value={{ isFallback, setFallback, reconnect }}>
      {children}
    </LiveblocksFallbackContext.Provider>
  )
}

export function useLiveblocksFallback() {
  return useContext(LiveblocksFallbackContext)
}
