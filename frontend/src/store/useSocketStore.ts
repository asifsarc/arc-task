import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

interface SocketState {
    socket: Socket | null;
    connectSocket: () => void;
    disconnectSocket: () => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
    socket: null,
    connectSocket: () => {
        if (!get().socket) {
            // Strip '/api' out of NEXT_PUBLIC_API_URL to construct pure root WebSocket connection
            const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5001';
            const socketInstance = io(backendUrl);
            set({ socket: socketInstance });
        }
    },
    disconnectSocket: () => {
        const { socket } = get();
        if (socket) {
            socket.disconnect();
            set({ socket: null });
        }
    }
}));
