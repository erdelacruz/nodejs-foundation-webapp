// ============================================================
// components/Navbar.jsx — Top navigation bar.
//
// Renders different links based on authentication state:
//   Logged out: Home | Login
//   Logged in:  Home | Admin Dashboard | Logout (username)
// ============================================================

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  // user: the logged-in user object or null
  // logout: function from AuthContext that clears auth state
  const { user, logout } = useAuth();

  // useNavigate returns a function that navigates programmatically.
  // Used here to redirect to /login after logging out.
  const navigate = useNavigate();

  // Handle logout button click
  const handleLogout = () => {
    logout();           // Clear state and localStorage token
    navigate('/login'); // Redirect to login page
  };

  return (
    <nav className="navbar">
      {/* App brand / home link */}
      <Link to="/" className="nav-brand">Node.js Foundation Web App</Link>

      {/* Navigation links — rendered conditionally based on login state */}
      <div className="nav-links">
        {/* Home is always visible */}
        <Link to="/">Home</Link>

        {user ? (
          // === Logged-in state ===
          <>
            {/* Link to the admin dashboard — only shown when authenticated */}
            <Link to="/admin">Admin Dashboard</Link>

            {/* Logout button — displays the username so the user knows who is logged in */}
            <button className="btn-logout" onClick={handleLogout}>
              Logout ({user.username})
            </button>
          </>
        ) : (
          // === Logged-out state ===
          // Link component from react-router-dom renders an <a> tag that
          // navigates without a full page reload
          <Link to="/login">Login</Link>
        )}
      </div>
    </nav>
  );
}
