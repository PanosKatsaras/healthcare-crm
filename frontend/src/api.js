import axios from "axios";

// Axios instance with base URL
const API = axios.create({
  baseURL: "http://localhost:5287/api", // Backend API URL
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Ensure cookies (like the JWT in HttpOnly cookie) are sent with the request
});

export default API;
