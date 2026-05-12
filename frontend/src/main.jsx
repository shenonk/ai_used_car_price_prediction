import './i18n'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './premium-polish.css'
import './auth-premium.css'
import App from './App.jsx'
import { applyTheme, getStoredTheme } from './utils/theme'

applyTheme(getStoredTheme())

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
