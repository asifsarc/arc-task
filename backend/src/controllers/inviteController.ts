import { Request, Response } from 'express';
import crypto from 'crypto';
import { Invitation } from '../models/Invitation';
import { Project } from '../models/Project';
import sendEmail from '../utils/sendEmail';
import asyncHandler from '../utils/asyncHandler';
import { AuthRequest } from '../middlewares/authMiddleware';

// @desc    Invite user via email
// @route   POST /api/invites
// @access  Private (Owner/Leader)
export const inviteUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { email, projectId } = req.body;

    const project = await Project.findById(projectId);

    if (!project) {
        res.status(404);
        throw new Error('Project not found');
    }

    // Verify ownership permissions over the project being accessed
    const isOwner = project.ownerId.toString() === req.user?._id.toString();
    const isMemberOwner = project.members.some(
        (m) => m.userId.toString() === req.user?._id.toString() && m.role === 'owner'
    );

    if (!isOwner && !isMemberOwner) {
        res.status(403);
        throw new Error('Not authorized to invite people to this project board');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const invitation = await Invitation.create({
        email,
        projectId,
        invitedBy: req.user?._id,
        token,
        status: 'pending',
        expiresAt,
    });

    const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invite/${token}`;

    const messageHtml = `
      <div style="font-family: inherit, sans-serif; background-color: #f1f5f9; padding: 40px;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 16px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
          <h2 style="color: #4f46e5; margin-bottom: 20px; font-weight: 800; text-align: center;">You've been invited!</h2>
          <p style="color: #475569; font-size: 16px; line-height: 1.6; text-align: center;">You have received a secure invitation to collaborate as a client on the workspace board <strong>${project.name}</strong> at ArcTask.</p>
          <div style="margin-top: 30px; margin-bottom: 30px; text-align: center;">
            <a href="${inviteUrl}" style="background-color: #4f46e5; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; border: none; display: inline-block;">Accept Invitation</a>
          </div>
          <p style="font-size: 12px; color: #94a3b8; font-style: italic; text-align: center;">For security purposes, this magic link automatically expires in strictly 48 hours. Please do not share this link with anyone.</p>
        </div>
      </div>
    `;

    try {
        await sendEmail({
            to: email,
            subject: `ArcTask: Collaboration Invite to join ${project.name}`,
            html: messageHtml
        });

        res.status(201).json({ message: 'Invitation effectively created and email dispatched!', invitationId: invitation._id });
    } catch (error) {
        console.error('SMTP Transport failed', error);
        
        // Revoke token immediately if email bounces/fails structurally to avoid orphan tokens
        invitation.status = 'expired';
        await invitation.save();
        
        res.status(500);
        throw new Error('Email transit service failed. Invitation revoked.');
    }
});

// @desc    Accept invitation mapped via its magic link token
// @route   POST /api/invites/:token/accept
// @access  Private
export const acceptInvitation = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { token } = req.params;

    const invitation = await Invitation.findOne({ token, status: 'pending' });

    if (!invitation) {
        res.status(404);
        throw new Error('Invalid or expired invitation token');
    }

    if (new Date() > invitation.expiresAt) {
        invitation.status = 'expired';
        await invitation.save();
        res.status(400);
        throw new Error('Invitation expired');
    }

    // Security check to avoid someone else accepting invitation sent strictly to `email`
    if (invitation.email !== req.user?.email) {
        res.status(403);
        throw new Error('This invitation magic link corresponds to a different email address');
    }

    const project = await Project.findById(invitation.projectId);

    if (!project) {
        res.status(404);
        throw new Error('Project no longer exists');
    }

    const isAlreadyMember = project.members.some(m => m.userId.toString() === req.user?._id.toString());
    
    if (!isAlreadyMember) {
        project.members.push({ userId: req.user?._id as any, role: 'client' });
        await project.save();
    }

    invitation.status = 'accepted';
    await invitation.save();

    res.json({ message: 'Successfully joined board as a client member.', projectId: project._id });
});
