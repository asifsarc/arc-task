import mongoose, { Schema, Document } from 'mongoose';

export interface ITask extends Document {
    projectId: mongoose.Types.ObjectId;
    title: string;
    description?: string;
    status: 'Todo' | 'Doing' | 'Done';
    order: number;
    assignedTo: mongoose.Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const taskSchema: Schema = new Schema(
    {
        projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
        title: { type: String, required: true },
        description: { type: String },
        status: { type: String, enum: ['Todo', 'Doing', 'Done'], default: 'Todo' },
        order: { type: Number, required: true, default: 0 },
        assignedTo: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    },
    {
        timestamps: true,
    }
);

export const Task = mongoose.model<ITask>('Task', taskSchema);
