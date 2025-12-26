import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import Heatmap from './Heatmap.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename="/react-globe">
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/heatmap" element={<Heatmap />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
