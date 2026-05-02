/* eslint-disable */
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MessageList = ({ item, onSelectChat, onClose }) => {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchConversations = React.useCallback(async () => {
        if (!item) return;
        try {
            const token = localStorage.getItem('token');
            const roomsRes = await axios.get('http://localhost:5000/api/chat/rooms', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (roomsRes.data.success) {
                const itemRooms = roomsRes.data.data.filter(
                    r => r.itemId === item._id || r.item?._id === item._id
                );
                setConversations(itemRooms);
            }
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    }, [item]);

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    const formatTime = (date) => {
        if (!date) return '';
        const now = new Date();
        const past = new Date(date);
        const mins = Math.floor((now - past) / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        return past.toLocaleDateString();
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 20
        }} onClick={onClose}>
            <div style={{
                background: 'white', borderRadius: 16, width: '100%', maxWidth: 500,
                maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden'
            }} onClick={(e) => e.stopPropagation()}>
                
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '16px 20px', background: '#0B3A66', color: 'white'
                }}>
                    <h2 style={{ margin: 0, fontSize: 16 }}>Messages: {item?.name}</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: 22, cursor: 'pointer' }}>X</button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {loading ? (
                        <p style={{ textAlign: 'center', padding: 40 }}>Loading conversations...</p>
                    ) : conversations.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 40 }}>
                            <p style={{ fontSize: 15, color: '#333' }}>No messages yet</p>
                            <p style={{ fontSize: 13, color: '#999', marginTop: 8 }}>
                                When someone shows interest in your item, their conversation will appear here
                            </p>
                        </div>
                    ) : (
                        conversations.map((conv) => {
                            const otherUser = conv.otherUser || {};
                            return (
                                <div key={conv._id} 
                                    onClick={() => onSelectChat(conv)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 12,
                                        padding: '16px 20px', cursor: 'pointer',
                                        borderBottom: '1px solid #f0f0f0'
                                    }}
                                >
                                    <div style={{
                                        width: 48, height: 48, borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #0B3A66, #1a2a8a)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: 'white', fontWeight: 700, fontSize: 18, flexShrink: 0
                                    }}>
                                        {(otherUser.name || '?').charAt(0).toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <span style={{ fontWeight: 600, color: '#0B3A66', fontSize: 14 }}>
                                                {otherUser.name || 'Unknown User'}
                                            </span>
                                            <span style={{ fontSize: 11, color: '#999' }}>
                                                {formatTime(conv.lastMessageTime)}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: 13, color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {conv.lastMessage || 'No messages'}
                                        </div>
                                    </div>
                                    <span style={{ color: '#ccc', fontSize: 18 }}>{'>'}</span>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default MessageList;