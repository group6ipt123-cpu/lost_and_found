import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ClaimModal from './ClaimModal';  
import './AllPostsScreen.css';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const AllPostsScreen = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [posts, setPosts] = useState([]);
    const [filteredPosts, setFilteredPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedPost, setSelectedPost] = useState(null);
    const [showClaimModal, setShowClaimModal] = useState(false);

    useEffect(() => {
        fetchPosts();
    }, []);

    useEffect(() => {
        filterPosts();
    }, [searchTerm, categoryFilter, statusFilter, posts]);

    const fetchPosts = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${API_URL}/api/items`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setPosts(data.data || []);
                setFilteredPosts(data.data || []);
            }
        } catch (err) {
            console.error('Failed to fetch posts:', err);
        } finally {
            setLoading(false);
        }
    };

    const filterPosts = () => {
        let filtered = [...posts];

        if (categoryFilter !== 'all') {
            filtered = filtered.filter(post => post.category === categoryFilter);
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter(post => post.status === statusFilter);
        }

        if (searchTerm) {
            filtered = filtered.filter(post =>
                post.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                post.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                post.location?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setFilteredPosts(filtered);
    };

    const handleClaim = async (postId) => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${API_URL}/api/claims/${postId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                alert('Claim filed successfully! Waiting for admin verification.');
                fetchPosts();
                setSelectedPost(null);
            } else {
                alert(data.message || 'Failed to claim item');
            }
        } catch (err) {
            alert('Network error. Please try again.');
        }
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'pending': return '#f59e0b';
            case 'claimed': return '#3b82f6';
            case 'verified': return '#10b981';
            case 'ready_for_pickup': return '#8b5cf6';
            default: return '#6b7280';
        }
    };

    const getStatusLabel = (status) => {
        switch(status) {
            case 'pending': return 'Pending';
            case 'claimed': return 'Claimed';
            case 'verified': return 'Verified';
            case 'ready_for_pickup': return 'Ready for Pickup';
            default: return status;
        }
    };

    const isAdmin = user?.role === 'admin';

    return (
        <div className="all-posts-page">
            {/* Header */}
            <header className="page-header">
                <div className="header-container">
                    <div className="header-left">
                        <button className="back-button" onClick={() => navigate('/dashboard')}>
                            ← Back to Dashboard
                        </button>
                        <h1 className="page-title">All Lost & Found Posts</h1>
                    </div>
                    <div className="header-right">
                        <span className="post-count-badge">{filteredPosts.length} posts</span>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="page-main">
                <div className="main-container">
                    {/* Search and Filters */}
                    <div className="filters-section">
                        <div className="search-container">
                            <input
                                type="text"
                                className="search-field"
                                placeholder="Search posts by name, description, or location..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        
                        <div className="filter-tabs">
                            <button 
                                className={`filter-tab ${categoryFilter === 'all' ? 'active' : ''}`}
                                onClick={() => setCategoryFilter('all')}
                            >
                                All
                            </button>
                            <button 
                                className={`filter-tab ${categoryFilter === 'lost' ? 'active' : ''}`}
                                onClick={() => setCategoryFilter('lost')}
                            >
                                Lost
                            </button>
                            <button 
                                className={`filter-tab ${categoryFilter === 'found' ? 'active' : ''}`}
                                onClick={() => setCategoryFilter('found')}
                            >
                                Found
                            </button>
                        </div>

                        <div className="status-filter">
                            <select 
                                value={statusFilter} 
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="status-select"
                            >
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="claimed">Claimed</option>
                                <option value="verified">Verified</option>
                                <option value="ready_for_pickup">Ready for Pickup</option>
                            </select>
                        </div>
                    </div>

                    {/* Posts Grid */}
                    {loading ? (
                        <div className="loading-container">
                            <div className="loading-spinner"></div>
                            <p>Loading posts...</p>
                        </div>
                    ) : filteredPosts.length > 0 ? (
                        <div className="posts-grid">
                            {filteredPosts.map(post => (
                                <div 
                                    key={post._id} 
                                    className="post-card"
                                    onClick={() => setSelectedPost(post)}
                                >
                                    <div className="post-header">
                                        <h3 className="post-title">{post.name}</h3>
                                        <span className={`post-category ${post.category}`}>
                                            {post.category}
                                        </span>
                                    </div>
                                    
                                    <p className="post-description">{post.description}</p>
                                    
                                    <div className="post-details">
                                        <div className="detail-row">
                                            <span className="detail-label">Location</span>
                                            <span className="detail-value">{post.location}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">Date</span>
                                            <span className="detail-value">
                                                {new Date(post.date).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">Reported By</span>
                                            <span className="detail-value">
                                                {post.reportedBy?.name || 'Anonymous'}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="post-footer">
                                        <span 
                                            className="post-status"
                                            style={{ 
                                                backgroundColor: getStatusColor(post.status) + '15',
                                                color: getStatusColor(post.status)
                                            }}
                                        >
                                            {getStatusLabel(post.status)}
                                        </span>
                                        
                                        {post.category === 'found' && post.status === 'pending' && !isAdmin && (
                                            <button 
                                                className="claim-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedPost(post);
                                                    setShowClaimModal(true);
                                                }}
                                            >
                                                Claim
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-container">
                            <div className="empty-content">
                                <div className="empty-icon"></div>
                                <h3>No posts found</h3>
                                <p>Try adjusting your filters or search terms.</p>
                                <button className="clear-filters-btn" onClick={() => {
                                    setSearchTerm('');
                                    setCategoryFilter('all');
                                    setStatusFilter('all');
                                }}>
                                    Clear Filters
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Post Detail Modal */}
            {selectedPost && !showClaimModal && (
                <div className="modal-overlay" onClick={() => setSelectedPost(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setSelectedPost(null)}>×</button>
                        
                        <div className="modal-header">
                            <h2 className="modal-title">{selectedPost.name}</h2>
                            <span className={`modal-category ${selectedPost.category}`}>
                                {selectedPost.category}
                            </span>
                        </div>
                        
                        <div className="modal-body">
                            <p className="modal-description">{selectedPost.description}</p>
                            
                            <div className="modal-details">
                                <div className="detail-item">
                                    <span className="detail-label">Location</span>
                                    <span className="detail-value">{selectedPost.location}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Date</span>
                                    <span className="detail-value">
                                        {new Date(selectedPost.date).toLocaleString()}
                                    </span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Reported By</span>
                                    <span className="detail-value">
                                        {selectedPost.reportedBy?.name || 'Anonymous'}
                                    </span>
                                    <span className="detail-sub">
                                        {selectedPost.reportedBy?.email}
                                    </span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Status</span>
                                    <span 
                                        className="detail-value"
                                        style={{ color: getStatusColor(selectedPost.status) }}
                                    >
                                        {getStatusLabel(selectedPost.status)}
                                    </span>
                                </div>
                                {selectedPost.claimedBy && (
                                    <div className="detail-item">
                                        <span className="detail-label">Claimed By</span>
                                        <span className="detail-value">
                                            {selectedPost.claimedBy?.name || 'Unknown'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="modal-footer">
                            {selectedPost.category === 'found' && 
                             selectedPost.status === 'pending' && 
                             !isAdmin && (
                                <button 
                                    className="modal-claim-btn"
                                    onClick={() => setShowClaimModal(true)}
                                >
                                    Claim This Item
                                </button>
                            )}
                            <button className="modal-close-btn" onClick={() => setSelectedPost(null)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Claim Modal */}
            {showClaimModal && selectedPost && (
                <ClaimModal
                    item={selectedPost}
                    onClose={() => {
                        setShowClaimModal(false);
                        setSelectedPost(null);
                    }}
                    onSuccess={() => {
                        setShowClaimModal(false);
                        setSelectedPost(null);
                        fetchPosts();
                    }}
                />
            )}
        </div>
    );
};

export default AllPostsScreen;