import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import CheckPage from './pages/CheckPage'
import './index.css'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CheckPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
