import React, { useState, useEffect, useRef } from 'react';
import './InquiryChatModal.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const InquiryChatModal = ({ inquiryId, item, onClose }) => {
    const [inquiry, setInquiry] = useState(null);
    const [replyMessage, setReplyMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        if (inquiryId) {
            fetchInquiry();
        } else {
            createInquiry();
        }
    }, [inquiryId]);

    useEffect(() => {
        scrollToBottom();
    }, [inquiry?.replies]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchInquiry = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/inquiries/${inquiryId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setInquiry(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch inquiry');
        } finally {
            setLoading(false);
        }
    };

    const createInquiry = async () => {
        // This will be called from the initial inquiry modal
        setLoading(false);
    };

    const handleSendReply = async () => {
        if (!replyMessage.trim() || !inquiry) return;

        setSending(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/inquiries/${inquiry._id}/reply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ message: replyMessage })
            });
            const data = await res.json();
            if (data.success) {
                setInquiry(data.data);
                setReplyMessage('');
            }
        } catch (err) {
            alert('Failed to send reply');
        } finally {
            setSending(false);
        }
    };

    const handleResolve = async () => {
        const token = localStorage.getItem('token');
        try {
            await fetch(`${API_URL}/api/inquiries/${inquiry._id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: 'resolved' })
            });
            alert('Inquiry marked as resolved');
            onClose();
        } catch (err) {
            alert('Failed to update status');
        }
    };

    if (loading) {
        return (
            <div className="modal-overlay">
                <div className="chat-modal">
                    <div className="loading-spinner"></div>
                </div>
            </div>
        );
    }

    const isSender = inquiry?.sender?._id === currentUser.id;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="chat-header">
                    <button className="chat-back" onClick={onClose}>←</button>
                    <div className="chat-header-info">
                        <h3>{inquiry?.item?.name || item?.name}</h3>
                        <span className={`chat-status ${inquiry?.status}`}>
                            {inquiry?.status || 'pending'}
                        </span>
                    </div>
                    <button className="chat-close" onClick={onClose}>×</button>
                </div>

                {/* Item Info */}
                <div className="chat-item-preview">
                    {inquiry?.item?.image && (
                        <img src={inquiry.item.image} alt={inquiry.item.name} />
                    )}
                    <div className="chat-item-details">
                        <p><strong>Location:</strong> {inquiry?.item?.location || item?.location}</p>
                        <p><strong>Category:</strong> {inquiry?.item?.category || item?.category}</p>
                    </div>
                </div>

                {/* Messages */}
                <div className="chat-messages">
                    {/* Initial Message */}
                    {inquiry?.message && (
                        <div className={`message ${isSender ? 'sent' : 'received'}`}>
                            <div className="message-bubble">
                                <p className="message-text">{inquiry.message}</p>
                                <span className="message-time">
                                    {new Date(inquiry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Replies */}
                    {inquiry?.replies?.map((reply, index) => {
                        const isCurrentUser = reply.sender?._id === currentUser.id;
                        return (
                            <div key={index} className={`message ${isCurrentUser ? 'sent' : 'received'}`}>
                                <div className="message-bubble">
                                    <p className="message-sender">{reply.sender?.name}</p>
                                    <p className="message-text">{reply.message}</p>
                                    <span className="message-time">
                                        {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                {inquiry?.status !== 'resolved' && inquiry?.status !== 'closed' && (
                    <div className="chat-input">
                        <textarea
                            placeholder="Type your reply..."
                            value={replyMessage}
                            onChange={(e) => setReplyMessage(e.target.value)}
                            rows="1"
                        />
                        <button 
                            className="send-btn" 
                            onClick={handleSendReply}
                            disabled={sending || !replyMessage.trim()}
                        >
                            {sending ? '...' : 'Send'}
                        </button>
                    </div>
                )}

                {/* Actions */}
                {inquiry?.status !== 'resolved' && inquiry?.status !== 'closed' && (
                    <div className="chat-actions">
                        <button className="resolve-btn" onClick={handleResolve}>
                            Mark as Resolved
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InquiryChatModal;