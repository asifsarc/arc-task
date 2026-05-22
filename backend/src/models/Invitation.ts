import mongoose, { Schema, Document } from 'mongoose';

export interface IInvitation extends Document {
    email: string;
    projectId: mongoose.Types.ObjectId;
    invitedBy: mongoose.Types.ObjectId;
    token: string;
    status: 'pending' | 'accepted' | 'expired';
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const invitationSchema: Schema = new Schema(
    {
        email: { type: String, required: true },
        projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
        invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        token: { type: String, required: true, unique: true },
        status: { type: String, enum: ['pending', 'accepted', 'expired'], default: 'pending' },
        expiresAt: { type: Date, required: true }
    },
    {
        timestamps: true,
    }
);

export const Invitation = mongoose.model<IInvitation>('Invitation', invitationSchema);
