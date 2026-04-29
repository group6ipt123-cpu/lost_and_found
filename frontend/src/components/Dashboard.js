import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../context/AuthContext';
import ProfileScreen from './ProfileScreen';
import ClaimModal from './ClaimModal';
import logoImage from '../assets/lostandfound_logo.png';
import './Dashboard.css';

const API_URL = 'http://localhost:5000';

const Dashboard = () => {
    const navigate = useNavigate();
    const { user, logout, isAdmin } = useAuth();

    const [items, setItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [uploadedImage, setUploadedImage] = useState(null);
    const [reportMode, setReportMode] = useState('lost');

    const [showProfile, setShowProfile] = useState(false);
    const [showClaimModal, setShowClaimModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [locationFilter, setLocationFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    const [chatModal, setChatModal] = useState(false);
    const [chatItem, setChatItem] = useState(null);
    const [messageInput, setMessageInput] = useState('');
    const [messages, setMessages] = useState({});

    const locations = [
        'Main Library', 'Science Building', 'Engineering Complex',
        'Student Center', 'Cafeteria', 'Gymnasium', 'Administration Building',
        'Arts Building', 'Computer Lab', 'Parking Lot A', 'Quadrangle'
    ];

    const categories = [
        'All', 'Electronics', 'Clothing', 'Accessories', 'Books', 'Documents',
        'Keys', 'Wallet/Purse', 'ID Card', 'Water Bottle', 'Umbrella', 'Others'
    ];

    const onDrop = useCallback((acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                alert('File size must be less than 10MB');
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => setUploadedImage(e.target.result);
            reader.readAsDataURL(file);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
        maxFiles: 1
    });

    useEffect(() => { fetchItems(); }, []);

    useEffect(() => {
        filterItems();
    }, [searchTerm, categoryFilter, locationFilter, statusFilter, items]);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/items`);
            const data = await res.json();
            if (data.success) {
                setItems(data.data || []);
                setFilteredItems(data.data || []);
            }
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const filterItems = () => {
        let filtered = [...items];
        if (categoryFilter !== 'all') filtered = filtered.filter(i => i.category === categoryFilter);
        if (locationFilter !== 'all') filtered = filtered.filter(i => i.location === locationFilter);
        if (statusFilter !== 'all') filtered = filtered.filter(i => i.status === statusFilter);
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(i =>
                (i.name && i.name.toLowerCase().includes(term)) ||
                (i.description && i.description.toLowerCase().includes(term)) ||
                (i.location && i.location.toLowerCase().includes(term))
            );
        }
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setFilteredItems(filtered);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ ...formData, category: reportMode, image: uploadedImage })
            });
            const data = await res.json();
            if (data.success) {
                alert('Item reported successfully!');
                setShowForm(false);
                setUploadedImage(null);
                fetchItems();
            } else { alert(data.message || 'Failed to report item'); }
        } catch (err) { alert('Network error'); }
    };

    const handleClaim = (item) => { setSelectedItem(item); setShowClaimModal(true); };
    const handleInquire = (item) => { setChatItem(item); setChatModal(true); };

    const sendMessage = () => {
        if (!messageInput.trim() || !chatItem) return;
        const newMsg = {
            sender: user?.name || 'You',
            text: messageInput,
            time: new Date().toLocaleTimeString()
        };
        setMessages(prev => ({
            ...prev,
            [chatItem._id]: [...(prev[chatItem._id] || []), newMsg]
        }));
        setMessageInput('');
    };

    const handleClaimSuccess = () => { setShowClaimModal(false); fetchItems(); };

    const formatDate = (date) => new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    const getStatusLabel = (status) => {
        const labels = { pending: 'Pending', claimed: 'Claimed', verified: 'Verified', ready_for_pickup: 'Ready', closed: 'Closed' };
        return labels[status] || status;
    };

    const getItemEmoji = (category) => {
        const emojis = {
            'Electronics': '📱', 'Clothing': '👕', 'Accessories': '💍',
            'Books': '📚', 'Documents': '📄', 'Keys': '🔑',
            'Wallet/Purse': '👛', 'ID Card': '🪪', 'Water Bottle': '🍶',
            'Umbrella': '☂️', 'Others': '📦'
        };
        return emojis[category] || '📦';
    };

    return (
        <div className="dashboard">
            {/* HEADER */}
            <header className="dashboard-header">
                <div className="header-container">
                    <a href="/dashboard" className="logo-container">
                        <img src={logoImage} alt="FindEra" className="logo-image" />
                        <h1 className="logo">Find<span>Era</span></h1>
                    </a>

                    <nav className="header-nav">
                        <button className="nav-link active" onClick={() => navigate('/dashboard')}>Browse</button>
                        {isAdmin && <button className="nav-link" onClick={() => navigate('/admin')}>Admin</button>}
                    </nav>

                    <div className="header-right">
                        <button className="ghost-btn" onClick={() => setShowProfile(true)}>Profile</button>
                        <button className="primary-btn" onClick={() => { setReportMode('lost'); setShowForm(true); }}>
                            Report item
                        </button>
                        <div className="user-profile">
                            <div className="user-avatar">{user?.name?.charAt(0) || 'U'}</div>
                            <button className="logout-btn" onClick={logout}>Sign Out</button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="dashboard-main">
                <div className="main-container">
                    {/* Hero Section */}
                    <section className="hero-section">
                        <div className="hero-content">
                            <h2 className="hero-title">
                                Lost something? <span className="text-accent">Find</span><span className="text-secondary">Era</span> it.
                            </h2>
                            <p className="hero-description">
                                A community-powered lost & found. Post what you've lost, browse what others have found, and reconnect with your belongings.
                            </p>
                        </div>
                        <div className="hero-stats">
                            <div className="stat"><span className="stat-value">{items.length}+</span><span className="stat-label">Items reported</span></div>
                            <div className="stat"><span className="stat-value">{filteredItems.filter(i => i.status === 'verified').length}</span><span className="stat-label">Reunited</span></div>
                        </div>
                    </section>

                    {/* Search & Filters */}
                    <div className="search-section">
                        <div className="search-bar">
                            <input
                                className="search-input"
                                placeholder="Search items by name, location..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="filter-chips">
                            {['all', 'lost', 'found'].map(s => (
                                <button
                                    key={s}
                                    className={`chip ${statusFilter === s ? 'active' : ''} ${s === 'lost' ? 'chip-lost' : s === 'found' ? 'chip-found' : ''}`}
                                    onClick={() => setStatusFilter(s)}
                                >
                                    {s === 'all' ? 'All items' : s}
                                </button>
                            ))}
                            <select className="chip" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
                                <option value="all">All Locations</option>
                                {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                            </select>
                        </div>
                        <div className="results-info">{filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} found</div>
                    </div>

                    {/* Items Grid */}
                    {loading ? (
                        <div className="loading-state"><div className="spinner"></div></div>
                    ) : filteredItems.length > 0 ? (
                        <div className="items-grid">
                            {filteredItems.map(item => (
                                <article key={item._id} className="item-card">
                                    <div className={`item-image ${item.category === 'lost' ? 'bg-lost' : 'bg-found'}`}>
                                        {item.image ? (
                                            <img src={item.image} alt={item.name} />
                                        ) : (
                                            <span className="item-emoji">{getItemEmoji(item.itemCategory)}</span>
                                        )}
                                        <span className={`item-badge ${item.category}`}>{item.category}</span>
                                        <span className="item-category-tag">{item.itemCategory}</span>
                                    </div>
                                    <div className="item-body">
                                        <h3 className="item-title">{item.name}</h3>
                                        <p className="item-description">{item.description?.substring(0, 100)}{item.description?.length > 100 ? '...' : ''}</p>
                                        <div className="item-meta">
                                            <span>📍 {item.location}</span>
                                            <span>📅 {formatDate(item.date)}</span>
                                        </div>
                                        <div className="item-footer">
                                            <span className={`status-pill ${item.status}`}>{getStatusLabel(item.status)}</span>
                                            <div className="item-actions">
                                                {item.category === 'found' && item.status === 'pending' && (
                                                    <button className="btn-claim" onClick={() => handleClaim(item)}>This is mine</button>
                                                )}
                                                <button className="btn-inquire" onClick={() => handleInquire(item)}>
                                                    {item.category === 'lost' ? 'I found it' : 'Message'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-icon">🔍</div>
                            <h3>No items found</h3>
                            <p>Try adjusting your filters or be the first to report an item!</p>
                            <button className="primary-btn" onClick={() => { setReportMode('lost'); setShowForm(true); }}>Report an item</button>
                        </div>
                    )}
                </div>
            </main>

            {/* Report Modal */}
            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="dialog-modal" onClick={e => e.stopPropagation()}>
                        <div className="dialog-header">
                            <h2>Report an item</h2>
                            <p>Share a few details — the more specific, the faster the match.</p>
                            <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
                        </div>
                        <div className="mode-toggle">
                            <button className={`mode-btn ${reportMode === 'lost' ? 'active lost' : ''}`} onClick={() => setReportMode('lost')}>I lost something</button>
                            <button className={`mode-btn ${reportMode === 'found' ? 'active found' : ''}`} onClick={() => setReportMode('found')}>I found something</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="image-upload-area">
                                {!uploadedImage ? (
                                    <div {...getRootProps()} className="upload-zone">
                                        <input {...getInputProps()} />
                                        <p>Click or drag to upload photo</p>
                                        <span>Optional</span>
                                    </div>
                                ) : (
                                    <div className="preview">
                                        <img src={uploadedImage} alt="Preview" />
                                        <button type="button" onClick={() => setUploadedImage(null)}>×</button>
                                    </div>
                                )}
                            </div>
                            <input type="text" placeholder="Item title" required />
                            <div className="form-row-2">
                                <select value={formData.itemCategory} onChange={(e) => setFormData({...formData, itemCategory: e.target.value})}>
                                    {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <select value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})}>
                                    {locations.map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                            </div>
                            <textarea placeholder="Description — color, brand, distinguishing details..." rows={3} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required />
                            <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} required />
                            <button type="submit" className="submit-btn">Submit report</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Chat Modal */}
            {chatModal && chatItem && (
                <div className="modal-overlay" onClick={() => setChatModal(false)}>
                    <div className="chat-modal" onClick={e => e.stopPropagation()}>
                        <div className="chat-header">
                            <h3>{chatItem.name}</h3>
                            <button onClick={() => setChatModal(false)}>×</button>
                        </div>
                        <div className="chat-body">
                            {(messages[chatItem._id] || []).map((msg, i) => (
                                <div key={i} className="chat-bubble">
                                    <strong>{msg.sender}</strong>: {msg.text}
                                    <span>{msg.time}</span>
                                </div>
                            ))}
                        </div>
                        <div className="chat-input">
                            <input value={messageInput} onChange={e => setMessageInput(e.target.value)} placeholder="Type message..." onKeyPress={e => e.key === 'Enter' && sendMessage()} />
                            <button onClick={sendMessage}>Send</button>
                        </div>
                    </div>
                </div>
            )}

            {showProfile && <ProfileScreen onClose={() => setShowProfile(false)} />}
            {showClaimModal && <ClaimModal item={selectedItem} onClose={() => setShowClaimModal(false)} onSuccess={handleClaimSuccess} />}
        </div>
    );
};

export default Dashboard;