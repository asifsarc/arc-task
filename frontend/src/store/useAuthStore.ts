import { create } from 'zustand';
import api from '@/lib/api';
import Cookies from 'js-cookie';

interface User {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    role?: 'client' | 'admin';
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    login: (token: string, userData: User) => void;
    logout: () => void;
    checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    login: (token, userData) => {
        Cookies.set('jwt', token, { expires: 30, secure: true }); // Secure HTTP token bridging
        set({ user: userData, isAuthenticated: true });
    },
    logout: () => {
        Cookies.remove('jwt');
        set({ user: null, isAuthenticated: false });
    },
    checkAuth: async () => {
        try {
            const token = Cookies.get('jwt');
            if (!token) throw new Error('No authorization token present');
            const res = await api.get('/auth/profile');
            set({ user: res.data, isAuthenticated: true });
        } catch {
            set({ user: null, isAuthenticated: false });
        }
    }
}));
