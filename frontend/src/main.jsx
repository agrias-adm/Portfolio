import React from 'react'
import ReactDOM from 'react-dom/client'
import Portfolio from './Portfolio.jsx'
import './index.css'

// Expose runtime env overrides to `window.ENV` so hosting platforms can override API_URL at runtime
// (This mirrors the behavior described in the project README and provides a fallback to build-time or window origin)
if (typeof window !== 'undefined') {
  // If the build-time env VITE_API_URL exists, add it to window.ENV
  try {
    window.ENV = {
      ...(window.ENV || {}),
      VITE_API_URL: import.meta.env.VITE_API_URL || window.ENV?.VITE_API_URL || window.location.origin
    }
  } catch (e) {
    // import.meta may not be available in some environments; try to preserve existing window.ENV
    window.ENV = window.ENV || { VITE_API_URL: window.location.origin };
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Portfolio />
  </React.StrictMode>,
)