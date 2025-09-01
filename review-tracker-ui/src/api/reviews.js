import axios from "axios";

// Allow overriding API base via env (e.g., VITE_API_BASE=https://server)
const API_ROOT = (import.meta?.env?.VITE_API_BASE || "").replace(/\/$/, "");
const API_BASE = `${API_ROOT}/api/reviews`;

export const getReviews = (params = {}) => axios.get(API_BASE, { params });
export const getReview = (id) => axios.get(`${API_BASE}/${id}`);
export const createReview = (review) => axios.post(API_BASE, review);
export const updateReview = (id, review) => axios.put(`${API_BASE}/${id}`, review);
export const deleteReview = (id) => axios.delete(`${API_BASE}/${id}`);
export const searchReviews = (criteria, params = {}) => axios.post(`${API_BASE}/search`, criteria, { params });
export const exportCsv = () => axios.get(`${API_BASE}/export`, { responseType: 'blob' });
export const importCsv = (file) => {
  const fd = new FormData();
  fd.append('file', file);
  return axios.post(`${API_BASE}/import`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
};
export const bulkDelete = (ids) => axios.post(`${API_BASE}/bulk-delete`, ids);
export const aggregates = (criteria) => axios.post(`${API_BASE}/aggregates`, criteria);

// Advance next step endpoints
export const advanceReview = (id, date) => axios.post(`${API_BASE}/${id}/advance`, { date });
export const bulkAdvance = (ids, date) => axios.post(`${API_BASE}/bulk-advance`, { ids, date });
