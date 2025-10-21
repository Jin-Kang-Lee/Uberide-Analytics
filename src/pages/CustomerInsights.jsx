import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from "recharts";
import { FaUsers, FaDollarSign, FaStar, FaChartLine } from "react-icons/fa";

export default function CustomerInsights() {
  const [summary, setSummary] = useState({});
  const [topCustomers, setTopCustomers] = useState([]);
  const [frequency, setFrequency] = useState([]);
  const [growth, setGrowth] = useState([]);
  const [ratingsVsSpend, setRatingsVsSpend] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const endpoints = [
      { key: "summary", url: "/api/customer-summary" },
      { key: "topCustomers", url: "/api/top-customers" },
      { key: "frequency", url: "/api/customer-frequency" },
      { key: "growth", url: "/api/customer-growth" },
      { key: "ratingsVsSpend", url: "/api/customer-ratings-spending" },
    ];

    Promise.all(endpoints.map((ep) => axios.get(`http://localhost:5000${ep.url}`)))
      .then(([s, t, f, g, r]) => {
        setSummary(s.data);
        setTopCustomers(t.data);
        setFrequency(f.data);
        setGrowth(g.data);
        setRatingsVsSpend(r.data);
      })
      .catch(() => setError("Failed to load Customer Insights"));
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0B0E11] text-gray-800 dark:text-gray-200">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <Navbar />

        <main className="p-6 space-y-8 overflow-y-auto">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FaUsers className="text-blue-500 dark:text-yellow-400" />
            Customer Insights
          </h1>

          {error && <p className="text-red-500">{error}</p>}

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-4 bg-white dark:bg-[#181A20] rounded-2xl shadow">
              <p>Total Customers</p>
              <h2 className="text-xl font-bold">{summary.total_customers || 0}</h2>
            </div>
            <div className="p-4 bg-white dark:bg-[#181A20] rounded-2xl shadow">
              <p>Avg Rating</p>
              <h2 className="text-xl font-bold">
                {summary.avg_customer_rating || "-"}
              </h2>
            </div>
            <div className="p-4 bg-white dark:bg-[#181A20] rounded-2xl shadow">
              <p>Avg Spending</p>
              <h2 className="text-xl font-bold">
                ${summary.avg_spending_per_customer || 0}
              </h2>
            </div>
            <div className="p-4 bg-white dark:bg-[#181A20] rounded-2xl shadow">
              <p>Top Spender</p>
              <h2 className="text-xl font-bold">
                {summary.top_customer_id || "N/A"}
              </h2>
            </div>
          </div>

         {/* Top Customers */}
          <section>
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <FaDollarSign className="text-green-500" />
              Top 10 Customers by Spend
            </h2>
            {topCustomers.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topCustomers}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="customer_id" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total_spent" fill="#60a5fa" name="Total Spent ($)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-sm">No customer data available</p>
            )}
          </section>


          {/* Ride Frequency */}
          <section>
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <FaChartLine className="text-purple-500" />
              Ride Frequency Distribution
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={frequency}
                  dataKey="num_customers"
                  nameKey="ride_bracket"
                  outerRadius={120}
                  label
                >
                  {frequency.map((_, i) => (
                    <Cell
                      key={i}
                      fill={["#60a5fa", "#34d399", "#fbbf24", "#f87171"][i % 4]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </section>

          {/* Customer Growth */}
          <section>
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <FaChartLine className="text-emerald-500" />
              Monthly Customer Growth
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={growth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="first_ride_month" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="new_customers"
                  stroke="#10b981"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </section>

          {/* Ratings vs Spending */}
          <section>
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <FaStar className="text-yellow-400" />
              Ratings vs Total Spending
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart>
                <CartesianGrid />
                <XAxis dataKey="total_spent" name="Total Spent" />
                <YAxis dataKey="avg_rating" name="Avg Rating" />
                <Tooltip />
                <Scatter data={ratingsVsSpend} fill="#facc15" />
              </ScatterChart>
            </ResponsiveContainer>
          </section>
        </main>
      </div>
    </div>
  );
}
