import axios from "axios";

const API_BASE = "http://localhost:8080/api/lookups"; // adjust if needed

export const getPlatforms = () => axios.get(`${API_BASE}/platforms`);
export const getMediators = () => axios.get(`${API_BASE}/mediators`);
export const getStatuses = () => axios.get(`${API_BASE}/statuses`);
