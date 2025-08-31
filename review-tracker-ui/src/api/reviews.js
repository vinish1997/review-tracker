import axios from "axios";

const API_BASE = "http://localhost:8080/api/reviews"; // adjust backend URL

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
