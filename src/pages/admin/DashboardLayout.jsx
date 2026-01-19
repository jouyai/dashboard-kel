import { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { 
  NewspaperIcon, 
  ChatBubbleLeftRightIcon, 
  ArrowRightOnRectangleIcon, 
  Squares2X2Icon,
  Bars3Icon, // Icon Hamburger
  XMarkIcon   // Icon Close
} from '@heroicons/react/24/outline'; 

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State untuk mobile menu

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) navigate('/');
    };
    checkSession();
  }, [navigate]);

  // Tutup sidebar secara automatik apabila bertukar halaman (untuk mobile)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const NavItem = ({ to, icon: Icon, label, end = false }) => {
    const isActive = end ? location.pathname === to : location.pathname.startsWith(to);
    return (
      <Link 
        to={to} 
        className={`flex items-center gap-3 p-4 md:p-3 rounded-xl transition-all duration-300 ${
          isActive 
            ? 'bg-white/20 text-white shadow-lg border border-white/10 backdrop-blur-sm' 
            : 'text-blue-100 hover:bg-white/5 hover:text-white'
        }`}
      >
        <Icon className="h-6 w-6 md:h-5 md:w-5" />
        <span className="font-medium text-lg md:text-base">{label}</span>
      </Link>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#0f172a]">
      {/* MOBILE HEADER BAR */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-black/40 backdrop-blur-xl border-b border-white/10 z-30 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-white text-sm">A</div>
            <span className="text-white font-bold text-sm tracking-tight">Admin Panel</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-white bg-white/5 rounded-lg border border-white/10">
          {isSidebarOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
        </button>
      </div>

      {/* SIDEBAR (Desktop & Mobile Overlay) */}
      <aside className={`
        fixed inset-y-0 left-0 w-72 bg-[#0f172a]/95 backdrop-blur-2xl border-r border-white/10 flex flex-col shadow-2xl z-40 transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:w-64 md:bg-black/20
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-8 text-center border-b border-white/5 hidden md:block">
          <div className="w-12 h-12 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
             <span className="text-xl font-bold text-white">A</span>
          </div>
          <h1 className="text-md font-bold text-white tracking-wide">Admin Panel</h1>
        </div>

        {/* Padding tambahan untuk mobile supaya tidak tertutup header */}
        <nav className="flex-1 p-4 space-y-2 mt-20 md:mt-4">
          <NavItem to="/dashboard" icon={Squares2X2Icon} label="Dashboard" end={true} />
          <NavItem to="/dashboard/berita" icon={NewspaperIcon} label="Berita" />
          <NavItem to="/dashboard/chat" icon={ChatBubbleLeftRightIcon} label="Live Chat" />
        </nav>

        <div className="p-4 border-t border-white/5">
          <button onClick={handleLogout} className="flex items-center gap-3 p-4 md:p-3 w-full text-left hover:bg-red-500/20 rounded-xl text-red-300 transition-all">
            <ArrowRightOnRectangleIcon className="h-6 w-6 md:h-5 md:w-5" />
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

      {/* CONTENT AREA */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8 pt-24 md:pt-8">
        <div className="max-w-5xl mx-auto">
          <Outlet /> 
        </div>
      </main>
    </div>
  );
}