import dotenv from 'dotenv';
dotenv.config({ override: true });

import app from './app';
import connectDB from './config/db';
import { createServer } from 'http';
import { initSocket } from './utils/socket';

const PORT = process.env.PORT || 5000;
const httpServer = createServer(app);

// Initialize Socket.io logic
initSocket(httpServer);

connectDB().then(() => {
    httpServer.listen(PORT, () => {
        console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
});
