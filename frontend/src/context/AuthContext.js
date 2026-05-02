import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://lostandfound-three-kohl.vercel.app'  // Production URL
  : 'http://localhost:5000';  // Local development

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        if (token && userData) {
            try { setUser(JSON.parse(userData)); } catch (e) {}
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const res = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.toLowerCase(), password })
            });
            const data = await res.json();
            if (data.success || res.ok) {
                const token = data.token;
                const user = data.user;
                if (token && user) {
                    localStorage.setItem('token', token);
                    localStorage.setItem('user', JSON.stringify(user));
                    setUser(user);
                    return { success: true };
                }
            }
            return { success: false, message: data.message || 'Login failed' };
        } catch (err) {
            console.error('Login error:', err);
            return { success: false, message: 'Network error' };
        }
    };

    const register = async (userData) => {
        try {
            const res = await fetch(`${API_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            const data = await res.json();
            return { success: res.ok, message: data.message || (res.ok ? 'Registration successful' : 'Registration failed') };
        } catch (err) {
            console.error('Register error:', err);
            return { success: false, message: 'Network error' };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, isAdmin: user?.role === 'admin' }}>
            {children}
        </AuthContext.Provider>
    );
};