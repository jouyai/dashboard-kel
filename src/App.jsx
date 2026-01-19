import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/admin/Login';
import DashboardLayout from './pages/admin/DashboardLayout';
import BeritaManager from './pages/admin/BeritaManager';
import ChatManager from './pages/admin/ChatManager';

const Home = () => <h1 className="text-3xl font-bold text-center mt-10">Halaman Depan Kelurahan</h1>;

function App() {
  return (
    <Router>
      <Routes>
        {/* === JALUR PUBLIC (WEBSITE WARGA) === */}
        <Route path="/" element={<Home />} />
        {/* Tambahkan route halaman Tanah, Pajak, dll di sini nanti */}


        {/* === JALUR ADMIN (DASHBOARD) === */}
        <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
        <Route path="/admin/login" element={<Login />} />
        
        {/* Semua halaman di bawah ini butuh Login */}
        <Route path="/admin/dashboard" element={<DashboardLayout />}>
          <Route index element={<BeritaManager />} /> {/* Default: Berita */}
          <Route path="berita" element={<BeritaManager />} />
          <Route path="chat" element={<ChatManager />} />
        </Route>

      </Routes>
    </Router>
  );
}

export default App;