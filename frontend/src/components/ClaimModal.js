import React, { useState } from 'react';
import './ClaimModal.css';

const API_URL = 'http://localhost:3000';

const ClaimModal = ({ item, onClose, onSuccess }) => {
    const [proofDescription, setProofDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!proofDescription.trim()) {
            setError('Please provide proof of ownership');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/claims/${item._id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ proofDescription })
            });

            const data = await response.json();

            if (data.success) {
                onSuccess();
            } else {
                setError(data.message || 'Failed to file claim');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="claim-modal-overlay" onClick={onClose}>
            <div className="claim-modal" onClick={(e) => e.stopPropagation()}>
                <button className="claim-modal-close" onClick={onClose}>✕</button>
                
                <h2>File a Claim</h2>
                <p className="claim-item-name">{item.name}</p>
                
                {error && <div className="error-message">{error}</div>}
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Proof of Ownership</label>
                        <textarea
                            placeholder="Please describe details that prove this item belongs to you (e.g., distinctive marks, contents, where and when you lost it)"
                            value={proofDescription}
                            onChange={(e) => setProofDescription(e.target.value)}
                            rows="5"
                            required
                        />
                    </div>
                    
                    <div className="claim-modal-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-submit" disabled={loading}>
                            {loading ? 'Submitting...' : 'Submit Claim'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ClaimModal;