import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import StatsCard from "../components/StatsCard";
import Chart from "../components/Chart";
import DonutChart from "../components/DonutChart";
import BarChart from "../components/BarChart";
import { fetchMongoSummary } from "../services/mongoAPI";

export default function MongoDashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch MongoDB summary metrics
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchMongoSummary();
        setSummary(data);
      } catch (err) {
        console.error("Error fetching Mongo summary:", err);
        setError("Failed to load MongoDB summary data");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0B0E11] text-gray-800 dark:text-gray-200">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <Navbar />

        <main className="p-6 space-y-8 overflow-y-auto">
          {/* -------------------- Navigation Tabs -------------------- */}
          <section className="flex flex-wrap gap-2 bg-gray-200 dark:bg-[#1A1D23] p-1 rounded-lg">
            {[
              { id: 'overview', label: '📊 Overview' },
              { id: 'vehicles', label: '🚗 Vehicles' },
              { id: 'locations', label: '📍 Locations' },
              { id: 'time', label: '⏰ Time Analysis' },
              { id: 'customers', label: '👤 Customers' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-md transition-all font-medium ${
                  activeTab === tab.id 
                    ? 'bg-[#00ADB5] text-white shadow-lg' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-300 dark:hover:bg-[#2A2D33]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </section>

          {/* -------------------- OVERVIEW TAB -------------------- */}
          {activeTab === 'overview' && (
            <>
              {/* KPI Cards - from bookings_clean aggregation */}
              <section>
                <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-[#00ADB5]">
                  🍃 MongoDB Metrics Overview
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                  {loading ? (
                    <p className="col-span-5 text-center text-gray-500 dark:text-gray-400">
                      Loading MongoDB dashboard...
                    </p>
                  ) : error ? (
                    <p className="col-span-5 text-center text-red-500">{error}</p>
                  ) : summary ? (
                    <>
                      <StatsCard title="Total Bookings" value={summary.totalBookings ?? "N/A"} loading={loading} />
                      <StatsCard title="Total Revenue" value={`$${summary.totalRevenue ?? "0"}`} loading={loading} />
                      <StatsCard title="Avg Distance" value={`${summary.avgDistance ?? 0} km`} loading={loading} />
                      <StatsCard title="Completion Rate" value={`${summary.completionRate ?? 0}%`} loading={loading} />
                      <StatsCard title="Avg Rating" value={`⭐ ${summary.avgRating ?? "N/A"}`} loading={loading} />
                    </>
                  ) : (
                    <p className="col-span-5 text-center text-gray-500 dark:text-gray-400">
                      No data available
                    </p>
                  )}
                </div>
              </section>

              {/* Booking Status & Weekly Trends - from bookings_clean */}
              <section>
                <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-[#00ADB5]">
                  📊 Booking Status & Trends
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <DonutChart 
                    title="Booking Status Distribution" 
                    endpoint="mongo/booking-status"
                    description="From bookings_clean collection"
                  />
                  <BarChart 
                    title="Weekly Booking Trends" 
                    endpoint="mongo/weekly-trends" 
                    description="Aggregated from time_buckets by day of week"
                  />
                </div>
              </section>

              {/* Time Series - from rides collection */}
              <section>
                <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-[#00ADB5]">
                  📆 Booking Trend Over Time
                </h2>
                <Chart 
                  title="Rides Over Time" 
                  endpoint="mongo/rides-trend"
                  description="From rides collection by date"
                />
              </section>
            </>
          )}

          {/* -------------------- VEHICLES TAB -------------------- */}
          {activeTab === 'vehicles' && (
            <>
              <section>
                <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-[#00ADB5]">
                  🚗 Vehicle Performance Analysis
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                    (from vehicle_stats collection)
                  </span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatsCard 
                    title="Most Popular Vehicle" 
                    value={summary?.topVehicleType ?? "N/A"} 
                    loading={loading} 
                  />
                  <StatsCard 
                    title="Total Vehicle Types" 
                    value={summary?.vehicleTypeCount ?? "N/A"} 
                    loading={loading} 
                  />
                  <StatsCard 
                    title="Best Rated Vehicle" 
                    value={summary?.bestRatedVehicle ?? "N/A"} 
                    loading={loading} 
                  />
                  <StatsCard 
                    title="Highest Completion" 
                    value={summary?.bestCompletionVehicle ?? "N/A"} 
                    loading={loading} 
                  />
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-[#00ADB5]">
                  📈 Vehicle Type Metrics
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <BarChart 
                    title="Bookings by Vehicle Type" 
                    endpoint="mongo/vehicle-stats/bookings"
                    description="counts.bookings from vehicle_stats"
                  />
                  <DonutChart 
                    title="Completion Rate Distribution" 
                    endpoint="mongo/vehicle-stats/completion"
                    description="reliability.completion_rate from vehicle_stats"
                  />
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-[#00ADB5]">
                  ⚡ Vehicle Reliability & Experience
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <BarChart 
                    title="Completed vs No Driver Found" 
                    endpoint="mongo/vehicle-stats/reliability"
                    description="counts.completed & counts.no_driver_found"
                  />
                  <BarChart 
                    title="Average Ratings by Vehicle" 
                    endpoint="mongo/vehicle-stats/ratings"
                    description="experience.avg_driver_ratings & avg_customer_rating"
                  />
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-[#00ADB5]">
                  ⏱️ Vehicle Speed Metrics
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <BarChart 
                    title="Average VTAT by Vehicle" 
                    endpoint="mongo/vehicle-stats/vtat"
                    description="speed.avg_vtat from vehicle_stats"
                  />
                  <BarChart 
                    title="Average CTAT by Vehicle" 
                    endpoint="mongo/vehicle-stats/ctat"
                    description="speed.avg_ctat from vehicle_stats"
                  />
                </div>
              </section>
            </>
          )}

          {/* -------------------- LOCATIONS TAB -------------------- */}
          {activeTab === 'locations' && (
            <>
              <section>
                <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-[#00ADB5]">
                  📍 Location Performance Overview
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                    (from location_stats collection)
                  </span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatsCard 
                    title="Total Pickup Zones" 
                    value={summary?.totalPickupLocations ?? "N/A"} 
                    loading={loading} 
                  />
                  <StatsCard 
                    title="Busiest Location" 
                    value={summary?.busiestLocation ?? "N/A"} 
                    loading={loading} 
                  />
                  <StatsCard 
                    title="Avg VTAT" 
                    value={`${summary?.avgVTAT ?? 0} min`} 
                    loading={loading} 
                  />
                  <StatsCard 
                    title="Best Completion Zone" 
                    value={summary?.bestCompletionLocation ?? "N/A"} 
                    loading={loading} 
                  />
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-[#00ADB5]">
                  🗺️ Demand Heatmap
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <BarChart 
                    title="Top Pickup Locations" 
                    endpoint="mongo/location-stats/top-pickups"
                    description="counts.bookings from location_stats"
                  />
                  <BarChart 
                    title="No Driver Found by Location" 
                    endpoint="mongo/location-stats/no-driver"
                    description="counts.no_driver_found from location_stats"
                  />
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-[#00ADB5]">
                  ⚡ Location Performance Metrics
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <BarChart 
                    title="Completion Rate by Location" 
                    endpoint="mongo/location-stats/completion"
                    description="rates.completion_rate from location_stats"
                  />
                  <BarChart 
                    title="Average VTAT by Location" 
                    endpoint="mongo/location-stats/vtat"
                    description="speed.avg_vtat from location_stats"
                  />
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-[#00ADB5]">
                  🎯 Popular Routes & Quality
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <BarChart 
                    title="Top Drop Locations" 
                    endpoint="mongo/location-stats/top-drops"
                    description="top_drop_locations from location_stats"
                  />
                  <BarChart 
                    title="Average Ratings by Pickup Location" 
                    endpoint="mongo/location-stats/ratings"
                    description="quality.avg_driver_ratings & avg_customer_rating"
                  />
                </div>
              </section>
            </>
          )}

          {/* -------------------- TIME ANALYSIS TAB -------------------- */}
          {activeTab === 'time' && (
            <>
              <section>
                <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-[#00ADB5]">
                  ⏰ Time-Based Performance
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                    (from time_buckets collection)
                  </span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatsCard 
                    title="Peak Hour" 
                    value={summary?.peakHour ?? "N/A"} 
                    loading={loading} 
                  />
                  <StatsCard 
                    title="Busiest Day" 
                    value={summary?.busiestDay ?? "N/A"} 
                    loading={loading} 
                  />
                  <StatsCard 
                    title="Best Completion Time" 
                    value={summary?.bestCompletionHour ?? "N/A"} 
                    loading={loading} 
                  />
                  <StatsCard 
                    title="Low Supply Period" 
                    value={summary?.lowSupplyPeriod ?? "N/A"} 
                    loading={loading} 
                  />
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-[#00ADB5]">
                  📊 Hourly Booking Patterns
                </h2>
                <Chart 
                  title="Bookings by Hour of Day" 
                  endpoint="mongo/time-buckets/hourly"
                  description="Aggregated by hour from time_buckets"
                />
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-[#00ADB5]">
                  📅 Day of Week Analysis
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <BarChart 
                    title="Bookings by Weekday" 
                    endpoint="mongo/time-buckets/weekday"
                    description="counts.bookings grouped by dow"
                  />
                  <Chart 
                    title="Completion Rate by Weekday" 
                    endpoint="mongo/time-buckets/weekday-completion"
                    description="rates.completion_rate by dow"
                  />
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-[#00ADB5]">
                  💰 Revenue & Distance Patterns
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Chart 
                    title="Average Booking Value by Hour" 
                    endpoint="mongo/time-buckets/hourly-value"
                    description="economics.avg_booking_value from time_buckets"
                  />
                  <Chart 
                    title="Average Distance by Hour" 
                    endpoint="mongo/time-buckets/hourly-distance"
                    description="economics.avg_ride_distance from time_buckets"
                  />
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-[#00ADB5]">
                  ⚡ Speed & Experience Metrics
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Chart 
                    title="VTAT & CTAT by Hour" 
                    endpoint="mongo/time-buckets/speed"
                    description="speed.avg_vtat & avg_ctat from time_buckets"
                  />
                  <Chart 
                    title="Average Ratings by Hour" 
                    endpoint="mongo/time-buckets/ratings"
                    description="experience.avg_driver_ratings & avg_customer_rating"
                  />
                </div>
              </section>
            </>
          )}

          {/* -------------------- CUSTOMERS TAB -------------------- */}
          {activeTab === 'customers' && (
            <>
              <section>
                <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-[#00ADB5]">
                  👤 Customer Insights
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                    (from customer_profiles collection)
                  </span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatsCard 
                    title="Total Customers" 
                    value={summary?.totalCustomers ?? "N/A"} 
                    loading={loading} 
                  />
                  <StatsCard 
                    title="Active Customers" 
                    value={summary?.activeCustomers ?? "N/A"} 
                    loading={loading} 
                  />
                  <StatsCard 
                    title="Avg Customer Rating" 
                    value={`⭐ ${summary?.avgCustomerRating ?? "N/A"}`} 
                    loading={loading} 
                  />
                  <StatsCard 
                    title="Loyal Customers" 
                    value={summary?.loyalCustomers ?? "N/A"} 
                    loading={loading} 
                  />
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-[#00ADB5]">
                  🏆 Top Customers
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <BarChart 
                    title="Top 10 Customers by Bookings" 
                    endpoint="mongo/customer-profiles/top-bookings"
                    description="Sort by counts.bookings from customer_profiles"
                  />
                  <BarChart 
                    title="Top 10 Customers by Revenue" 
                    endpoint="mongo/customer-profiles/top-revenue"
                    description="Sort by averages.booking_value * counts.bookings"
                  />
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-[#00ADB5]">
                  📊 Customer Preferences
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <DonutChart 
                    title="Vehicle Type Preferences" 
                    endpoint="mongo/customer-profiles/vehicle-preference"
                    description="preferences.most_used_vehicle_type distribution"
                  />
                  <DonutChart 
                    title="Payment Method Distribution" 
                    endpoint="mongo/customer-profiles/payment-method"
                    description="preferences.most_used_payment_method distribution"
                  />
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-[#00ADB5]">
                  🎯 Customer Behavior & Satisfaction
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <BarChart 
                    title="Booking Success Rate by Customer Segment" 
                    endpoint="mongo/customer-profiles/success-rate"
                    description="counts.completed / counts.bookings segmentation"
                  />
                  <BarChart 
                    title="Average Ratings Distribution" 
                    endpoint="mongo/customer-profiles/ratings-dist"
                    description="averages.customer_rating & driver_ratings distribution"
                  />
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-[#00ADB5]">
                  📍 Customer Location Patterns
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <BarChart 
                    title="Most Popular Pickup Locations (All Customers)" 
                    endpoint="mongo/customer-profiles/popular-pickups"
                    description="Aggregated from preferences.top_pickup_locations"
                  />
                  <BarChart 
                    title="Most Popular Drop Locations (All Customers)" 
                    endpoint="mongo/customer-profiles/popular-drops"
                    description="Aggregated from preferences.top_drop_locations"
                  />
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}