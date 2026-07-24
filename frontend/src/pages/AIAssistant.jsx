import React, { useState } from 'react';
import { api } from '../api';

export default function AIAssistant() {
  const [prompt, setPrompt] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!prompt.trim()) return;
    const q = prompt.trim();
    setPrompt('');
    setLoading(true);
    setHistory((h) => [...h, { role: 'user', text: q }]);
    try {
      const res = await api.aiQuery(q);
      setHistory((h) => [...h, { role: 'assistant', ...res }]);
    } catch (err) {
      setHistory((h) => [...h, { role: 'error', text: err.message }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 160px)', maxWidth: 1100, margin: '0 auto' }}>
      <h1 className="display" style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
        AI Case Query Assistant
      </h1>
      <p style={{ color: '#64748b', fontSize: 13, marginBottom: 16 }}>
        Ask in plain language. Answers are generated from a read-only query over case-level
        data only — victim/complainant identity fields are never accessible to this assistant.
      </p>

      {/* Main Chat Feed */}
      <div 
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: 20, 
          marginBottom: 16, 
          background: '#ffffff', 
          border: '1px solid #e2e8f0', 
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)' 
        }}
      >
        {!history.length && (
          <div style={{ color: '#94a3b8', fontSize: 13.5, fontStyle: 'italic', textAlign: 'center', marginTop: 40 }}>
            Try asking: "How many heinous cases were filed in the last 30 days?" or
            "Show cases still under investigation by offence category."
          </div>
        )}

        {history.map((m, i) => (
          <div key={i} style={{ marginBottom: 20 }}>
            {/* User Message */}
            {m.role === 'user' && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'flex-end', 
                marginBottom: 12 
              }}>
                <div style={{ 
                  background: '#f1f5f9', 
                  border: '1px solid #cbd5e1', 
                  color: '#0f172a', 
                  padding: '10px 16px', 
                  borderRadius: '12px 12px 2px 12px', 
                  fontSize: 13.5, 
                  fontWeight: 500,
                  maxWidth: '80%'
                }}>
                  <strong style={{ color: '#475569', fontSize: 12, display: 'block', marginBottom: 2 }}>You</strong>
                  {m.text}
                </div>
              </div>
            )}

            {/* Error Message */}
            {m.role === 'error' && (
              <div style={{ 
                background: '#fef2f2', 
                border: '1px solid #fecaca', 
                color: '#991b1b', 
                padding: '10px 14px', 
                borderRadius: 8, 
                fontSize: 13 
              }}>
                <strong>Error:</strong> {m.text}
              </div>
            )}

            {/* Assistant Response */}
            {m.role === 'assistant' && (
              <div style={{ 
                background: '#ffffff', 
                border: '1px solid #e2e8f0', 
                borderRadius: '12px 12px 12px 2px', 
                padding: 16, 
                maxWidth: '90%',
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#059669', marginBottom: 6, letterSpacing: '0.03em' }}>
                  NAGARWATCH AI
                </div>
                <div style={{ fontSize: 13.5, color: '#1e293b', marginBottom: 12, lineHeight: 1.5 }}>
                  {m.explanation}
                </div>

                {/* SQL Accordion */}
                <details style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
                  <summary className="mono" style={{ cursor: 'pointer', fontWeight: 600, color: '#475569' }}>
                    View Generated SQL ({m.modelUsed || 'LLM Gateway'})
                  </summary>
                  <pre 
                    className="mono" 
                    style={{ 
                      background: '#f8fafc', 
                      color: '#0f172a',
                      border: '1px solid #e2e8f0', 
                      padding: 12, 
                      borderRadius: 6, 
                      overflowX: 'auto',
                      marginTop: 8,
                      fontSize: 12
                    }}
                  >
                    {m.sql}
                  </pre>
                </details>

                {/* Data Table Output */}
                {Array.isArray(m.rows) && m.rows.length > 0 && (
                  <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 6 }}>
                    <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12.5 }}>
                      <thead>
                        <tr style={{ background: '#f1f5f9' }}>
                          {Object.keys(m.rows[0]).map((k) => (
                            <th key={k} style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid #cbd5e1', color: '#334155', fontWeight: 600 }}>
                              {k}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {m.rows.slice(0, 25).map((row, ri) => (
                          <tr key={ri} style={{ background: ri % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                            {Object.values(row).map((v, vi) => (
                              <td key={vi} style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', color: '#0f172a' }}>
                                {String(v)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ fontSize: 13, color: '#059669', fontWeight: 500, fontStyle: 'italic', paddingLeft: 8 }}>
            Analyzing schema & executing query…
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10 }}>
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask about case volumes, statuses, or offence trends…"
          style={{ 
            flex: 1, 
            padding: '12px 16px', 
            border: '1px solid #cbd5e1', 
            borderRadius: 8,
            background: '#ffffff',
            color: '#0f172a',
            fontSize: 13.5,
            outline: 'none'
          }}
        />
        <button 
          type="submit" 
          disabled={loading} 
          style={{ 
            padding: '12px 24px', 
            background: '#0f172a', 
            color: '#ffffff', 
            border: 'none', 
            borderRadius: 8, 
            fontWeight: 600,
            fontSize: 13.5,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          Ask
        </button>
      </form>
    </div>
  );
}