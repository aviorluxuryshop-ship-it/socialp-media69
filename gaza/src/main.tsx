import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// self-hosted: no third-party font CDN at runtime, and the canvas label can rely on them being there.
// Latin + Latin Extended only (Turkish ğ ı İ ş live in latin-ext).
import '@fontsource/poppins/latin-600.css'
import '@fontsource/poppins/latin-ext-600.css'
import '@fontsource/poppins/latin-700.css'
import '@fontsource/poppins/latin-ext-700.css'
import '@fontsource/poppins/latin-800.css'
import '@fontsource/poppins/latin-ext-800.css'
import '@fontsource/poppins/latin-900.css'
import '@fontsource/poppins/latin-ext-900.css'
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-ext-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-ext-500.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/inter/latin-ext-600.css'
import '@fontsource/inter/latin-700.css'
import '@fontsource/inter/latin-ext-700.css'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
