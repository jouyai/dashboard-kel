import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  NewspaperIcon, 
  ChatBubbleLeftRightIcon, 
  MapPinIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

export default function Home() {
  const [berita, setBerita] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBerita();
  }, []);

  const fetchBerita = async () => {
    const { data } = await supabase
      .from('berita')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3); // Ambil 3 berita terbaru sahaja untuk Home
    setBerita(data || []);
    setLoading(false);
  };

  const getCategoryColor = (cat) => {
    switch(cat) {
      case 'Berita Kesehatan': return 'text-green-400 border-green-400/30 bg-green-400/10';
      case 'Berita Kegiatan Kesra': return 'text-purple-400 border-purple-400/30 bg-purple-400/10';
      case 'Berita Kegiatan Ekbang': return 'text-orange-400 border-orange-400/30 bg-orange-400/10';
      default: return 'text-blue-400 border-blue-400/30 bg-blue-400/10';
    }
  };

  return (
    <div className="min-h-screen">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-[#0f172a]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
                L
             </div>
             <div>
                <h1 className="font-bold text-white leading-tight">Kelurahan</h1>
                <p className="text-[10px] text-blue-300 uppercase tracking-widest">Lenteng Agung</p>
             </div>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
            <a href="#hero" className="hover:text-white transition">Utama</a>
            <a href="#berita" className="hover:text-white transition">Berita</a>
            <Link to="/admin" className="px-5 py-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition">Admin Panel</Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section id="hero" className="relative pt-20 pb-32 px-6 overflow-hidden text-center">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] -z-10"></div>
        
        <div className="max-w-4xl mx-auto">
          <span className="px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6 inline-block">
            Selamat Datang di Portal Rasmi
          </span>
          <h2 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight">
            Melayani Warga dengan <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Sepenuh Hati</span>
          </h2>
          <p className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto">
            Akses maklumat terkini, pengumuman, dan perkhidmatan digital Kelurahan Lenteng Agung dengan pantas dan telus.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
             <button className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold shadow-xl shadow-blue-600/20 transition-all hover:scale-105 flex items-center gap-2">
                E-Perkhidmatan <ArrowRightIcon className="h-5 w-5" />
             </button>
             <Link to="/admin/dashboard/chat" className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl font-bold transition-all backdrop-blur-sm flex items-center gap-2">
                <ChatBubbleLeftRightIcon className="h-5 w-5" /> Live Chat
             </Link>
          </div>
        </div>
      </section>

      {/* QUICK LINKS / SERVICES */}
      <section className="max-w-7xl mx-auto px-6 -mt-16 relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: 'Urusan Tanah', desc: 'Permohonan surat keterangan pendaftaran tanah.', icon: MapPinIcon, color: 'from-blue-500 to-cyan-400' },
          { title: 'Info Pajak', desc: 'Maklumat bayaran PBB dan cukai tempatan.', icon: NewspaperIcon, color: 'from-purple-500 to-pink-500' },
          { title: 'Laporan Warga', desc: 'Aduan masalah infrastruktur atau kebajikan.', icon: ChatBubbleLeftRightIcon, color: 'from-orange-500 to-yellow-500' },
        ].map((item, i) => (
          <div key={i} className="bg-white/10 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl hover:border-white/20 transition-all group">
            <div className={`w-14 h-14 bg-gradient-to-br ${item.color} rounded-2xl mb-6 flex items-center justify-center text-white shadow-lg`}>
               <item.icon className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </section>

      {/* BERITA TERKINI */}
      <section id="berita" className="max-w-7xl mx-auto px-6 py-32">
        <div className="flex justify-between items-end mb-12">
           <div>
              <h2 className="text-3xl font-bold text-white mb-2 text-left">Berita & Kegiatan</h2>
              <div className="h-1 w-20 bg-blue-500 rounded-full"></div>
           </div>
           <button className="text-blue-400 font-medium hover:underline flex items-center gap-1">
              Lihat Semua Berita <ArrowRightIcon className="h-4 w-4" />
           </button>
        </div>

        {loading ? (
           <div className="text-center py-20 text-gray-500">Memuatkan berita...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {berita.map((item) => (
              <div key={item.id} className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:bg-white/[0.08] transition group">
                <div className="h-52 overflow-hidden relative">
                   {item.image_url ? (
                      <img src={item.image_url} alt={item.judul} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                   ) : (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-600 italic">Tiada Gambar</div>
                   )}
                   <span className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-bold border ${getCategoryColor(item.kategori)} backdrop-blur-md`}>
                      {item.kategori}
                   </span>
                </div>
                <div className="p-6">
                   <p className="text-xs text-gray-500 mb-3">{new Date(item.created_at).toLocaleDateString('ms-MY')}</p>
                   <h3 className="text-xl font-bold text-white mb-3 line-clamp-2 leading-tight group-hover:text-blue-400 transition">{item.judul}</h3>
                   <p className="text-gray-400 text-sm line-clamp-3 mb-6">{item.isi}</p>
                   <button className="text-sm font-bold text-white flex items-center gap-2 group/btn">
                      Baca Selengkapnya <ArrowRightIcon className="h-4 w-4 group-hover/btn:translate-x-1 transition" />
                   </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer className="bg-black/40 border-t border-white/5 py-12 text-center">
         <p className="text-gray-500 text-sm">
            &copy; 2026 Kelurahan Lenteng Agung. Dibangunkan untuk kemudahan warga.
         </p>
      </footer>
    </div>
  );
}