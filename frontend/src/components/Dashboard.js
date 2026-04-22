import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../context/AuthContext';
import { itemsAPI, claimsAPI, inquiriesAPI } from '../services/api';
import ProfileScreen from './ProfileScreen';
import AllPostsScreen from './AllPostsScreen';
import ClaimModal from './ClaimModal';
import InquiryChatModal from './InquiryChatModal';
import './Dashboard.css';

const Dashboard = () => {
    const navigate = useNavigate();
    const { user, logout, isAdmin } = useAuth();
    const [items, setItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [showClaimModal, setShowClaimModal] = useState(false);
    const [showInquiryChat, setShowInquiryChat] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [uploadedImage, setUploadedImage] = useState(null);
    const [currentInquiryId, setCurrentInquiryId] = useState(null);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    useEffect(() => {
    setNotifications([
        { id: 1, message: "Someone inquired about your item" },
        { id: 2, message: "Your item has been claimed" }
    ]);
}, []);


    
    const [formData, setFormData] = useState({
        name: '', 
        description: '', 
        category: 'lost', 
        itemCategory: 'Electronics',
        location: 'Main Library', 
        date: ''
    });

    const locations = [
        'Main Library', 'Science Building', 'Engineering Complex', 
        'Student Center', 'Cafeteria', 'Gymnasium', 'Administration Building',
        'Arts Building', 'Computer Lab', 'Parking Lot A', 'Quadrangle'
    ];

    const categories = [
        'Electronics', 'Clothing', 'Accessories', 'Books', 'Documents',
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

    useEffect(() => {
        fetchItems();
    }, []);

    useEffect(() => {
        filterItems();
    }, [searchTerm, categoryFilter, items]);

    const fetchItems = async () => {
        setLoading(true);
        const data = await itemsAPI.getAll();
        if (data.success) {
            setItems(data.data || []);
            setFilteredItems(data.data || []);
        }
        setLoading(false);
    };

    const filterItems = () => {
        let filtered = [...items];
        if (categoryFilter !== 'all') {
            filtered = filtered.filter(item => item.category === categoryFilter);
        }
        if (searchTerm) {
            filtered = filtered.filter(item =>
                item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.location?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setFilteredItems(filtered);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = await itemsAPI.create({ ...formData, image: uploadedImage });
        if (data.success) {
            alert('Item reported successfully!');
            setShowForm(false);
            setFormData({ 
                name: '', description: '', category: 'lost', 
                itemCategory: 'Electronics', location: 'Main Library', date: '' 
            });
            setUploadedImage(null);
            fetchItems();
        } else {
            alert(data.message || 'Failed to report item');
        }
    };

    const handleClaim = (item) => {
        setSelectedItem(item);
        setShowClaimModal(true);
    };

    const handleInquire = async (item) => {
        setSelectedItem(item);
        const data = await inquiriesAPI.getAll();
        if (data.success) {
            const existing = data.data.find(
                inv => inv.item._id === item._id && !['closed', 'resolved'].includes(inv.status)
            );
            if (existing) {
                setCurrentInquiryId(existing._id);
                setShowInquiryChat(true);
                return;
            }
        }
        setCurrentInquiryId(null);
        setShowInquiryChat(true);
    };

    const handleClaimSuccess = () => {
        setShowClaimModal(false);
        setSelectedItem(null);
        fetchItems();
    };

    const formatTimeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        if (seconds < 60) return `${seconds}s ago`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    };

    const getStatusLabel = (status) => {
        const labels = {
            pending: 'Pending', claimed: 'Claimed', verified: 'Verified',
            ready_for_pickup: 'Ready', picked_up: 'Picked Up', closed: 'Closed'
        };
        return labels[status] || status;
    };

    return (
        <div className="dashboard">
            {/* Header */}
            <header className="dashboard-header">
                <div className="header-container">
    <div className="header-left">
        <h1 className="logo">Lost & Found</h1>
    </div>

  <div className="header-right">
    <button className="nav-btn" onClick={() => navigate('/posts')}>
        Browse All
    </button>

    {/* PROFILE FIRST */}
    <button className="nav-btn" onClick={() => setShowProfile(true)}>
        Profile
    </button>

    {/* NOTIFICATION BELL SECOND */}
    <div className="notification-wrapper">
        <button
            className="notification-btn"
            onClick={() => {
                setShowNotifications(!showNotifications);
                setNotifications([]); // clears badge when clicked
            }}
        >
            🔔

            {notifications.length > 0 && (
                <span className="notification-badge">
                    {notifications.length > 9 ? '9+' : notifications.length}
                </span>
            )}
        </button>

        {showNotifications && (
            <div className="notification-dropdown">
                <h4>Notifications</h4>

                {notifications.length > 0 ? (
                    notifications.map((notif, index) => (
                        <div key={index} className="notification-item">
                            {notif.message}
                        </div>
                    ))
                ) : (
                    <div className="no-notif">No notifications</div>
                )}
            </div>
        )}
    </div>

    <div className="user-info">
        <span className="user-name">{user?.name}</span>
        <span className={`user-role ${user?.role}`}>{user?.role}</span>
    </div>

    <button className="logout-btn" onClick={logout}>
        Sign Out
    </button>
</div>
    </div>
            </header>

            {/* Main Content */}
            <main className="dashboard-main">
                <div className="main-container">
                    {/* Quick Actions */}
                    <div className="quick-actions">
                        <button className="create-post-btn" onClick={() => setShowForm(true)}>
                            <span className="plus-icon">+</span>
                            <span>Report Item</span>
                        </button>
                        
                        <div className="filter-tabs">
                            <button 
                                className={`filter-tab ${categoryFilter === 'all' ? 'active' : ''}`}
                                onClick={() => setCategoryFilter('all')}
                            >
                                All
                            </button>
                            <button 
                                className={`filter-tab lost ${categoryFilter === 'lost' ? 'active' : ''}`}
                                onClick={() => setCategoryFilter('lost')}
                            >
                                Lost
                            </button>
                            <button 
                                className={`filter-tab found ${categoryFilter === 'found' ? 'active' : ''}`}
                                onClick={() => setCategoryFilter('found')}
                            >
                                Found
                            </button>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="search-wrapper">
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search items by name, description, or location..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Report Form Modal */}
                    {showForm && (
                        <div className="modal-overlay" onClick={() => setShowForm(false)}>
                            <div className="form-modal" onClick={(e) => e.stopPropagation()}>
                                <div className="modal-header">
                                    <h2>Report Item</h2>
                                    <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
                                </div>
                                
                                <form className="post-form" onSubmit={handleSubmit}>
                                    <div className="image-upload">
                                        {!uploadedImage ? (
                                            <div {...getRootProps()} className={`upload-area ${isDragActive ? 'active' : ''}`}>
                                                <input {...getInputProps()} />
                                                <div className="upload-icon">+</div>
                                                <p>{isDragActive ? 'Drop image here' : 'Click or drag to upload'}</p>
                                                <span>Optional • Max 10MB</span>
                                            </div>
                                        ) : (
                                            <div className="image-preview">
                                                <img src={uploadedImage} alt="Preview" />
                                                <button type="button" className="remove-image" onClick={() => setUploadedImage(null)}>×</button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="form-row">
                                        <div className="form-field">
                                            <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                                                <option value="lost">Lost Item</option>
                                                <option value="found">Found Item</option>
                                            </select>
                                        </div>
                                        <div className="form-field">
                                            <select value={formData.itemCategory} onChange={(e) => setFormData({...formData, itemCategory: e.target.value})}>
                                                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <div className="form-field">
                                        <input type="text" placeholder="Item name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                                    </div>
                                    
                                    <div className="form-field">
                                        <textarea placeholder="Description..." value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required rows="2" />
                                    </div>
                                    
                                    <div className="form-row">
                                        <div className="form-field">
                                            <select value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})}>
                                                {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                                            </select>
                                        </div>
                                        <div className="form-field">
                                            <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} required />
                                        </div>
                                    </div>
                                    
                                    <button type="submit" className="submit-btn">Post Item</button>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Items Grid */}
                    {loading ? (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>Loading items...</p>
                        </div>
                    ) : filteredItems.length > 0 ? (
                        <div className="items-masonry">
                            {filteredItems.map(item => (
                                <article key={item._id} className="item-post">
                                    <div className="post-image">
                                        {item.image ? (
                                            <img src={item.image} alt={item.name} />
                                        ) : (
                                            <div className="placeholder-image">
                                                <span>{item.itemCategory?.charAt(0) || 'I'}</span>
                                            </div>
                                        )}
                                        <span className={`post-type ${item.category}`}>
                                            {item.category === 'lost' ? 'LOST' : 'FOUND'}
                                        </span>
                                    </div>

                                    <div className="post-content">
                                        <div className="post-header">
                                            <div className="post-user">
                                                <div className="user-avatar-small">
                                                    {item.reportedBy?.name?.charAt(0) || 'A'}
                                                </div>
                                                <div>
                                                    <span className="post-username">{item.reportedBy?.name || 'Anonymous'}</span>
                                                    <span className="post-location">{item.location}</span>
                                                </div>
                                            </div>
                                            <span className="post-time">{formatTimeAgo(item.createdAt)}</span>
                                        </div>

                                        <h3 className="post-title">{item.name}</h3>
                                        <p className="post-description">{item.description}</p>
                                        
                                        <div className="post-meta">
                                            <span className="meta-tag">{item.itemCategory}</span>
                                            <span className={`status-badge ${item.status}`}>{getStatusLabel(item.status)}</span>
                                        </div>

                                        <div className="post-actions">
                                            {item.category === 'found' && item.status === 'pending' && !isAdmin && (
                                                <button className="action-btn claim" onClick={() => handleClaim(item)}>
                                                    Claim Item
                                                </button>
                                            )}
                                            {item.category === 'lost' && item.status === 'pending' && (
                                                <button className="action-btn inquire" onClick={() => handleInquire(item)}>
                                                    Inquire
                                                </button>
                                            )}
                                            {(item.status === 'claimed' || item.status === 'verified') && (
                                                <button className="action-btn chat" onClick={() => handleInquire(item)}>
                                                    View Chat
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-content">
                                <div className="empty-icon"></div>
                                <h3>No items found</h3>
                                <p>Be the first to report a lost or found item!</p>
                                <button className="create-first-btn" onClick={() => setShowForm(true)}>
                                    Report an Item
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Modals */}
            {showProfile && <ProfileScreen onClose={() => setShowProfile(false)} />}
            {showClaimModal && (
                <ClaimModal 
                    item={selectedItem}
                    onClose={() => setShowClaimModal(false)}
                    onSuccess={handleClaimSuccess}
                />
            )}
            {showInquiryChat && selectedItem && (
                <InquiryChatModal 
                    inquiryId={currentInquiryId}
                    item={selectedItem}
                    onClose={() => {
                        setShowInquiryChat(false);
                        setSelectedItem(null);
                        setCurrentInquiryId(null);
                    }}
                />
            )}
        </div>
    );
};

export default Dashboard;