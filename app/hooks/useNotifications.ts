"use client";

import { useCallback, useState } from "react";

export interface Notification {
    id: string;
    type: "success" | "error" | "info" | "warning";
    title: string;
    message?: string;
    duration?: number;
}

export function useNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const removeNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
    }, []);

    const addNotification = useCallback(
        (notification: Omit<Notification, "id">) => {
            const id = `notification-${Date.now()}-${Math.random().toString(36).slice(2)}`;
            const duration = notification.duration || 5000;

            const newNotification: Notification = {
                ...notification,
                id,
            };

            setNotifications(prev => [...prev, newNotification]);

            setTimeout(() => {
                removeNotification(id);
            }, duration);

            return id;
        },
        [removeNotification],
    );

    const clearAll = useCallback(() => {
        setNotifications([]);
    }, []);

    return {
        notifications,
        addNotification,
        removeNotification,
        clearAll,
    };
}
