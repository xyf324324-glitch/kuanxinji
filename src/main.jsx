import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ZenSpace from './components/ZenSpace'
import './companion-video/companion.js'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ZenSpace><App /></ZenSpace>
  </StrictMode>,
)
