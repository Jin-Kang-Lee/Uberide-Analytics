import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import StatsCard from "../components/StatsCard";
import Chart from "../components/Chart";
import DonutChart from "../components/DonutChart";
import BarChart from "../components/BarChart";
import { fetchMongoSummary } from "../services/mongoAPI";
import { SiMongodb } from "react-icons/si";
import { FaDatabase } from "react-icons/fa";

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
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Navbar />

        <main className="p-6 space-y-8 overflow-y-auto">
          {/* KPI Cards */}
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

          {/* Booking Status */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-[#00ADB5] flex items-center gap-2">
              <FaDatabase className="text-blue-600 dark:text-[#00ADB5]" />
              Booking Status Distribution
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DonutChart 
                title="Booking Status Breakdown" 
                endpoint="mongo/booking-status"
                description="From bookings_clean collection"
              />
              <BarChart 
                title="Weekly Booking Patterns" 
                endpoint="mongo/weekly-trends" 
                description="Aggregated from time_buckets"
              />
            </div>
          </section>

          {/* Time Series */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-[#00ADB5]">
              📆 Booking Timeline
            </h2>
            <Chart 
              title="Rides Over Time" 
              endpoint="mongo/rides-trend"
              description="From rides collection by date"
            />
          </section>
        </main>
      </div>
    </div>
  );
}
