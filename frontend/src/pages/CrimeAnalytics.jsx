import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, CartesianGrid, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { api } from '../api';

export default function CrimeAnalytics() {
  const [monthlyData, setMonthlyData] = useState([]);
  const [scatterData, setScatterData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true);
        const [monthly, scatter] = await Promise.all([
          api.getMonthlyTrends(),
          api.getHourlySeverity()
        ]);

        console.log('📊 Monthly trends API data:', monthly);
        console.log('📊 Scatter API data:', scatter);

        setMonthlyData(Array.isArray(monthly) ? monthly : (monthly.data || []));
        setScatterData(Array.isArray(scatter) ? scatter : (scatter.data || []));
      } catch (err) {
        setError(err.message || 'Error fetching analytics data from server');
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: '#64748b', fontSize: 14 }}>
        Loading analytics from database...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 16, background: '#fef2f2', color: '#b91c1c', borderRadius: 8, border: '1px solid #fecaca', fontSize: 13.5 }}>
        <strong>Error:</strong> {error}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 className="display" style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>
          Crime Analytics & Spatial Trends
        </h1>
        <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
          Real-time aggregated metrics pulled directly from PostgreSQL FIR records.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 24 }}>
        
        {/* 1. MULTI-BAR GRAPH (Property & Street Offences) */}
        <div style={{ background: '#ffffff', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>
            Property & Violent Offences
          </h2>
          <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>
            Comparative breakdown across theft, burglary, robbery, and assault.
          </p>
          <div style={{ width: '100%', height: 280, minHeight: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #cbd5e1', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Bar dataKey="Theft" fill="#2563eb" name="Theft" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Burglary" fill="#dc2626" name="Burglary" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Vehicle Theft" fill="#d97706" name="Vehicle Theft" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Robbery & Extortion" fill="#059669" name="Robbery" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. LINE GRAPH (Cyber Crime & Special Acts) */}
        <div style={{ background: '#ffffff', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>
            Cyber & Special Act Trends
          </h2>
          <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>
            Monthly volume tracking for online financial frauds, phishing, and NDPS cases.
          </p>
          <div style={{ width: '100%', height: 280, minHeight: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #cbd5e1', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Line type="monotone" dataKey="Cyber Crime" stroke="#7c3aed" strokeWidth={2.5} dot={{ r: 4, fill: '#7c3aed' }} name="Cyber Crime" />
                <Line type="monotone" dataKey="Narcotics" stroke="#0891b2" strokeWidth={2.5} dot={{ r: 4, fill: '#0891b2' }} name="Narcotics (NDPS)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. SCATTER PLOT (Time of Day vs Severity) */}
        <div style={{ background: '#ffffff', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', gridColumn: '1 / -1' }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>
            Incident Occurrence vs. Severity Index (Scatter Plot)
          </h2>
          <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>
            Plots recorded hour of occurrence against calculated severity score.
          </p>
          <div style={{ width: '100%', height: 300, minHeight: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" dataKey="hour" name="Hour of Day" unit=":00" domain={[0, 23]} stroke="#64748b" fontSize={12} />
                <YAxis type="number" dataKey="severity" name="Severity Score" domain={[0, 10]} stroke="#64748b" fontSize={12} />
                <ZAxis range={[60, 120]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #cbd5e1' }} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                
                {/* Standard Severity (Score 3) */}
                <Scatter 
                  name="Standard Incidents" 
                  data={scatterData.filter(d => Number(d.severity) <= 5)} 
                  fill="#d97706" 
                />
                
                {/* High Severity / Heinous (Score 8) */}
                <Scatter 
                  name="High Severity" 
                  data={scatterData.filter(d => Number(d.severity) > 5)} 
                  fill="#dc2626" 
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}