import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { ShieldCheckIcon, KeyIcon } from '@heroicons/react/24/outline';

export default function ResetPassword() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        // Supabase secara otomatis menangani token dari URL ke session
        // Kita hanya perlu mengecek apakah user sudah "auth" via link tersebut
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                // Jika tidak ada session, berarti link tidak valid atau expired
                console.log("No session found for reset password");
            }
        };
        checkSession();
    }, []);

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            return setError('Password konfirmasi tidak cocok!');
        }

        setLoading(true);
        const { error } = await supabase.auth.updateUser({ password });

        if (error) {
            setError(error.message);
        } else {
            alert('Password berhasil diperbarui! Silakan login dengan password baru.');
            navigate('/');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[#0f172a]">
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-8 rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden">
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500/30 rounded-full blur-2xl"></div>

                <div className="relative z-10">
                    <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-400">
                        <ShieldCheckIcon className="h-10 w-10" />
                    </div>

                    <h2 className="text-3xl font-bold mb-2 text-white text-center">Password Baru</h2>
                    <p className="text-blue-200 mb-8 text-sm text-center">Silakan masukkan password baru Anda.</p>

                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/50 text-red-400 rounded-xl mb-6 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleUpdatePassword} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-blue-100 mb-1">Password Baru</label>
                            <div className="relative">
                                <KeyIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 text-white p-3 pl-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400 transition"
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-blue-100 mb-1">Konfirmasi Password Baru</label>
                            <div className="relative">
                                <KeyIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 text-white p-3 pl-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400 transition"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>
                        <button
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white font-bold p-3 rounded-lg hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 shadow-green-500/20"
                        >
                            {loading ? 'Memproses...' : 'Perbarui Password'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
