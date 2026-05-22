'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'client' | 'admin'>('client');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const login = useAuthStore((state) => state.login);
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        try {
            setLoading(true);
            const res = await api.post('/auth/register', { name, email, password, role });
            login(res.data.token, res.data);
            router.push('/');
        } catch (err: any) {
            console.error('Registration failed', err);
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-[#0F172A] flex items-center justify-center p-4 font-sans relative overflow-hidden">
            {/* Ambient background decoration */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px]"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[128px]"></div>

            <div className="bg-white/10 backdrop-blur-xl border border-white/10 p-10 rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] w-full max-w-md transform transition-all hover:scale-[1.01] duration-500 z-10">
                <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-indigo-200 mb-2 text-center tracking-tight">Create Account</h1>
                <p className="text-center text-slate-300 text-sm mb-8">Sign up to coordinate your tasks effectively</p>
                
                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm font-medium text-center animate-pulse">
                        {error}
                    </div>
                )}

                <form onSubmit={handleRegister} className="space-y-5">
                    <div>
                        <label className="block text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-2">Full Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-5 py-3.5 rounded-xl border border-white/5 bg-white/5 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/10 transition-all font-medium"
                            placeholder="John Doe"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-2">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-5 py-3.5 rounded-xl border border-white/5 bg-white/5 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/10 transition-all font-medium"
                            placeholder="hello@example.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-2">Account Type</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value as any)}
                            className="w-full px-5 py-3.5 rounded-xl border border-white/5 bg-[#1F2937]/75 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium cursor-pointer"
                        >
                            <option value="client" className="bg-[#1E293B] text-slate-100">Client (Task Giver)</option>
                            <option value="admin" className="bg-[#1E293B] text-slate-100">Admin (Workspace Manager)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-5 py-3.5 rounded-xl border border-white/5 bg-white/5 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/10 transition-all font-medium"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-2">Confirm Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-5 py-3.5 rounded-xl border border-white/5 bg-white/5 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/10 transition-all font-medium"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 mt-8 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? 'Creating Account...' : 'Get Started'}
                    </button>
                </form>

                <div className="mt-8 text-center text-slate-400 text-sm font-medium">
                    Already have an account? <Link href="/login" className="text-indigo-300 hover:text-white transition-colors hover:underline">Sign in</Link>
                </div>
            </div>
        </div>
    );
}
