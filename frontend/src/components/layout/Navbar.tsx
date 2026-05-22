import { useAuthStore } from '@/store/useAuthStore';
import { LogOut, Layout } from 'lucide-react';

export default function Navbar() {
    const { user, logout } = useAuthStore();

    return (
        <nav className="h-16 border-b border-slate-800/80 bg-[#0F172A]/70 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-50">
            <div className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 flex items-center justify-center transform hover:rotate-12 transition-transform">
                    <Layout className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-black tracking-tight text-white bg-clip-text">ArcTask</span>
            </div>
            
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-3 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700/50">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-xs font-bold text-white shadow-inner">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="text-sm font-semibold text-slate-200 pr-1 hidden sm:block">{user?.name}</span>
                </div>
                <button 
                    onClick={logout} 
                    className="text-slate-400 hover:text-rose-400 transition-colors p-2 hover:bg-rose-500/10 rounded-xl"
                    title="Sign Out"
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </div>
        </nav>
    );
}
