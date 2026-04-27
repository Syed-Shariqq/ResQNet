import { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Toast from './components/shared/Toast';
import { startSyncEngine } from './engine/syncEngine';
import CitizenPage from './pages/CitizenPage';
import Dashboard from './pages/Dashboard';
import DemoPage from './pages/DemoPage';

export default function App() {
  const [toast, setToast] = useState({ visible: false, message: '' });

  useEffect(() => {
    const cleanup = startSyncEngine((result) => {
      setToast({
        visible: true,
        message: `Synced ${result.synced} queued request${result.synced > 1 ? 's' : ''}`,
      });
      window.setTimeout(() => setToast({ visible: false, message: '' }), 3500);
    });

    return cleanup;
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/responder" element={<Dashboard />} />
        <Route path="/citizen" element={<CitizenPage />} />
        <Route path="/demo" element={<DemoPage />} />
      </Routes>
      <Toast message={toast.message} visible={toast.visible} />
    </BrowserRouter>
  );
}
