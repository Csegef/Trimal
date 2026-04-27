// ==========================================
// Fájl: React Belépési Pont (Main)
// Cél: Csak elindítja és hozzáköti a React alkalmazást a böngésző DOM-hoz (az index.html-ben).
// ==========================================
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
