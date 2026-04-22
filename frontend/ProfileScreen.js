import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ProfileScreen.css';

export default function ProfileScreen() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = () => {
      const data = localStorage.getItem('user');
      if (data) setUser(JSON.parse(data));
    };

    loadUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="container">

      {/* PROFILE SECTION */}
      <div className="profileSection">
        <img
          src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
          alt="profile"
          className="profilePic"
        />

        <h2 className="name">
          {user?.email?.split('@')[0] || 'User Name'}
        </h2>

        <p className="email">
          {user?.email || 'user@email.com'}
        </p>
      </div>

      {/* OPTIONS */}
      <button
        className="item"
        onClick={() => alert('Edit Profile Clicked')}
      >
        Edit Profile
      </button>

      <button
        className="item"
        onClick={() => navigate('/notifications')}
      >
        Notification Settings
      </button>

      <button
        className="item"
        onClick={() => alert('Privacy Policy Clicked')}
      >
        Privacy Policy
      </button>

      {/* LOGOUT */}
      <button
        className="item logout"
        onClick={handleLogout}
      >
        Logout
      </button>

    </div>
  );
}