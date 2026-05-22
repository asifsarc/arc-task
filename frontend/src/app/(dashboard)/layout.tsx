'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useSocketStore } from '@/store/useSocketStore';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, checkAuth } = useAuthStore();
    const { connectSocket, disconnectSocket } = useSocketStore();
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initializeProtection = async () => {
            await checkAuth();
            setLoading(false);
        };
        initializeProtection();
    }, [checkAuth]);

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            disconnectSocket();
            router.push('/login');
        } else if (!loading && isAuthenticated) {
            connectSocket();
        }
    }, [loading, isAuthenticated, router, connectSocket, disconnectSocket]);

    if (loading || !isAuthenticated) {
        return (
            <div className="min-h-screen bg-[#0F172A] flex flex-col gap-4 items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-indigo-400 font-medium animate-pulse">Authenticating Identity...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0F172A] text-slate-200 flex flex-col font-sans">
            <Navbar />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar />
                <main className="flex-1 overflow-y-auto p-6 md:p-8 scrollbar-hide relative">
                    {/* Subtle page-level background glow */}
                    <div className="absolute top-0 right-0 w-full h-96 bg-gradient-to-b from-indigo-900/10 to-transparent pointer-events-none -z-10"></div>
                    {children}
                </main>
            </div>
        </div>
    );
}
