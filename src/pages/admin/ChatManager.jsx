import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabaseClient";
import {
  UserCircleIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  ClockIcon,
  BuildingOffice2Icon,
  UserPlusIcon,
  FunnelIcon,
  ShieldCheckIcon,
  TagIcon,
  ChatBubbleLeftRightIcon,
  ArrowLeftIcon, // Icon baru untuk tombol kembali di mobile
} from "@heroicons/react/24/solid";

/**
 * --- COMPONENT: SIDEBAR ITEM ---
 */
const SidebarItem = ({ session, isSelected, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`p-3 md:p-4 rounded-xl cursor-pointer transition-all border relative flex items-start gap-3 mb-2 ${
        isSelected
          ? "bg-blue-600/20 border-blue-500/50 shadow-md"
          : "bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10"
      }`}
    >
      {/* Avatar Wrapper */}
      <div className={`shrink-0 p-2 rounded-full relative ${
        session.status === "live" ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"
      }`}>
        <UserCircleIcon className="h-5 w-5 md:h-6 md:w-6" />
        {session.status === "live" && !session.handled_by && (
          <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0f172a] animate-pulse"></span>
        )}
      </div>

      {/* Content Info */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex justify-between items-start">
          <p className={`font-semibold text-sm truncate pr-2 ${isSelected ? "text-white" : "text-gray-200"}`}>
            {session.user_name || "Warga"}
          </p>
          <span className="text-[10px] text-gray-400 shrink-0 whitespace-nowrap">
            {new Date(session.last_message_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>

        {/* Badge Topik */}
        {session.topic && (
          <div className="flex items-center gap-1 w-fit bg-yellow-500/10 border border-yellow-500/20 px-1.5 py-0.5 rounded text-[10px]">
            <TagIcon className="h-3 w-3 text-yellow-500" />
            <span className="font-bold text-yellow-200 truncate max-w-[120px]">
              {session.topic}
            </span>
          </div>
        )}

        {/* Status Text */}
        <p className="text-[10px] mt-0.5 truncate">
          {session.status === "live" && !session.handled_by ? (
            <span className="text-red-400 font-bold flex items-center gap-1">
              ⚠️ Butuh Respon
            </span>
          ) : session.handled_by ? (
            <span className="text-blue-300 flex items-center gap-1">
              <ShieldCheckIcon className="h-3 w-3" /> {session.handled_by.split("@")[0]}
            </span>
          ) : (
            <span className="text-gray-500">Bot Mode</span>
          )}
        </p>
      </div>
    </div>
  );
};

/**
 * --- COMPONENT: MESSAGE BUBBLE ---
 */
const MessageBubble = ({ message }) => {
  const isUser = message.sender === "user";
  return (
    <div className={`flex w-full ${isUser ? "justify-start" : "justify-end"} mb-4`}>
      <div className={`max-w-[85%] md:max-w-[70%] flex gap-2 md:gap-3 ${isUser ? "flex-row" : "flex-row-reverse"}`}>
        
        {/* Avatar (Hidden on tiny screens to save space) */}
        <div className="shrink-0 mt-1 hidden sm:block">
          {isUser ? (
            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
              <UserCircleIcon className="h-5 w-5 text-gray-400" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <BuildingOffice2Icon className="h-4 w-4 text-white" />
            </div>
          )}
        </div>

        {/* Bubble Box */}
        <div className={`p-3 md:p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm break-words ${
          isUser
            ? "bg-white/10 text-gray-100 rounded-tl-none border border-white/5"
            : "bg-blue-600 text-white rounded-tr-none shadow-md"
        }`}>
          <p className="whitespace-pre-wrap">{message.message}</p>
          <p className="text-[10px] opacity-60 mt-1 text-right">
            {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * --- MAIN PAGE: CHAT MANAGER ---
 */
export default function ChatManager() {
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("priority");
  
  const messagesEndRef = useRef(null);

  // --- INITIALIZATION ---
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      fetchSessions();
    };
    init();

    const channel = supabase
      .channel("public:chat_sessions")
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_sessions" }, () => fetchSessions())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // --- FETCH SESSIONS & TOPICS ---
  const fetchSessions = async () => {
    try {
      const { data: sessionData, error } = await supabase
        .from("chat_sessions")
        .select("*")
        .order("last_message_at", { ascending: false });

      if (error || !sessionData) return;

      const sessionIds = sessionData.map((s) => s.id);
      let enrichedSessions = sessionData;

      if (sessionIds.length > 0) {
        const { data: topicMessages } = await supabase
          .from("chat_messages")
          .select("session_id, message")
          .in("session_id", sessionIds)
          .eq("sender", "user")
          .ilike("message", "Halo, saya ingin bertanya mengenai%");

        enrichedSessions = sessionData.map((session) => {
          const topicMsg = topicMessages?.find((m) => m.session_id === session.id);
          const topic = topicMsg 
            ? topicMsg.message.replace(/Halo, saya ingin bertanya mengenai /i, "").replace(/[.]/g, "").trim()
            : null;
          return { ...session, topic };
        });
      }
      setSessions(enrichedSessions);
    } catch (err) {
      console.error("Fetch Error:", err);
    }
  };

  // --- FILTER TABS ---
  useEffect(() => {
    const isLive = (s) => s.status === "live";
    let result = [];
    if (activeTab === "priority") {
      result = sessions.filter((s) => isLive(s) && !s.handled_by);
    } else if (activeTab === "mine") {
      result = sessions.filter((s) => isLive(s) && s.handled_by === currentUser?.email);
    } else {
      result = sessions.filter((s) => s.status === "bot" || (isLive(s) && s.handled_by !== currentUser?.email));
    }
    setFilteredSessions(result);
  }, [sessions, activeTab, currentUser]);

  // --- FETCH MESSAGES ---
  useEffect(() => {
    if (!selectedSession) return;
    
    const loadMessages = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("session_id", selectedSession.id)
        .order("created_at", { ascending: true });
      setMessages(data || []);
      scrollToBottom();
    };
    loadMessages();

    const channel = supabase
      .channel(`chat:${selectedSession.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `session_id=eq.${selectedSession.id}` }, 
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
          scrollToBottom();
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [selectedSession]);

  const scrollToBottom = () => setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

  // --- ACTIONS ---
  const handleClaim = async () => {
    if (!selectedSession || !currentUser) return;
    await supabase.from("chat_sessions").update({ handled_by: currentUser.email }).eq("id", selectedSession.id);
    await supabase.from("chat_messages").insert([{ session_id: selectedSession.id, sender: "system", message: `Percakapan ini ditangani oleh Staff: ${currentUser.email}` }]);
    setSelectedSession(prev => ({ ...prev, handled_by: currentUser.email }));
    setActiveTab("mine");
    fetchSessions();
  };

  const handleResolve = async () => {
    if (!confirm("Akhiri sesi ini?")) return;
    await supabase.from("chat_sessions").update({ status: "bot", handled_by: null }).eq("id", selectedSession.id);
    await supabase.from("chat_messages").insert([{ session_id: selectedSession.id, sender: "system", message: "Sesi live chat diakhiri." }]);
    setSelectedSession(null); // Kembali ke list (Mobile & Desktop)
    setActiveTab("all");
    fetchSessions();
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!reply.trim() || !selectedSession) return;
    if (!selectedSession.handled_by) await handleClaim();

    const text = reply;
    setReply("");

    await supabase.from("chat_messages").insert([{ session_id: selectedSession.id, sender: "system", message: text }]);
    await supabase.from("chat_sessions").update({ last_message_at: new Date(), status: "live" }).eq("id", selectedSession.id);
  };

  // --- LAYOUT RENDER ---
  return (
    // Gunakan 100dvh untuk mobile browser compatibility yang lebih baik
    <div className="h-[calc(100dvh-100px)] md:h-[calc(100vh-140px)] flex gap-0 md:gap-6 font-sans overflow-hidden relative">
      
      {/* === 1. SIDEBAR LIST === 
          Logic: Pada mobile, sembunyikan jika ada sesi yang dipilih. 
          Pada desktop (md), selalu tampilkan.
      */}
      <div className={`
        flex-col w-full md:w-1/3 h-full 
        bg-white/5 backdrop-blur-xl border border-white/10 md:rounded-2xl shadow-2xl overflow-hidden
        absolute md:relative z-10 bg-[#0f172a] md:bg-transparent
        ${selectedSession ? 'hidden md:flex' : 'flex'}
      `}>
        
        {/* Mobile Title (Hanya muncul di mobile) */}
        <div className="md:hidden p-4 border-b border-white/10 bg-black/20 text-center">
          <h1 className="text-white font-bold text-lg">Daftar Percakapan</h1>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-3 bg-black/20 p-1 m-2 rounded-xl shrink-0">
           {[
             { id: "priority", label: "Antrian", icon: FunnelIcon, count: sessions.filter(s => s.status === "live" && !s.handled_by).length },
             { id: "mine", label: "Saya", icon: ShieldCheckIcon },
             { id: "all", label: "Riwayat", icon: ClockIcon }
           ].map(tab => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               className={`relative flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 py-2 text-[10px] md:text-xs font-bold rounded-lg transition-all ${
                 activeTab === tab.id 
                   ? "bg-blue-600 text-white shadow-lg" 
                   : "text-gray-400 hover:text-white hover:bg-white/5"
               }`}
             >
               <tab.icon className="h-4 w-4" />
               <span>{tab.label}</span>
               {tab.count > 0 && (
                 <span className="absolute top-1 right-2 md:-top-1 md:-right-1 bg-red-500 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full border border-black/50">
                   {tab.count}
                 </span>
               )}
             </button>
           ))}
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto px-2 pb-20 md:pb-2 scrollbar-thin scrollbar-thumb-white/10">
          {filteredSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500 gap-2 opacity-60">
              <ChatBubbleLeftRightIcon className="h-10 w-10" />
              <span className="text-xs">Tidak ada data chat</span>
            </div>
          ) : (
            filteredSessions.map(session => (
              <SidebarItem 
                key={session.id} 
                session={session} 
                isSelected={selectedSession?.id === session.id}
                onClick={() => setSelectedSession(session)}
              />
            ))
          )}
        </div>
      </div>

      {/* === 2. CHAT WINDOW === 
          Logic: Pada mobile, sembunyikan jika TIDAK ada sesi yang dipilih.
          Pada desktop, selalu tampil (atau tampilkan placeholder jika null).
      */}
      <div className={`
        flex-col w-full md:flex-1 h-full 
        bg-white/5 backdrop-blur-xl border border-white/10 md:rounded-2xl shadow-2xl overflow-hidden
        absolute md:relative z-20 bg-[#0f172a] md:bg-transparent
        ${selectedSession ? 'flex' : 'hidden md:flex'}
      `}>
        
        {selectedSession ? (
          <>
            {/* Header Chat */}
            <div className="px-4 py-3 md:px-5 md:py-4 bg-black/20 border-b border-white/5 flex justify-between items-center shrink-0 shadow-lg z-10">
              <div className="flex items-center gap-3 overflow-hidden">
                {/* BACK BUTTON (Mobile Only) */}
                <button 
                  onClick={() => setSelectedSession(null)} 
                  className="md:hidden p-2 -ml-2 text-white hover:bg-white/10 rounded-full"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                </button>

                <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-base md:text-lg shadow-lg shrink-0">
                  {selectedSession.user_name?.charAt(0) || "U"}
                </div>
                
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-white text-sm md:text-base truncate">{selectedSession.user_name}</h2>
                    {selectedSession.topic && (
                      <span className="hidden sm:flex items-center gap-1 text-[10px] bg-yellow-500 text-black px-2 py-0.5 rounded-full font-extrabold shadow-sm whitespace-nowrap">
                        <TagIcon className="h-3 w-3" />
                        {selectedSession.topic}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] md:text-xs text-gray-400 flex items-center gap-1.5 mt-0.5 truncate">
                    {selectedSession.status === "live" 
                      ? selectedSession.handled_by 
                        ? <span className="text-blue-300 flex items-center gap-1 truncate"><CheckCircleIcon className="h-3 w-3" /> {selectedSession.handled_by}</span>
                        : <span className="text-red-400 animate-pulse font-bold">⚠️ Menunggu Respon</span>
                      : "🤖 Mode Bot"
                    }
                  </p>
                </div>
              </div>

              {/* Header Actions */}
              <div className="flex gap-1 md:gap-2 shrink-0">
                {selectedSession.status === "live" && !selectedSession.handled_by && (
                  <button onClick={handleClaim} className="flex items-center gap-1 md:gap-2 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-bold shadow-lg transition-all">
                    <UserPlusIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Ambil</span>
                  </button>
                )}
                {selectedSession.status === "live" && selectedSession.handled_by && (
                  <button onClick={handleResolve} className="flex items-center gap-1 md:gap-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-500/30 px-3 py-1.5 md:px-3 md:py-2 rounded-lg text-xs md:text-sm transition-all">
                    <CheckCircleIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Selesai</span>
                  </button>
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-3 md:p-5 bg-black/10 scrollbar-thin scrollbar-thumb-white/10">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 md:p-4 bg-black/20 border-t border-white/5 shrink-0 safe-area-bottom">
              {selectedSession.status === "live" ? (
                (selectedSession.handled_by === currentUser?.email || !selectedSession.handled_by) ? (
                  <form onSubmit={handleReply} className="flex gap-2 md:gap-3 relative">
                    <input
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder={!selectedSession.handled_by ? "Ambil alih..." : "Ketik balasan..."}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/10 transition-all"
                    />
                    <button 
                      type="submit" 
                      disabled={!reply.trim()}
                      className="absolute right-2 top-2 bottom-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-all shadow-lg"
                    >
                      <PaperAirplaneIcon className="h-5 w-5" />
                    </button>
                  </form>
                ) : (
                  <div className="text-center p-3 bg-gray-800/50 rounded-lg border border-white/5 text-gray-400 text-xs md:text-sm">
                    🔒 Chat sedang ditangani staff lain.
                  </div>
                )
              ) : (
                <div className="text-center p-3 bg-gray-800/50 rounded-lg border border-white/5 text-gray-400 text-xs md:text-sm">
                  🤖 Sesi Bot. Klik "Ambil" untuk membalas.
                </div>
              )}
            </div>
          </>
        ) : (
          /* Empty State (Desktop Only - karena di mobile ini hidden) */
          <div className="hidden md:flex flex-1 flex-col items-center justify-center text-gray-500 p-8 text-center opacity-60">
            <ChatBubbleLeftRightIcon className="h-20 w-20 mb-4 opacity-30" />
            <h3 className="text-lg font-bold text-gray-300">Dashboard Live Chat</h3>
            <p className="text-sm max-w-xs mx-auto mt-2">
              Pilih percakapan dari panel kiri untuk mulai melayani warga.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}