import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/admin/Login';
import ForgotPassword from './pages/admin/ForgotPassword';
import ResetPassword from './pages/admin/ResetPassword';
import DashboardLayout from './pages/admin/DashboardLayout';
import AdminHome from './pages/admin/AdminHome';
import BeritaManager from './pages/admin/BeritaManager';
import ChatManager from './pages/admin/ChatManager';
import LayananManager from './pages/admin/LayananManager';
import KelembagaanManager from './pages/admin/KelembagaanManager';
import TemplateManager from './pages/admin/TemplateManager';
import AccountManager from './pages/admin/AccountManager';


function App() {
  return (
    <Router>
      <Routes>
        {/* HALAMAN UTAMA ADALAH LOGIN */}
        <Route path="/" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* DASHBOARD ROUTES */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<AdminHome />} /> {/* Halaman Statistik */}
          <Route path="berita" element={<BeritaManager />} />
          <Route path="chat" element={<ChatManager />} />
          <Route path="layanan" element={<LayananManager />} />
          <Route path="templates" element={<TemplateManager />} />
          <Route path="kelembagaan" element={<KelembagaanManager />} />
          <Route path="account" element={<AccountManager />} />
        </Route>

        {/* CATCH ALL: Balik ke login jika URL salah */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;