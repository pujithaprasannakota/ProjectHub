import axios from "axios";
const api = axios.create({ baseURL: "https://projecthub-78zw.onrender.com/api" });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("projecthub_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
export default api;