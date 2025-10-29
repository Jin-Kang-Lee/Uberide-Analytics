import React, { useEffect, useState, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { FaChartPie, FaChartBar, FaSearch } from "react-icons/fa";
import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

export default function RideRecommendations() {
  const [customerId, setCustomerId] = useState("");     // ← start empty
  const [pendingId, setPendingId] = useState("");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);        // ← start not loading
  const [error, setError] = useState(null);

  const COLORS = ["#00C49F", "#FFBB28", "#FF8042", "#0088FE", "#AA46BE"];

  // Formatting helper
  const fmt = (val, decimals = 2, suffix = "") => {
    if (val == null || isNaN(val)) return "—";
    return `${Number(val).toFixed(decimals)}${suffix}`;
  };

  const fetchProfile = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    setProfile(null);
    try {
      const res = await fetch(
        `http://localhost:5002/api/mongo/customers/${encodeURIComponent(id)}/profile`
      );
      const data = await res.json();
      if (res.ok) setProfile(data);
      else setError(data?.error || "Failed to fetch profile");
    } catch {
      setError("Server error while fetching profile");
    } finally {
      setLoading(false);
    }
  }, []);

  // Only fetch when we actually have an ID
  useEffect(() => {
    if (customerId.trim()) {
      fetchProfile(customerId.trim());
    } else {
      // clear state for the empty-ID case
      setProfile(null);
      setError(null);
      setLoading(false);
    }
  }, [customerId, fetchProfile]);

  const handleSearch = () => {
    const id = (pendingId || "").trim();
    if (!id) {
      setError("Please enter a customer ID.");
      setProfile(null);
      setLoading(false);
      return;
    }
    setCustomerId(id);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const Card = ({ title, value, color }) => (
    <div className="bg-white dark:bg-[#1A1D21] shadow rounded-xl p-4 border border-gray-100 dark:border-gray-700 text-center">
      <h3 className="text-sm text-gray-500 dark:text-gray-400">{title}</h3>
      <p className={`text-2xl font-semibold ${color || "text-gray-800 dark:text-gray-200"}`}>
        {value}
      </p>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0B0E11] text-gray-800 dark:text-gray-200">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Navbar />

        <main className="p-6 space-y-8 overflow-y-auto">
          {/* Header + Search */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <h1 className="text-3xl font-semibold text-gray-800 dark:text-yellow-400 flex items-center gap-2">
              <FaChartPie className="text-green-600 dark:text-yellow-400" />
              Ride Recommendations Overview
            </h1>

            <div className="bg-white dark:bg-[#1A1D21] border border-gray-100 dark:border-gray-700 rounded-xl p-2 pl-3 flex items-center gap-2 w-full lg:w-[420px]">
              <input
                className="flex-1 bg-transparent outline-none text-sm placeholder-gray-400"
                placeholder="Enter Customer ID (e.g., CID1162119)"
                value={pendingId}
                onChange={(e) => setPendingId(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                onClick={handleSearch}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                <FaSearch />
                Search
              </button>
            </div>
          </div>

          {/* Customer context (hide when empty) */}
          {customerId ? (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Viewing profile for{" "}
              <span className="font-medium text-gray-700 dark:text-gray-200">
                {customerId}
              </span>
            </div>
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Enter a Customer ID above and click <strong>Search</strong>.
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="bg-white dark:bg-[#1A1D21] shadow rounded-xl p-6 text-center">
              <p className="text-gray-500 dark:text-gray-400">Loading profile data…</p>
            </div>
          )}

          {/* Empty-ID friendly prompt (no fetch attempted) */}
          {!loading && !error && !profile && !customerId && (
            <div className="bg-white dark:bg-[#1A1D21] shadow rounded-xl p-6 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                Please enter a valid <strong>Customer ID</strong> above and click <strong>Search</strong> to view recommendations.
              </p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="bg-white dark:bg-[#1A1D21] shadow rounded-xl p-6 text-center">
              <p className="text-red-500">{error}</p>
            </div>
          )}

          {/* Main content */}
          {!loading && !error && profile && (
            <>
              {/* KPI Summary */}
              <section>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-gray-800 dark:text-yellow-400">
                  <FaChartBar className="text-blue-600 dark:text-yellow-400" />
                  Key Ride Statistics
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card title="Total Bookings" value={profile.counts?.bookings ?? "—"} />
                  <Card title="Completed Rides" value={profile.counts?.completed ?? "—"} color="text-green-600" />
                  <Card
                    title="Avg Booking Value"
                    value={
                      profile.averages?.booking_value != null
                        ? `₹${fmt(profile.averages.booking_value, 2)}`
                        : "—"
                    }
                  />
                  <Card
                    title="Avg Distance"
                    value={
                      profile.averages?.ride_distance != null
                        ? `${fmt(profile.averages.ride_distance, 1)} km`
                        : "—"
                    }
                  />
                </div>
              </section>

              {/* Ratings */}
              <section>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-gray-800 dark:text-yellow-400">
                  <FaChartPie className="text-yellow-500 dark:text-yellow-400" />
                  Average Ratings
                </h2>
                <div className="bg-white dark:bg-[#1A1D21] shadow rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Driver Rating", value: profile.averages?.driver_ratings ?? 0 },
                          { name: "Customer Rating", value: profile.averages?.customer_rating ?? 0 },
                        ]}
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, value }) => `${name}: ${fmt(value, 1)}`}
                      >
                        {COLORS.map((c, i) => (
                          <Cell key={i} fill={c} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => fmt(v, 1)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </section>

              {/* Location Analytics */}
              <section>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-gray-800 dark:text-yellow-400">
                  <FaChartBar className="text-purple-600 dark:text-yellow-400" />
                  Location Analytics
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-[#1A1D21] shadow rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                    <h3 className="font-semibold mb-2">Top Pickup Locations</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <ReBarChart data={profile.preferences?.top_pickup_locations ?? []}>
                        <XAxis dataKey="pickup_location" />
                        <YAxis allowDecimals={false} />
                        <Tooltip formatter={(v) => fmt(v, 0)} />
                        <Bar dataKey="count" fill="#0088FE" />
                      </ReBarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white dark:bg-[#1A1D21] shadow rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                    <h3 className="font-semibold mb-2">Top Drop Locations</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <ReBarChart data={profile.preferences?.top_drop_locations ?? []}>
                        <XAxis dataKey="drop_location" />
                        <YAxis allowDecimals={false} />
                        <Tooltip formatter={(v) => fmt(v, 0)} />
                        <Bar dataKey="count" fill="#FF8042" />
                      </ReBarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </section>

              {/* Temporal Trends */}
              <section>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-gray-800 dark:text-yellow-400">
                  <FaChartBar className="text-indigo-600 dark:text-yellow-400" />
                  Temporal Ride Patterns
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-[#1A1D21] shadow rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                    <h3 className="font-semibold mb-2">Most Active Hours</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <ReBarChart data={profile.preferences?.top_hours ?? []}>
                        <XAxis dataKey="hour" />
                        <YAxis allowDecimals={false} />
                        <Tooltip formatter={(v) => fmt(v, 0)} />
                        <Bar dataKey="count" fill="#00C49F" />
                      </ReBarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white dark:bg-[#1A1D21] shadow rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                    <h3 className="font-semibold mb-2">Most Active Days</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <ReBarChart data={profile.preferences?.top_days ?? []}>
                        <XAxis dataKey="dayOfWeek" />
                        <YAxis allowDecimals={false} />
                        <Tooltip formatter={(v) => fmt(v, 0)} />
                        <Bar dataKey="count" fill="#AA46BE" />
                      </ReBarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </section>

              {/* Summary */}
              <section>
                <div className="bg-white dark:bg-[#1A1D21] shadow rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                  <h2 className="text-2xl font-semibold mb-2 text-gray-800 dark:text-yellow-400">
                    Summary Insights
                  </h2>
                  <p><strong>Most Used Vehicle:</strong> {profile.preferences?.most_used_vehicle_type ?? "—"}</p>
                  <p><strong>Most Used Payment Method:</strong> {profile.preferences?.most_used_payment_method ?? "—"}</p>
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
