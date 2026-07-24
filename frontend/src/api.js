const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

function getToken() {
  return localStorage.getItem('nagarwatch_token');
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  login: (kgid, password) => request('/auth/login', { method: 'POST', body: { kgid, password }, auth: false }),
  dashboardSummary: () => request('/dashboard/summary'),
  searchFIR: (params) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
    return request(`/fir?${qs}`);
  },
  getFIRDetail: (id) => request(`/fir/${id}`),
  getFIRById: (id) => request(`/fir/${id}`),

  hotspots: () => request('/map/hotspots'),
  aiQuery: (prompt) => request('/ai/query', { method: 'POST', body: { prompt } }),
  auditLog: () => request('/audit'),

  getLinkSamples: () => request('/links/samples'),
  linkAnalysis: (accusedId) => request(`/links/${accusedId}`),

  getMonthlyTrends: () => request('/analytics/monthly-trends'),
  getHourlySeverity: () => request('/analytics/hourly-severity'),
  getSummaryStats: () => request('/analytics/summary-stats')
};

export { getToken };