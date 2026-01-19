import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { 
  NewspaperIcon, 
  ChatBubbleLeftRightIcon, 
  ArrowUpRightIcon 
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

export default function AdminHome() {
  const [stats, setStats] = useState({ berita: 0, chat: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const { count: bCount } = await supabase.from('berita').select('*', { count: 'exact', head: true });
      const { count: cCount } = await supabase.from('chats').select('*', { count: 'exact', head: true });
      setStats({ berita: bCount || 0, chat: cCount || 0 });
      setLoading(false);
    };
    fetchStats();
  }, []);

  const cards = [
    { label: 'Total Berita', value: stats.berita, icon: NewspaperIcon, color: 'from-blue-500 to-cyan-400', link: '/dashboard/berita' },
    { label: 'Live Chat', value: stats.chat, icon: ChatBubbleLeftRightIcon, color: 'from-purple-500 to-pink-500', link: '/dashboard/chat' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-white">Statistik</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((card) => (
          <div key={card.label} className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-xl group hover:border-white/20 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{card.label}</p>
                <h3 className="text-4xl font-bold text-white mt-1">{loading ? '...' : card.value}</h3>
              </div>
              <div className={`p-4 bg-gradient-to-br ${card.color} rounded-2xl shadow-lg`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
            </div>
            <Link to={card.link} className="mt-6 flex items-center text-[10px] font-bold text-blue-400 gap-1 hover:text-blue-300 transition">
              LIHAT SEMUA <ArrowUpRightIcon className="h-3 w-3" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}