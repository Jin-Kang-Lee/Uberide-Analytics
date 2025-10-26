// src/services/mongoAPI.js
const BASE_URL = "http://localhost:5002/api/mongo"; // Mongo lives on port 5002

async function fetchData(endpoint) {
  const url = endpoint.startsWith("/") ? `${BASE_URL}${endpoint}` : `${BASE_URL}/${endpoint}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  return res.json();
}

// Canonical KPI from mongoRoutes (four analytics collections)
export const fetchMongoSummary     = () => fetchData("/summary");

// Time series / rides analytics (rideRoutes mounted under /rides)
export const fetchBookingStatus    = () => fetchData("/rides/booking-status");
export const fetchWeeklyTrends     = () => fetchData("/rides/weekly-trends");
export const fetchRidesTrend       = () => fetchData("/rides/rides-trend");
export const fetchVehicleBookings  = () => fetchData("/rides/vehicle-bookings");
export const fetchVehicleCompletion= () => fetchData("/rides/vehicle-completion");
export const fetchVehicleRevenue   = () => fetchData("/rides/vehicle-revenue");
export const fetchVehicleRatings   = () => fetchData("/rides/vehicle-ratings");
export const fetchVehicleReliability = () => fetchData("/rides/vehicle-reliability");
export const fetchVehicleVTAT      = () => fetchData("/rides/vehicle-vtat");
export const fetchVehicleCTAT      = () => fetchData("/rides/vehicle-ctat");
// --- Time buckets ---
export const fetchTimeHeatmap       = () => fetchData("/time/heatmap");
export const fetchHourlyTimeSeries  = () => fetchData("/time/hourly");

// --- Locations ---
export const fetchTopLocations      = () => fetchData("/locations/top");
export const fetchProblemZones      = () => fetchData("/locations/problem-zones");

// --- Fleet / Vehicles ---
export const fetchVehicleMetrics    = () => fetchData("/vehicles/metrics");

// --- Customers ---
export const fetchTopCustomers      = () => fetchData("/customers/top");

// Booking model–based operational summary (bookingRoutes mounted under /bookings)
export const fetchBookingsSummary  = () => fetchData("/bookings/summary");

export async function fetchVehicleDashboardData() {
  const [bookings, completion, revenue, ratings, reliability, vtat, ctat] =
    await Promise.all([
      fetchVehicleBookings(),
      fetchVehicleCompletion(),
      fetchVehicleRevenue(),
      fetchVehicleRatings(),
      fetchVehicleReliability(),
      fetchVehicleVTAT(),
      fetchVehicleCTAT(),
    ]);

  return { bookings, completion, revenue, ratings, reliability, vtat, ctat };
}

