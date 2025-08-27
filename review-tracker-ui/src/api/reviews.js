import axios from "axios";

const API_BASE = "http://localhost:8080/api/reviews"; // adjust backend URL

export const getReviews = (params = {}) => axios.get(API_BASE, { params });
export const createReview = (review) => axios.post(API_BASE, review);
export const updateReview = (id, review) => axios.put(`${API_BASE}/${id}`, review);
export const deleteReview = (id) => axios.delete(`${API_BASE}/${id}`);
