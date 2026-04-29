import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const API_URL = 'http://localhost:5000';

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [items, setItems] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        const token = localStorage.getItem('token');
        setLoading(true);
        try {
            const [statsRes, usersRes, itemsRes] = await Promise.all([
                fetch(`${API_URL}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_URL}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_URL}/api/items`)
            ]);

            const statsData = await statsRes.json();
            const usersData = await usersRes.json();
            const itemsData = await itemsRes.json();

            if (statsData.success) setStats(statsData.data);
            if (usersData.success) setUsers(usersData.data);
            if (itemsData.success) setItems(itemsData.data);
        } catch (err) {
            console.error('Failed to fetch admin data');
        } finally {
            setLoading(false);
        }
    };

    const updateItemStatus = async (itemId, status) => {
        const token = localStorage.getItem('token');
        await fetch(`${API_URL}/api/admin/items/${itemId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ status })
        });
        fetchAllData();
    };

    const deleteItem = async (itemId) => {
        if (!window.confirm('Delete this item?')) return;
        const token = localStorage.getItem('token');
        await fetch(`${API_URL}/api/admin/items/${itemId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
        fetchAllData();
    };

    if (loading) return <div className="loading">Loading...</div>;

    return (
        <div className="dashboard">
            <header className="dashboard-header">
                <div className="header-container">
                    <h1 className="logo">Admin Panel</h1>
                    <div className="header-right">
                        <span className="user-name">{user?.name}</span>
                        <button className="logout-btn" onClick={logout}>Sign Out</button>
                    </div>
                </div>
            </header>

            <main className="dashboard-main">
                <div className="admin-tabs">
                    <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
                    <button className={`tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>Users</button>
                    <button className={`tab ${activeTab === 'items' ? 'active' : ''}`} onClick={() => setActiveTab('items')}>Items</button>
                </div>

                {activeTab === 'overview' && stats && (
                    <div className="stats-grid">
                        <div className="stat-card"><h3>Total Users</h3><p>{stats.users}</p></div>
                        <div className="stat-card"><h3>Total Items</h3><p>{stats.items.total}</p></div>
                        <div className="stat-card"><h3>Lost Items</h3><p>{stats.items.lost}</p></div>
                        <div className="stat-card"><h3>Found Items</h3><p>{stats.items.found}</p></div>
                        <div className="stat-card"><h3>Pending</h3><p>{stats.pending}</p></div>
                        <div className="stat-card"><h3>Claimed</h3><p>{stats.claimed}</p></div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <table className="data-table">
                        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Student ID</th><th>Contact</th></tr></thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u._id}><td>{u.name}</td><td>{u.email}</td><td>{u.role}</td><td>{u.studentId}</td><td>{u.contactNumber}</td></tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {activeTab === 'items' && (
                    <table className="data-table">
                        <thead><tr><th>Name</th><th>Category</th><th>Location</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>
                            {items.map(item => (
                                <tr key={item._id}>
                                    <td>{item.name}</td>
                                    <td>{item.category}</td>
                                    <td>{item.location}</td>
                                    <td>
                                        <select value={item.status} onChange={(e) => updateItemStatus(item._id, e.target.value)}>
                                            <option value="pending">Pending</option>
                                            <option value="claimed">Claimed</option>
                                            <option value="verified">Verified</option>
                                            <option value="ready_for_pickup">Ready for Pickup</option>
                                            <option value="closed">Closed</option>
                                        </select>
                                    </td>
                                    <td><button onClick={() => deleteItem(item._id)} className="delete-btn">Delete</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;