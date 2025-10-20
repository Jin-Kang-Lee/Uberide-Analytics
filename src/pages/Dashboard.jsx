import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import StatsCard from "../components/StatsCard";
import Chart from "../components/Chart";
// import DataTable from "../components/DataTable";
import DonutChart from "../components/DonutChart";
import BarChart from "../components/BarChart";
import { fetchSummary } from "../services/api";
import { useNavigate } from "react-router-dom";
import { FaChartBar, FaChartPie, FaCalendarAlt, FaFileInvoice } from "react-icons/fa";

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate(); // ✅ navigation hook

  // Fetch summary metrics
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchSummary();
        setSummary(data);
      } catch (err) {
        console.error("Error fetching summary:", err);
        setError("Failed to load summary data");
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

          {/* -------------------- KPI Cards -------------------- */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-yellow-400 flex items-center gap-2">
              <FaChartBar className="text-blue-600 dark:text-yellow-400" />
              Key Metrics Overview
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {loading ? (
                <p className="col-span-5 text-center text-gray-500 dark:text-gray-400">
                  Loading dashboard...
                </p>
              ) : error ? (
                <p className="col-span-5 text-center text-red-500">{error}</p>
              ) : summary ? (
                <>
                  <StatsCard title="Total Rides" value={summary.total_rides} loading={loading} />
                  <StatsCard title="Total Revenue" value={`$${summary.total_revenue}`} loading={loading} />
                  <StatsCard title="Avg Distance" value={`${summary.avg_distance} km`} loading={loading} />
                  <StatsCard title="Avg Rating" value={`${summary.avg_rating}`} loading={loading} />
                  <StatsCard title="B2B Ride %" value={`${summary.b2b_percentage ?? "N/A"}%`} loading={loading} />
                </>
              ) : (
                <p className="col-span-5 text-center text-gray-500 dark:text-gray-400">
                  No data available
                </p>
              )}
            </div>
          </section>

          {/* -------------------- Charts -------------------- */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-yellow-400 flex items-center gap-2">
              <FaChartPie className="text-green-600 dark:text-yellow-400" />
              Operational Insights
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[350px]">
              <DonutChart title="Revenue by Vehicle Type" endpoint="revenue-by-vehicle" />
              <BarChart title="Top 5 Locations by Rides" endpoint="rides-per-location" />
            </div>
          </section>

          {/* -------------------- Trends -------------------- */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-yellow-400 flex items-center gap-2">
              <FaCalendarAlt className="text-purple-600 dark:text-yellow-400" />
              Booking Trend
            </h2>
            <Chart title="Rides Over Time" endpoint="rides-trend" />
          </section>

          {/* -------------------- Table -------------------- */}
          {/* <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-yellow-400">
              🧾 Recent Bookings
            </h2>
            <DataTable />
          </section> */}
        </main>
      </div>
    </div>
  );
}
