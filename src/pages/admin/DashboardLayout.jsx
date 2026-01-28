import { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import {
  NewspaperIcon,
  ChatBubbleLeftRightIcon,
  ArrowRightOnRectangleIcon,
  Squares2X2Icon,
  Bars3Icon,
  XMarkIcon,
  DocumentTextIcon,
  UserGroupIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // 1. Semakan Sesi Log Masuk
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) navigate('/');
    };
    checkSession();
  }, [navigate]);

  // 2. Sistem Notifikasi Chat Realtime
  useEffect(() => {
    const getUnread = async () => {
      const { data } = await supabase
        .from('chat_sessions')
        .select('id')
        .eq('status', 'live')
        .is('handled_by', null);
      setUnreadCount(data?.length || 0);
    };

    getUnread();

    // Langganan perubahan data secara langsung (Realtime)
    const channel = supabase.channel('sidebar_notif')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_sessions'
      }, getUnread)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // Tutup sidebar secara automatik apabila bertukar halaman pada mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const NavItem = ({ to, icon: Icon, label, end = false, badge = 0 }) => {
    const isActive = end ? location.pathname === to : location.pathname.startsWith(to);

    return (
      <Link
        to={to}
        className={`flex items-center justify-between p-4 md:p-3 rounded-xl transition-all duration-300 ${isActive
          ? 'bg-white/20 text-white shadow-lg border border-white/10 backdrop-blur-sm'
          : 'text-blue-100 hover:bg-white/5 hover:text-white'
          }`}
      >
        <div className="flex items-center gap-3">
          <Icon className="h-6 w-6 md:h-5 md:w-5" />
          <span className="font-medium text-lg md:text-base">{label}</span>
        </div>

        {badge > 0 && (
          <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse shadow-lg">
            {badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className="flex h-screen md:h-screen bg-[#0f172a] overflow-hidden">

      {/* MOBILE HEADER BAR (Hanya muncul di skrin kecil) */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-black/40 backdrop-blur-xl border-b border-white/10 z-30 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-lg flex items-center justify-center font-bold text-white text-sm">A</div>
          <span className="text-white font-bold text-sm tracking-tight">Admin Panel</span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-white bg-white/5 rounded-lg border border-white/10"
        >
          {isSidebarOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
        </button>
      </div>

      {/* SIDEBAR (Desktop & Mobile Overlay) */}
      <aside className={`
        fixed inset-y-0 left-0 w-72 bg-[#0f172a]/95 backdrop-blur-2xl border-r border-white/10 flex flex-col shadow-2xl z-40 transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:w-64 md:bg-black/20
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Identiti Panel (Desktop) */}
        <div className="p-8 text-center border-b border-white/5 hidden md:block">
          <div className="w-12 h-12 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-blue-500/20 text-xl font-bold text-white">
            A
          </div>
          <h1 className="text-md font-bold text-white tracking-wide">Admin Panel</h1>
          <p className="text-[10px] text-blue-300/50 uppercase tracking-widest mt-1">Lenteng Agung</p>
        </div>

        {/* Menu Navigasi */}
        <nav className="flex-1 p-4 space-y-2 mt-20 md:mt-4 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
          <NavItem to="/dashboard" icon={Squares2X2Icon} label="Dashboard" end={true} />
          <NavItem to="/dashboard/berita" icon={NewspaperIcon} label="Berita" />
          <NavItem to="/dashboard/chat" icon={ChatBubbleLeftRightIcon} label="Live Chat" badge={unreadCount} />



          <div className="pt-4 pb-2 px-4 text-[10px] font-bold text-blue-300/30 uppercase tracking-[0.2em]">CMS Dinamis</div>
          <NavItem to="/dashboard/layanan" icon={DocumentTextIcon} label="Persyaratan Layanan" />
          <NavItem to="/dashboard/templates" icon={DocumentTextIcon} label="Manajer Template" />
          <NavItem to="/dashboard/kelembagaan" icon={UserGroupIcon} label="Kelembagaan" />

          <div className="pt-4 pb-2 px-4 text-[10px] font-bold text-blue-300/30 uppercase tracking-[0.2em]">Sistem</div>
          <NavItem to="/dashboard/account" icon={UserCircleIcon} label="Kelola Akun" />
        </nav>

        {/* Bahagian Logout */}
        <div className="p-4 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 p-4 md:p-3 w-full text-left hover:bg-red-500/20 rounded-xl text-red-300 hover:text-red-100 transition-all border border-transparent hover:border-red-500/30 group"
          >
            <ArrowRightOnRectangleIcon className="h-6 w-6 md:h-5 md:w-5 group-hover:translate-x-1 transition-transform" />
            <span className="text-lg md:text-base font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* OVERLAY (Tutup menu apabila klik luar pada mobile) */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* KAWASAN KANDUNGAN UTAMA */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8 pt-24 md:pt-8 relative">
        <div className="max-w-6xl mx-auto">
          {/* Tajuk Halaman Dinamik (Pilihan) */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
              <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest">System Online</span>
            </div>
          </div>

          <Outlet />
        </div>
      </main>
    </div>
  );
}