import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: SocketIOServer;

export const initSocket = (server: HttpServer) => {
    io = new SocketIOServer(server, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
        }
    });

    io.on('connection', (socket) => {
        console.log(`[Socket] Connected: ${socket.id}`);

        socket.on('join_board', (data: { projectId: string; user: { _id: string; name: string } }) => {
            const { projectId, user } = data;
            socket.join(projectId);
            socket.to(projectId).emit('user_joined', { userId: user._id, name: user.name });
            console.log(`[Socket] ${user.name} joined board: ${projectId}`);
        });

        socket.on('leave_board', (data: { projectId: string; user: { _id: string; name: string } }) => {
            const { projectId, user } = data;
            socket.leave(projectId);
            socket.to(projectId).emit('user_left', { userId: user._id, name: user.name });
            console.log(`[Socket] ${user.name} left board: ${projectId}`);
        });

        socket.on('disconnect', () => {
            console.log(`[Socket] Disconnected: ${socket.id}`);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io has not been initialized!');
    }
    return io;
};
