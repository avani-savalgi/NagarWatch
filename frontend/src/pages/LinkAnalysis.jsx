import React, { useState, useEffect } from 'react';
import { api } from '../api';

export default function LinkAnalysis() {
  const [accusedId, setAccusedId] = useState('');
  const [samples, setSamples] = useState([]);
  const [graph, setGraph] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 1. Fetch available sample accused records on page mount
  useEffect(() => {
    async function fetchSamples() {
      try {
        if (api.getLinkSamples) {
          const data = await api.getLinkSamples();
          console.log('🧪 Samples fetched from API:', data);
          if (Array.isArray(data) && data.length > 0) {
            setSamples(data);
          } else {
            console.warn('Samples endpoint returned an empty array or invalid format.');
          }
        } else {
          console.error('api.getLinkSamples is not defined in src/api.js');
        }
      } catch (err) {
        console.error('Failed to load sample accused options:', err.message);
      }
    }
    fetchSamples();
  }, []);

  async function load(targetId) {
    const queryId = targetId || accusedId.trim();
    if (!queryId) return;

    setError('');
    setLoading(true);
    setGraph(null);

    try {
      const data = await api.linkAnalysis(queryId);
      setGraph(data);
    } catch (err) {
      setError(err.message || 'Failed to load link analysis graph');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <h1 className="display" style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
        Link Analysis & Criminal Networks
      </h1>
      <p style={{ color: '#64748b', fontSize: 13, marginBottom: 16 }}>
        Explore co-accused, shared-MO, vehicle, and call detail connections radiating from an accused record.
      </p>

      {/* Control Card */}
      <div style={{ 
        background: '#ffffff', 
        padding: 20, 
        borderRadius: 12, 
        border: '1px solid #e2e8f0', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        marginBottom: 16, 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 14 
      }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            value={accusedId}
            onChange={(e) => setAccusedId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
            placeholder="Enter Accused Name or paste accused UUID..."
            style={{ 
              flex: 1, 
              padding: '10px 14px', 
              border: '1px solid #cbd5e1', 
              borderRadius: 8,
              fontSize: 13.5,
              color: '#0f172a',
              outline: 'none'
            }}
          />
          <button 
            onClick={() => load()} 
            disabled={loading || !accusedId}
            style={{ 
              padding: '10px 20px', 
              background: '#0f172a', 
              color: '#ffffff', 
              border: 'none', 
              borderRadius: 8, 
              fontWeight: 600, 
              fontSize: 13.5,
              cursor: (loading || !accusedId) ? 'not-allowed' : 'pointer',
              opacity: (loading || !accusedId) ? 0.6 : 1
            }}
          >
            {loading ? 'Loading…' : 'Load Graph'}
          </button>
        </div>

        {/* Quick Testing Dropdown Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5, color: '#64748b' }}>
          <span>🧪 <strong>Accused Quick Test:</strong></span>
          <select
            onChange={(e) => {
              const val = e.target.value;
              if (val) {
                setAccusedId(val);
                load(val);
              }
            }}
            style={{ 
              padding: '6px 12px', 
              borderRadius: 6, 
              border: '1px solid #cbd5e1', 
              fontSize: 12,
              background: '#ffffff',
              color: '#0f172a',
              outline: 'none',
              maxWidth: 400
            }}
          >
            <option value="">
              {samples.length > 0 ? '-- Select an Accused to test graph --' : 'Loading sample accused...'}
            </option>
            {samples.map((s) => {
              const shortId = s.accusedid ? `${s.accusedid.slice(0, 8)}…` : '';
              const shortFir = s.firnumber || (s.firid ? `FIR #${s.firid.slice(0, 6)}` : '');
              return (
                <option key={s.accusedid} value={s.accusedid}>
                  {s.accusedname} {shortFir ? `(${shortFir})` : ''} - ID: {shortId}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {error && (
        <div style={{ padding: 14, background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: 8, fontSize: 13.5, marginBottom: 16 }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {graph && (
        <GraphSvg 
          nodes={graph.nodes || []} 
          edges={graph.edges || []} 
          onNodeClick={(clickedId) => {
            setAccusedId(clickedId);
            load(clickedId);
          }} 
        />
      )}
    </div>
  );
}

function GraphSvg({ nodes, edges, onNodeClick }) {
  if (!nodes || nodes.length === 0) return null;

  const totalNodes = nodes.length;
  const outerNodeCount = Math.max(1, totalNodes - 1);

  // Dynamic Sizing Math based on Node Density
  const dynamicOrbitRadius = outerNodeCount > 8 ? 190 : 160;
  const nodeRadius = outerNodeCount > 12 ? 12 : outerNodeCount > 6 ? 16 : 22;
  const centerRadius = nodeRadius + 6;
  const fontSize = outerNodeCount > 12 ? 9 : 11;
  const labelOffset = centerRadius + (fontSize > 10 ? 16 : 12);

  const cx = 400, cy = 260;

  // Position calculation with dynamic orbit radius
  const positioned = nodes.map((n, i) => {
    if (n.isCenter) return { ...n, x: cx, y: cy };
    const angle = (2 * Math.PI * (i - 1)) / outerNodeCount;
    return { 
      ...n, 
      x: cx + dynamicOrbitRadius * Math.cos(angle), 
      y: cy + dynamicOrbitRadius * Math.sin(angle) 
    };
  });

  const posById = Object.fromEntries(positioned.map(n => [n.id, n]));

  const getNodeColor = (node) => {
    if (node.isCenter) return '#2563eb'; // Blue for Target Accused
    if (node.isRepeatOffender) return '#dc2626'; // Red for Repeat Offender
    return '#64748b'; // Slate for standard links
  };

  const getEdgeStyle = (type) => {
    const lowerType = (type || '').toLowerCase();

    if (lowerType.includes('vehicle') || lowerType.includes('stolen') || lowerType.includes('transport') || lowerType.includes('driver') ) {
      return { icon: '🚗', color: '#ef4444', dash: '6,4', strokeWidth: 2 };
    }
    if (lowerType.includes('mo') || lowerType.includes('associate') || lowerType.includes('fencer') || lowerType.includes('supplier') || lowerType.includes('gang')) {
      return { icon: '🧩', color: '#059669', dash: '3,3', strokeWidth: 2.5 };
    }
    if (lowerType.includes('call') || lowerType.includes('cdr') || lowerType.includes('phone')) {
      return { icon: '📞', color: '#7c3aed', dash: '4,4', strokeWidth: 2 };
    }
    // Default fallback (Co-Accused & general linkages)
    return { icon: '🔷', color: '#94a3b8', dash: 'none', strokeWidth: 2 };
  };

  return (
    <div style={{ 
      background: '#ffffff', 
      padding: 20, 
      borderRadius: 12, 
      border: '1px solid #e2e8f0', 
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)' 
    }}>
      {/* Legend Header */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 14, fontSize: 12, color: '#334155', flexWrap: 'wrap' }}>
        <span>🔵 <strong>Target Accused</strong></span>
        <span>🔴 <strong>Repeat Offender</strong></span>
        <span>🔷 <strong>Co-Accused</strong></span>
        <span>🚗 <strong>Vehicle Link</strong></span>
        <span>🧩 <strong>Shared MO / Gang</strong></span>
        <span>📞 <strong>Call Detail / CDR</strong></span>
      </div>

      <svg viewBox="0 0 800 520" style={{ width: '100%', height: 480, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
        {/* Render Connection Edges */}
        {edges.map((e, i) => {
          const a = posById[e.source], b = posById[e.target];
          if (!a || !b) return null;
          const midX = (a.x + b.x) / 2;
          const midY = (a.y + b.y) / 2;

          const edgeStyle = getEdgeStyle(e.type);
          const labelText = e.type || 'Co-Accused';
          // Calculate dynamic badge width so text doesn't overflow
          const badgeWidth = Math.max(80, labelText.length * 6.5 + 24);

          return (
            <g key={i}>
              <line 
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke={edgeStyle.color} 
                strokeWidth={edgeStyle.strokeWidth}
                strokeDasharray={edgeStyle.dash}
              />

              {outerNodeCount <= 12 && (
                <g>
                  <rect 
                    x={midX - badgeWidth / 2} 
                    y={midY - 10} 
                    width={badgeWidth} 
                    height="18" 
                    rx="4" 
                    fill="#ffffff" 
                    stroke={edgeStyle.color} 
                    strokeWidth="1" 
                  />
                  <text 
                    x={midX} 
                    y={midY + 3} 
                    textAnchor="middle" 
                    fontSize="9" 
                    fontWeight="600" 
                    fill="#1e293b"
                  >
                    {edgeStyle.icon} {labelText}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Render Nodes */}
        {positioned.map((n) => {
          const currentRadius = n.isCenter ? centerRadius : nodeRadius;
          return (
            <g 
              key={n.id} 
              onClick={() => onNodeClick && onNodeClick(n.id)}
              style={{ cursor: 'pointer' }}
            >
              <circle 
                cx={n.x} cy={n.y} 
                r={currentRadius}
                fill={getNodeColor(n)}
                stroke="#ffffff" 
                strokeWidth={2.5} 
              />
              <text 
                x={n.x} y={n.y + labelOffset} 
                textAnchor="middle" 
                fontSize={fontSize} 
                fontWeight={n.isCenter ? "700" : "600"} 
                fill="#0f172a"
              >
                {n.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}