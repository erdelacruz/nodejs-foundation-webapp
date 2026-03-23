// ============================================================
// pages/PublicPage.jsx — The public-facing home page.
//
// Accessible by anyone — no login required.
//
// On every page load it:
//   1. Generates or retrieves a persistent visitor UUID from localStorage
//   2. Sends that UUID to POST /api/stats/visit to record the visit
//
// The UUID persists across sessions so the admin can distinguish
// "same person visited 5 times" from "5 different people visited".
// ============================================================

import React, { useEffect } from 'react';

// ---------------------------------------------------------------------------
// getOrCreateVisitorId — returns a stable UUID for this browser.
//
// localStorage persists data permanently (until cleared by the user).
// On the first visit we generate a UUID and save it.
// On every subsequent visit we reuse the saved UUID.
// This lets the backend track unique vs. returning visitors.
// ---------------------------------------------------------------------------
function getOrCreateVisitorId() {
  const key = 'visitorId'; // Key used to store/read the UUID in localStorage

  // Check if we already have a UUID saved from a previous session
  let id = localStorage.getItem(key);

  if (!id) {
    // crypto.randomUUID() generates a cryptographically random UUID v4.
    // This is a modern browser API, available in all current browsers.
    id = crypto.randomUUID();
    localStorage.setItem(key, id); // Save it for future visits
  }

  return id;
}

// ---------------------------------------------------------------------------
// PublicPage component
// ---------------------------------------------------------------------------
export default function PublicPage() {
  // useEffect with [] runs once when the component first mounts (page loads).
  // Perfect for side-effects like recording the visit.
  useEffect(() => {
    const visitorId = getOrCreateVisitorId(); // Get or create the persistent UUID

    // Fire-and-forget: we don't need to await this or show the result to the user.
    // Even if it fails, the page still works normally.
    fetch('/api/stats/visit', {
      method: 'POST',                               // POST because we're creating a record
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitorId }),           // Send the UUID to the backend
    }).catch(() => {
      // Silently ignore errors — visitor tracking should never break the page
      console.warn('Could not record visit — is the backend running?');
    });
  }, []); // [] = run only once on mount

  return (
    <div className="page public-page">
      {/* Hero section */}
      <div className="hero">
        <h1>Welcome to Node.js Foundation Web App</h1>
        <p className="hero-subtitle">
          This is a publicly accessible page. Anyone can view it — no login needed.
        </p>
      </div>

      {/* Content cards */}
      <div className="card-grid">
        <div className="card">
          <h2>Open Access</h2>
          <p>
            This page is visible to every visitor. It is the main landing page
            of the application and requires no authentication.
          </p>
        </div>

        <div className="card">
          <h2>Visitor Tracking</h2>
          <p>
            Each visit to this page is recorded on the backend. Admins can see
            the total number of visits and unique visitors on the Admin Dashboard.
          </p>
        </div>

        <div className="card">
          <h2>Admin Area</h2>
          <p>
            Looking for the admin panel? Click <strong>Login</strong> in the navbar
            and use the admin credentials to access the dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
