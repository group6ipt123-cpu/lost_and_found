const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const authFetch = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
    });

    return response.json();
};

export const itemsAPI = {
    getAll: () => authFetch('/api/items'),
    getOne: (id) => authFetch(`/api/items/${id}`),
    create: (data) => authFetch('/api/items', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    update: (id, data) => authFetch(`/api/items/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    delete: (id) => authFetch(`/api/items/${id}`, { method: 'DELETE' })
};

export const claimsAPI = {
    getAll: () => authFetch('/api/claims'),
    create: (itemId, proofDescription) => authFetch(`/api/claims/${itemId}`, {
        method: 'POST',
        body: JSON.stringify({ proofDescription })
    })
};

export const inquiriesAPI = {
    getAll: () => authFetch('/api/inquiries'),
    getOne: (id) => authFetch(`/api/inquiries/${id}`),
    create: (itemId, message) => authFetch(`/api/inquiries/${itemId}`, {
        method: 'POST',
        body: JSON.stringify({ message })
    }),
    reply: (id, message) => authFetch(`/api/inquiries/${id}/reply`, {
        method: 'POST',
        body: JSON.stringify({ message })
    })
};

export const notificationsAPI = {
    getAll: () => authFetch('/api/notifications'),
    markAsRead: (id) => authFetch(`/api/notifications/${id}/read`, { method: 'PUT' }),
    markAllAsRead: () => authFetch('/api/notifications/read-all', { method: 'PUT' })
};

export const userAPI = {
    getProfile: () => authFetch('/api/users/profile'),
    updateProfile: (data) => authFetch('/api/users/profile', {
        method: 'PUT',
        body: JSON.stringify(data)
    })
};

export const adminAPI = {
    getStats: () => authFetch('/api/admin/stats'),
    getUsers: () => authFetch('/api/admin/users'),
    getItems: () => authFetch('/api/admin/items'),
    updateItem: (id, data) => authFetch(`/api/admin/items/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    deleteItem: (id) => authFetch(`/api/admin/items/${id}`, { method: 'DELETE' })
};

export default API_URL;