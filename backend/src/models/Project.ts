import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User';

export interface IMember {
    userId: mongoose.Types.ObjectId | IUser;
    role: 'owner' | 'client';
}

export interface IProject extends Document {
    name: string;
    description?: string;
    ownerId: mongoose.Types.ObjectId | IUser;
    members: IMember[];
    createdAt: Date;
    updatedAt: Date;
}

const memberSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['owner', 'client'], default: 'client' }
}, { _id: false });

const projectSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        description: { type: String },
        ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        members: [memberSchema],
    },
    {
        timestamps: true,
    }
);

export const Project = mongoose.model<IProject>('Project', projectSchema);
