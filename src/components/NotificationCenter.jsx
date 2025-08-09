import React, { useState, useEffect } from 'react';
import { notificationApi } from '../services/asanaApi';

const NotificationCenter = ({ isOpen, onClose }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, unread, read

    useEffect(() => {
        if (isOpen) {
            loadNotifications();
        }
    }, [isOpen]);

    const loadNotifications = async () => {
        try {
            const response = await notificationApi.getNotifications();
            setNotifications(response.data);
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            await notificationApi.markAsRead(notificationId);
            setNotifications(notifications.map(n =>
                n.id === notificationId ? { ...n, read: true } : n
            ));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const deleteNotification = async (notificationId) => {
        try {
            await notificationApi.deleteNotification(notificationId);
            setNotifications(notifications.filter(n => n.id !== notificationId));
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const markAllAsRead = async () => {
        const unreadNotifications = notifications.filter(n => !n.read);
        try {
            await Promise.all(
                unreadNotifications.map(n => notificationApi.markAsRead(n.id))
            );
            setNotifications(notifications.map(n => ({ ...n, read: true })));
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'success': return '✅';
            case 'warning': return '⚠️';
            case 'error': return '❌';
            case 'info': return 'ℹ️';
            default: return '🔔';
        }
    };

    const getNotificationColor = (type) => {
        switch (type) {
            case 'success': return '#48bb78';
            case 'warning': return '#ed8936';
            case 'error': return '#e53e3e';
            case 'info': return '#3182ce';
            default: return '#718096';
        }
    };

    const filteredNotifications = notifications.filter(notification => {
        if (filter === 'unread') return !notification.read;
        if (filter === 'read') return notification.read;
        return true;
    });

    const unreadCount = notifications.filter(n => !n.read).length;

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: '400px',
            height: '100vh',
            backgroundColor: 'white',
            boxShadow: '-4px 0 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Header */}
            <div style={{
                padding: '1.5rem',
                borderBottom: '1px solid #e2e8f0',
                backgroundColor: '#f8f9fa'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem'
                }}>
                    <h3 style={{
                        margin: 0,
                        fontSize: '1.25rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        🔔 Notifications
                        {unreadCount > 0 && (
                            <span style={{
                                backgroundColor: '#e53e3e',
                                color: 'white',
                                borderRadius: '50%',
                                width: '24px',
                                height: '24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                                fontWeight: '600'
                            }}>
                {unreadCount}
              </span>
                        )}
                    </h3>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '1.5rem',
                            cursor: 'pointer',
                            color: '#718096',
                            padding: '0.25rem'
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Filter Buttons */}
                <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    marginBottom: '1rem'
                }}>
                    {['all', 'unread', 'read'].map(filterType => (
                        <button
                            key={filterType}
                            onClick={() => setFilter(filterType)}
                            style={{
                                padding: '0.5rem 1rem',
                                border: '1px solid #e2e8f0',
                                borderRadius: '20px',
                                backgroundColor: filter === filterType ? '#3182ce' : 'white',
                                color: filter === filterType ? 'white' : '#4a5568',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                textTransform: 'capitalize'
                            }}
                        >
                            {filterType}
                            {filterType === 'unread' && unreadCount > 0 && ` (${unreadCount})`}
                        </button>
                    ))}
                </div>

                {/* Action Buttons */}
                {unreadCount > 0 && (
                    <button
                        onClick={markAllAsRead}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            backgroundColor: '#48bb78',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: '500',
                            fontSize: '0.875rem'
                        }}
                    >
                        Mark All as Read
                    </button>
                )}
            </div>

            {/* Notifications List */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1rem'
            }}>
                {loading ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '2rem',
                        color: '#718096'
                    }}>
                        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔄</div>
                        Loading notifications...
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '2rem',
                        color: '#718096'
                    }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                        {filter === 'unread' ? 'No unread notifications' :
                            filter === 'read' ? 'No read notifications' :
                                'No notifications yet'}
                    </div>
                ) : (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem'
                    }}>
                        {filteredNotifications.map(notification => (
                            <div
                                key={notification.id}
                                style={{
                                    padding: '1rem',
                                    backgroundColor: notification.read ? '#f8f9fa' : 'white',
                                    border: `1px solid ${notification.read ? '#e2e8f0' : getNotificationColor(notification.type)}`,
                                    borderLeft: `4px solid ${getNotificationColor(notification.type)}`,
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onClick={() => !notification.read && markAsRead(notification.id)}
                            >
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                    marginBottom: '0.5rem'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}>
                    <span style={{ fontSize: '1.25rem' }}>
                      {getNotificationIcon(notification.type)}
                    </span>
                                        <h4 style={{
                                            margin: 0,
                                            fontSize: '1rem',
                                            fontWeight: notification.read ? '500' : '600',
                                            color: notification.read ? '#4a5568' : '#2d3748'
                                        }}>
                                            {notification.title}
                                        </h4>
                                        {!notification.read && (
                                            <div style={{
                                                width: '8px',
                                                height: '8px',
                                                backgroundColor: '#3182ce',
                                                borderRadius: '50%'
                                            }} />
                                        )}
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteNotification(notification.id);
                                        }}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: '#718096',
                                            cursor: 'pointer',
                                            fontSize: '1rem',
                                            padding: '0.25rem'
                                        }}
                                        title="Delete notification"
                                    >
                                        🗑️
                                    </button>
                                </div>

                                <p style={{
                                    margin: '0 0 0.75rem 0',
                                    color: notification.read ? '#718096' : '#4a5568',
                                    lineHeight: '1.4',
                                    fontSize: '0.875rem'
                                }}>
                                    {notification.message}
                                </p>

                                <div style={{
                                    fontSize: '0.75rem',
                                    color: '#a0aec0',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                  <span>
                    {new Date(notification.createdAt).toLocaleString()}
                  </span>
                                    <span style={{
                                        backgroundColor: `${getNotificationColor(notification.type)}15`,
                                        color: getNotificationColor(notification.type),
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '12px',
                                        fontSize: '0.7rem',
                                        fontWeight: '600',
                                        textTransform: 'uppercase'
                                    }}>
                    {notification.type}
                  </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div style={{
                padding: '1rem',
                borderTop: '1px solid #e2e8f0',
                backgroundColor: '#f8f9fa'
            }}>
                <button
                    onClick={loadNotifications}
                    style={{
                        width: '100%',
                        padding: '0.75rem',
                        backgroundColor: '#3182ce',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                    }}
                >
                    🔄 Refresh
                </button>
            </div>
        </div>
    );
};

export default NotificationCenter;