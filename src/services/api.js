// src/services/api.js
import axios from "axios";

// ✅ Reusable Axios instance
const api = axios.create({
  baseURL: "http://localhost:5000/api", // backend base URL
  timeout: 10000,
});

// ---- ROUTE CALLS ----

// 🟩 1️⃣ Summary (KPI cards)
export const fetchSummary = async () => {
  const response = await api.get("/summary");
  return response.data;
};

// 🟦 2️⃣ Rides per city (chart)
export const fetchRidesPerCity = async () => {
  const response = await api.get("/rides-per-city");
  return response.data;
};

// Fetch bookings original
export const fetchBookings = async () => {
  const response = await api.get("/bookings");
  return response.data;
};

// Manage Bookings (paged + search)
export async function fetchBookingsPaged({ limit = 25, offset = 0, search = "" } = {}) {
  const { data } = await api.get("/bookings", { params: { limit, offset, search } });
  return data; // { data, total, limit, offset }
}

// 🧪 4️⃣ Test connection (optional)
export const testConnection = async () => {
  const response = await api.get("/test");
  return response.data;
};

// 🟧 5️⃣ Revenue by vehicle type (DonutChart)
export const fetchRevenueByVehicle = async () => {
  const response = await api.get("/revenue-by-vehicle");
  return response.data;
};

// 🟨 6️⃣ Rides per location (BarChart)
export const fetchRidesPerLocation = async () => {
  const response = await api.get("/rides-per-location");
  return response.data;
};

// 🟦 7️⃣ Monthly rides trend (LineChart)
export const fetchRidesTrend = async () => {
  const response = await api.get("/rides-trend");
  return response.data;
};

// 🗺️ 8️⃣ City & Region Insights (Map)
export const fetchCityInsights = async () => {
  const response = await api.get("/city-insights");
  return response.data;
};

// Additional helper functions for dropdowns and creating bookings
export async function fetchCustomers() {
  const response = await api.get(`/customers`);
  return response.data;
}

export async function fetchVehicleTypes() {
  const response = await api.get(`/vehicle-types`);
  return response.data;
}

export async function fetchLocations() {
  const response = await api.get(`/locations`);
  return response.data;
}

// CREATE BOOKING
export async function createBooking(payload) {
  const response = await api.post("/bookings", payload);
  return response.data;
}

export async function validateCustomer(id) {
  const { data } = await api.get(`/customers/${id}`);
  return data; // { exists: boolean, customer_id: number }
}

export async function updateBooking(id, data) {
  const res = await api.put(`/bookings/${id}`, data);
  return res.data;
}

export async function deleteBooking(id) {
  const res = await api.delete(`/bookings/${id}`);
  return res.data;
}


export default api;
