import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function AuditLog() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.auditLog()
      .then((d) => setRows(d.results || []))
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <h1 className="display" style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
        Audit Log
      </h1>
      <p style={{ color: '#64748b', fontSize: 13, marginBottom: 16 }}>
        Immutable (WORM) record of every login, search, export, filter change, and AI query
        across the platform.
      </p>

      {error && (
        <div style={{ padding: 14, background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: 8, fontSize: 13.5, marginBottom: 16 }}>
          <strong>Error loading logs:</strong> {error}
        </div>
      )}

      <div style={{ 
        background: '#ffffff', 
        border: '1px solid #e2e8f0', 
        borderRadius: 12, 
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)' 
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <Th>Timestamp</Th>
                <Th>KGID</Th>
                <Th>Action</Th>
                <Th>Detail</Th>
                <Th>IP Address</Th>
              </tr>
            </thead>
            <tbody>
              {!rows.length && !error && (
                <tr>
                  <td colSpan={5} style={{ padding: '24px 14px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                    No audit log records found.
                  </td>
                </tr>
              )}
              {rows.map((r, i) => {
                const createdAt = r.createdat || r.CreatedAt;
                const kgid = r.kgid || r.KGID;
                const actionType = r.actiontype || r.ActionType;
                const actionDetail = r.actiondetail || r.ActionDetail;
                const ipAddress = r.ipaddress || r.IPAddress;
                const logId = r.auditlogid || r.AuditLogID || i;

                return (
                  <tr key={logId} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                    <td className="mono" style={{ padding: '10px 14px', color: '#334155', whiteSpace: 'nowrap' }}>
                      {createdAt ? new Date(createdAt).toLocaleString('en-IN') : '—'}
                    </td>
                    <td className="mono" style={{ padding: '10px 14px', color: '#0f172a', fontWeight: 600 }}>
                      {kgid || '—'}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 11.5,
                        fontWeight: 600,
                        background: getActionBadgeBg(actionType),
                        color: getActionBadgeColor(actionType)
                      }}>
                        {actionType || 'UNKNOWN'}
                      </span>
                    </td>
                    <td className="mono" style={{ padding: '10px 14px', maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#475569', fontSize: 12 }}>
                      {actionDetail ? JSON.stringify(actionDetail) : '—'}
                    </td>
                    <td className="mono" style={{ padding: '10px 14px', color: '#64748b', fontSize: 12 }}>
                      {ipAddress || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Th({ children }) {
  return (
    <th style={{ padding: '12px 14px', fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569' }}>
      {children}
    </th>
  );
}

function getActionBadgeBg(action) {
  if (!action) return '#f1f5f9';
  const a = action.toUpperCase();
  if (a.includes('LOGIN')) return '#e0f2fe';
  if (a.includes('SEARCH') || a.includes('VIEW')) return '#f0fdf4';
  if (a.includes('EXPORT')) return '#fef3c7';
  if (a.includes('QUERY') || a.includes('AI')) return '#f3e8ff';
  return '#f1f5f9';
}

function getActionBadgeColor(action) {
  if (!action) return '#475569';
  const a = action.toUpperCase();
  if (a.includes('LOGIN')) return '#0369a1';
  if (a.includes('SEARCH') || a.includes('VIEW')) return '#15803d';
  if (a.includes('EXPORT')) return '#b45309';
  if (a.includes('QUERY') || a.includes('AI')) return '#6b21a8';
  return '#334155';
}