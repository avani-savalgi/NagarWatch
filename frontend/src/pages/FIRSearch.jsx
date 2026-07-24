import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';

export default function FIRSearch() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('query') || '');
  const [status, setStatus] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Selected FIR state for modal inspection
  const [selectedFirId, setSelectedFirId] = useState(null);
  const [firDetail, setFirDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [activeModalTab, setActiveModalTab] = useState('overview');

  async function runSearch(q = query, s = status) {
    setLoading(true);
    setError('');
    try {
      const res = await api.searchFIR({ query: q, status: s });
      // Safely extract results array
      const list = Array.isArray(res) ? res : (res.results || res.firs || res.data || []);
      setResults(list);
    } catch (err) {
      setError(err.message || 'Failed to execute search');
    } finally {
      setLoading(false);
    }
  }

  // Sync search input and run query if URL query param changes
  useEffect(() => {
    const urlQuery = searchParams.get('query') || '';
    setQuery(urlQuery);
    runSearch(urlQuery, status);
  }, [searchParams]);

  // Load detailed FIR data when an entry is selected
  useEffect(() => {
    if (!selectedFirId) {
      setFirDetail(null);
      setDetailError('');
      return;
    }
    async function loadFirDetail() {
      try {
        setLoadingDetail(true);
        setDetailError('');
        const fetchFn = api.getFIRById || api.getFIRDetail;
        const res = await fetchFn(selectedFirId);
        setFirDetail(res);
        setActiveModalTab('overview');
      } catch (err) {
        console.error('Failed to load FIR details:', err);
        setDetailError(err.message || 'Access restricted.');
      } finally {
        setLoadingDetail(false);
      }
    }
    loadFirDetail();
  }, [selectedFirId]);

  function closeModal() {
    setSelectedFirId(null);
    setFirDetail(null);
    setDetailError('');
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <h1 className="display" style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
        FIR Search & Registry
      </h1>
      <p style={{ color: '#64748b', fontSize: 13, marginBottom: 16 }}>
        Search FIR records by number, location, narrative keyword, or status.
      </p>

      {/* Filter Control Bar */}
      <div style={{ 
        background: '#ffffff', 
        padding: 16, 
        borderRadius: 12, 
        border: '1px solid #e2e8f0', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        marginBottom: 16, 
        display: 'flex', 
        flexWrap: 'wrap',
        gap: 12 
      }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="FIR number, location, or keyword…"
          style={{ 
            flex: 1, 
            minWidth: 220,
            padding: '10px 14px', 
            border: '1px solid #cbd5e1', 
            borderRadius: 8,
            fontSize: 13.5,
            color: '#0f172a',
            outline: 'none'
          }}
          onKeyDown={(e) => e.key === 'Enter' && runSearch()}
        />
        
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={{ 
            padding: '10px 14px', 
            border: '1px solid #cbd5e1', 
            borderRadius: 8,
            fontSize: 13.5,
            color: '#0f172a',
            background: '#ffffff',
            outline: 'none'
          }}
        >
          <option value="">All statuses</option>
          <option value="Under Investigation">Under Investigation</option>
          <option value="Charge-sheeted">Charge-sheeted</option>
          <option value="Closed - Untraced">Closed - Untraced</option>
          <option value="Court - Pending">Court - Pending</option>
          <option value="Convicted">Convicted</option>
          <option value="Acquitted">Acquitted</option>
        </select>

        <button
          onClick={() => runSearch()}
          style={{ 
            padding: '10px 20px', 
            background: '#0f172a', 
            color: '#ffffff', 
            border: 'none', 
            borderRadius: 8, 
            fontWeight: 600,
            fontSize: 13.5,
            cursor: 'pointer' 
          }}
        >
          Search
        </button>
      </div>

      {error && (
        <div style={{ padding: 14, background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: 8, fontSize: 13.5, marginBottom: 16 }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Results Table Container */}
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
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
                <Th>FIR Number</Th>
                <Th>Station Unit</Th>
                <Th>Date of Occurrence</Th>
                <Th>Location</Th>
                <Th>Status</Th>
                <Th>Flag</Th>
                <Th>Action</Th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <Td colSpan={7} style={{ color: '#64748b', textAlign: 'center', padding: 24 }}>
                    Searching FIR records...
                  </Td>
                </tr>
              ) : results.map((r, i) => {
                const firId = r.firid || r.FIRID;
                const firNo = r.FIRNumber || r.firnumber || r.firno || `FIR-#${firId}`;
                const unitName = r.UnitName || r.unitname || 'Station Unit';
                const dateOcc = r.DateOfOccurrence || r.dateofoccurrence;
                const locationText = r.LocationText || r.locationtext || '—';
                const statusLabel = r.StatusLabel || r.statuslabel || 'Active';
                const isHeinous = r.IsHeinous || r.isheinous;

                return (
                  <tr key={firId || i} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                    <Td><span className="mono" style={{ fontWeight: 600, color: '#0f172a' }}>{firNo}</span></Td>
                    <Td><span style={{ color: '#334155' }}>{unitName}</span></Td>
                    <Td><span style={{ color: '#64748b' }}>{dateOcc ? new Date(dateOcc).toLocaleDateString('en-IN') : '—'}</span></Td>
                    <Td><span style={{ color: '#334155' }}>{locationText}</span></Td>
                    <Td><span style={{ color: '#334155' }}>{statusLabel}</span></Td>
                    <Td>
                      {isHeinous && (
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, fontWeight: 600, background: '#fef2f2', color: '#dc2626' }}>
                          Heinous
                        </span>
                      )}
                    </Td>
                    <Td>
                      <button 
                        onClick={() => setSelectedFirId(firId)}
                        style={{ 
                          background: 'none', 
                          border: 'none', 
                          color: '#059669', 
                          fontWeight: 600, 
                          cursor: 'pointer',
                          fontSize: 13 
                        }}
                      >
                        View Details →
                      </button>
                    </Td>
                  </tr>
                );
              })}

              {!loading && !results.length && (
                <tr>
                  <Td colSpan={7} style={{ color: '#94a3b8', textAlign: 'center', padding: 24 }}>
                    No matching FIR records found.
                  </Td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FIR Details Popup Modal */}
      {selectedFirId && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 20
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 12,
            maxWidth: 780,
            width: '100%',
            maxHeight: '88vh',
            padding: 24,
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            overflow: 'hidden'
          }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h2 style={{ margin: 0, fontSize: 18, color: '#0f172a', fontWeight: 700 }}>
                    {firDetail?.fir?.FIRNumber || firDetail?.fir?.firnumber || `FIR #${selectedFirId}`}
                  </h2>
                  {firDetail?.fir && (
                    <span style={{ 
                      fontSize: 11, 
                      padding: '2px 8px', 
                      borderRadius: 4, 
                      fontWeight: 600, 
                      background: (firDetail.fir.IsHeinous || firDetail.fir.isheinous) ? '#fef2f2' : '#f1f5f9', 
                      color: (firDetail.fir.IsHeinous || firDetail.fir.isheinous) ? '#dc2626' : '#334155' 
                    }}>
                      {firDetail.fir.StatusLabel || firDetail.fir.statuslabel || 'Active'}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                  Unit: <strong>{firDetail?.fir?.UnitName || firDetail?.fir?.unitname || 'District Station'}</strong>
                </div>
              </div>
              <button 
                onClick={closeModal}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            {loadingDetail ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: '#64748b', fontSize: 14 }}>
                Retrieving case register details...
              </div>
            ) : detailError ? (
              /* 🔒 RESTRICTED ACCESS WARNING PANEL */
              <div style={{
                padding: '28px 20px',
                margin: '12px 0',
                background: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: 8,
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10
              }}>
                <div style={{ fontSize: 32 }}>🔒</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#92400e' }}>
                  Access Restricted
                </div>
                <div style={{ fontSize: 13, color: '#b45309', maxWidth: 480, lineHeight: 1.5 }}>
                  {detailError.includes('IO SHO access') 
                    ? 'Full FIR Case Inspection sheets contain sensitive investigation metadata and are restricted to Investigating Officers (IO), Station House Officers (SHO), or SCRB Administrators.'
                    : detailError}
                </div>
                <div style={{ fontSize: 12, color: '#78350f', marginTop: 4, background: '#fef3c7', padding: '4px 10px', borderRadius: 4, fontWeight: 600 }}>
                  Logged in Role: Beat Constable (Insufficient Privileges)
                </div>
              </div>
            ) : firDetail?.fir ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1, overflowY: 'auto' }}>
                
                {/* Navigation Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', gap: 12 }}>
                  <TabButton active={activeModalTab === 'overview'} onClick={() => setActiveModalTab('overview')}>
                    Overview & Narrative
                  </TabButton>
                  <TabButton active={activeModalTab === 'accused'} onClick={() => setActiveModalTab('accused')}>
                    Accused ({firDetail.accused?.length || 0})
                  </TabButton>
                  <TabButton active={activeModalTab === 'victims'} onClick={() => setActiveModalTab('victims')}>
                    Victims ({firDetail.victims?.length || 0})
                  </TabButton>
                </div>

                {/* OVERVIEW TAB */}
                {activeModalTab === 'overview' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, fontSize: 13, background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                      <div><strong>Date of Occurrence:</strong> {firDetail.fir.dateofoccurrence ? new Date(firDetail.fir.dateofoccurrence).toLocaleString('en-IN') : 'N/A'}</div>
                      <div><strong>Date Filed:</strong> {firDetail.fir.datefiled ? new Date(firDetail.fir.datefiled).toLocaleString('en-IN') : 'N/A'}</div>
                      <div><strong>Location:</strong> {firDetail.fir.locationtext || 'Logged Coordinates'}</div>
                      <div><strong>Heinous Classification:</strong> {(firDetail.fir.isheinous || firDetail.fir.IsHeinous) ? 'Yes' : 'Standard'}</div>
                    </div>

                    <div style={{ fontSize: 13 }}>
                      <strong style={{ color: '#0f172a', display: 'block', marginBottom: 6 }}>FIR Incident Narrative:</strong>
                      <div style={{ background: '#ffffff', padding: 14, borderRadius: 8, border: '1px solid #cbd5e1', color: '#334155', lineHeight: 1.6, maxHeight: 180, overflowY: 'auto' }}>
                        {firDetail.fir.narrative || firDetail.fir.description || 'No formal narrative text recorded.'}
                      </div>
                    </div>
                  </div>
                )}

                {/* ACCUSED TAB */}
                {activeModalTab === 'accused' && (
                  <ModalTable 
                    headers={['Accused Name', 'Age/Gender', 'Status']}
                    data={firDetail.accused}
                    emptyMsg="No accused individual records attached to this FIR."
                    renderRow={(a, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: '#0f172a' }}>{a.accusedname || a.name || 'Unknown'}</td>
                        <td style={{ padding: '8px 12px' }}>{a.age ? `${a.age} yrs` : 'N/A'} · {a.gender || '—'}</td>
                        <td style={{ padding: '8px 12px' }}>{a.status || 'Named in FIR'}</td>
                      </tr>
                    )}
                  />
                )}

                {/* VICTIMS TAB */}
                {activeModalTab === 'victims' && (
                  <ModalTable 
                    headers={['Victim Name', 'Age/Gender', 'Injury Degree']}
                    data={firDetail.victims}
                    emptyMsg="No victim entries logged."
                    renderRow={(v, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: '#0f172a' }}>{v.victimname || v.fullname || '[PROTECTED PII]'}</td>
                        <td style={{ padding: '8px 12px' }}>{v.age ? `${v.age} yrs` : 'N/A'} · {v.gender || '—'}</td>
                        <td style={{ padding: '8px 12px' }}>{v.injurydegree || v.injurytype || 'Stated'}</td>
                      </tr>
                    )}
                  />
                )}

              </div>
            ) : null}

            {/* Modal Footer */}
            <div style={{ textAlign: 'right', borderTop: '1px solid #e2e8f0', paddingTop: 12, marginTop: 'auto' }}>
              <button 
                onClick={closeModal}
                style={{ background: '#0f172a', color: '#ffffff', padding: '8px 18px', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

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

function Td({ children, ...rest }) {
  return <td style={{ padding: '10px 14px' }} {...rest}>{children}</td>;
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none',
        border: 'none',
        padding: '8px 12px',
        fontSize: 13,
        fontWeight: 600,
        color: active ? '#059669' : '#64748b',
        borderBottom: active ? '2px solid #059669' : '2px solid transparent',
        cursor: 'pointer'
      }}
    >
      {children}
    </button>
  );
}

function ModalTable({ headers, data, emptyMsg, renderRow }) {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 13, background: '#f8fafc', borderRadius: 8, border: '1px border-dashed #cbd5e1' }}>
        {emptyMsg}
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12.5 }}>
        <thead>
          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
            {headers.map((h, i) => (
              <th key={i} style={{ padding: '8px 12px', color: '#475569', fontWeight: 600 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => renderRow(item, idx))}
        </tbody>
      </table>
    </div>
  );
}