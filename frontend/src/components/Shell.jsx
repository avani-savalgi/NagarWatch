import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

const TABS = [
  { to: '/', label: 'Overview', end: true, minTier: 'BEAT_CONSTABLE' },
  { to: '/map', label: 'Hotspot Map', minTier: 'BEAT_CONSTABLE' },
  { to: '/links', label: 'Link Analysis', minTier: 'IO_SHO' },
  { to: '/ai', label: 'AI Assistant', minTier: 'IO_SHO' },
  { to: '/analytics', label: 'Crime Analytics', minTier: 'BEAT_CONSTABLE' },
  { to: '/audit', label: 'Audit Log', minTier: 'SP_SCRB_ADMIN' }
];

const TIER_RANK = { BEAT_CONSTABLE: 1, IO_SHO: 2, SP_SCRB_ADMIN: 3 };

const TIER_DISPLAY = {
  BEAT_CONSTABLE: 'Beat Constable',
  IO_SHO: 'Investigating Officer / SHO',
  SP_SCRB_ADMIN: 'SCRB Administrator'
};

export default function Shell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const userRank = TIER_RANK[user?.accessTier] || 0;

  function handleSearchSubmit(e) {
    e.preventDefault();
    if (query.trim()) navigate(`/fir?query=${encodeURIComponent(query.trim())}`);
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--offwhite, #f8fafc)' }}>
      {/* Light-themed Header */}
      <header style={{
        background: '#ffffff',
        color: '#1e293b',
        padding: '14px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        borderBottom: '1px solid #e2e8f0',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span className="display" style={{ color: '#0f172a', fontWeight: 700, fontSize: 18, letterSpacing: '0.02em' }}>
            NagarWatch
          </span>
          <span className="mono" style={{ color: '#64748b', fontSize: 12 }}>SCRB · Karnataka Police</span>
        </div>

        {/* Light Search Input */}
        <form onSubmit={handleSearchSubmit} style={{ flex: 1, maxWidth: 520 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search FIR, Accused Name, Vehicle, or Legal Section…"
            style={{
              width: '100%',
              padding: '9px 14px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              background: '#f1f5f9',
              color: '#0f172a',
              fontSize: 13.5,
              outline: 'none'
            }}
          />
        </form>

        {/* User Info & Sign out Button */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ textAlign: 'right', lineHeight: 1.25 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{user?.fullName}</div>
            <div className="mono" style={{ fontSize: 11, color: '#64748b' }}>
              {TIER_DISPLAY[user?.accessTier]} · {user?.kgid}
            </div>
          </div>
          <button
            onClick={logout}
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#334155',
              padding: '7px 12px',
              borderRadius: 6,
              fontSize: 12.5,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 120ms ease'
            }}
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Light Tab Navigation Bar */}
      <nav style={{
        background: '#f1f5f9',
        display: 'flex',
        paddingLeft: 20,
        gap: 4,
        borderBottom: '1px solid #cbd5e1'
      }}>
        {TABS.filter(t => TIER_RANK[t.minTier] <= userRank).map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            style={({ isActive }) => ({
              padding: '10px 20px 9px',
              fontFamily: 'var(--font-display)',
              fontSize: 13.5,
              fontWeight: 600,
              textDecoration: 'none',
              color: isActive ? '#0f172a' : '#64748b',
              background: isActive ? '#ffffff' : 'transparent',
              borderTop: isActive ? '3px solid #059669' : '3px solid transparent',
              borderLeft: isActive ? '1px solid #cbd5e1' : '1px solid transparent',
              borderRight: isActive ? '1px solid #cbd5e1' : '1px solid transparent',
              borderRadius: '8px 8px 0 0',
              marginTop: 6,
              marginBottom: '-1px',
              transition: 'color 120ms ease, background 120ms ease'
            })}
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      {/* Main Content Area */}
      <main style={{ flex: 1, background: 'var(--offwhite, #f8fafc)', padding: 24 }}>
        <Outlet />
      </main>
    </div>
  );
}