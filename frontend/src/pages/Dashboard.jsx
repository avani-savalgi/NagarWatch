import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function Dashboard() {
  // --- Selected FIR Modal State ---
  const [selectedFirId, setSelectedFirId] = useState(null);
  const [firDetail, setFirDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // --- Summary KPI State ---
  const [stats, setStats] = useState({
    totalFirs: 0,
    heinousCount: 0,
    underInvestigation: 0,
    chargeSheeted: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // --- FIR Search State ---
  const [searchParams, setSearchParams] = useState({
    query: '',
    category: '',
    status: ''
  });
  const [firResults, setFirResults] = useState([]);
  const [loadingFirs, setLoadingFirs] = useState(false);
  const [error, setError] = useState('');

  // Fetch KPI Stats on Mount
  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoadingStats(true);
        const data = await api.getSummaryStats();
        setStats(data || {});
      } catch (err) {
        setError(err.message || 'Failed to load summary metrics');
      } finally {
        setLoadingStats(false);
      }
    }
    fetchDashboardData();
    handleSearch(); // Initial load of recent FIRs
  }, []);

  // Fetch Detailed FIR Metadata when Modal opens
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
        // Fallback check to support both method names in api.js
        const fetchFn = api.getFIRById || api.getFIRDetail;
        const res = await fetchFn(selectedFirId);
        setFirDetail(res);
        setActiveTab('overview');
      } catch (err) {
        console.error('Failed to load FIR details:', err);
        setDetailError(err.message || 'Access restricted.');
      } finally {
        setLoadingDetail(false);
      }
    }
    loadFirDetail();
  }, [selectedFirId]);

  // Fetch / Search FIRs
  async function handleSearch(e) {
    if (e) e.preventDefault();
    try {
      setLoadingFirs(true);
      const res = await api.searchFIR(searchParams);
      
      const list = Array.isArray(res) 
        ? res 
        : (res.firs || res.data || res.results || []);

      setFirResults(list);
    } catch (err) {
      setError(err.message || 'Failed to fetch FIR records');
      setFirResults([]);
    } finally {
      setLoadingFirs(false);
    }
  }

  // Close modal helper
  function closeModal() {
    setSelectedFirId(null);
    setFirDetail(null);
    setDetailError('');
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* 1. Header Title */}
      <div>
        <h1 className="display" style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>
          State Crime Overview & FIR Directory
        </h1>
        <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
          Real-time case monitoring, operational metrics, and FIR record searching.
        </p>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: '#fef2f2', color: '#991b1b', borderRadius: 8, border: '1px solid #fecaca', fontSize: 13.5 }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* 2. Live KPI Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        
        {/* Total FIRs */}
        <div style={{ background: '#ffffff', padding: 20, borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>Total FIRs Filed</span>
            <span className="mono" style={{ fontSize: 10, background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, color: '#334155', fontWeight: 600 }}>ALL</span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-display, sans-serif)' }}>
            {loadingStats ? '...' : (stats.totalFirs ?? stats.total_firs ?? 0)}
          </div>
          <div style={{ fontSize: 12, color: '#64748b' }}>Live database records</div>
        </div>

        {/* Heinous Offences */}
        <div style={{ background: '#ffffff', padding: 20, borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>Heinous Offences</span>
            <span style={{ fontSize: 10, background: '#fef2f2', color: '#dc2626', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>Critical</span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#dc2626', fontFamily: 'var(--font-display, sans-serif)' }}>
            {loadingStats ? '...' : (stats.heinousCount ?? stats.heinous_count ?? 0)}
          </div>
          <div style={{ fontSize: 12, color: '#64748b' }}>High priority cases</div>
        </div>

        {/* Under Investigation */}
        <div style={{ background: '#ffffff', padding: 20, borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>Under Investigation</span>
            <span style={{ fontSize: 10, background: '#fffbeb', color: '#d97706', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>Pending</span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#d97706', fontFamily: 'var(--font-display, sans-serif)' }}>
            {loadingStats ? '...' : (stats.underInvestigation ?? stats.under_investigation ?? 0)}
          </div>
          <div style={{ fontSize: 12, color: '#d97706', fontWeight: 500 }}>Pending IO review</div>
        </div>

        {/* Charge-Sheeted */}
        <div style={{ background: '#ffffff', padding: 20, borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>Charge-Sheeted</span>
            <span style={{ fontSize: 10, background: '#ecfdf5', color: '#059669', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>Submitted</span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#059669', fontFamily: 'var(--font-display, sans-serif)' }}>
            {loadingStats ? '...' : (stats.chargeSheeted ?? stats.charge_sheeted ?? 0)}
          </div>
          <div style={{ fontSize: 12, color: '#059669', fontWeight: 500 }}>Submitted to Court</div>
        </div>

      </div>

      {/* 3. Integrated FIR Search Section */}
      <div style={{ background: '#ffffff', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>
          FIR Directory & Search
        </h2>

        {/* Search Controls Form */}
        <form onSubmit={handleSearch} style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search FIR No, Accused Name, Section..."
            value={searchParams.query}
            onChange={(e) => setSearchParams({ ...searchParams, query: e.target.value })}
            style={{ flex: 1, minWidth: 240, padding: '9px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13.5, outline: 'none' }}
          />

          <button
            type="submit"
            style={{ background: '#0f172a', color: '#ffffff', padding: '9px 20px', borderRadius: 8, border: 'none', fontWeight: 600, fontSize: 13.5, cursor: 'pointer' }}
          >
            {loadingFirs ? 'Searching...' : 'Search'}
          </button>
        </form>

        {/* Results Table */}
        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #cbd5e1', background: '#f8fafc' }}>
                <th style={{ padding: '10px 14px', color: '#475569', fontWeight: 600 }}>FIR Number</th>
                <th style={{ padding: '10px 14px', color: '#475569', fontWeight: 600 }}>Jurisdiction Unit</th>
                <th style={{ padding: '10px 14px', color: '#475569', fontWeight: 600 }}>Date Filed</th>
                <th style={{ padding: '10px 14px', color: '#475569', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '10px 14px', color: '#475569', fontWeight: 600 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loadingFirs ? (
                <tr><td colSpan="5" style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>Loading FIR records...</td></tr>
              ) : firResults.length === 0 ? (
                <tr><td colSpan="5" style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>No FIR records found matching criteria.</td></tr>
              ) : (
                firResults.map((fir, idx) => {
                  const firId = fir.firid || fir.FIRID;
                  const firNumber = fir.FIRNumber || fir.firnumber || fir.firno || `FIR-#${firId}`;
                  const unitName = fir.UnitName || fir.unitname || 'Station Unit';
                  const dateFiled = fir.DateFiled || fir.datefiled || fir.DateOfOccurrence || fir.dateofoccurrence;
                  const statusLabel = fir.StatusLabel || fir.statuslabel || (fir.isheinous ? 'Heinous' : 'Active');
                  const isHeinous = fir.IsHeinous || fir.isheinous;

                  return (
                    <tr key={firId || idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0f172a' }}>{firNumber}</td>
                      <td style={{ padding: '10px 14px', color: '#334155' }}>{unitName}</td>
                      <td style={{ padding: '10px 14px', color: '#64748b' }}>{dateFiled ? new Date(dateFiled).toLocaleDateString('en-IN') : 'N/A'}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontSize: 11.5, padding: '2px 8px', borderRadius: 4, fontWeight: 600, background: isHeinous ? '#fef2f2' : '#f1f5f9', color: isHeinous ? '#dc2626' : '#334155' }}>
                          {statusLabel}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
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
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Comprehensive FIR Case Sheet Modal */}
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
                  Unit: <strong>{firDetail?.fir?.UnitName || firDetail?.fir?.unitname || 'District Station'}</strong> · KGID: {firDetail?.fir?.investigatingofficerid || 'IO-ASSIGNED'}
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
                
                {/* Navigation Tabs for Related Records */}
                <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', gap: 12 }}>
                  <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
                    Overview & Narrative
                  </TabButton>
                  <TabButton active={activeTab === 'accused'} onClick={() => setActiveTab('accused')}>
                    Accused ({firDetail.accused?.length || 0})
                  </TabButton>
                  <TabButton active={activeTab === 'victims'} onClick={() => setActiveTab('victims')}>
                    Victims ({firDetail.victims?.length || 0})
                  </TabButton>
                  <TabButton active={activeTab === 'complainants'} onClick={() => setActiveTab('complainants')}>
                    Complainants ({firDetail.complainants?.length || 0})
                  </TabButton>
                  <TabButton active={activeTab === 'vehicles'} onClick={() => setActiveTab('vehicles')}>
                    Seized Vehicles ({firDetail.vehicles?.length || 0})
                  </TabButton>
                </div>

                {/* TAB 1: OVERVIEW & METADATA */}
                {activeTab === 'overview' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, fontSize: 13, background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                      <div><strong>Date of Occurrence:</strong> {firDetail.fir.dateofoccurrence ? new Date(firDetail.fir.dateofoccurrence).toLocaleString('en-IN') : 'N/A'}</div>
                      <div><strong>Date Filed:</strong> {firDetail.fir.datefiled ? new Date(firDetail.fir.datefiled).toLocaleString('en-IN') : 'N/A'}</div>
                      <div><strong>Location Address:</strong> {firDetail.fir.locationtext || 'Logged Coordinates'}</div>
                      <div><strong>Heinous Classification:</strong> {(firDetail.fir.isheinous || firDetail.fir.IsHeinous) ? 'Yes (Mandatory Review)' : 'Standard'}</div>
                      <div><strong>Status ID:</strong> {firDetail.fir.casestatusid || 1}</div>
                      <div><strong>Investigating Officer ID:</strong> {firDetail.fir.investigatingofficerid || 'Unassigned'}</div>
                    </div>

                    <div style={{ fontSize: 13 }}>
                      <strong style={{ color: '#0f172a', display: 'block', marginBottom: 6 }}>FIR Incident Narrative:</strong>
                      <div style={{ background: '#ffffff', padding: 14, borderRadius: 8, border: '1px solid #cbd5e1', color: '#334155', lineHeight: 1.6, maxHeight: 180, overflowY: 'auto' }}>
                        {firDetail.fir.narrative || firDetail.fir.description || 'No formal narrative text recorded in entry register.'}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: ACCUSED LIST */}
                {activeTab === 'accused' && (
                  <EntityTable 
                    headers={['Accused Name', 'Age/Gender', 'Status', 'Repeat Offender']}
                    data={firDetail.accused}
                    emptyMsg="No accused individual records attached to this FIR."
                    renderRow={(a, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: '#0f172a' }}>{a.accusedname || a.name || 'Unknown'}</td>
                        <td style={{ padding: '8px 12px' }}>{a.age ? `${a.age} yrs` : 'N/A'} · {a.gender || '—'}</td>
                        <td style={{ padding: '8px 12px' }}>{a.status || 'Named in FIR'}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: a.isrepeatoffender ? '#fef2f2' : '#f1f5f9', color: a.isrepeatoffender ? '#dc2626' : '#475569' }}>
                            {a.isrepeatoffender ? 'Yes' : 'No'}
                          </span>
                        </td>
                      </tr>
                    )}
                  />
                )}

                {/* TAB 3: VICTIMS LIST */}
                {activeTab === 'victims' && (
                  <EntityTable 
                    headers={['Victim Name', 'Age/Gender', 'Injury Degree']}
                    data={firDetail.victims}
                    emptyMsg="No victim entries logged."
                    renderRow={(v, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: '#0f172a' }}>{v.victimname || v.fullname || '[PROTECTED PII]'}</td>
                        <td style={{ padding: '8px 12px' }}>{v.age ? `${v.age} yrs` : 'N/A'} · {v.gender || '—'}</td>
                        <td style={{ padding: '8px 12px' }}>{v.injurydegree || v.injurytype || 'Grievous/Stated'}</td>
                      </tr>
                    )}
                  />
                )}

                {/* TAB 4: COMPLAINANTS */}
                {activeTab === 'complainants' && (
                  <EntityTable 
                    headers={['Complainant Name', 'Phone / Contact', 'Relation to Incident']}
                    data={firDetail.complainants}
                    emptyMsg="No complainant information recorded."
                    renderRow={(c, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: '#0f172a' }}>{c.complainantname || c.fullname || '[PROTECTED PII]'}</td>
                        <td style={{ padding: '8px 12px', fontFamily: 'monospace' }}>{c.phonenumber || '[REDACTED]'}</td>
                        <td style={{ padding: '8px 12px' }}>{c.relation || 'Informant / Victim'}</td>
                      </tr>
                    )}
                  />
                )}

                {/* TAB 5: SEIZED VEHICLES */}
                {activeTab === 'vehicles' && (
                  <EntityTable 
                    headers={['Registration No', 'Make / Model', 'Vehicle Type', 'Seizure Status']}
                    data={firDetail.vehicles}
                    emptyMsg="No seized vehicles connected with this FIR."
                    renderRow={(vh, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: '#0f172a', fontFamily: 'monospace' }}>{vh.registrationnumber || vh.regno || 'UNREGISTERED'}</td>
                        <td style={{ padding: '8px 12px' }}>{vh.make || ''} {vh.model || 'Unknown Model'}</td>
                        <td style={{ padding: '8px 12px' }}>{vh.vehicletype || '2-Wheeler / 4-Wheeler'}</td>
                        <td style={{ padding: '8px 12px' }}>{vh.seizurestatus || 'Seized & Stationed'}</td>
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
                Close Case Inspection
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

// Tab navigation button component
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
        cursor: 'pointer',
        transition: 'all 120ms ease'
      }}
    >
      {children}
    </button>
  );
}

// Table renderer helper for modal tabs
function EntityTable({ headers, data, emptyMsg, renderRow }) {
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