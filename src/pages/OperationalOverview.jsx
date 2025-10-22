// ============================================================
// 🧩 Operational Overview (MongoDB)
// ------------------------------------------------------------
// Displays top-level MongoDB analytics for marketplace health,
// booking performance, and time trends (from bookings_clean &
// time_buckets collections).
// ============================================================

import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import StatsCard from "../components/StatsCard";
import DonutChart from "../components/MongoDonutChart";
import CustomBarChart from "../components/MongoBarChart";
import Chart from "../components/Chart";
import { SiMongodb } from "react-icons/si";
import { FaDatabase, FaChartLine, FaClock, FaCheckCircle, FaStar, FaCalendar } from "react-icons/fa";
import { fetchMongoSummary } from "../services/mongoAPI";

export default function OperationalOverview() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchMongoSummary();
        setSummary(data);
      } catch (err) {
        console.error("❌ Error fetching Mongo summary:", err);
        setError("Failed to load MongoDB summary data");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0B0E11] text-gray-800 dark:text-gray-200">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Navbar />

        <main className="p-6 space-y-8 overflow-y-auto">
          {/* ========================================================= */}
          {/* 🔹 Section 1: KPI Cards - Marketplace Health */}
          {/* ========================================================= */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-[#00ADB5] flex items-center gap-2">
              <SiMongodb className="text-green-600 dark:text-[#00ADB5]" />
              MongoDB Operational Overview
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
                  <StatsCard
                    title="Total Bookings"
                    value={summary.totalBookings ?? "N/A"}
                    icon={<FaCalendar className="text-3xl text-blue-500" />}
                  />
                  <StatsCard
                    title="Total Revenue"
                    value={`$${summary.totalRevenue?.toLocaleString() ?? "0"}`}
                    icon={<FaChartLine className="text-3xl text-green-500" />}
                  />
                  <StatsCard
                    title="Avg Distance"
                    value={`${summary.avgDistance?.toFixed(1) ?? 0} km`}
                    icon={<FaClock className="text-3xl text-yellow-400" />}
                  />
                  <StatsCard
                    title="Completion Rate"
                    value={`${summary.completionRate ?? 0}%`}
                    icon={<FaCheckCircle className="text-3xl text-emerald-500" />}
                  />
                  <StatsCard
                    title="Avg Rating"
                    value={`${summary.avgRating?.toFixed(2) ?? "N/A"}`}
                    icon={<FaStar className="text-3xl text-yellow-400" />}
                  />
                </>
              ) : (
                <p className="col-span-5 text-center text-gray-500 dark:text-gray-400">
                  No data available
                </p>
              )}
            </div>
          </section>

          {/* ========================================================= */}
          {/* 🔸 Section 2: Booking Status + Weekly Trends */}
          {/* ========================================================= */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-[#00ADB5] flex items-center gap-2">
              <FaDatabase className="text-blue-600 dark:text-[#00ADB5]" />
              Booking Status & Weekly Patterns
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DonutChart
                title="Booking Status Breakdown"
                endpoint="mongo/booking-status"
                description="Distribution of completed, cancelled, and pending rides from bookings_clean collection"
              />
              <CustomBarChart
                title="Weekly Booking Trends"
                endpoint="mongo/weekly-trends"
                description="Shows ride and revenue totals per week (aggregated by ISO week)"
              />
            </div>
          </section>

          {/* ========================================================= */}
          {/* 🔹 Section 3: Time-Series Trends */}
          {/* ========================================================= */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-[#00ADB5] flex items-center gap-2">
              <FaChartLine className="text-indigo-500" />
              Booking Timeline
            </h2>

            <Chart
              title="Rides Over Time"
              endpoint="mongo/rides-trend"
              description="Daily booking volume aggregated from bookings_clean"
            />
          </section>
        </main>
      </div>
    </div>
  );
}
