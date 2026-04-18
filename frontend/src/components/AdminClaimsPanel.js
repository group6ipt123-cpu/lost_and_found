import React, { useState, useEffect } from 'react';
import './AdminClaimsPanel.css';

const API_URL = 'http://localhost:3000';

const AdminClaimsPanel = ({ onClose }) => {
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedClaim, setSelectedClaim] = useState(null);
    const [adminNote, setAdminNote] = useState('');
    const [filter, setFilter] = useState('pending');

    useEffect(() => {
        fetchClaims();
    }, []);

    const fetchClaims = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${API_URL}/api/claims`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setClaims(data.data || []);
            }
        } catch (err) {
            console.error('Failed to fetch claims:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (claimId, status) => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${API_URL}/api/claims/${claimId}/verify`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status, adminNote })
            });

            const data = await response.json();
            if (data.success) {
                alert(`Claim ${status}!`);
                fetchClaims();
                setSelectedClaim(null);
                setAdminNote('');
            } else {
                alert(data.message || 'Failed to update claim');
            }
        } catch (err) {
            alert('Network error. Please try again.');
        }
    };

    const filteredClaims = claims.filter(claim => {
        if (filter === 'all') return true;
        return claim.status === filter;
    });

    return (
        <div className="admin-claims-overlay">
            <div className="admin-claims-panel">
                <button className="close-panel" onClick={onClose}>✕</button>
                
                <h2>📋 Claim Management</h2>
                
                <div className="claims-filters">
                    <button className={filter === 'pending' ? 'active' : ''} onClick={() => setFilter('pending')}>
                        Pending
                    </button>
                    <button className={filter === 'verified' ? 'active' : ''} onClick={() => setFilter('verified')}>
                        Verified
                    </button>
                    <button className={filter === 'approved' ? 'active' : ''} onClick={() => setFilter('approved')}>
                        Approved
                    </button>
                    <button className={filter === 'rejected' ? 'active' : ''} onClick={() => setFilter('rejected')}>
                        Rejected
                    </button>
                    <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
                        All
                    </button>
                </div>

                {loading ? (
                    <div className="loading">Loading claims...</div>
                ) : (
                    <div className="claims-list">
                        {filteredClaims.length > 0 ? (
                            filteredClaims.map(claim => (
                                <div key={claim._id} className="claim-item" onClick={() => setSelectedClaim(claim)}>
                                    <div className="claim-item-header">
                                        <h3>{claim.item?.name}</h3>
                                        <span className={`claim-status ${claim.status}`}>{claim.status}</span>
                                    </div>
                                    <p className="claim-proof">{claim.proofDescription.substring(0, 100)}...</p>
                                    <div className="claim-meta">
                                        <span>Claimed by: {claim.claimedBy?.name}</span>
                                        <span>{new Date(claim.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="no-claims">No claims found</p>
                        )}
                    </div>
                )}

                {selectedClaim && (
                    <div className="claim-detail-panel">
                        <h3>Claim Details</h3>
                        
                        <div className="detail-section">
                            <label>Item</label>
                            <p><strong>{selectedClaim.item?.name}</strong></p>
                            <p>{selectedClaim.item?.description}</p>
                            <p>📍 {selectedClaim.item?.location}</p>
                        </div>
                        
                        <div className="detail-section">
                            <label>Claimed By</label>
                            <p><strong>{selectedClaim.claimedBy?.name}</strong></p>
                            <p>📧 {selectedClaim.claimedBy?.email}</p>
                            <p>📱 {selectedClaim.claimedBy?.contactNumber}</p>
                            <p>🆔 {selectedClaim.claimedBy?.studentId}</p>
                        </div>
                        
                        <div className="detail-section">
                            <label>Proof of Ownership</label>
                            <p className="proof-text">{selectedClaim.proofDescription}</p>
                        </div>
                        
                        <div className="detail-section">
                            <label>Admin Note</label>
                            <textarea
                                placeholder="Add notes about this claim..."
                                value={adminNote}
                                onChange={(e) => setAdminNote(e.target.value)}
                                rows="3"
                            />
                        </div>
                        
                        <div className="claim-actions">
                            <button 
                                className="btn-verify"
                                onClick={() => handleVerify(selectedClaim._id, 'verified')}
                            >
                                ✅ Verify
                            </button>
                            <button 
                                className="btn-ready"
                                onClick={() => handleVerify(selectedClaim._id, 'ready_for_pickup')}
                            >
                                📦 Ready for Pickup
                            </button>
                            <button 
                                className="btn-reject"
                                onClick={() => handleVerify(selectedClaim._id, 'rejected')}
                            >
                                ❌ Reject
                            </button>
                            <button 
                                className="btn-close-detail"
                                onClick={() => setSelectedClaim(null)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminClaimsPanel;