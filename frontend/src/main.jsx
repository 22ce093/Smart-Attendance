import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const apiBaseUrl = String(import.meta.env.VITE_API_BASE_URL || '')
  .trim()
  .replace(/\/+$/, '')

if (apiBaseUrl && typeof window !== 'undefined') {
  const nativeFetch = window.fetch.bind(window)

  window.fetch = (input, init) => {
    if (typeof input === 'string' && input.startsWith('/api')) {
      return nativeFetch(`${apiBaseUrl}${input}`, init)
    }

    if (input instanceof Request) {
      const currentOrigin = window.location.origin
      const localApiPrefix = `${currentOrigin}/api`
      if (input.url.startsWith(localApiPrefix)) {
        const rewrittenUrl = `${apiBaseUrl}${input.url.slice(currentOrigin.length)}`
        return nativeFetch(new Request(rewrittenUrl, input), init)
      }
    }

    return nativeFetch(input, init)
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
