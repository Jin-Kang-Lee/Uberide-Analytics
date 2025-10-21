import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import StatsCard from "../components/StatsCard";
import CustomBarChart from "../components/BarChart";
import DonutChart from "../components/DonutChart";
import Chart from "../components/Chart"; // For line chart
import { SiMongodb } from "react-icons/si";
import { FaCarSide, FaChartLine, FaCheckCircle, FaStar } from "react-icons/fa";
import {
  fetchVehicleDashboardData
} from "../services/mongoAPI";

export default function MongoVehicles() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetchVehicleDashboardData();
        setData(res);
      } catch (err) {
        console.error("❌ Error loading vehicle dashboard:", err);
        setError("Failed to load MongoDB vehicle dashboard data");
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
          {/* ===================== HEADER ===================== */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-gray-800 dark:text-[#00ADB5]">
              <SiMongodb className="text-green-600 dark:text-[#00ADB5]" />
              MongoDB Vehicle Analytics
            </h2>
          </section>

          {/* ===================== KPI CARDS ===================== */}
          <section>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {loading ? (
                <p className="col-span-4 text-center text-gray-500 dark:text-gray-400">
                  Loading vehicle metrics...
                </p>
              ) : error ? (
                <p className="col-span-4 text-center text-red-500">{error}</p>
              ) : (
                <>
                  <StatsCard
                    title="Total Vehicle Types"
                    value={data?.summary?.totalVehicleTypes ?? "N/A"}
                    icon={<FaCarSide />}
                  />
                  <StatsCard
                    title="Avg Completion Rate"
                    value={`${data?.summary?.completionRate ?? 0}%`}
                    icon={<FaCheckCircle />}
                  />
                  <StatsCard
                    title="Avg Rating"
                    value={`⭐ ${data?.summary?.avgRating ?? 0}`}
                    icon={<FaStar />}
                  />
                  <StatsCard
                    title="Top Cancellation Reason"
                    value={data?.summary?.topCancelReason ?? "—"}
                    icon={<FaChartLine />}
                  />
                </>
              )}
            </div>
          </section>

          {/* ===================== RELIABILITY & PERFORMANCE ===================== */}
          <section>
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-[#00ADB5]">
              🚘 Reliability & Performance
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CustomBarChart
                title="Bookings by Vehicle Type"
                endpoint="vehicle-stats/bookings"
              />
              <CustomBarChart
                title="Completion Rate by Vehicle Type"
                endpoint="vehicle-stats/completion"
              />
            </div>
          </section>

          {/* ===================== REVENUE & RATINGS ===================== */}
          <section>
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-[#00ADB5]">
              💰 Revenue & Ratings
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DonutChart
                title="Revenue Distribution by Vehicle Type"
                endpoint="vehicle-stats/revenue"
                description="From MongoDB vehicle_stats collection"
              />
              <CustomBarChart
                title="Average Ratings by Vehicle Type"
                endpoint="vehicle-stats/ratings"
              />
            </div>
          </section>

          {/* ===================== RELIABILITY BREAKDOWN ===================== */}
          <section>
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-[#00ADB5]">
              ⚙️ Reliability Breakdown
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DonutChart
                title="Cancellation Breakdown by Reason"
                endpoint="vehicle-stats/reliability"
                description="From MongoDB ride_metadata collection"
              />
              <Chart
                title="Average VTAT & CTAT Trends"
                endpoint="vehicle-stats/vtat"
                description="Average Vehicle & Customer Turnaround Times"
              />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
