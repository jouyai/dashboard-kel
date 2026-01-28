import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { UserPlusIcon, KeyIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

export default function AccountManager() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Password Change State
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // New Admin State
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [newAdminPassword, setNewAdminPassword] = useState('');

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        getUser();
    }, []);

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            return setMessage({ type: 'error', text: 'Password konfirmasi tidak cocok!' });
        }

        setLoading(true);
        const { error } = await supabase.auth.updateUser({ password: newPassword });

        if (error) {
            setMessage({ type: 'error', text: error.message });
        } else {
            setMessage({ type: 'success', text: 'Password berhasil diperbarui!' });
            setNewPassword('');
            setConfirmPassword('');
        }
        setLoading(false);
    };

    const handleCreateAdmin = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Note: signUp will work, but depending on Supabase settings, 
        // it might send a confirmation email or just create the user.
        const { data, error } = await supabase.auth.signUp({
            email: newAdminEmail,
            password: newAdminPassword,
            options: {
                data: {
                    role: 'admin'
                }
            }
        });

        if (error) {
            setMessage({ type: 'error', text: error.message });
        } else {
            setMessage({ type: 'success', text: `Admin baru (${newAdminEmail}) berhasil didaftarkan! Silakan cek email untuk verifikasi (jika aktif).` });
            setNewAdminEmail('');
            setNewAdminPassword('');
        }
        setLoading(false);
    };

    return (
        <div className="space-y-8 pb-12">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Manajemen Akun</h1>
                <p className="text-blue-300">Kelola akses dashboard dan keamanan akun Anda.</p>
            </div>

            {message.text && (
                <div className={`p-4 rounded-xl border ${message.type === 'success' ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-red-500/10 border-red-500/50 text-red-400'}`}>
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* GANTI PASSWORD */}
                <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
                            <KeyIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Ganti Password</h2>
                            <p className="text-sm text-gray-400">Update password akun Anda yang sekarang ({user?.email})</p>
                        </div>
                    </div>

                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Password Baru</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full bg-black/30 border border-white/10 text-white p-3 rounded-xl focus:ring-2 focus:ring-blue-500 transition shadow-inner"
                                placeholder="••••••••"
                                required
                                minLength={6}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Konfirmasi Password Baru</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-black/30 border border-white/10 text-white p-3 rounded-xl focus:ring-2 focus:ring-blue-500 transition shadow-inner"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        <button
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold p-3 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50"
                        >
                            {loading ? 'Memproses...' : 'Simpan Password Baru'}
                        </button>
                    </form>
                </div>

                {/* TAMBAH ADMIN BARU */}
                <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400">
                            <UserPlusIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Tambah Akses Admin</h2>
                            <p className="text-sm text-gray-400">Daftarkan email staff baru untuk akses dashboard</p>
                        </div>
                    </div>

                    <form onSubmit={handleCreateAdmin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Email Staff Baru</label>
                            <input
                                type="email"
                                value={newAdminEmail}
                                onChange={(e) => setNewAdminEmail(e.target.value)}
                                className="w-full bg-black/30 border border-white/10 text-white p-3 rounded-xl focus:ring-2 focus:ring-purple-500 transition shadow-inner"
                                placeholder="staff@kelurahan.go.id"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Password Sementara</label>
                            <input
                                type="password"
                                value={newAdminPassword}
                                onChange={(e) => setNewAdminPassword(e.target.value)}
                                className="w-full bg-black/30 border border-white/10 text-white p-3 rounded-xl focus:ring-2 focus:ring-purple-500 transition shadow-inner"
                                placeholder="••••••••"
                                required
                                minLength={6}
                            />
                        </div>
                        <button
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold p-3 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50"
                        >
                            {loading ? 'Memproses...' : 'Daftarkan Admin Baru'}
                        </button>
                        <p className="text-[10px] text-gray-400 mt-4 leading-relaxed italic">
                            *Setelah didaftarkan, user bisa langsung login (jika Auto-Confirm aktif di Supabase) atau cek email untuk verifikasi.
                        </p>
                    </form>
                </div>

            </div>

            {/* INFO KEAMANAN */}
            <div className="bg-blue-600/10 border border-blue-500/20 p-6 rounded-2xl flex items-start gap-4">
                <ShieldCheckIcon className="h-8 w-8 text-blue-400 shrink-0" />
                <div>
                    <h3 className="text-white font-bold mb-1">Tips Keamanan</h3>
                    <p className="text-sm text-blue-200/70 leading-relaxed">
                        Pastikan password minimal 6 karakter dengan kombinasi huruf dan angka. Jangan berikan akses admin kepada pihak luar yang tidak berkepentingan. Segera hapus akses melalui Supabase Dashboard jika staff sudah tidak bertugas.
                    </p>
                </div>
            </div>
        </div>
    );
}
