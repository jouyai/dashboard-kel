import { useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { NewspaperIcon, ChatBubbleLeftRightIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/solid';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) navigate('/admin/login');
    };
    checkSession();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  const NavItem = ({ to, icon: Icon, label }) => {
    const isActive = location.pathname.includes(to);
    return (
      <Link 
        to={to} 
        className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
          isActive 
            ? 'bg-white/20 text-white shadow-lg border border-white/10 backdrop-blur-sm' 
            : 'text-blue-100 hover:bg-white/5 hover:text-white'
        }`}
      >
        <Icon className="h-5 w-5" />
        <span className="font-medium">{label}</span>
      </Link>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* SIDEBAR GLASS */}
      <aside className="w-64 bg-black/20 backdrop-blur-xl border-r border-white/10 flex flex-col shadow-2xl z-20">
        <div className="p-8 text-center border-b border-white/5">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-blue-500/20">
             <span className="text-2xl font-bold text-white">A</span>
          </div>
          <h1 className="text-lg font-bold text-white tracking-wide">Admin Panel</h1>
          <p className="text-xs text-blue-200/60 mt-1">Kelurahan Lenteng Agung</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 mt-4">
          <NavItem to="/admin/dashboard/berita" icon={NewspaperIcon} label="Berita" />
          <NavItem to="/admin/dashboard/chat" icon={ChatBubbleLeftRightIcon} label="Live Chat" />
        </nav>

        <div className="p-4 border-t border-white/5">
          <button onClick={handleLogout} className="flex items-center gap-3 p-3 w-full text-left hover:bg-red-500/20 rounded-xl text-red-300 hover:text-red-100 transition-all border border-transparent hover:border-red-500/30">
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* CONTENT AREA */}
      <main className="flex-1 overflow-y-auto relative">
        <div className="p-8 max-w-7xl mx-auto">
           {/* Efek Blur Header */}
           <div className="sticky top-0 z-10 -mx-8 px-8 py-4 mb-6 backdrop-blur-sm bg-transparent flex justify-between items-center">
              <h2 className="text-xl font-bold text-white drop-shadow-md">Dashboard Overview</h2>
              <div className="flex items-center gap-2">
                 <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
                 <span className="text-xs text-green-300">System Online</span>
              </div>
           </div>
           <Outlet /> 
        </div>
      </main>
    </div>
  );
}