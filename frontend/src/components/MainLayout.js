import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import NotificationBell from './NotificationBell';
import './MainLayout.css';

/* eslint-disable react-hooks/exhaustive-deps */

const MainLayout = ({ children, onOpenChatFromNotification }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [chatRooms, setChatRooms] = useState([]);
  const [showMessagesDropdown, setShowMessagesDropdown] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [loadingChats, setLoadingChats] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (user) {
      fetchChatRooms();
      const interval = setInterval(fetchChatRooms, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowMessagesDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchChatRooms = async () => {
    if (loadingChats) return;
    setLoadingChats(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/chat/rooms', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setChatRooms(response.data.data);
        
        let unread = 0;
        for (const room of response.data.data) {
          const messagesResponse = await axios.get(`http://localhost:5000/api/chat/messages/${room._id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (messagesResponse.data.success) {
            const unreadCount = messagesResponse.data.data.filter(
              m => !m.read && m.senderId !== user?.id
            ).length;
            unread += unreadCount;
          }
        }
        setUnreadMessagesCount(unread);
      }
    } catch (err) {
      console.error('Error fetching chat rooms:', err);
    } finally {
      setLoadingChats(false);
    }
  };

  const openChatRoom = (itemId, ownerId) => {
    setShowMessagesDropdown(false);
    if (onOpenChatFromNotification) {
      onOpenChatFromNotification(itemId, ownerId);
    }
  };

  const getInitials = (name) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const goToProfile = () => {
    navigate('/profile');
  };

  const goToDashboard = () => {
    navigate('/dashboard');
  };

  const goToAdmin = () => {
    navigate('/admin');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const getTimeAgo = (date) => {
    if (!date) return '';
    const now = new Date();
    const past = new Date(date);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return past.toLocaleDateString();
  };

  return (
    <div className="main-layout">
      <header className="main-header">
        <div className="header-container">
          <div className="logo-container" onClick={goToDashboard}>
            <span className="logo">Lost<span>&</span>Found</span>
          </div>
          
          <div className="header-nav">
            <button 
              className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
              onClick={goToDashboard}
            >
              Dashboard
            </button>
            {user?.role === 'admin' && (
              <button 
                className={`nav-link ${isActive('/admin') ? 'active' : ''}`}
                onClick={goToAdmin}
              >
                Admin
              </button>
            )}
          </div>
          
          <div className="header-right">
            {/* Messages Dropdown */}
            <div className="messages-dropdown-container" ref={dropdownRef}>
              <button 
                className="messages-btn"
                onClick={() => {
                  setShowMessagesDropdown(!showMessagesDropdown);
                  if (!showMessagesDropdown) {
                    fetchChatRooms();
                  }
                }}
              >
                💬
                {unreadMessagesCount > 0 && (
                  <span className="messages-badge">{unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}</span>
                )}
              </button>
              
              {showMessagesDropdown && (
                <div className="messages-dropdown">
                  <div className="messages-header">
                    <h3>Messages</h3>
                  </div>
                  <div className="messages-list">
                    {chatRooms.length === 0 ? (
                      <div className="no-messages">
                        <p>No messages yet</p>
                        <p className="no-messages-sub">Start a conversation by clicking "Chat" on any item</p>
                      </div>
                    ) : (
                      chatRooms.map((room) => (
                        <div 
                          key={room._id} 
                          className="message-item"
                          onClick={() => openChatRoom(room.itemId, room.otherUser?.id)}
                        >
                          <div className="message-avatar">
                            {room.otherUser?.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div className="message-content">
                            <div className="message-sender-name">{room.otherUser?.name || 'User'}</div>
                            <div className="message-preview">
                              {room.lastMessage || 'No messages yet'}
                            </div>
                            <div className="message-item-time">
                              {getTimeAgo(room.lastMessageTime)}
                            </div>
                          </div>
                          <div className="message-item-badge">
                            <span className="item-name-badge">{room.item?.name}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <NotificationBell onOpenChat={onOpenChatFromNotification} />
            
            <div className="user-profile" onClick={goToProfile} style={{ cursor: 'pointer' }}>
              <div className="user-avatar">{getInitials(user?.name)}</div>
              <div className="user-info">
                <div className="user-name">{user?.name?.split(' ')[0] || 'User'}</div>
                <div className="user-role">{user?.role === 'admin' ? 'Admin' : 'User'}</div>
              </div>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>
      
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;