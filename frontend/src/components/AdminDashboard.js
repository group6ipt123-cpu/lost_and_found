import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [items, setItems] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [statsRes, usersRes, itemsRes] = await Promise.all([
                adminAPI.getStats(),
                adminAPI.getUsers(),
                adminAPI.getItems()
            ]);

            if (statsRes.success) setStats(statsRes.data);
            if (usersRes.success) setUsers(usersRes.data);
            if (itemsRes.success) setItems(itemsRes.data);
        } catch (error) {
            console.error('Failed to fetch admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            const result = await adminAPI.deleteUser(userId);
            if (result.success) {
                setUsers(users.filter(u => u._id !== userId));
                alert('User deleted successfully');
            }
        }
    };

    const handleUpdateItemStatus = async (itemId, status) => {
        const result = await adminAPI.updateItem(itemId, { status });
        if (result.success) {
            setItems(items.map(i => i._id === itemId ? result.data : i));
            alert('Item status updated');
        }
    };

    const handleDeleteItem = async (itemId) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            const result = await adminAPI.deleteItem(itemId);
            if (result.success) {
                setItems(items.filter(i => i._id !== itemId));
                alert('Item deleted successfully');
            }
        }
    };

    if (loading) return <div className="loading">Loading admin dashboard...</div>;

    return (
        <div className="admin-dashboard">
            <h1>Admin Dashboard</h1>
            
            <div className="admin-tabs">
                <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>Overview</button>
                <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>Users</button>
                <button className={activeTab === 'items' ? 'active' : ''} onClick={() => setActiveTab('items')}>Items</button>
            </div>

            {activeTab === 'overview' && stats && (
                <div className="overview-stats">
                    <div className="stat-card">
                        <h3>Total Users</h3>
                        <p className="stat-value">{stats.users}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Total Items</h3>
                        <p className="stat-value">{stats.items.total}</p>
                        <small>Lost: {stats.items.lost} | Found: {stats.items.found}</small>
                    </div>
                    <div className="stat-card">
                        <h3>Pending Claims</h3>
                        <p className="stat-value">{stats.claims.pending}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Pending Inquiries</h3>
                        <p className="stat-value">{stats.inquiries.pending}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Resolved Items</h3>
                        <p className="stat-value">{stats.resolved}</p>
                    </div>
                </div>
            )}

            {activeTab === 'users' && (
                <div className="users-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Student ID</th>
                                <th>Contact</th>
                                <th>Joined</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user._id}>
                                    <td>{user.name}</td>
                                    <td>{user.email}</td>
                                    <td><span className={`role-badge ${user.role}`}>{user.role}</span></td>
                                    <td>{user.studentId || '-'}</td>
                                    <td>{user.contactNumber}</td>
                                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <button className="delete-btn" onClick={() => handleDeleteUser(user._id)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'items' && (
                <div className="items-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Type</th>
                                <th>Location</th>
                                <th>Status</th>
                                <th>Reported By</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map(item => (
                                <tr key={item._id}>
                                    <td>{item.name}</td>
                                    <td>{item.itemCategory}</td>
                                    <td><span className={`type-badge ${item.category}`}>{item.category}</span></td>
                                    <td>{item.location}</td>
                                    <td>
                                        <select 
                                            value={item.status} 
                                            onChange={(e) => handleUpdateItemStatus(item._id, e.target.value)}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="claimed">Claimed</option>
                                            <option value="verified">Verified</option>
                                            <option value="ready_for_pickup">Ready for Pickup</option>
                                            <option value="closed">Closed</option>
                                        </select>
                                    </td>
                                    <td>{item.reportedBy?.name || 'Unknown'}</td>
                                    <td>
                                        <button className="delete-btn" onClick={() => handleDeleteItem(item._id)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;