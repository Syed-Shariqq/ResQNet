import { BrowserRouter, Routes, Route } from 'react-router-dom'
import CitizenPage from './pages/CitizenPage'
import ResponderPage from './pages/ResponderPage'
import DemoPage from './pages/DemoPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CitizenPage />} />
        <Route path="/responder" element={<ResponderPage />} />
        <Route path="/demo" element={<DemoPage />} />
      </Routes>
    </BrowserRouter>
  )
}