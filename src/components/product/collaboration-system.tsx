'use client';

import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
    Users,
    MessageSquare,
    Share2,
    Eye,
    EyeOff,
    Send,
    UserPlus,
    Copy,
    Check,
    Wifi,
    WifiOff
} from 'lucide-react';
import { toast } from 'sonner';

interface CollaborationUser {
    id: string;
    name: string;
    email?: string;
    color: string;
    cursor?: { x: number; y: number };
    isActive: boolean;
    lastSeen: Date;
}

interface ChatMessage {
    id: string;
    userId: string;
    userName: string;
    message: string;
    timestamp: Date;
    type: 'text' | 'system';
}

interface DesignChange {
    id: string;
    userId: string;
    userName: string;
    action: string;
    timestamp: Date;
    data: any;
}

interface CollaborationSystemProps {
    designId: string;
    userId: string;
    userName: string;
    onDesignChange?: (change: DesignChange) => void;
    onUsersChange?: (users: CollaborationUser[]) => void;
}

export default function CollaborationSystem({
    designId,
    userId,
    userName,
    onDesignChange,
    onUsersChange
}: CollaborationSystemProps) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [users, setUsers] = useState<CollaborationUser[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [shareUrl, setShareUrl] = useState('');
    const [isCopied, setIsCopied] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const [recentChanges, setRecentChanges] = useState<DesignChange[]>([]);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const currentUser = useRef<CollaborationUser>({
        id: userId,
        name: userName,
        color: generateUserColor(userId),
        isActive: true,
        lastSeen: new Date()
    });

    // Initialize socket connection
    useEffect(() => {
        // In a real app, this would connect to your Socket.IO server
        // For demo purposes, we'll simulate the connection
        const mockSocket = {
            emit: (event: string, data: any) => console.log('Socket emit:', event, data),
            on: (event: string, callback: Function) => console.log('Socket on:', event),
            off: (event: string, callback?: Function) => console.log('Socket off:', event),
            disconnect: () => console.log('Socket disconnect'),
            connected: true
        } as any;

        setSocket(mockSocket);
        setIsConnected(true);

        // Generate share URL
        const baseUrl = window.location.origin;
        setShareUrl(`${baseUrl}/collaborate/${designId}`);

        // Initialize with demo users
        const demoUsers: CollaborationUser[] = [
            currentUser.current,
            {
                id: 'user2',
                name: 'Alice Johnson',
                email: 'alice@example.com',
                color: '#ff6b6b',
                isActive: true,
                lastSeen: new Date(),
                cursor: { x: 150, y: 200 }
            },
            {
                id: 'user3',
                name: 'Bob Smith',
                email: 'bob@example.com',
                color: '#4ecdc4',
                isActive: false,
                lastSeen: new Date(Date.now() - 300000) // 5 minutes ago
            }
        ];

        setUsers(demoUsers);
        onUsersChange?.(demoUsers);

        // Add some demo messages
        setMessages([
            {
                id: '1',
                userId: 'system',
                userName: 'System',
                message: `${userName} joined the collaboration`,
                timestamp: new Date(),
                type: 'system'
            },
            {
                id: '2',
                userId: 'user2',
                userName: 'Alice Johnson',
                message: 'Hey! I love the color scheme you chose.',
                timestamp: new Date(Date.now() - 60000),
                type: 'text'
            }
        ]);

        return () => {
            if (socket) {
                socket.disconnect();
            }
        };
    }, [designId, userId, userName]);

    // Scroll to bottom of messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    function generateUserColor(id: string): string {
        const colors = [
            '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4',
            '#ffeaa7', '#dda0dd', '#98d8c8', '#f7dc6f'
        ];
        const hash = id.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0);
        return colors[Math.abs(hash) % colors.length];
    }

    const sendMessage = () => {
        if (!newMessage.trim() || !socket) return;

        const message: ChatMessage = {
            id: Date.now().toString(),
            userId: currentUser.current.id,
            userName: currentUser.current.name,
            message: newMessage.trim(),
            timestamp: new Date(),
            type: 'text'
        };

        setMessages(prev => [...prev, message]);
        setNewMessage('');

        // In real app, emit to socket
        socket.emit('chat_message', message);
        toast.success('Message sent');
    };

    const copyShareUrl = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setIsCopied(true);
            toast.success('Share URL copied to clipboard');
            setTimeout(() => setIsCopied(false), 2000);
        } catch (error) {
            toast.error('Failed to copy URL');
        }
    };

    const inviteUser = () => {
        // In real app, this would open an invite modal
        toast.info('Invite feature would open here');
    };

    const broadcastDesignChange = (action: string, data: any) => {
        const change: DesignChange = {
            id: Date.now().toString(),
            userId: currentUser.current.id,
            userName: currentUser.current.name,
            action,
            timestamp: new Date(),
            data
        };

        setRecentChanges(prev => [change, ...prev.slice(0, 9)]); // Keep last 10 changes
        onDesignChange?.(change);

        if (socket) {
            socket.emit('design_change', change);
        }
    };

    const toggleVisibility = () => {
        setIsVisible(!isVisible);
    };

    if (!isVisible) {
        return (
            <div className="fixed bottom-4 right-4 z-50">
                <Button
                    onClick={toggleVisibility}
                    variant="default"
                    size="lg"
                    className="rounded-full shadow-lg"
                >
                    <Users className="h-5 w-5 mr-2" />
                    {users.filter(u => u.isActive).length}
                </Button>
            </div>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 w-80 z-50">
            <Card className="shadow-lg border-2">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Collaboration
                            <Badge variant={isConnected ? "default" : "destructive"} className="text-xs">
                                {isConnected ? (
                                    <>
                                        <Wifi className="h-3 w-3 mr-1" />
                                        Connected
                                    </>
                                ) : (
                                    <>
                                        <WifiOff className="h-3 w-3 mr-1" />
                                        Offline
                                    </>
                                )}
                            </Badge>
                        </CardTitle>
                        <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={toggleVisibility}>
                                <EyeOff className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Active Users */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">
                                Active Users ({users.filter(u => u.isActive).length})
                            </span>
                            <Button variant="ghost" size="sm" onClick={inviteUser}>
                                <UserPlus className="h-3 w-3" />
                            </Button>
                        </div>
                        <div className="space-y-2">
                            {users.filter(u => u.isActive).map(user => (
                                <div key={user.id} className="flex items-center gap-2">
                                    <div
                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: user.color }}
                                    />
                                    <span className="text-sm truncate">
                                        {user.name}
                                        {user.id === currentUser.current.id && ' (you)'}
                                    </span>
                                    <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 animate-pulse" />
                                </div>
                            ))}
                        </div>
                    </div>

                    <Separator />

                    {/* Share Section */}
                    <div>
                        <span className="text-sm font-medium mb-2 block">Share Design</span>
                        <div className="flex gap-2">
                            <Input
                                value={shareUrl}
                                readOnly
                                className="text-xs"
                                placeholder="Share URL"
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={copyShareUrl}
                                className="flex-shrink-0"
                            >
                                {isCopied ? (
                                    <Check className="h-3 w-3" />
                                ) : (
                                    <Copy className="h-3 w-3" />
                                )}
                            </Button>
                        </div>
                    </div>

                    <Separator />

                    {/* Recent Changes */}
                    <div>
                        <span className="text-sm font-medium mb-2 block">Recent Changes</span>
                        <ScrollArea className="h-20">
                            {recentChanges.length === 0 ? (
                                <p className="text-xs text-muted-foreground text-center py-2">
                                    No recent changes
                                </p>
                            ) : (
                                <div className="space-y-1">
                                    {recentChanges.map(change => (
                                        <div key={change.id} className="text-xs p-2 bg-muted rounded">
                                            <span className="font-medium">{change.userName}</span>
                                            <span className="text-muted-foreground"> {change.action}</span>
                                            <div className="text-xs text-muted-foreground">
                                                {change.timestamp.toLocaleTimeString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </div>

                    <Separator />

                    {/* Chat */}
                    <div>
                        <span className="text-sm font-medium mb-2 block flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Chat
                        </span>
                        <ScrollArea className="h-32 mb-2">
                            <div className="space-y-2">
                                {messages.map(message => (
                                    <div key={message.id} className="text-xs">
                                        {message.type === 'system' ? (
                                            <div className="text-center text-muted-foreground italic">
                                                {message.message}
                                            </div>
                                        ) : (
                                            <div>
                                                <span className="font-medium">
                                                    {message.userName}:
                                                </span>
                                                <span className="ml-1">{message.message}</span>
                                                <div className="text-xs text-muted-foreground">
                                                    {message.timestamp.toLocaleTimeString()}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                        </ScrollArea>
                        <div className="flex gap-2">
                            <Input
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="text-sm"
                                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                            />
                            <Button variant="outline" size="sm" onClick={sendMessage}>
                                <Send className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// Hook to use collaboration features
export function useCollaboration(designId: string, userId: string, userName: string) {
    const [isCollaborating, setIsCollaborating] = useState(false);
    const [users, setUsers] = useState<CollaborationUser[]>([]);
    const [changes, setChanges] = useState<DesignChange[]>([]);

    const startCollaboration = () => {
        setIsCollaborating(true);
        toast.success('Collaboration started');
    };

    const stopCollaboration = () => {
        setIsCollaborating(false);
        setUsers([]);
        setChanges([]);
        toast.info('Collaboration stopped');
    };

    const broadcastChange = (action: string, data: any) => {
        const change: DesignChange = {
            id: Date.now().toString(),
            userId,
            userName,
            action,
            timestamp: new Date(),
            data
        };
        setChanges(prev => [change, ...prev]);
    };

    return {
        isCollaborating,
        users,
        changes,
        startCollaboration,
        stopCollaboration,
        broadcastChange
    };
}
