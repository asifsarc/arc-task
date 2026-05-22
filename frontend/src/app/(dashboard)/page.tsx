'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import { Briefcase, Users, Plus, Shield, FolderOpen, Check } from 'lucide-react';

interface Project {
    _id: string;
    name: string;
    description: string;
    ownerId: {
        _id: string;
        name: string;
        email: string;
    };
    members: {
        userId: {
            _id: string;
            name: string;
            email: string;
            avatar?: string;
        };
        role: 'owner' | 'client';
    }[];
}

interface ClientUser {
    _id: string;
    name: string;
    email: string;
    role: string;
}

export default function DashboardPage() {
    const { user } = useAuthStore();
    const [projects, setProjects] = useState<Project[]>([]);
    const [clients, setClients] = useState<ClientUser[]>([]);
    const [activeTab, setActiveTab] = useState<'workspaces' | 'clients'>('workspaces');
    const [isCreating, setIsCreating] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [assignedClientId, setAssignedClientId] = useState('');

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await api.get('/projects');
                setProjects(res.data);
            } catch (error) {
                console.error('Failed to fetch projects', error);
            }
        };
        fetchProjects();
    }, []);

    useEffect(() => {
        if (user?.role === 'admin') {
            const fetchClients = async () => {
                try {
                    const res = await api.get('/auth/clients');
                    setClients(res.data);
                } catch (error) {
                    console.error('Failed to fetch clients', error);
                }
            };
            fetchClients();
        }
    }, [user]);

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        
        setIsCreating(true);
        try {
            const payload = {
                name,
                description,
                assignedClientId: assignedClientId || undefined
            };
            const res = await api.post('/projects', payload);
            
            // Re-fetch projects to make sure members are fully populated from backend
            const refreshRes = await api.get('/projects');
            setProjects(refreshRes.data);
            
            setIsModalOpen(false);
            setName('');
            setDescription('');
            setAssignedClientId('');
        } catch (error) {
            console.error('Failed to create new board', error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleAssignClient = async (projectId: string, clientIds: string[]) => {
        try {
            const res = await api.put(`/projects/${projectId}/assign`, { clientIds });
            setProjects(prev => prev.map(p => p._id === projectId ? res.data : p));
        } catch (error) {
            console.error('Failed to assign clients to project', error);
        }
    };

    const getClientProjects = (clientId: string) => {
        return projects.filter(p => 
            p.members?.some((m: any) => (m.userId?._id || m.userId) === clientId)
        );
    };

    const getProjectClientName = (project: Project) => {
        const clientMember = project.members?.find(m => m.role === 'client');
        return clientMember?.userId?.name || 'Unassigned';
    };

    const getUnassignedProjectsForClient = (clientId: string) => {
        return projects.filter(p => 
            !p.members?.some((m: any) => (m.userId?._id || m.userId) === clientId)
        );
    };

    return (
        <div className="h-full z-10 w-full max-w-7xl mx-auto relative">
            {/* Header section with User Info */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-10 gap-4">
                <div>
                    <div className="flex items-center gap-2.5 mb-1.5">
                        <h1 className="text-4xl font-extrabold text-white tracking-tight">
                            {user?.role === 'admin' ? 'Admin Control Center' : 'Your Workspace'}
                        </h1>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-extrabold flex items-center gap-1 ${
                            user?.role === 'admin' 
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                            : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        }`}>
                            <Shield className="w-3 h-3" /> {user?.role || 'Client'}
                        </span>
                    </div>
                    <p className="text-slate-400 font-medium text-sm">
                        {user?.role === 'admin' 
                            ? 'Deploy workspaces, audit client projects, and manage secure tenant integrations.'
                            : 'Coordinate agile tasks, view sprint progress, and collaborate in real-time.'}
                    </p>
                </div>

                {user?.role === 'admin' && (
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl shadow-[0_0_15px_rgba(79,70,229,0.4)] hover:shadow-[0_0_25px_rgba(79,70,229,0.7)] transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 font-bold flex-shrink-0"
                    >
                        <Plus className="w-5 h-5" /> Launch Workspace
                    </button>
                )}
            </div>

            {/* Admin Tabs */}
            {user?.role === 'admin' && (
                <div className="flex gap-4 border-b border-slate-800 pb-4 mb-8">
                    <button
                        onClick={() => setActiveTab('workspaces')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all text-sm ${
                            activeTab === 'workspaces'
                            ? 'bg-white/10 text-white shadow-lg'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <Briefcase className="w-4 h-4" /> Workspaces ({projects.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('clients')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all text-sm ${
                            activeTab === 'clients'
                            ? 'bg-white/10 text-white shadow-lg'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <Users className="w-4 h-4" /> Clients Manager ({clients.length})
                    </button>
                </div>
            )}

            {/* Content Area */}
            {activeTab === 'workspaces' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {projects.length === 0 ? (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center border border-dashed border-slate-700 rounded-2xl bg-slate-800/20">
                            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                <span className="text-3xl">🚀</span>
                            </div>
                            <h3 className="text-slate-200 font-bold mb-1">No Workspaces Found</h3>
                            <p className="text-slate-500 text-sm">
                                {user?.role === 'admin' 
                                    ? 'Start by deploying your first client workspace board.'
                                    : 'Please wait for the administrator to assign you a workspace.'}
                            </p>
                        </div>
                    ) : (
                        projects.map((project) => (
                            <Link href={`/board/${project._id}`} key={project._id}>
                                <div className="group h-44 rounded-2xl bg-[#1E293B]/70 backdrop-blur-sm border border-slate-700/50 p-6 flex flex-col justify-between hover:border-indigo-500/50 hover:bg-[#1E293B] hover:shadow-[0_12px_40px_-10px_rgb(79,70,229,0.3)] transition-all duration-300 hover:-translate-y-1.5 cursor-pointer overflow-hidden relative">
                                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/30 transition-all duration-500"></div>
                                    
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-100 group-hover:text-indigo-400 transition-colors z-10 mb-2 truncate">{project.name}</h3>
                                        <p className="text-slate-400 text-sm line-clamp-2 z-10 font-medium">{project.description || 'No description provided.'}</p>
                                    </div>
                                    
                                    <div className="mt-4 flex items-center justify-between w-full z-10">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/50">
                                                <span className="text-[10px] text-purple-200">
                                                    {project.ownerId?._id === user?._id ? 'ME' : 'AD'}
                                                </span>
                                            </div>
                                            <span className="text-xs text-slate-500 font-medium">
                                                {project.ownerId?._id === user?._id ? 'Owner' : 'Admin'}
                                            </span>
                                        </div>

                                        {user?.role === 'admin' && (
                                            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                                getProjectClientName(project) === 'Unassigned'
                                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                            }`}>
                                                {getProjectClientName(project)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            ) : (
                /* Clients Manager View (Admin Only) */
                <div className="space-y-6">
                    <div className="bg-[#1E293B]/70 border border-slate-700/60 backdrop-blur-xl rounded-2xl overflow-hidden shadow-xl">
                        <div className="px-6 py-5 border-b border-slate-800 bg-[#1E293B]/90 flex justify-between items-center">
                            <h3 className="font-bold text-slate-100 flex items-center gap-2">
                                <Users className="w-5 h-5 text-indigo-400" /> Active System Clients
                            </h3>
                        </div>
                        
                        <div className="divide-y divide-slate-800">
                            {clients.length === 0 ? (
                                <div className="p-8 text-center text-slate-500">
                                    No client accounts are registered in the system.
                                </div>
                            ) : (
                                clients.map((client) => {
                                    const clientProjects = getClientProjects(client._id);
                                    const unassignedProjects = getUnassignedProjectsForClient(client._id);
                                    
                                    return (
                                        <div key={client._id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-800/10 transition-colors">
                                            {/* Client Details */}
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-lg shadow-lg">
                                                    {client.name.substring(0,2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-200 text-lg leading-tight">{client.name}</h4>
                                                    <p className="text-slate-400 text-sm font-medium mt-0.5">{client.email}</p>
                                                </div>
                                            </div>

                                            {/* Workspaces list */}
                                            <div className="flex-1 flex flex-wrap gap-2 max-w-lg md:justify-center">
                                                {clientProjects.length === 0 ? (
                                                    <span className="text-xs text-slate-500 font-medium italic">No workspaces assigned</span>
                                                ) : (
                                                    clientProjects.map((p) => (
                                                        <div key={p._id} className="flex items-center gap-1 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold rounded-lg group transition-all">
                                                            <span>{p.name}</span>
                                                            <button 
                                                                onClick={() => {
                                                                    const otherMembers = p.members
                                                                        .map((m: any) => m.userId?._id || m.userId)
                                                                        .filter((id: string) => id !== client._id);
                                                                    handleAssignClient(p._id, otherMembers);
                                                                }}
                                                                className="text-slate-500 hover:text-rose-400 ml-1.5 font-bold focus:outline-none"
                                                                title="Remove client from workspace"
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    ))
                                                )}
                                            </div>

                                            {/* Assignment Controls */}
                                            <div className="flex items-center gap-2">
                                                {unassignedProjects.length > 0 ? (
                                                    <select
                                                        onChange={(e) => {
                                                            const pId = e.target.value;
                                                            if (!pId) return;
                                                            
                                                            const project = projects.find(p => p._id === pId);
                                                            if (project) {
                                                                const currentMembers = project.members.map((m: any) => m.userId?._id || m.userId);
                                                                handleAssignClient(pId, [...currentMembers, client._id]);
                                                            }
                                                            e.target.value = '';
                                                        }}
                                                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 hover:text-white text-xs font-bold cursor-pointer transition-all outline-none"
                                                    >
                                                        <option value="">+ Assign Workspace</option>
                                                        {unassignedProjects.map(p => (
                                                            <option key={p._id} value={p._id}>{p.name}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1">
                                                        <Check className="w-3.5 h-3.5" /> All Workspaces Assigned
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Overlay (Launch Workspace Modal for Admins) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm transition-opacity">
                    <div className="bg-[#1E293B] border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl relative shadow-black/50">
                        <button 
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors text-lg"
                        >
                            ✕
                        </button>
                        <h2 className="text-2xl font-bold text-slate-100 mb-6 tracking-tight flex items-center gap-2">
                            <FolderOpen className="w-6 h-6 text-indigo-400" /> Launch Workspace
                        </h2>
                        
                        <form onSubmit={handleCreateProject} className="space-y-4">
                            <div>
                                <label className="block text-slate-300 text-xs font-bold uppercase tracking-wider mb-2">Workspace Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-600 bg-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                                    placeholder="e.g. Q4 Website Redesign"
                                    required
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-slate-300 text-xs font-bold uppercase tracking-wider mb-2">Description (Optional)</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-600 bg-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium resize-none h-24"
                                    placeholder="Brief details about what this board will track..."
                                />
                            </div>
                            
                            {/* Assign to Client Select Box */}
                            <div>
                                <label className="block text-slate-300 text-xs font-bold uppercase tracking-wider mb-2">Assign to Client (Optional)</label>
                                <select
                                    value={assignedClientId}
                                    onChange={(e) => setAssignedClientId(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-600 bg-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium cursor-pointer"
                                >
                                    <option value="" className="bg-[#1E293B]">Unassigned / Select Client Later</option>
                                    {clients.map(client => (
                                        <option key={client._id} value={client._id} className="bg-[#1E293B]">
                                            {client.name} ({client.email})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="flex justify-end gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-5 py-2.5 rounded-xl font-bold text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center"
                                >
                                    {isCreating ? 'Creating...' : 'Launch Workspace'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
