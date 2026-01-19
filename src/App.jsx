import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/admin/Login';
import DashboardLayout from './pages/admin/DashboardLayout';
import AdminHome from './pages/admin/AdminHome';
import BeritaManager from './pages/admin/BeritaManager';
import ChatManager from './pages/admin/ChatManager';

function App() {
  return (
    <Router>
      <Routes>
        {/* HALAMAN UTAMA ADALAH LOGIN */}
        <Route path="/" element={<Login />} />

        {/* DASHBOARD ROUTES */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<AdminHome />} /> {/* Halaman Statistik */}
          <Route path="berita" element={<BeritaManager />} />
          <Route path="chat" element={<ChatManager />} />
        </Route>

        {/* CATCH ALL: Balik ke login jika URL salah */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;