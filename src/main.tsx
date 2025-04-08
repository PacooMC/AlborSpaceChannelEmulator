import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './d3-patch.js'; // Import the patch *before* App renders
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
