import React from "react";
import styles from "./NotificationContainer.module.css";
import { Notification } from "@/app/hooks/useNotifications";

interface NotificationContainerProps {
    notifications: Notification[];
    onRemove: (id: string) => void;
}

export function NotificationContainer({ notifications, onRemove }: NotificationContainerProps) {
    if (notifications.length === 0) {
        return null;
    }

    const getIcon = (type: Notification["type"]) => {
        switch (type) {
            case "success":
                return "bi-check-circle-fill";
            case "error":
                return "bi-x-circle-fill";
            case "warning":
                return "bi-exclamation-triangle-fill";
            case "info":
            default:
                return "bi-info-circle-fill";
        }
    };

    return (
        <div className={styles.notificationContainer}>
            {notifications.map(notification => (
                <div key={notification.id} className={`${styles.notification} ${styles[notification.type]}`}>
                    <div className={styles.notificationContent}>
                        <i className={`${getIcon(notification.type)} ${styles.icon}`} aria-hidden="true" />
                        <div className={styles.notificationText}>
                            <div className={styles.title}>{notification.title}</div>
                            {notification.message && <div className={styles.message}>{notification.message}</div>}
                        </div>
                        <button
                            className={styles.closeButton}
                            onClick={() => onRemove(notification.id)}
                            aria-label="Close notification"
                        >
                            <i className="bi-x" aria-hidden="true" />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
