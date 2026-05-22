'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useSocketStore } from '@/store/useSocketStore';
import { useParams } from 'next/navigation';
import { MoreHorizontal, Plus, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface Task {
    _id: string;
    title: string;
    description: string;
    status: 'Todo' | 'Doing' | 'Done';
    order: number;
}

interface ActiveUser {
    userId: string;
    name: string;
}

export default function BoardPage() {
    const params = useParams();
    const projectId = params.id as string;
    
    const { user } = useAuthStore();
    const { socket } = useSocketStore();
    
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);

    // Task Creation States
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [creatingTitle, setCreatingTitle] = useState('');
    const [creatingDescription, setCreatingDescription] = useState('');
    const [creatingStatus, setCreatingStatus] = useState<'Todo' | 'Doing' | 'Done'>('Todo');
    const [isCreatingTask, setIsCreatingTask] = useState(false);

    const columns = ['Todo', 'Doing', 'Done'] as const;

    useEffect(() => {
        const fetchBoard = async () => {
            try {
                const res = await api.get(`/projects/${projectId}/tasks`);
                setTasks(res.data);
            } catch (error) {
                console.error('Board fetching error', error);
            } finally {
                setLoading(false);
            }
        };
        fetchBoard();
    }, [projectId]);

    // Setup Socket Subscriptions & Interactions
    useEffect(() => {
        if (!socket || !user) return;

        socket.emit('join_board', { projectId, user });

        socket.on('task_created', (newTask: Task) => {
            setTasks(prev => {
                if(prev.find(t => t._id === newTask._id)) return prev;
                return [...prev, newTask];
            });
        });

        socket.on('task_updated', (updatedTask: Task) => {
            setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
        });

        socket.on('task_deleted', (taskId: string) => {
            setTasks(prev => prev.filter(t => t._id !== taskId));
        });

        socket.on('user_joined', (userData: ActiveUser) => {
            setActiveUsers(prev => {
                if (prev.find(u => u.userId === userData.userId)) return prev;
                return [...prev, userData];
            });
        });

        socket.on('user_left', (userData: ActiveUser) => {
            setActiveUsers(prev => prev.filter(u => u.userId !== userData.userId));
        });

        return () => {
            socket.emit('leave_board', { projectId, user });
            socket.off('task_created');
            socket.off('task_updated');
            socket.off('task_deleted');
            socket.off('user_joined');
            socket.off('user_left');
        };
    }, [socket, projectId, user]);

    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        // Clone current state for optimistic UI update
        const prevTasks = [...tasks];

        const movedTaskIndex = prevTasks.findIndex(t => t._id === draggableId);
        const movedTask = prevTasks[movedTaskIndex];

        // Optimistically morph visually immediately prior to Socket loopback latency overrides
        movedTask.status = destination.droppableId as any;

        const destTasks = prevTasks
            .filter(t => t.status === destination.droppableId)
            .sort((a, b) => a.order - b.order);
        
        const cleanDestTasks = destTasks.filter(t => t._id !== draggableId);

        let newOrder = 0;

        if (cleanDestTasks.length === 0) {
            newOrder = 1000;
        } else if (destination.index === 0) {
            newOrder = cleanDestTasks[0].order / 2;
        } else if (destination.index === cleanDestTasks.length) {
            newOrder = cleanDestTasks[cleanDestTasks.length - 1].order + 1000;
        } else {
            const prevOrder = cleanDestTasks[destination.index - 1].order;
            const nextOrder = cleanDestTasks[destination.index].order;
            newOrder = (prevOrder + nextOrder) / 2;
        }

        movedTask.order = newOrder;

        // Apply updated snapshot manually over frontend locally overriding React lifecycle
        setTasks([...prevTasks]);

        try {
            await api.patch(`/projects/${projectId}/tasks/${draggableId}/move`, {
                status: movedTask.status,
                order: newOrder
            });
            // The API response will natively trigger the Socket Loopback updating connected peers
        } catch (error) {
            console.error('Failed to save move remotely.', error);
        }
    };

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!creatingTitle.trim()) return;

        setIsCreatingTask(true);
        try {
            const res = await api.post(`/projects/${projectId}/tasks`, {
                title: creatingTitle,
                description: creatingDescription,
                status: creatingStatus,
                order: tasks.filter(t => t.status === creatingStatus).length * 1000 + 1000
            });
            // Native UI Optimistic update (Socket will re-verify subsequently)
            setTasks(prev => {
                if(prev.find(t => t._id === res.data._id)) return prev;
                return [...prev, res.data];
            });
            setIsTaskModalOpen(false);
            setCreatingTitle('');
            setCreatingDescription('');
        } catch (error) {
            console.error('Failed to create new task', error);
        } finally {
            setIsCreatingTask(false);
        }
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center text-indigo-400">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col w-full max-w-[1600px] mx-auto overflow-hidden">
            {/* Board Header Container */}
            <div className="flex justify-between items-center mb-8 px-2 shrink-0">
                <div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 flex items-center gap-4">
                        Project Canvas
                        <span className="text-xs px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 font-bold uppercase tracking-wider backdrop-blur-sm">Active Sprint</span>
                    </h1>
                    {/* Real-time Workspace Presence */}
                    {activeUsers.length > 0 && (
                        <div className="flex items-center gap-2 mt-3 animate-fade-in">
                            <span className="text-xs text-slate-400 mr-1 font-semibold tracking-wider">ONLINE LIVE:</span>
                            <div className="flex -space-x-2">
                                {activeUsers.map(u => (
                                    <div key={u.userId} title={u.name} className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-700 border-2 border-[#0F172A] flex items-center justify-center text-xs font-bold text-white shadow-lg animate-bounce-short">
                                        {u.name.charAt(0).toUpperCase()}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="flex items-center gap-3">
                    <button className="hidden sm:flex text-slate-400 hover:text-white bg-slate-800/30 hover:bg-slate-800 p-2.5 rounded-xl border border-transparent hover:border-slate-700 transition-all">
                        <MoreHorizontal className="w-5 h-5" />
                    </button>
                    {user?.role === 'admin' && (
                        <button className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:shadow-[0_0_30px_rgba(79,70,229,0.6)] transition-all active:scale-95 flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Client Invite
                        </button>
                    )}
                </div>
            </div>

            {/* Complete Drag Framework Overlaying Context logic */}
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex gap-6 overflow-x-auto pb-6 h-full snap-x scrollbar-hide items-start">
                    {columns.map(status => (
                        <div key={status} className="min-w-[320px] w-80 h-[80vh] flex flex-col bg-slate-800/30 backdrop-blur-md border border-slate-700/50 rounded-3xl shrink-0 snap-center shadow-lg shadow-black/20">
                            
                            <div className="p-5 flex justify-between items-center bg-slate-800/60 rounded-t-3xl border-b border-slate-700/50">
                                <h3 className="font-bold text-slate-200 flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${
                                        status === 'Todo' ? 'bg-rose-400' : 
                                        status === 'Doing' ? 'bg-amber-400' : 'bg-emerald-400'
                                    } shadow-[0_0_12px_currentColor] animate-pulse`}></div>
                                    {status}
                                    <span className="ml-1 text-xs text-slate-400 font-black bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-700/50">
                                        {tasks.filter(t => t.status === status).length}
                                    </span>
                                </h3>
                                <button className="text-slate-400 hover:text-indigo-300 p-1.5 hover:bg-indigo-500/10 rounded-lg transition-all">
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>

                            <Droppable droppableId={status}>
                                {(provided, snapshot) => (
                                    <div 
                                        ref={provided.innerRef} 
                                        {...provided.droppableProps}
                                        className={`p-4 flex-1 overflow-y-auto space-y-4 scrollbar-hide transition-colors ${snapshot.isDraggingOver ? 'bg-indigo-500/5' : ''}`}
                                    >
                                        {tasks.filter(t => t.status === status).sort((a,b) => a.order - b.order).map((task, index) => (
                                            <Draggable key={task._id} draggableId={task._id} index={index}>
                                                {(provided, snapshot) => (
                                                    <div 
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        style={provided.draggableProps.style}
                                                        className="focus:outline-none"
                                                    >
                                                        <div 
                                                            className={`group bg-[#1E293B] hover:bg-slate-800 border border-slate-700/60 hover:border-indigo-500/60 p-5 rounded-2xl cursor-grab relative overflow-hidden backdrop-blur-sm ${
                                                                snapshot.isDragging 
                                                                    ? 'shadow-2xl shadow-indigo-500/40 border-indigo-500/80 rotate-2 scale-[1.03] transition-none' 
                                                                    : 'transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/20'
                                                            }`}
                                                        >
                                                            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-white/5 to-transparent rounded-bl-full pointer-events-none"></div>
                                                            
                                                            <div className="flex justify-between items-start mb-3">
                                                                <h4 className="font-bold text-sm text-slate-100 group-hover:text-indigo-300 transition-colors pr-8 leading-relaxed">
                                                                    {task.title}
                                                                </h4>
                                                                <GripVertical className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 absolute right-4 top-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                            </div>
                                                            
                                                            <p className="text-xs text-slate-400 line-clamp-2 mt-1 font-medium">{task.description}</p>
                                                            
                                                            <div className="mt-5 flex items-center justify-between border-t border-slate-700/50 pt-4">
                                                                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">MAR 19</div>
                                                                <div className="flex -space-x-2 relative">
                                                                    <div className="w-7 h-7 rounded-full border-2 border-[#1E293B] bg-gradient-to-tr from-cyan-400 to-indigo-500 z-10 shadow-md"></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                        
                                        <button 
                                            onClick={() => {
                                                setCreatingStatus(status);
                                                setIsTaskModalOpen(true);
                                            }}
                                            className="w-full py-4 mt-2 border border-dashed border-slate-600 hover:border-indigo-400 hover:bg-indigo-500/10 text-slate-400 hover:text-indigo-300 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 group"
                                        >
                                            <Plus className="w-4 h-4 group-hover:scale-125 transition-transform group-hover:text-indigo-400" /> New Card
                                        </button>
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    ))}
                </div>
            </DragDropContext>

            {/* Task Creation Modal */}
            {isTaskModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm transition-opacity">
                    <div className="bg-[#1E293B] border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl relative shadow-black/50 animate-fade-in">
                        <button 
                            onClick={() => setIsTaskModalOpen(false)}
                            className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors text-lg"
                        >
                            ✕
                        </button>
                        <h2 className="text-2xl font-bold text-slate-100 mb-6 tracking-tight">Create New Card</h2>
                        
                        <form onSubmit={handleCreateTask} className="space-y-4">
                            <div>
                                <label className="block text-slate-300 text-xs font-bold uppercase tracking-wider mb-2">Card Title</label>
                                <input
                                    type="text"
                                    value={creatingTitle}
                                    onChange={(e) => setCreatingTitle(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-600 bg-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                                    placeholder="e.g. Implement OAuth Flow"
                                    required
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-slate-300 text-xs font-bold uppercase tracking-wider mb-2">Description</label>
                                <textarea
                                    value={creatingDescription}
                                    onChange={(e) => setCreatingDescription(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-600 bg-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium resize-none h-24"
                                    placeholder="Add details, acceptance criteria, sub-tasks..."
                                />
                            </div>
                            
                            <div className="flex justify-between items-center mt-8">
                                <div className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-md text-xs font-bold text-slate-400 tracking-wider">
                                    in <span className="text-indigo-400 uppercase">{creatingStatus}</span>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsTaskModalOpen(false)}
                                        className="px-5 py-2.5 rounded-xl font-bold text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isCreatingTask}
                                        className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center"
                                    >
                                        {isCreatingTask ? 'Creating...' : 'Add Card'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
