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
} from "@heroicons/react/24/solid";

export default function ChatManager() {
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");

  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("priority");

  const messagesEndRef = useRef(null);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getUser();
  }, []);

  useEffect(() => {
    fetchSessions();

    const sessionChannel = supabase
      .channel("public:chat_sessions")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_sessions" },
        () => {
          fetchSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sessionChannel);
    };
  }, []);

  const fetchSessions = async () => {
    const { data } = await supabase
      .from("chat_sessions")
      .select("*")
      .order("last_message_at", { ascending: false });
    setSessions(data || []);
  };

  useEffect(() => {
    if (!currentUser) return;

    let result = [];
    if (activeTab === "priority") {
      result = sessions.filter((s) => s.status === "live" && !s.handled_by);
    } else if (activeTab === "mine") {
      result = sessions.filter(
        (s) => s.status === "live" && s.handled_by === currentUser.email
      );
    } else {
      result = sessions.filter(
        (s) =>
          s.status === "bot" ||
          (s.status === "live" &&
            s.handled_by !== currentUser.email &&
            s.handled_by !== null)
      );
    }
    setFilteredSessions(result);
  }, [sessions, activeTab, currentUser]);

  // 4. LOAD PESAN
  useEffect(() => {
    if (!selectedSession) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("session_id", selectedSession.id)
        .order("created_at", { ascending: true });
      setMessages(data || []);
      scrollToBottom();
    };
    fetchMessages();

    const messageChannel = supabase
      .channel(`chat:${selectedSession.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `session_id=eq.${selectedSession.id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messageChannel);
    };
  }, [selectedSession]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // 5. FITUR CLAIM CHAT (AMBIL ANTREAN)
  const handleClaimChat = async () => {
    if (!selectedSession || !currentUser) return;

    await supabase
      .from("chat_sessions")
      .update({ handled_by: currentUser.email })
      .eq("id", selectedSession.id);

    // Kirim notif sistem di chat
    await supabase.from("chat_messages").insert([
      {
        session_id: selectedSession.id,
        sender: "system",
        message: `Percakapan ini sekarang ditangani oleh Staff: ${currentUser.email}`,
      },
    ]);

    // Pindah ke tab 'mine' otomatis
    setActiveTab("mine");
    setSelectedSession((prev) => ({ ...prev, handled_by: currentUser.email }));
  };

  // 6. KIRIM BALASAN
  const sendReply = async (e) => {
    e.preventDefault();
    if (!reply.trim() || !selectedSession) return;

    // Auto-claim jika belum diklaim (jaga-jaga)
    if (!selectedSession.handled_by) {
      await handleClaimChat();
    }

    const text = reply;
    setReply("");

    await supabase
      .from("chat_messages")
      .insert([
        { session_id: selectedSession.id, sender: "system", message: text },
      ]);

    await supabase
      .from("chat_sessions")
      .update({
        last_message_at: new Date(),
        status: "live",
      })
      .eq("id", selectedSession.id);
  };

  // 7. SELESAIKAN CHAT
  const handleResolve = async () => {
    if (!confirm("Akhiri sesi ini? Chat akan kembali ke mode Bot.")) return;

    await supabase
      .from("chat_sessions")
      .update({ status: "bot", handled_by: null })
      .eq("id", selectedSession.id);

    await supabase.from("chat_messages").insert([
      {
        session_id: selectedSession.id,
        sender: "system",
        message: "Sesi live chat diakhiri. Kembali ke asisten virtual.",
      },
    ]);

    setSelectedSession(null);
    setActiveTab("all"); // Pindah ke tab history
  };

  return (
    <div className="h-[calc(100vh-180px)] md:h-[calc(100vh-140px)] flex flex-col md:flex-row gap-4 md:gap-6">
      {/* --- SIDEBAR (GLASS) --- */}
      <div className="w-full md:w-1/3 h-1/2 md:h-full bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden flex flex-col shadow-xl">
        {/* TAB FILTER */}
        <div className="p-2 grid grid-cols-3 gap-1 bg-white/5 border-b border-white/10">
          <button
            onClick={() => setActiveTab("priority")}
            className={`text-xs py-2 rounded-lg font-bold transition flex flex-col items-center gap-1 ${
              activeTab === "priority"
                ? "bg-red-500/80 text-white shadow-lg"
                : "text-gray-400 hover:bg-white/5"
            }`}
          >
            <div className="relative">
              <FunnelIcon className="h-4 w-4" />
              {/* Badge Counter */}
              {sessions.filter((s) => s.status === "live" && !s.handled_by)
                .length > 0 && (
                <span className="absolute -top-1 -right-2 bg-white text-red-600 w-3 h-3 text-[8px] flex items-center justify-center rounded-full font-extrabold">
                  {
                    sessions.filter((s) => s.status === "live" && !s.handled_by)
                      .length
                  }
                </span>
              )}
            </div>
            Perlu Ditangani
          </button>
          <button
            onClick={() => setActiveTab("mine")}
            className={`text-xs py-2 rounded-lg font-bold transition flex flex-col items-center gap-1 ${
              activeTab === "mine"
                ? "bg-blue-600 text-white shadow-lg"
                : "text-gray-400 hover:bg-white/5"
            }`}
          >
            <ShieldCheckIcon className="h-4 w-4" />
            Chat Saya
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`text-xs py-2 rounded-lg font-bold transition flex flex-col items-center gap-1 ${
              activeTab === "all"
                ? "bg-gray-600 text-white shadow-lg"
                : "text-gray-400 hover:bg-white/5"
            }`}
          >
            <ClockIcon className="h-4 w-4" />
            Riwayat Bot
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {filteredSessions.length === 0 && (
            <div className="text-center py-10 text-gray-500 text-xs opacity-60">
              Tidak ada chat di kategori ini
            </div>
          )}

          {filteredSessions.map((session) => (
            <div
              key={session.id}
              onClick={() => setSelectedSession(session)}
              className={`p-3 rounded-xl cursor-pointer transition-all border group relative ${
                selectedSession?.id === session.id
                  ? "bg-blue-600/30 border-blue-500/50 shadow-lg"
                  : "bg-transparent border-transparent hover:bg-white/5 hover:border-white/10"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-full relative ${
                    session.status === "live"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  <UserCircleIcon className="h-6 w-6" />
                  {session.status === "live" && !session.handled_by && (
                    <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-[#0f172a] animate-pulse"></span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <p className="font-semibold text-gray-100 text-sm truncate">
                      {session.user_name || "Warga"}
                    </p>
                    <span className="text-[10px] text-gray-400">
                      {new Date(session.last_message_at).toLocaleTimeString(
                        [],
                        { hour: "2-digit", minute: "2-digit" }
                      )}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1 truncate">
                    {session.status === "live" && !session.handled_by ? (
                      <span className="text-red-400 font-bold">
                        BUTUH RESPON!
                      </span>
                    ) : session.handled_by ? (
                      <span className="text-blue-300">
                        Dihandle: {session.handled_by.split("@")[0]}
                      </span>
                    ) : (
                      <span>Bot mode</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- CHAT WINDOW (GLASS) --- */}
      <div className="flex-1 h-1/2 md:h-full bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl flex flex-col overflow-hidden relative">
        {selectedSession ? (
          <>
            {/* HEADER CHAT */}
            <div className="p-4 bg-white/5 border-b border-white/10 flex justify-between items-center z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                  {selectedSession.user_name?.charAt(0) || "W"}
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">
                    {selectedSession.user_name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs">
                    {selectedSession.status === "live" ? (
                      selectedSession.handled_by ? (
                        <span className="text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded border border-blue-500/30">
                          Ditangani: {selectedSession.handled_by}
                        </span>
                      ) : (
                        <span className="text-red-300 bg-red-500/20 px-2 py-0.5 rounded border border-red-500/30 animate-pulse">
                          MENUNGGU STAFF
                        </span>
                      )
                    ) : (
                      <span className="text-gray-400">🤖 Mode Bot</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                {/* TOMBOL CLAIM (Hanya muncul jika live & belum ada yg ambil) */}
                {selectedSession.status === "live" &&
                  !selectedSession.handled_by && (
                    <button
                      onClick={handleClaimChat}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-500/20 transition animate-bounce"
                    >
                      <UserPlusIcon className="h-4 w-4" />
                      Ambil Chat
                    </button>
                  )}

                {/* TOMBOL SELESAI */}
                {selectedSession.status === "live" &&
                  selectedSession.handled_by && (
                    <button
                      onClick={handleResolve}
                      className="flex items-center gap-2 px-3 py-1.5 bg-green-600/20 hover:bg-green-600/40 border border-green-500/30 text-green-300 rounded-lg text-sm transition"
                    >
                      <CheckCircleIcon className="h-4 w-4" />
                      Selesai
                    </button>
                  )}
              </div>
            </div>

            {/* ISI PESAN */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-black/10">
              {messages.map((msg, idx) => {
                const isUser = msg.sender === "user";
                return (
                  <div
                    key={idx}
                    className={`flex ${
                      isUser ? "justify-start" : "justify-end"
                    }`}
                  >
                    <div
                      className={`max-w-[75%] flex gap-3 ${
                        isUser ? "flex-row" : "flex-row-reverse"
                      }`}
                    >
                      <div className="shrink-0 mt-1">
                        {isUser ? (
                          <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                            <UserCircleIcon className="h-5 w-5 text-gray-300" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                            <BuildingOffice2Icon className="h-5 w-5 text-white" />
                          </div>
                        )}
                      </div>
                      <div
                        className={`p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                          isUser
                            ? "bg-white/10 text-white rounded-tl-none border border-white/10"
                            : "bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-900/20"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.message}</p>
                        <p className="text-[10px] opacity-50 mt-1 text-right">
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* INPUT BALASAN */}
            {selectedSession.status === "live" ? (
              selectedSession.handled_by === currentUser?.email ||
              !selectedSession.handled_by ? (
                <div className="p-4 bg-white/5 border-t border-white/10">
                  <form onSubmit={sendReply} className="flex gap-3">
                    <input
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                      placeholder={
                        !selectedSession.handled_by
                          ? "Ketik untuk mengambil alih chat..."
                          : "Ketik balasan..."
                      }
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={!reply.trim()}
                      className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white p-3 rounded-xl transition shadow-lg shadow-blue-500/20"
                    >
                      <PaperAirplaneIcon className="h-6 w-6" />
                    </button>
                  </form>
                </div>
              ) : (
                <div className="p-4 bg-gray-800/50 text-center text-gray-400 text-sm border-t border-white/10">
                  Chat ini sedang ditangani oleh staff lain.
                </div>
              )
            ) : (
              <div className="p-4 bg-gray-800/50 text-center text-gray-400 text-sm border-t border-white/10">
                Sesi ini ditangani oleh Bot.
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-white/30">
            <UserCircleIcon className="h-20 w-20 mb-4 opacity-20" />
            <p className="text-lg font-medium">Dashboard Chat</p>
            <p className="text-sm">
              Pilih tab "Perlu Ditangani" untuk melihat chat masuk.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
