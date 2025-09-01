import axios from "axios";

const API_ROOT = (import.meta?.env?.VITE_API_BASE || "").replace(/\/$/, "");
const API_BASE = `${API_ROOT}/api/views`;

export const listViews = () => axios.get(API_BASE);
export const saveView = (vp) => axios.post(API_BASE, vp);
export const deleteView = (id) => axios.delete(`${API_BASE}/${id}`);
export const shareView = (id) => axios.post(`${API_BASE}/${id}/share`);
export const unshareView = (id) => axios.post(`${API_BASE}/${id}/unshare`);
export const getSharedView = (slug) => axios.get(`${API_BASE}/shared/${slug}`);
