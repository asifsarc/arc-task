import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { notFound, errorHandler } from './middlewares/errorMiddleware';
import authRoutes from './routes/authRoutes';
import inviteRoutes from './routes/inviteRoutes';
import projectRoutes from './routes/projectRoutes';

const app: Application = express();

// Middlewares
app.use(express.json());
app.use(cors());
app.use(helmet());

// Routes
app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/invites', inviteRoutes);
app.use('/api/projects', projectRoutes);
// app.use('/api/projects', projectRoutes);
// app.use('/api/tasks', taskRoutes);

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

export default app;
