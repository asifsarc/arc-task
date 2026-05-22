import dotenv from 'dotenv';
dotenv.config();
import { User } from './models/User';
import { Project } from './models/Project';
import { Task } from './models/Task';
import connectDB from './config/db';

const seedDB = async () => {
    try {
        await connectDB();

        let user = await User.findOne({ email: 'demo@example.com' });
        
        if (!user) {
            user = await User.create({
                name: 'Demo Client',
                email: 'demo@example.com',
                password: 'password123'
            });
            console.log('Demo user created.');
        } else {
            console.log('Demo user already exists.');
            user.password = 'password123';
            await user.save();
        }

        const projects = await Project.find({ ownerId: user._id });
        if (projects.length === 0) {
            const project = await Project.create({
                name: 'Master Sandbox',
                description: 'Test your drag and drop and API sockets here.',
                ownerId: user._id,
                members: [{ userId: user._id, role: 'owner' }]
            });

            await Task.create([
                { projectId: project._id, title: 'Analyze drag physics', description: 'Evaluate optimistic updating algorithms locally.', status: 'Todo', order: 1000 },
                { projectId: project._id, title: 'Inspect Socket Hooks', description: 'Test realtime sync handling natively across environments.', status: 'Doing', order: 1000 },
                { projectId: project._id, title: 'Configure Database Hooks', description: 'MongoDB seeded safely.', status: 'Done', order: 1000 }
            ]);
            console.log('Demo project and tasks natively injected.');
        }

        console.log('====================================');
        console.log('Demo Account Ready:');
        console.log('Email: demo@example.com');
        console.log('Password: password123');
        console.log('====================================');
        process.exit(0);
    } catch (error) {
        console.error('Seeding Failure:', error);
        process.exit(1);
    }
};

seedDB();
