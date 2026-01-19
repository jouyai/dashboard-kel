import { useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { 
  NewspaperIcon, 
  ChatBubbleLeftRightIcon, 
  ArrowRightOnRectangleIcon, 
  Squares2X2Icon 
} from '@heroicons/react/24/outline'; 

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) navigate('/'); // Redirect ke login jika tiada sesi
    };
    checkSession();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const NavItem = ({ to, icon: Icon, label, end = false }) => {
    // Loji isActive yang lebih tepat
    const isActive = end ? location.pathname === to : location.pathname.startsWith(to);
    
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
    <div className="flex h-screen overflow-hidden bg-[#0f172a]">
      <aside className="w-64 bg-black/20 backdrop-blur-xl border-r border-white/10 flex flex-col shadow-2xl z-20">
        <div className="p-8 text-center border-b border-white/5">
          <div className="w-12 h-12 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-blue-500/20">
             <span className="text-xl font-bold text-white">A</span>
          </div>
          <h1 className="text-md font-bold text-white tracking-wide">Admin Panel</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 mt-4">
          {/* ITEM HOME/STATISTIK BARU */}
          <NavItem to="/dashboard" icon={Squares2X2Icon} label="Dashboard" end={true} />
          
          <NavItem to="/dashboard/berita" icon={NewspaperIcon} label="Berita" />
          <NavItem to="/dashboard/chat" icon={ChatBubbleLeftRightIcon} label="Live Chat" />
        </nav>

        <div className="p-4 border-t border-white/5">
          <button onClick={handleLogout} className="flex items-center gap-3 p-3 w-full text-left hover:bg-red-500/20 rounded-xl text-red-300 transition-all">
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-5xl mx-auto">
          <Outlet /> 
        </div>
      </main>
    </div>
  );
}