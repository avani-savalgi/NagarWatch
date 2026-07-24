import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [kgid, setKgid] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(kgid, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  }

  // Quick fill helper for demo testing
  function fillDemoCredentials(demoKgid) {
    setKgid(demoKgid);
    setPassword('Demo@12345');
  }

  return (
    <div style={{
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      background: '#f8fafc'
    }}>
      {/* Disclaimer Banner */}
      <div style={{ 
        background: '#fffbeb', 
        color: '#b45309', 
        borderBottom: '1px solid #fcd34d', 
        padding: '8px 16px', 
        fontSize: 12, 
        textAlign: 'center', 
        fontWeight: 500 
      }}>
        ⚠️ <strong>Hackathon Prototype:</strong> Unofficial project. All data shown is synthetically generated for demonstration purposes only.
      </div>

      {/* Main Container */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
      }}>
        <div style={{ 
          width: 400, 
          padding: 32, 
          background: '#ffffff', 
          borderRadius: 12, 
          border: '1px solid #e2e8f0', 
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)' 
        }}>
          {/* Brand Header */}
          <div style={{ marginBottom: 24, textAlign: 'center' }}>
            <div className="display" style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', letterSpacing: '0.02em' }}>
              NagarWatch
            </div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
              State Crime Records Bureau · Karnataka Police
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
              KGID (Karnataka Government ID)
            </label>
            <input
              value={kgid}
              onChange={(e) => setKgid(e.target.value)}
              placeholder="e.g. KGID-IO-001"
              style={inputStyle}
              autoFocus
            />

            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', margin: '16px 0 6px' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={inputStyle}
            />

            {error && (
              <div style={{
                marginTop: 14, 
                padding: '10px 12px', 
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b', 
                borderRadius: 6, 
                fontSize: 13
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', 
                marginTop: 20, 
                padding: '11px', 
                background: '#0f172a',
                color: '#ffffff', 
                border: 'none', 
                borderRadius: 8, 
                fontWeight: 600, 
                fontSize: 14,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'background 120ms ease'
              }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {/* Demo Quick Select Footer */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #f1f5f9', fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
            <div style={{ fontWeight: 600, color: '#475569', marginBottom: 6 }}>Demo Quick Fill (Local Seed):</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button 
                type="button"
                onClick={() => fillDemoCredentials('KGID-BC-001')}
                style={demoBadgeStyle}
              >
                Constable
              </button>
              <button 
                type="button"
                onClick={() => fillDemoCredentials('KGID-IO-001')}
                style={demoBadgeStyle}
              >
                IO / SHO
              </button>
              <button 
                type="button"
                onClick={() => fillDemoCredentials('KGID-AD-001')}
                style={demoBadgeStyle}
              >
                SCRB Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%', 
  padding: '10px 12px', 
  border: '1px solid #cbd5e1',
  borderRadius: 8, 
  fontSize: 13.5,
  color: '#0f172a',
  outline: 'none',
  background: '#ffffff'
};

const demoBadgeStyle = {
  background: '#f1f5f9',
  border: '1px solid #cbd5e1',
  color: '#334155',
  padding: '3px 8px',
  borderRadius: 4,
  fontSize: 11,
  fontWeight: 600,
  cursor: 'pointer'
};