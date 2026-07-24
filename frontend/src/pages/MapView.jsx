import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import { api } from '../api';
import 'leaflet/dist/leaflet.css';

// Default center coordinates (e.g., Bengaluru)
const DEFAULT_CENTER = [12.9716, 77.5946];
const DEFAULT_ZOOM = 11;

// Custom Marker Pin Styling
const orangeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function getCoords(point) {
  if (!point) return { lat: NaN, lng: NaN };
  const lat = parseFloat(point.latitude ?? point.lat ?? point.station_lat ?? point.latitude_val);
  const lng = parseFloat(point.longitude ?? point.lng ?? point.lon ?? point.station_lng ?? point.longitude_val);
  return { lat, lng };
}

// Sub-component to manage map controls programmatically (Reset View)
function MapControls({ onResetView }) {
  const map = useMap();

  return (
    <div style={{
      position: 'absolute',
      top: 12,
      right: 12,
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      background: '#ffffff',
      padding: 6,
      borderRadius: 8,
      border: '1px solid #cbd5e1',
      boxShadow: '0 2px 4px rgba(0,0,0,0.08)'
    }}>
      <button
        onClick={() => map.zoomIn()}
        title="Zoom In"
        style={controlButtonStyle}
      >
        ＋
      </button>
      <button
        onClick={() => map.zoomOut()}
        title="Zoom Out"
        style={controlButtonStyle}
      >
        －
      </button>
      <button
        onClick={() => {
          map.flyTo(DEFAULT_CENTER, DEFAULT_ZOOM, { duration: 1.2 });
          if (onResetView) onResetView();
        }}
        title="Reset Map View"
        style={{ ...controlButtonStyle, fontSize: 11, fontWeight: 700 }}
      >
        🎯 Reset
      </button>
    </div>
  );
}

// Custom Heatmap Layer Sub-component
function HeatmapLayer({ points }) {
  const map = useMap();
  const heatLayerRef = useRef(null);

  useEffect(() => {
    if (!map || !L.heatLayer) return;

    const heatPoints = points
      .map((p) => {
        const { lat, lng } = getCoords(p);
        if (isNaN(lat) || isNaN(lng)) return null;
        const intensity = p.isheinous ? 1.0 : 0.6;
        return [lat, lng, intensity];
      })
      .filter(Boolean);

    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    if (heatPoints.length > 0) {
      heatLayerRef.current = L.heatLayer(heatPoints, {
        radius: 35,
        blur: 15,
        maxZoom: 18,
        max: 1.0,
        minOpacity: 0.4,
        gradient: {
          0.2: '#3b82f6',
          0.5: '#eab308',
          0.8: '#f97316',
          1.0: '#dc2626'
        }
      }).addTo(map);
    }

    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
      }
    };
  }, [map, points]);

  return null;
}

