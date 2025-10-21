// src/services/mongoAPI.js
const BASE_URL = "http://localhost:5001/api/mongo";

// ==================== HELPER FUNCTION ====================
async function fetchData(endpoint) {
  try {
    // Ensure slash prefix
    const fullUrl = endpoint.startsWith("/")
      ? `${BASE_URL}${endpoint}`
      : `${BASE_URL}/${endpoint}`;

    const response = await fetch(fullUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch data from ${endpoint}`);
    }
    return await response.json();
  } catch (err) {
    console.error(`❌ Error fetching ${endpoint}:`, err);
    throw err;
  }
}

// ==================== GENERAL / SUMMARY ====================
export async function fetchMongoSummary() {
  return fetchData("/summary");
}

export async function fetchMongoRides() {
  return fetchData("/rides");
}

// ==================== BOOKINGS ====================
export async function fetchBookingStatus() {
  return fetchData("/booking-status");
}

export async function fetchWeeklyTrends() {
  return fetchData("/weekly-trends");
}

export async function fetchRidesTrend() {
  return fetchData("/rides-trend");
}

// ==================== VEHICLE STATS ====================
export async function fetchVehicleBookings() {
  return fetchData("/vehicle-bookings");
}

export async function fetchVehicleCompletion() {
  return fetchData("/vehicle-completion");
}

export async function fetchVehicleReliability() {
  return fetchData("/vehicle-reliability");
}

export async function fetchVehicleRevenue() {
  return fetchData("/vehicle-revenue");
}

export async function fetchVehicleRatings() {
  return fetchData("/vehicle-ratings");
}

export async function fetchVehicleVTAT() {
  return fetchData("/vehicle-vtat");
}

export async function fetchVehicleCTAT() {
  return fetchData("/vehicle-ctat");
}

// ==================== LOCATION STATS ====================
export async function fetchTopPickupLocations() {
  return fetchData("/location-top-pickups");
}

export async function fetchTopDropLocations() {
  return fetchData("/location-top-drops");
}

export async function fetchNoDriverByLocation() {
  return fetchData("/location-no-driver");
}

export async function fetchCompletionRateByLocation() {
  return fetchData("/location-completion");
}

export async function fetchVTATByLocation() {
  return fetchData("/location-vtat");
}

export async function fetchRatingsByLocation() {
  return fetchData("/location-ratings");
}

// ==================== TIME BUCKETS ====================
export async function fetchHourlyBookings() {
  return fetchData("/time-hourly-bookings");
}

export async function fetchWeekdayBookings() {
  return fetchData("/time-weekday-bookings");
}

export async function fetchWeekdayCompletion() {
  return fetchData("/time-weekday-completion");
}

export async function fetchHourlyBookingValue() {
  return fetchData("/time-hourly-value");
}

export async function fetchHourlyDistance() {
  return fetchData("/time-hourly-distance");
}

export async function fetchSpeedMetrics() {
  return fetchData("/time-speed");
}

export async function fetchHourlyRatings() {
  return fetchData("/time-hourly-ratings");
}

// ==================== CUSTOMER PROFILES ====================
export async function fetchTopCustomersByBookings() {
  return fetchData("/customer-top-bookings");
}

export async function fetchTopCustomersByRevenue() {
  return fetchData("/customer-top-revenue");
}

export async function fetchVehiclePreferences() {
  return fetchData("/customer-vehicle-preference");
}

export async function fetchPaymentMethodDistribution() {
  return fetchData("/customer-payment-method");
}

export async function fetchCustomerSuccessRate() {
  return fetchData("/customer-success-rate");
}

export async function fetchCustomerRatingsDistribution() {
  return fetchData("/customer-ratings-dist");
}

export async function fetchPopularPickupsByCustomers() {
  return fetchData("/customer-popular-pickups");
}

export async function fetchPopularDropsByCustomers() {
  return fetchData("/customer-popular-drops");
}

// ==================== BATCH FETCHING ====================
export async function fetchDashboardData() {
  try {
    const [summary, bookingStatus, weeklyTrends, ridesTrend] = await Promise.all([
      fetchMongoSummary(),
      fetchBookingStatus(),
      fetchWeeklyTrends(),
      fetchRidesTrend(),
    ]);

    return { summary, bookingStatus, weeklyTrends, ridesTrend };
  } catch (err) {
    console.error("❌ Error fetching dashboard data:", err);
    throw err;
  }
}

export async function fetchVehicleDashboardData() {
  try {
    const [
      summary,
      bookings,
      completion,
      reliability,
      revenue,
      ratings,
      vtat,
      ctat,
    ] = await Promise.all([
      fetchMongoSummary(),
      fetchVehicleBookings(),
      fetchVehicleCompletion(),
      fetchVehicleReliability(),
      fetchVehicleRevenue(),
      fetchVehicleRatings(),
      fetchVehicleVTAT(),
      fetchVehicleCTAT(),
    ]);

    return { summary, bookings, completion, reliability, revenue, ratings, vtat, ctat };
  } catch (err) {
    console.error("❌ Error fetching vehicle dashboard data:", err);
    throw err;
  }
}

export async function fetchLocationDashboardData() {
  try {
    const [summary, topPickups, topDrops, noDriver, completion, vtat, ratings] = await Promise.all([
      fetchMongoSummary(),
      fetchTopPickupLocations(),
      fetchTopDropLocations(),
      fetchNoDriverByLocation(),
      fetchCompletionRateByLocation(),
      fetchVTATByLocation(),
      fetchRatingsByLocation(),
    ]);

    return { summary, topPickups, topDrops, noDriver, completion, vtat, ratings };
  } catch (err) {
    console.error("❌ Error fetching location dashboard data:", err);
    throw err;
  }
}

export async function fetchTimeDashboardData() {
  try {
    const [
      summary,
      hourlyBookings,
      weekdayBookings,
      weekdayCompletion,
      hourlyValue,
      hourlyDistance,
      speedMetrics,
      hourlyRatings,
    ] = await Promise.all([
      fetchMongoSummary(),
      fetchHourlyBookings(),
      fetchWeekdayBookings(),
      fetchWeekdayCompletion(),
      fetchHourlyBookingValue(),
      fetchHourlyDistance(),
      fetchSpeedMetrics(),
      fetchHourlyRatings(),
    ]);

    return {
      summary,
      hourlyBookings,
      weekdayBookings,
      weekdayCompletion,
      hourlyValue,
      hourlyDistance,
      speedMetrics,
      hourlyRatings,
    };
  } catch (err) {
    console.error("❌ Error fetching time dashboard data:", err);
    throw err;
  }
}

export async function fetchCustomerDashboardData() {
  try {
    const [
      summary,
      topByBookings,
      topByRevenue,
      vehiclePreferences,
      paymentMethods,
      successRate,
      ratingsDistribution,
      popularPickups,
      popularDrops,
    ] = await Promise.all([
      fetchMongoSummary(),
      fetchTopCustomersByBookings(),
      fetchTopCustomersByRevenue(),
      fetchVehiclePreferences(),
      fetchPaymentMethodDistribution(),
      fetchCustomerSuccessRate(),
      fetchCustomerRatingsDistribution(),
      fetchPopularPickupsByCustomers(),
      fetchPopularDropsByCustomers(),
    ]);

    return {
      summary,
      topByBookings,
      topByRevenue,
      vehiclePreferences,
      paymentMethods,
      successRate,
      ratingsDistribution,
      popularPickups,
      popularDrops,
    };
  } catch (err) {
    console.error("❌ Error fetching customer dashboard data:", err);
    throw err;
  }
}

// ==================== EXPORT ALL ====================
const mongoAPI = {
  // General
  fetchMongoSummary,
  fetchMongoRides,

  // Bookings
  fetchBookingStatus,
  fetchWeeklyTrends,
  fetchRidesTrend,

  // Vehicles
  fetchVehicleBookings,
  fetchVehicleCompletion,
  fetchVehicleReliability,
  fetchVehicleRevenue,
  fetchVehicleRatings,
  fetchVehicleVTAT,
  fetchVehicleCTAT,

  // Locations
  fetchTopPickupLocations,
  fetchTopDropLocations,
  fetchNoDriverByLocation,
  fetchCompletionRateByLocation,
  fetchVTATByLocation,
  fetchRatingsByLocation,

  // Time Analysis
  fetchHourlyBookings,
  fetchWeekdayBookings,
  fetchWeekdayCompletion,
  fetchHourlyBookingValue,
  fetchHourlyDistance,
  fetchSpeedMetrics,
  fetchHourlyRatings,

  // Customers
  fetchTopCustomersByBookings,
  fetchTopCustomersByRevenue,
  fetchVehiclePreferences,
  fetchPaymentMethodDistribution,
  fetchCustomerSuccessRate,
  fetchCustomerRatingsDistribution,
  fetchPopularPickupsByCustomers,
  fetchPopularDropsByCustomers,

  // Batch Fetching
  fetchDashboardData,
  fetchVehicleDashboardData,
  fetchLocationDashboardData,
  fetchTimeDashboardData,
  fetchCustomerDashboardData,
};

export default mongoAPI;
