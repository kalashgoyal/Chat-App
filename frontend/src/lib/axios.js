import axios from "axios";

export const axiosInstance = axios.create({
  baseURL:
    import.meta.env.MODE === "development"
      ? "http://localhost:8000/api"
      : "https://chat-app-5ap2.onrender.com/api",
  withCredentials: true,
});