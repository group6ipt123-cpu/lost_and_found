// api.js - API Service for Lost and Found
const API_URL = 'http://localhost:3000';

export const register = async (userData) => {
    try {
        const response = await fetch(${API_URL}/api/auth/register, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        return await response.json();
    } catch (error) {
        return { success: false, message: 'Network error: ' + error.message };
    }
};

export const login = async (email, password, role) => {
    try {
        const response = await fetch(${API_URL}/api/auth/login, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (data.success && data.user.role !== role) {
            return { success: false, message: Invalid role. You are registered as  };
        }
        return data;
    } catch (error) {
        return { success: false, message: 'Network error: ' + error.message };
    }
};

export const getItems = async (token) => {
    try {
        const response = await fetch(${API_URL}/api/items, {
            headers: { 'Authorization': Bearer  }
        });
        return await response.json();
    } catch (error) {
        return { success: false, message: error.message, data: [] };
    }
};

export const createItem = async (itemData, token) => {
    try {
        const response = await fetch(${API_URL}/api/items, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': Bearer 
            },
            body: JSON.stringify(itemData)
        });
        return await response.json();
    } catch (error) {
        return { success: false, message: error.message };
    }
};

export const claimItem = async (itemId, token) => {
    try {
        const response = await fetch(${API_URL}/api/claims/, {
            method: 'POST',
            headers: { 'Authorization': Bearer  }
        });
        return await response.json();
    } catch (error) {
        return { success: false, message: error.message };
    }
};

export const getCurrentUser = async (token) => {
    try {
        const response = await fetch(${API_URL}/api/auth/me, {
            headers: { 'Authorization': Bearer  }
        });
        return await response.json();
    } catch (error) {
        return { success: false, message: error.message };
    }
};

export const logout = async () => {
    try {
        await fetch(${API_URL}/api/auth/logout, { method: 'POST' });
    } catch (error) {
        console.log('Logout error:', error);
    }
};
