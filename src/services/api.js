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

// 🟨 3️⃣ Bookings table
export const fetchBookings = async () => {
  const response = await api.get("/bookings");
  return response.data;
};

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

// 👥 9️⃣ CUSTOMER INSIGHTS SECTION ----------------------------

// 9.1️⃣ Customer Summary (KPI Cards)
export const fetchCustomerSummary = async () => {
  const response = await api.get("/customer-summary");
  return response.data;
};

// 9.2️⃣ Top Customers by Spend
export const fetchTopCustomers = async () => {
  const response = await api.get("/top-customers");
  return response.data;
};

// 9.3️⃣ Ride Frequency Distribution
export const fetchCustomerFrequency = async () => {
  const response = await api.get("/customer-frequency");
  return response.data;
};

// 9.4️⃣ Monthly Customer Growth
export const fetchCustomerGrowth = async () => {
  const response = await api.get("/customer-growth");
  return response.data;
};

// 9.5️⃣ Ratings vs Spending Scatter Plot
export const fetchCustomerRatingsSpending = async () => {
  const response = await api.get("/customer-ratings-spending");
  return response.data;
};

// ------------------------------------------------------------

export default api;
