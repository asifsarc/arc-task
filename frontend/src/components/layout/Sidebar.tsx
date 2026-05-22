import Link from 'next/link';
import { Home, Zap } from 'lucide-react';

export default function Sidebar() {
    const navItems = [
        { icon: Home, label: 'Boards', path: '/' },
    ];

    return (
        <aside className="w-64 border-r border-slate-800/80 bg-[#0F172A]/40 backdrop-blur-2xl hidden md:flex flex-col p-4 z-40 relative">
            <div className="space-y-1.5 mt-4 flex-1">
                {navItems.map((item) => (
                    <Link href={item.path} key={item.label}>
                        <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-gradient-to-r hover:from-indigo-500/10 hover:to-transparent border-l-2 border-transparent hover:border-indigo-500 transition-all group">
                            <item.icon className="w-5 h-5 group-hover:text-indigo-400 transition-colors" />
                            <span className="font-semibold text-sm tracking-wide">{item.label}</span>
                        </div>
                    </Link>
                ))}
            </div>
            
            <div className="mt-auto mb-4">
                <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-900/40 via-purple-900/20 to-slate-900 border border-indigo-500/20 relative overflow-hidden group hover:border-indigo-500/40 transition-colors">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-2xl rounded-full group-hover:bg-purple-500/20 transition-all"></div>
                    <Zap className="w-6 h-6 text-yellow-400 mb-3" />
                    <h4 className="text-sm font-bold text-white mb-1">Upgrade to ArcTask Pro</h4>
                    <p className="text-xs text-slate-400 mb-4 font-medium leading-relaxed">Collaborate natively, manage access, and scale.</p>
                    <button className="w-full py-2.5 bg-white/10 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors">
                        Unlock Features
                    </button>
                </div>
            </div>
        </aside>
    );
}
