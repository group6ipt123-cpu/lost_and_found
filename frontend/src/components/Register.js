import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Register = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        studentId: '',
        contactNumber: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [acceptTerms, setAcceptTerms] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const validateStep1 = () => {
        if (!formData.name || !formData.email || !formData.studentId || !formData.contactNumber) {
            setError('Please fill in all fields');
            return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Please enter a valid email address');
            return false;
        }
        return true;
    };

    const validateStep2 = () => {
        if (!formData.password || !formData.confirmPassword) {
            setError('Please fill in all fields');
            return false;
        }
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return false;
        }
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return false;
        }
        if (!acceptTerms) {
            setError('Please accept the terms and conditions');
            return false;
        }
        return true;
    };

    const nextStep = () => {
        if (validateStep1()) {
            setStep(2);
        }
    };

    const prevStep = () => {
        setStep(1);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateStep2()) return;

        setLoading(true);
        setError('');

        const result = await register({
            ...formData,
            role: 'user'
        });
        
        if (result.success) {
            navigate('/login', { 
                state: { message: 'Registration successful! Please login.' }
            });
        } else {
            setError(result.message || 'Registration failed');
        }
        
        setLoading(false);
    };

    const getPasswordStrength = (password) => {
        if (!password) return { strength: 0, label: '', color: '#e5e7eb' };
        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^a-zA-Z0-9]/.test(password)) strength++;
        
        const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
        const colors = ['#e5e7eb', '#ef4444', '#f59e0b', '#eab308', '#10b981', '#059669'];
        
        return { 
            strength, 
            label: labels[strength], 
            color: colors[strength],
            percentage: (strength / 5) * 100
        };
    };

    const passwordStrength = getPasswordStrength(formData.password);

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card register-card">
                    <div className="auth-header">
                        <div className="auth-logo">
                            <span className="logo-icon">LF</span>
                            <h2>Lost & Found</h2>
                        </div>
                        <p className="auth-subtitle">Create your account to get started</p>
                    </div>

                    <div className="progress-steps">
                        <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                            <span className="step-number">1</span>
                            <span className="step-label">Personal</span>
                        </div>
                        <div className="step-line"></div>
                        <div className={`step ${step >= 2 ? 'active' : ''}`}>
                            <span className="step-number">2</span>
                            <span className="step-label">Security</span>
                        </div>
                    </div>

                    {error && (
                        <div className="auth-error">
                            <span className="error-icon">!</span>
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form">
                        {step === 1 ? (
                            <div className="step-content">
                                <div className="form-group">
                                    <label htmlFor="name">Full Name</label>
                                    <div className="input-wrapper">
                                        <span className="input-icon user-icon"></span>
                                        <input
                                            id="name"
                                            type="text"
                                            name="name"
                                            placeholder="Enter your full name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            autoComplete="name"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="email">Email Address</label>
                                    <div className="input-wrapper">
                                        <span className="input-icon mail-icon"></span>
                                        <input
                                            id="email"
                                            type="email"
                                            name="email"
                                            placeholder="your.email@example.com"
                                            value={formData.email}
                                            onChange={handleChange}
                                            autoComplete="email"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="studentId">Student ID</label>
                                    <div className="input-wrapper">
                                        <span className="input-icon id-icon"></span>
                                        <input
                                            id="studentId"
                                            type="text"
                                            name="studentId"
                                            placeholder="Enter your student ID"
                                            value={formData.studentId}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="contactNumber">Contact Number</label>
                                    <div className="input-wrapper">
                                        <span className="input-icon phone-icon"></span>
                                        <input
                                            id="contactNumber"
                                            type="tel"
                                            name="contactNumber"
                                            placeholder="Enter your contact number"
                                            value={formData.contactNumber}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <button 
                                    type="button" 
                                    className="auth-submit"
                                    onClick={nextStep}
                                >
                                    Continue
                                </button>
                            </div>
                        ) : (
                            <div className="step-content">
                                <div className="form-group">
                                    <label htmlFor="password">Password</label>
                                    <div className="input-wrapper">
                                        <span className="input-icon lock-icon"></span>
                                        <input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            placeholder="Create a password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            autoComplete="new-password"
                                            required
                                        />
                                        <button 
                                            type="button"
                                            className="password-toggle"
                                            onClick={() => setShowPassword(!showPassword)}
                                            tabIndex="-1"
                                        >
                                            <span className={showPassword ? "eye-off-icon" : "eye-icon"}></span>
                                        </button>
                                    </div>
                                    {formData.password && (
                                        <div className="password-strength">
                                            <div className="strength-bar">
                                                <div 
                                                    className="strength-fill" 
                                                    style={{ 
                                                        width: `${passwordStrength.percentage}%`,
                                                        backgroundColor: passwordStrength.color
                                                    }}
                                                ></div>
                                            </div>
                                            <span style={{ color: passwordStrength.color }}>
                                                {passwordStrength.label}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="confirmPassword">Confirm Password</label>
                                    <div className="input-wrapper">
                                        <span className="input-icon lock-icon"></span>
                                        <input
                                            id="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            name="confirmPassword"
                                            placeholder="Confirm your password"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            autoComplete="new-password"
                                            required
                                        />
                                        <button 
                                            type="button"
                                            className="password-toggle"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            tabIndex="-1"
                                        >
                                            <span className={showConfirmPassword ? "eye-off-icon" : "eye-icon"}></span>
                                        </button>
                                    </div>
                                    {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                                        <span className="validation-error">Passwords do not match</span>
                                    )}
                                </div>

                                <div className="terms-group">
                                    <label className="checkbox-label">
                                        <input 
                                            type="checkbox" 
                                            checked={acceptTerms}
                                            onChange={(e) => setAcceptTerms(e.target.checked)}
                                        />
                                        <span>
                                            I agree to the Terms of Service and Privacy Policy
                                        </span>
                                    </label>
                                </div>

                                <div className="step-actions">
                                    <button 
                                        type="button" 
                                        className="auth-submit secondary"
                                        onClick={prevStep}
                                    >
                                        Back
                                    </button>
                                    <button 
                                        type="submit" 
                                        className={`auth-submit ${loading ? 'loading' : ''}`}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <span className="spinner-small"></span>
                                        ) : (
                                            'Create Account'
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>

                    <div className="auth-footer">
                        <p>Already have an account? <Link to="/login">Sign In</Link></p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;