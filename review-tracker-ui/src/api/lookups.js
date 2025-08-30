import axios from "axios";

const API_BASE = "http://localhost:8080/api/lookups"; // adjust if needed

// Convenience getters for simple dropdown usage (return arrays of items)
export const getPlatforms = async () => {
  const res = await axios.get(`${API_BASE}/platforms`, { params: { page: 0, size: 1000, sort: "name", dir: "ASC" } });
  return { data: res.data.content };
};
export const getStatuses = async () => {
  const res = await axios.get(`${API_BASE}/statuses`, { params: { page: 0, size: 1000, sort: "name", dir: "ASC" } });
  return { data: res.data.content };
};
export const getMediators = async () => {
  const res = await axios.get(`${API_BASE}/mediators`, { params: { page: 0, size: 1000, sort: "name", dir: "ASC" } });
  return { data: res.data.content };
};

// Paged APIs for Lookups management UIs
export const pagePlatforms = (params) => axios.get(`${API_BASE}/platforms`, { params });
export const pageStatuses = (params) => axios.get(`${API_BASE}/statuses`, { params });
export const pageMediators = (params) => axios.get(`${API_BASE}/mediators`, { params });

// Save (create/update)
export const savePlatform = (platform) => axios.post(`${API_BASE}/platforms`, platform);
export const saveStatus = (status) => axios.post(`${API_BASE}/statuses`, status);
export const saveMediator = (mediator) => axios.post(`${API_BASE}/mediators`, mediator);

// Delete
export const deletePlatform = (id) => axios.delete(`${API_BASE}/platforms/${id}`);
export const deleteStatus = (id) => axios.delete(`${API_BASE}/statuses/${id}`);
export const deleteMediator = (id) => axios.delete(`${API_BASE}/mediators/${id}`);
