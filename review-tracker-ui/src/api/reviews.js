import axios from "axios";

// Allow overriding API base via env (e.g., VITE_API_BASE=https://server)
const API_ROOT = (import.meta?.env?.VITE_API_BASE || "").replace(/\/$/, "");
const API_BASE = `${API_ROOT}/api/reviews`;

export const getReviews = (params = {}) => axios.get(API_BASE, { params });
export const getReview = (id) => axios.get(`${API_BASE}/${id}`);
export const createReview = (review) => axios.post(API_BASE, review);
export const updateReview = (id, review) => axios.put(`${API_BASE}/${id}`, review);
export const deleteReview = (id) => axios.delete(`${API_BASE}/${id}`);
const toQuery = (criteria = {}) => {
  const q = { ...criteria };
  // Serialize arrays as comma-separated to avoid bracket syntax; backend splits on commas
  if (Array.isArray(q.platformIdIn)) q.platformIdIn = q.platformIdIn.join(',');
  if (Array.isArray(q.mediatorIdIn)) q.mediatorIdIn = q.mediatorIdIn.join(',');
  if (Array.isArray(q.statusIn)) q.statusIn = q.statusIn.join(',');
  if (Array.isArray(q.dealTypeIn)) q.dealTypeIn = q.dealTypeIn.join(',');
  return q;
};

export const searchReviews = (criteria, params = {}) =>
  axios.get(`${API_BASE}/search`, { params: { ...toQuery(criteria), ...params } });
export const exportCsv = () => axios.get(`${API_BASE}/export`, { responseType: 'blob' });
export const importCsv = (file) => {
  const fd = new FormData();
  fd.append('file', file);
  return axios.post(`${API_BASE}/import`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
};
export const bulkDelete = (ids) => axios.post(`${API_BASE}/bulk-delete`, ids);
export const aggregates = (criteria) => axios.get(`${API_BASE}/aggregates`, { params: toQuery(criteria) });
export const overdueCount = () => axios.get(`${API_BASE}/metrics/overdue-count`);

// Advance next step endpoints
export const advanceReview = (id, date) => axios.post(`${API_BASE}/${id}/advance`, { date });
export const bulkAdvance = (ids, date) => axios.post(`${API_BASE}/bulk-advance`, { ids, date });

export const uploadImage = (file) => {
  const fd = new FormData();
  fd.append('file', file);
  return axios.post(`${API_ROOT}/api/media/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
};

export const getNotifications = () => axios.get(`${API_ROOT}/api/notifications`);

export const bulkUpdate = (ids, updates) => axios.post(`${API_BASE}/bulk-update`, { ids, updates });
