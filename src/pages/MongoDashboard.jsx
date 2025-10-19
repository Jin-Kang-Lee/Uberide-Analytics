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
          {/* -------------------- KPI Cards -------------------- */}
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
                  <StatsCard title="Total Documents" value={summary.totalDocuments ?? "N/A"} loading={loading} />
                  <StatsCard title="Total Revenue" value={`$${summary.totalRevenue ?? "0"}`} loading={loading} />
                  <StatsCard title="Avg Distance" value={`${summary.avgDistance ?? 0} km`} loading={loading} />
                  <StatsCard title="Active Collections" value={summary.collectionCount ?? "N/A"} loading={loading} />
                  <StatsCard title="Top Vehicle Type" value={summary.topVehicleType ?? "N/A"} loading={loading} />
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
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-[#00ADB5]">
              📈 Operational Insights
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[350px]">
              <DonutChart title="Revenue by Vehicle Type" endpoint="mongo/revenue-by-vehicle" />
              <BarChart title="Top Pickup Locations" endpoint="mongo/rides-per-location" />
            </div>
          </section>

          {/* -------------------- Trends -------------------- */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-[#00ADB5]">
              📆 Booking Trend
            </h2>
            <Chart title="Rides Over Time" endpoint="mongo/rides-trend" />
          </section>

          {/* -------------------- Table (optional) -------------------- */}
          {/* <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-[#00ADB5]">
              🧾 Recent Documents
            </h2>
            <DataTable />
          </section> */}
        </main>
      </div>
    </div>
  );
}
