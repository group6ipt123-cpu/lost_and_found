import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './ProfileScreen.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const ProfileScreen = ({ onClose }) => {
    const { user, logout } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        studentId: '',
        contactNumber: '',
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
    });

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                name: user.name || '',
                email: user.email || '',
                studentId: user.studentId || '',
                contactNumber: user.contactNumber || ''
            }));
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        
        if (formData.newPassword && formData.newPassword !== formData.confirmNewPassword) {
            setError('New passwords do not match');
            return;
        }

        if (formData.newPassword && formData.newPassword.length < 6) {
            setError('New password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const updateData = {
                name: formData.name,
                studentId: formData.studentId,
                contactNumber: formData.contactNumber
            };

            if (formData.newPassword) {
                updateData.currentPassword = formData.currentPassword;
                updateData.newPassword = formData.newPassword;
            }

            const response = await fetch(`${API_URL}/api/auth/update-profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updateData)
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem('user', JSON.stringify(data.user));
                setSuccess('Profile updated successfully!');
                setIsEditing(false);
                setFormData({
                    ...formData,
                    currentPassword: '',
                    newPassword: '',
                    confirmNewPassword: ''
                });
                setTimeout(() => {
                    onClose();
                    window.location.reload();
                }, 1500);
            } else {
                setError(data.message || 'Update failed');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to sign out?')) {
            logout();
            onClose();
        }
    };

    return (
        <div className="profile-overlay" onClick={onClose}>
            <div className="profile-panel" onClick={(e) => e.stopPropagation()}>
                <button className="profile-close" onClick={onClose}>×</button>
                
                {/* Profile Header */}
                <div className="profile-header">
                    <div className="profile-avatar-large">
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <h2 className="profile-name">{user?.name}</h2>
                    <span className={`profile-role-badge ${user?.role}`}>
                        {user?.role}
                    </span>
                </div>

                {/* Success/Error Messages */}
                {success && <div className="profile-success">{success}</div>}
                {error && <div className="profile-error">{error}</div>}

                {!isEditing ? (
                    <>
                        {/* View Mode */}
                        <div className="profile-info-section">
                            <div className="info-item">
                                <span className="info-icon">📧</span>
                                <div className="info-content">
                                    <label>Email</label>
                                    <p>{user?.email}</p>
                                </div>
                            </div>
                            
                            <div className="info-item">
                                <span className="info-icon">🆔</span>
                                <div className="info-content">
                                    <label>Student ID</label>
                                    <p>{user?.studentId || 'Not provided'}</p>
                                </div>
                            </div>
                            
                            <div className="info-item">
                                <span className="info-icon">📱</span>
                                <div className="info-content">
                                    <label>Contact Number</label>
                                    <p>{user?.contactNumber || 'Not provided'}</p>
                                </div>
                            </div>
                            
                            <div className="info-item">
                                <span className="info-icon">📅</span>
                                <div className="info-content">
                                    <label>Member Since</label>
                                    <p>{new Date(user?.createdAt || Date.now()).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="profile-actions">
                            <button className="btn-edit-profile" onClick={() => setIsEditing(true)}>
                                Edit Profile
                            </button>
                            <button className="btn-signout" onClick={handleLogout}>
                                Sign Out
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Edit Mode */}
                        <form className="profile-edit-form" onSubmit={handleSubmit}>
                            <div className="form-section">
                                <h4>Personal Information</h4>
                                
                                <div className="form-field">
                                    <label>Full Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-field">
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        disabled
                                        className="disabled-field"
                                    />
                                    <small>Email cannot be changed</small>
                                </div>

                                <div className="form-field">
                                    <label>Student ID</label>
                                    <input
                                        type="text"
                                        name="studentId"
                                        value={formData.studentId}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-field">
                                    <label>Contact Number</label>
                                    <input
                                        type="tel"
                                        name="contactNumber"
                                        value={formData.contactNumber}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-section">
                                <h4>Change Password</h4>
                                <p className="section-hint">Leave blank to keep current password</p>

                                <div className="form-field">
                                    <label>Current Password</label>
                                    <input
                                        type="password"
                                        name="currentPassword"
                                        value={formData.currentPassword}
                                        onChange={handleChange}
                                        placeholder="Enter current password"
                                    />
                                </div>

                                <div className="form-field">
                                    <label>New Password</label>
                                    <input
                                        type="password"
                                        name="newPassword"
                                        value={formData.newPassword}
                                        onChange={handleChange}
                                        placeholder="Enter new password"
                                    />
                                </div>

                                <div className="form-field">
                                    <label>Confirm New Password</label>
                                    <input
                                        type="password"
                                        name="confirmNewPassword"
                                        value={formData.confirmNewPassword}
                                        onChange={handleChange}
                                        placeholder="Confirm new password"
                                    />
                                </div>
                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn-cancel" onClick={() => setIsEditing(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-save" disabled={loading}>
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>

                        <button className="btn-signout-secondary" onClick={handleLogout}>
                            Sign Out
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default ProfileScreen;