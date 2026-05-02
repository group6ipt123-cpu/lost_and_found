/* eslint-disable */
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './ChatModal.css';

const ChatModal = ({ isOpen, onClose, item, currentUser, onItemUpdate, initialRoom }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [chatRoom, setChatRoom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const messagesEndRef = useRef(null);

    const isItemOwner = () => {
        if (!currentUser || !item) return false;
        return String(currentUser.id) === String(item.userId);
    };

    const loadChat = async () => {
        if (!item || !currentUser) return;
        setLoading(true);
        setError(null);
        
        try {
            const token = localStorage.getItem('token');
            const ownerId = item.userId;
            
            if (initialRoom) {
                setChatRoom(initialRoom);
                const msgRes = await axios.get(
                    `http://localhost:5000/api/chat/messages/${initialRoom._id}`,
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );
                if (msgRes.data.success) setMessages(msgRes.data.data || []);
                else setMessages([]);
            } else if (isItemOwner()) {
                const roomsRes = await axios.get('http://localhost:5000/api/chat/rooms', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (roomsRes.data.success) {
                    const itemRooms = roomsRes.data.data.filter(
                        r => r.itemId === item._id || r.item?._id === item._id
                    );
                    if (itemRooms.length > 0) {
                        setChatRoom(itemRooms[0]);
                        const msgRes = await axios.get(
                            `http://localhost:5000/api/chat/messages/${itemRooms[0]._id}`,
                            { headers: { 'Authorization': `Bearer ${token}` } }
                        );
                        if (msgRes.data.success) setMessages(msgRes.data.data || []);
                        else setMessages([]);
                    } else {
                        setMessages([]);
                    }
                }
            } else {
                const roomRes = await axios.post('http://localhost:5000/api/chat/room', {
                    itemId: item._id,
                    ownerId: ownerId
                }, { headers: { 'Authorization': `Bearer ${token}` } });
                if (roomRes.data.success && roomRes.data.data) {
                    setChatRoom(roomRes.data.data);
                    setMessages(roomRes.data.data.messages || []);
                }
            }
        } catch (err) {
            console.error('Load chat error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const refreshMessages = async () => {
        if (!chatRoom?._id) return;
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(
                `http://localhost:5000/api/chat/messages/${chatRoom._id}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            if (res.data.success) setMessages(res.data.data || []);
        } catch (err) {}
    };

    useEffect(() => {
        if (isOpen && item) {
            loadChat();
            const interval = setInterval(refreshMessages, 3000);
            return () => clearInterval(interval);
        }
    }, [isOpen, item?._id, initialRoom]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async () => {
        if (!newMessage.trim() || !chatRoom) return;
        setSending(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('http://localhost:5000/api/chat/message', {
                roomId: chatRoom._id,
                message: newMessage.trim()
            }, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.data.success) {
                setMessages(prev => [...prev, res.data.data]);
                setNewMessage('');
            }
        } catch (err) {
            console.error('Send error:', err);
        } finally {
            setSending(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const formatTime = (date) => new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (!isOpen) return null;

    return (
        <div className="chat-modal-overlay" onClick={onClose}>
            <div className="chat-modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="chat-header">
                    <div className="chat-header-info">
                        <div className="chat-item-name">{item?.name}</div>
                        <div className="chat-with">
                            {initialRoom?.otherUser 
                                ? `Chat with ${initialRoom.otherUser.name || initialRoom.otherUserName || 'User'}`
                                : isItemOwner() ? 'Messages from interested people' : 'Chat with owner'}
                        </div>
                    </div>
                    <button className="chat-close-btn" onClick={onClose}>X</button>
                </div>

                {error && (
                    <div className="chat-error">
                        <span>{error}</span>
                        <button onClick={loadChat}>Retry</button>
                    </div>
                )}

                <div className="chat-messages-area">
                    {loading ? (
                        <div className="chat-loading"><div className="spinner-small"></div><p>Loading...</p></div>
                    ) : messages.length === 0 ? (
                        <div className="chat-no-messages">
                            <p>No messages yet</p>
                            <p className="no-messages-sub">
                                {isItemOwner() 
                                    ? "When someone shows interest in your item, their messages will appear here"
                                    : "Send a message to the owner about this item"}
                            </p>
                        </div>
                    ) : (
                        messages.map((msg, index) => {
                            const isOwn = msg.senderId === currentUser?.id;
                            return (
                                <div key={index} className={`message-row ${isOwn ? 'own' : 'other'}`}>
                                    {!isOwn && <div className="message-sender-avatar">{msg.senderName?.charAt(0) || '?'}</div>}
                                    <div className="message-wrapper">
                                        {!isOwn && <div className="message-sender-name">{msg.senderName || 'Unknown'}</div>}
                                        <div className={`message-bubble ${isOwn ? 'own-bubble' : 'other-bubble'}`}>
                                            <div className="message-text">{msg.message}</div>
                                            <div className="message-time">{formatTime(msg.createdAt)}</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="chat-input-area">
                    <div className="chat-input-wrapper">
                        <textarea className="chat-input" placeholder="Type a message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={handleKeyPress} rows="1" />
                        <button className="chat-send-btn" onClick={sendMessage} disabled={sending || !newMessage.trim()}>Send</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatModal;