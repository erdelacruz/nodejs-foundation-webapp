// ============================================================
// pages/AdminPage.jsx — Admin dashboard (protected route).
//
// Only renders when the user is authenticated (enforced by ProtectedRoute).
//
// Features:
//   - Fetches and displays live visitor stats from GET /api/stats/visitors
//   - Shows total visits, unique visitors, and recent visit timestamps
//   - Auto-refreshes every 10 seconds so stats stay current
//   - Manual "Refresh" button for on-demand updates
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AdminPage() {
  // Read the logged-in user info and the JWT token from global auth state
  const { user, token } = useAuth();

  // stats: the visitor data object returned by the backend, or null before first fetch
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);  // True while fetching
  const [error,   setError]   = useState('');     // Error message if fetch fails

  // ---------------------------------------------------------------------------
  // fetchStats — calls the protected GET /api/stats/visitors endpoint.
  //
  // useCallback memoizes the function so it doesn't get recreated on every render.
  // This matters because we pass fetchStats to useEffect's dependency array;
  // without useCallback it would cause an infinite re-render loop.
  // ---------------------------------------------------------------------------
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/stats/visitors', {
        headers: {
          // Send the JWT in the Authorization header — the backend's verifyToken
          // middleware reads this to confirm the user is authenticated.
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Unauthorized'); // 401 if token expired

      const data = await res.json();
      setStats(data);   // Update stats state — triggers a re-render of the UI
      setError('');     // Clear any previous error
    } catch {
      setError('Failed to load visitor stats. Please refresh.');
    } finally {
      setLoading(false); // Hide the loading indicator
    }
  }, [token]); // Re-create this function only if the token changes

  // ---------------------------------------------------------------------------
  // Initial fetch + auto-refresh every 10 seconds.
  //
  // setInterval schedules fetchStats to run repeatedly.
  // The cleanup function (returned from useEffect) calls clearInterval when
  // the component unmounts, preventing memory leaks and stale updates.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    fetchStats(); // Fetch immediately on mount

    // Schedule auto-refresh every 10 000 ms (10 seconds)
    const interval = setInterval(fetchStats, 10000);

    // Cleanup: stop the interval when the component unmounts (e.g. user navigates away)
    return () => clearInterval(interval);
  }, [fetchStats]); // Re-run if fetchStats changes (i.e. if the token changes)

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="page admin-page">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        {/* Display the logged-in admin's username from the auth context */}
        <p className="welcome">Welcome, <strong>{user?.username}</strong></p>
      </div>

      {/* Manual refresh button — useful when the admin wants instant stats */}
      <button className="btn-primary refresh-btn" onClick={fetchStats}>
        Refresh Stats
      </button>

      {/* Show loading text on the very first load (before stats arrive) */}
      {loading && !stats && <p className="loading-text">Loading stats…</p>}

      {/* Error banner — shown when the fetch fails */}
      {error && <p className="error-banner">{error}</p>}

      {/* Stats section — only rendered once we have data */}
      {stats && (
        <>
          {/* KPI cards — three key numbers side by side */}
          <div className="stats-grid">
            {/* Total page loads across all visitors */}
            <div className="stat-card">
              <span className="stat-number">{stats.totalVisits}</span>
              <span className="stat-label">Total Visits</span>
              <p className="stat-desc">
                Every load of the public page, including return visitors.
              </p>
            </div>

            {/* Count of distinct browser UUIDs — true unique visitors */}
            <div className="stat-card highlight">
              <span className="stat-number">{stats.uniqueVisitors}</span>
              <span className="stat-label">Unique Visitors</span>
              <p className="stat-desc">
                Distinct browsers that have visited the public page.
              </p>
            </div>

            {/* Derived metric: average visits per unique visitor */}
            <div className="stat-card">
              <span className="stat-number">
                {stats.uniqueVisitors > 0
                  ? (stats.totalVisits / stats.uniqueVisitors).toFixed(1)
                  : '0'}
              </span>
              <span className="stat-label">Visits / Visitor</span>
              <p className="stat-desc">
                Average number of times each unique visitor has loaded the page.
              </p>
            </div>
          </div>

          {/* Recent activity feed */}
          <div className="recent-visits">
            <h2>Recent Visits (last 10)</h2>
            {stats.recentVisits.length === 0 ? (
              <p className="no-data">No visits recorded yet. Go visit the public page!</p>
            ) : (
              <ul className="visit-list">
                {/*
                  Each item in recentVisits is now an object:
                  { timestamp, os, browser, country }
                  Previously it was just a plain timestamp string.
                */}
                {stats.recentVisits.map((visit, index) => (
                  <li key={index} className="visit-item">
                    {/* Left: visitor icon */}
                    <span className="visit-icon">👤</span>

                    {/* Center: stacked timestamp + metadata row */}
                    <div className="visit-details">
                      {/* Primary line — when the visit happened */}
                      <span className="visit-time">
                        {new Date(visit.timestamp).toLocaleString()}
                      </span>

                      {/* Secondary line — OS, browser, country as labelled chips */}
                      <div className="visit-meta">
                        {/* 🖥️ OS — e.g. "Windows 10", "macOS 14", "Android 13" */}
                        <span className="meta-chip">
                          <span className="meta-icon">🖥️</span>
                          {visit.os || 'Unknown OS'}
                        </span>

                        {/* 🌐 Browser — e.g. "Chrome 120", "Firefox 121", "Safari 17" */}
                        <span className="meta-chip">
                          <span className="meta-icon">🌐</span>
                          {visit.browser || 'Unknown Browser'}
                        </span>

                        {/* 📍 Country — resolved from client IP via ip-api.com */}
                        <span className="meta-chip">
                          <span className="meta-icon">📍</span>
                          {visit.country || 'Unknown'}
                        </span>
                      </div>
                    </div>

                    {/* Right: "Latest" badge only on the most recent entry (index 0) */}
                    {index === 0 && <span className="badge-new">Latest</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Auto-refresh notice */}
          <p className="auto-refresh-note">
            Stats auto-refresh every 10 seconds.
          </p>
        </>
      )}
    </div>
  );
}