export default function MapView() {
  const [hotspots, setHotspots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // --- Filter State ---
  const [category, setCategory] = useState('ALL');
  const [timeWindow, setTimeWindow] = useState('ALL');
  const [onlyHeinous, setOnlyHeinous] = useState(false);
  const [viewMode, setViewMode] = useState('HEATMAP');

  useEffect(() => {
    async function fetchHotspots() {
      try {
        setLoading(true);
        const data = await api.hotspots();
        const list = Array.isArray(data) ? data : (data.hotspots || data.data || []);
        setHotspots(list);
      } catch (err) {
        setError(err.message || 'Failed to fetch map data');
      } finally {
        setLoading(false);
      }
    }
    fetchHotspots();
  }, []);

  const filteredHotspots = hotspots.filter((item) => {
    const catUpper = (category || '').toUpperCase();
    if (catUpper !== 'ALL' && catUpper !== 'ALL CATEGORIES') {
      const itemCat = (item.offencecategory || item.category || '').toUpperCase();
      if (!itemCat.includes(catUpper)) return false;
    }

    if (onlyHeinous && !item.isheinous) return false;

    if (timeWindow !== 'ALL' && timeWindow !== 'All Time' && item.dateofoccurrence) {
      const occurrenceDate = new Date(item.dateofoccurrence);
      const diffDays = (new Date() - occurrenceDate) / (1000 * 60 * 60 * 24);
      if (timeWindow === '30' && diffDays > 30) return false;
      if (timeWindow === '90' && diffDays > 90) return false;
      if (timeWindow === '365' && diffDays > 365) return false;
    }

    return true;
  });

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      
      {/* Header */}
      <div>
        <h1 className="display" style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>
          Hotspot Map & GIS Density
        </h1>
        <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
          Spatiotemporal view of filed FIRs with crime density gradient heatmaps.
        </p>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: '#fef2f2', color: '#991b1b', borderRadius: 8, border: '1px solid #fecaca', fontSize: 13.5 }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Filter Controls Bar */}
      <div style={{
        background: '#ffffff',
        padding: '12px 16px',
        borderRadius: 12,
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 16,
        fontSize: 13
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontWeight: 600, color: '#0f172a' }}>Offence Category:</label>
          <select 
            value={category} 
            onChange={(e) => setCategory(e.target.value)} 
            style={selectStyle}
          >
            <option value="ALL">All Categories</option>
            <option value="General">General</option>
            <option value="Theft">Theft / Burglary</option>
            <option value="Cybercrime">Cybercrime</option>
            <option value="Assault">Assault</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontWeight: 600, color: '#0f172a' }}>Time Window:</label>
          <select 
            value={timeWindow} 
            onChange={(e) => setTimeWindow(e.target.value)} 
            style={selectStyle}
          >
            <option value="ALL">All Time</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="365">Past Year</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f1f5f9', padding: 4, borderRadius: 8, border: '1px solid #cbd5e1' }}>
          <button
            onClick={() => setViewMode('HEATMAP')}
            style={{
              background: viewMode === 'HEATMAP' ? '#0f172a' : 'transparent',
              color: viewMode === 'HEATMAP' ? '#ffffff' : '#475569',
              border: 'none', padding: '5px 12px', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 12
            }}
          >
            🔥 Heatmap Density
          </button>
          <button
            onClick={() => setViewMode('PINS')}
            style={{
              background: viewMode === 'PINS' ? '#0f172a' : 'transparent',
              color: viewMode === 'PINS' ? '#ffffff' : '#475569',
              border: 'none', padding: '5px 12px', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 12
            }}
          >
            📍 Incident Pins
          </button>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 600, color: '#dc2626' }}>
          <input type="checkbox" checked={onlyHeinous} onChange={(e) => setOnlyHeinous(e.target.checked)} />
          Heinous Only
        </label>

        <div style={{ marginLeft: 'auto', fontSize: 12.5, color: '#64748b' }}>
          Showing <strong>{filteredHotspots.length}</strong> points
        </div>
      </div>

      {/* Leaflet Map Display Container */}
      <div style={{ 
        position: 'relative', 
        height: 540, 
        borderRadius: 12, 
        overflow: 'hidden', 
        border: '1px solid #e2e8f0', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)' 
      }}>
        <MapContainer 
          center={DEFAULT_CENTER} 
          zoom={DEFAULT_ZOOM} 
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}              // We render clean custom zoom buttons
          scrollWheelZoom="center"         // Centers trackpad zoom smoothly
          smoothWheelZoom={true}           // Smooth inertia trackpad zooming
          inertia={true}                   // Kinetic momentum panning
          inertiaDeceleration={3000}       // Natural deceleration for trackpads
          touchZoom={true}
          doubleClickZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Custom Navigation Overlay */}
          <MapControls />

          {/* Render Heatmap Gradient Layer */}
          {viewMode === 'HEATMAP' && <HeatmapLayer points={filteredHotspots} />}

          {/* Render Pins Layer */}
          {viewMode === 'PINS' &&
            filteredHotspots.map((point, index) => {
              const { lat, lng } = getCoords(point);
              if (isNaN(lat) || isNaN(lng)) return null;

              const offsetLat = lat + (index * 0.003 - 0.003);
              const offsetLng = lng + (index * 0.003 - 0.003);

              return (
                <Marker key={point.firid || point.id || index} position={[offsetLat, offsetLng]} icon={orangeIcon}>
                  <Popup>
                    <div style={{ fontSize: 12, lineHeight: 1.5, color: '#0f172a' }}>
                      <strong>FIR No:</strong> {point.firno || point.fir_number || `FIR-#${point.firid}`}<br />
                      <strong>Category:</strong> {point.offencecategory || point.category || 'General'}<br />
                      <strong>Status:</strong> {point.statuslabel || 'Active'}<br />
                      <strong>Date:</strong> {point.dateofoccurrence ? new Date(point.dateofoccurrence).toLocaleDateString('en-IN') : 'N/A'}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
        </MapContainer>
      </div>

    </div>
  );
}

const selectStyle = {
  padding: '6px 10px',
  borderRadius: 6,
  border: '1px solid #cbd5e1',
  fontSize: 13,
  color: '#0f172a',
  outline: 'none',
  background: '#ffffff'
};

const controlButtonStyle = {
  width: 32,
  height: 32,
  background: '#ffffff',
  color: '#0f172a',
  border: '1px solid #e2e8f0',
  borderRadius: 6,
  fontSize: 16,
  fontWeight: 600,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background 120ms ease'
};