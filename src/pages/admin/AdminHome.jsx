import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import {
  NewspaperIcon,
  ChatBubbleLeftRightIcon,
  ArrowUpRightIcon,
} from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";

export default function AdminHome() {
  const [stats, setStats] = useState({ berita: 0, chat: 0 });
  const [loading, setLoading] = useState(true);

  // Fungsi untuk mengambil statistik terkini
  const fetchStats = async () => {
    try {
      // 1. Kira jumlah semua berita
      const { count: bCount } = await supabase
        .from("berita")
        .select("*", { count: "exact", head: true });

      // 2. Kira jumlah Live Chat (Hanya yang berstatus 'live')
      // Ini secara automatik merangkumi "Perlu Ditangani" + "Chat Saya"
      const { count: cCount } = await supabase
        .from("chat_sessions")
        .select("*", { count: "exact", head: true })
        .eq("status", "live");

      setStats({ 
        berita: bCount || 0, 
        chat: cCount || 0 
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // LANGGANAN REALTIME: Mengemas kini statistik secara automatik
    const channel = supabase
      .channel("admin_stats_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_sessions" },
        () => {
          fetchStats(); // Ambil statistik baru jika ada perubahan pada chat
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "berita" },
        () => {
          fetchStats(); // Ambil statistik baru jika ada perubahan pada berita
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const cards = [
    {
      label: "Total Berita",
      value: stats.berita,
      icon: NewspaperIcon,
      color: "from-blue-500 to-cyan-400",
      link: "/dashboard/berita",
    },
    {
      label: "Live Chat Aktif", // Nama ditukar untuk lebih jelas
      value: stats.chat,
      icon: ChatBubbleLeftRightIcon,
      color: "from-purple-500 to-pink-500",
      link: "/dashboard/chat",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-white">Statistik Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Ringkasan aktiviti portal semasa.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-xl group hover:border-white/20 transition-all relative overflow-hidden"
          >
            {/* Kesan hiasan cahaya di belakang kad */}
            <div className={`absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br ${card.color} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity`}></div>
            
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                  {card.label}
                </p>
                <h3 className="text-4xl font-bold text-white mt-1">
                  {loading ? "..." : card.value}
                </h3>
              </div>
              <div
                className={`p-4 bg-gradient-to-br ${card.color} rounded-2xl shadow-lg shadow-black/20`}
              >
                <card.icon className="h-6 w-6 text-white" />
              </div>
            </div>
            
            <Link
              to={card.link}
              className="mt-6 flex items-center text-[10px] font-bold text-blue-400 gap-1 hover:text-blue-300 transition relative z-10"
            >
              LIHAT DETAIL <ArrowUpRightIcon className="h-3 w-3" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}