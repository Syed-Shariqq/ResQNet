import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import CitizenPage from './pages/CitizenPage'
import ResponderPage from './pages/ResponderPage'
import DemoPage from './pages/DemoPage'
import Toast from './components/shared/Toast'
import { startSyncEngine } from './engine/syncEngine'

export default function App() {
  const [toast, setToast] = useState({ visible: false, message: '' })

  useEffect(() => {
    const cleanup = startSyncEngine((result) => {
      setToast({
        visible: true,
        message: '✅ Synced ' + result.synced + ' queued request' + (result.synced > 1 ? 's' : ''),
      })
      setTimeout(() => setToast({ visible: false, message: '' }), 3500)
    })
    return cleanup
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CitizenPage />} />
        <Route path="/responder" element={<ResponderPage />} />
        <Route path="/demo" element={<DemoPage />} />
      </Routes>
      <Toast message={toast.message} visible={toast.visible} />
    </BrowserRouter>
  )
}