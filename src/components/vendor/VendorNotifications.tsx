"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, X, CheckCircle, AlertTriangle, Info, DollarSign, TrendingUp } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Notification {
    id: string;
    type: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    title: string;
    message: string;
    potentialSavings?: number;
    actionUrl?: string;
    actionText?: string;
    createdAt: string;
}

interface VendorNotificationsProps {
    className?: string;
}

export default function VendorNotifications({ className = "" }: VendorNotificationsProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await fetch('/api/vendor/notifications?type=alerts');
            const data = await response.json();

            if (data.success) {
                setNotifications(data.data.notifications);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const dismissNotification = (notificationId: string) => {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        // In a real app, you would also send a request to mark as read
    };

    const getNotificationIcon = (type: string, priority: string) => {
        switch (type) {
            case 'PLAN_RECOMMENDATION':
                return <TrendingUp className="h-5 w-5 text-blue-600" />;
            case 'PERFORMANCE_MILESTONE':
                return <CheckCircle className="h-5 w-5 text-green-600" />;
            case 'PERFORMANCE_WARNING':
                return <AlertTriangle className="h-5 w-5 text-red-600" />;
            case 'BILLING_REMINDER':
                return <DollarSign className="h-5 w-5 text-orange-600" />;
            default:
                return <Info className="h-5 w-5 text-gray-600" />;
        }
    };

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'HIGH':
                return <Badge variant="destructive" className="ml-2">High</Badge>;
            case 'MEDIUM':
                return <Badge variant="default" className="ml-2">Medium</Badge>;
            case 'LOW':
                return <Badge variant="secondary" className="ml-2">Low</Badge>;
            default:
                return null;
        }
    };

    const getNotificationBorder = (priority: string) => {
        switch (priority) {
            case 'HIGH':
                return 'border-l-4 border-l-red-500';
            case 'MEDIUM':
                return 'border-l-4 border-l-yellow-500';
            case 'LOW':
                return 'border-l-4 border-l-blue-500';
            default:
                return 'border-l-4 border-l-gray-300';
        }
    };

    if (loading) {
        return (
            <div className={`animate-pulse ${className}`}>
                <div className="h-20 bg-gray-200 rounded"></div>
            </div>
        );
    }

    if (notifications.length === 0) {
        return null; // Don't show the component if no notifications
    }

    const visibleNotifications = expanded ? notifications : notifications.slice(0, 2);

    return (
        <Card className={`${className}`}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center text-lg">
                        <Bell className="h-5 w-5 mr-2" />
                        Notifications
                        {notifications.length > 0 && (
                            <Badge variant="destructive" className="ml-2">
                                {notifications.length}
                            </Badge>
                        )}
                    </CardTitle>
                    {notifications.length > 2 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpanded(!expanded)}
                        >
                            {expanded ? 'Show Less' : `Show All (${notifications.length})`}
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {visibleNotifications.map((notification) => (
                    <div
                        key={notification.id}
                        className={`p-4 rounded-lg bg-gray-50 ${getNotificationBorder(notification.priority)}`}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1">
                                {getNotificationIcon(notification.type, notification.priority)}
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center">
                                        <h4 className="font-medium text-gray-900">
                                            {notification.title}
                                        </h4>
                                        {getPriorityBadge(notification.priority)}
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        {notification.message}
                                    </p>
                                    {notification.potentialSavings && (
                                        <p className="text-sm font-medium text-green-600">
                                            Potential savings: ${notification.potentialSavings.toFixed(2)}/month
                                        </p>
                                    )}
                                    <div className="flex items-center space-x-2 mt-2">
                                        {notification.actionUrl && notification.actionText && (
                                            <Button asChild size="sm">
                                                <Link href={notification.actionUrl}>
                                                    {notification.actionText}
                                                </Link>
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => dismissNotification(notification.id)}
                                        >
                                            Dismiss
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => dismissNotification(notification.id)}
                                className="ml-2"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
