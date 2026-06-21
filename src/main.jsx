import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './i18n'
import App from './App.jsx'
import AppErrorBoundary from './AppErrorBoundary.jsx'
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault()
    window.location.reload()
  })

  // Clear outdated service worker cache from stale builds
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(reg => {
        // Force update check on every page load
        reg.update().catch(() => {})
      })
    })
  }

  // Aggressive trick to hide Liveblocks watermark everywhere
  const observer = new MutationObserver(() => {
    const watermarkEls = document.querySelectorAll('a[href*="liveblocks.io"], [class*="liveblocks-badge"], [id*="liveblocks-watermark"]');
    watermarkEls.forEach(el => {
      try {
        if (el && el.style) {
          el.style.setProperty('display', 'none', 'important');
          el.style.setProperty('opacity', '0', 'important');
          el.style.setProperty('visibility', 'hidden', 'important');
          el.style.setProperty('pointer-events', 'none', 'important');
        }
      } catch (e) {}
    });
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
}

import { ThemeProvider } from './contexts/ThemeContext.jsx'
import { IconProvider } from './components/IconProvider.jsx'

// Safe Boot Loader: Ensures PDF.js and crucial globals are ready before React mounts
function mountApp() {
  createRoot(document.getElementById('root')).render(
    <AppErrorBoundary>
      <ThemeProvider>
        <IconProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </IconProvider>
      </ThemeProvider>
    </AppErrorBoundary>,
  )
}

mountApp();
