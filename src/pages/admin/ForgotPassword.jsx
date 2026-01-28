import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleReset = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) {
            setError(error.message);
        } else {
            setMessage('Instruksi reset password telah dikirim ke email Anda. Silakan cek inbox atau folder spam.');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[#0f172a]">
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-8 rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/30 rounded-full blur-2xl"></div>

                <div className="relative z-10">
                    <Link to="/" className="inline-flex items-center gap-2 text-blue-300 hover:text-white mb-6 transition">
                        <ArrowLeftIcon className="h-4 w-4" />
                        <span className="text-sm">Kembali ke Login</span>
                    </Link>

                    <h2 className="text-3xl font-bold mb-2 text-white">Lupa Password?</h2>
                    <p className="text-blue-200 mb-8 text-sm">Masukkan email Anda untuk menerima link reset password.</p>

                    {message && (
                        <div className="p-4 bg-green-500/10 border border-green-500/50 text-green-400 rounded-xl mb-6 text-sm">
                            {message}
                        </div>
                    )}

                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/50 text-red-400 rounded-xl mb-6 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleReset} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-blue-100 mb-1">Email Terdaftar</label>
                            <div className="relative">
                                <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 text-white p-3 pl-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400 transition"
                                    placeholder="admin@kelurahan.go.id"
                                    required
                                />
                            </div>
                        </div>
                        <button
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold p-3 rounded-lg hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50"
                        >
                            {loading ? 'Mengirim...' : 'Kirim Link Reset'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
