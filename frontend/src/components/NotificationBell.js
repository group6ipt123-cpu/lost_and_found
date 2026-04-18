import React, { useState, useEffect } from 'react';
import './NotificationBell.css';

const API_URL = 'http://localhost:3000';

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${API_URL}/api/notifications`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setNotifications(data.data || []);
                setUnreadCount(data.data.filter(n => !n.read).length);
            }
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        }
    };

    const markAsRead = async (notificationId) => {
        const token = localStorage.getItem('token');
        try {
            await fetch(`${API_URL}/api/notifications/${notificationId}/read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchNotifications();
        } catch (err) {
            console.error('Failed to mark as read:', err);
        }
    };

    const markAllAsRead = async () => {
        const token = localStorage.getItem('token');
        try {
            await fetch(`${API_URL}/api/notifications/read-all`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchNotifications();
        } catch (err) {
            console.error('Failed to mark all as read:', err);
        }
    };

    const getIcon = (type) => {
        switch(type) {
            case 'claim_update': return '📋';
            case 'verification': return '✅';
            case 'pickup_ready': return '📦';
            case 'item_found': return '🔍';
            default: return '🔔';
        }
    };

    return (
        <div className="notification-bell">
            <button className="bell-button" onClick={() => setShowDropdown(!showDropdown)}>
                🔔
                {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
            </button>

            {showDropdown && (
                <div className="notification-dropdown">
                    <div className="dropdown-header">
                        <h3>Notifications</h3>
                        {unreadCount > 0 && (
                            <button onClick={markAllAsRead}>Mark all as read</button>
                        )}
                    </div>

                    <div className="notification-list">
                        {notifications.length > 0 ? (
                            notifications.map(notification => (
                                <div 
                                    key={notification._id} 
                                    className={`notification-item ${!notification.read ? 'unread' : ''}`}
                                    onClick={() => markAsRead(notification._id)}
                                >
                                    <span className="notification-icon">{getIcon(notification.type)}</span>
                                    <div className="notification-content">
                                        <h4>{notification.title}</h4>
                                        <p>{notification.message}</p>
                                        <span className="notification-time">
                                            {new Date(notification.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="no-notifications">No notifications</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;