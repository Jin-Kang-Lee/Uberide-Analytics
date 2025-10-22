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
  LabelList,
} from "recharts";
import { FaUsers, FaDollarSign, FaStar, FaChartLine } from "react-icons/fa";

export default function CustomerInsights() {
  const [summary, setSummary] = useState({});
  const [topCustomers, setTopCustomers] = useState([]);
  const [frequency, setFrequency] = useState([]);
  const [growth, setGrowth] = useState([]);
  const [ratingsVsSpend, setRatingsVsSpend] = useState([]);
  const [activeStatus, setActiveStatus] = useState([]); // 🆕
  const [rideType, setRideType] = useState([]);         // 🆕
  const [peakHours, setPeakHours] = useState([]);       // 🆕
  const [error, setError] = useState("");

  useEffect(() => {
    const endpoints = [
      "/api/customer-summary",
      "/api/top-customers",
      "/api/customer-frequency",
      "/api/customer-growth",
      "/api/customer-ratings-spending",
      "/api/customer-active-status",  // 🆕
      "/api/ride-type-popularity",    // 🆕
      "/api/peak-booking-hours",      // 🆕
    ];

    Promise.all(endpoints.map((url) => axios.get(`http://localhost:5000${url}`)))
      .then(([s, t, f, g, r, a, rt, ph]) => {
        setSummary(s.data);
        setTopCustomers(t.data);
        setFrequency(f.data);
        setGrowth(g.data);
        setRatingsVsSpend(r.data);
        setActiveStatus(a.data);
        setRideType(rt.data);
        setPeakHours(ph.data);
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

        <main className="p-6 space-y-10 overflow-y-auto">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FaUsers className="text-blue-500 dark:text-yellow-400" />
            Customer Insights
          </h1>

          {error && <p className="text-red-500">{error}</p>}

          {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Customers */}
          <div className="p-5 bg-white dark:bg-[#181A20] rounded-2xl shadow flex items-center justify-between border border-gray-200 dark:border-gray-700">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Customers</p>
              <h2 className="text-2xl font-bold">{summary.total_customers || 0}</h2>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 p-3 rounded-full">
              <FaUsers className="text-xl" />
            </div>
          </div>

          {/* Avg Rating */}
          <div className="p-5 bg-white dark:bg-[#181A20] rounded-2xl shadow flex items-center justify-between border border-gray-200 dark:border-gray-700">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Avg Rating</p>
              <h2 className="text-2xl font-bold">{summary.avg_customer_rating || "-"}</h2>
            </div>
            <div className="bg-yellow-100 dark:bg-yellow-900/40 text-yellow-500 dark:text-yellow-400 p-3 rounded-full">
              <FaStar className="text-xl" />
            </div>
          </div>

          {/* Avg Spending */}
          <div className="p-5 bg-white dark:bg-[#181A20] rounded-2xl shadow flex items-center justify-between border border-gray-200 dark:border-gray-700">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Avg Spending</p>
              <h2 className="text-2xl font-bold">${summary.avg_spending_per_customer || 0}</h2>
            </div>
            <div className="bg-green-100 dark:bg-green-900/40 text-green-500 dark:text-green-400 p-3 rounded-full">
              <FaDollarSign className="text-xl" />
            </div>
          </div>

          {/* Top Spender */}
          <div className="p-5 bg-white dark:bg-[#181A20] rounded-2xl shadow flex items-center justify-between border border-gray-200 dark:border-gray-700">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Top Spender</p>
              <h2 className="text-2xl font-bold">{summary.top_customer_id || "N/A"}</h2>
            </div>
            <div className="bg-amber-100 dark:bg-amber-900/40 text-amber-500 dark:text-amber-400 p-3 rounded-full">
              <FaChartLine className="text-xl" />
            </div>
          </div>
        </div>

          {/* === ROW 1: Spending & Frequency === */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top Customers */}
            <section className="bg-white dark:bg-[#181A20] rounded-2xl shadow p-4">
              <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <FaDollarSign className="text-green-500" />
                Top 10 Highest Paying Customers
              </h2>
              {topCustomers.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topCustomers}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="customer_id" angle={-30} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} />
                    <Bar dataKey="total_spent" fill="url(#colorSpend)" radius={[5, 5 ,0 ,0]}>
                      <LabelList dataKey="total_spent" position="top" formatter={(v) => `₹${v}`} />
                    </Bar>
                    <defs>
                      <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#076c0afe" stopOpacity={0.9} />
                        <stop offset="95%" stopColor="#1aa62dff" stopOpacity={0.7} />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-400 text-sm">No customer data available</p>
              )}
            </section>

            {/* Ride Frequency */}
            <section className="bg-white dark:bg-[#181A20] rounded-2xl shadow p-4 border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <FaChartLine className="text-purple-500" />
                Ride Frequency Distribution
              </h2>

              {frequency.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={frequency}
                      dataKey="num_customers"
                      nameKey="ride_bracket"
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={120}
                      paddingAngle={3}
                      minAngle={3} 
                      labelLine={false}
                      label={({ name, value, percent }) =>
                        `${name}: ${value} (${(percent * 100).toFixed(4)}%)`
                      }
                    >
                      {frequency.map((_, i) => (
                        <Cell
                          key={i}
                          fill={["#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#ec4899"][i % 5]}
                          stroke="#fff"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>

                    <Tooltip
                      formatter={(v) => `${v.toLocaleString()} customers`}
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                        color: "#111827",
                      }}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-400 text-sm text-center">No ride frequency data available.</p>
              )}
            </section>

          </div>

          {/* === ROW 2: Activity & Ride Type === */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Active vs Inactive */}
            <section className="bg-white dark:bg-[#181A20] rounded-2xl shadow p-4 border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <FaChartLine className="text-amber-500" />
                Active vs Inactive Customers
              </h2>

              {activeStatus.data && activeStatus.data.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <Pie
                        data={activeStatus.data}
                        dataKey="num_customers"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={120}
                        paddingAngle={3}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(1)}%`
                        }
                      >
                        {activeStatus.data.map((entry, i) => (
                          <Cell
                            key={i}
                            fill={entry.status === "Active" ? "#17c389ff" : "#b55858ff"}
                            stroke="#fff"
                            strokeWidth={1}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => `${v} customers`} />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* 🟡 Threshold label */}
                  <p className="text-center text-sm text-gray-500 mt-2 italic">
                    Threshold:{" "}
                    <span className="font-semibold">1 Year (365 Days)</span> since last booking
                  </p>
                </>
              ) : (
                <p className="text-gray-400 text-sm text-center">
                  No active/inactive data available.
                </p>
              )}
            </section>




            {/* Ride Type Popularity */}
            <section className="bg-white dark:bg-[#181A20] rounded-2xl shadow p-4 border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <FaChartLine className="text-indigo-500" />
                Ride Type Popularity
              </h2>

              {rideType.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart
                    data={rideType}
                    margin={{ top: 30, right: 30, left: 0, bottom: 5 }}
                    barCategoryGap="20%"
                  >
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />

                    <XAxis
                      dataKey="ride_type"
                      tick={{ fill: "#6b7280", fontSize: 12 }}
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                      height={60}
                    />

                    <YAxis
                      tick={{ fill: "#6b7280", fontSize: 12 }}
                      tickFormatter={(v) => v.toLocaleString()}
                    />

                    <Tooltip
                      formatter={(v) => [`${v.toLocaleString()} rides`, "Total Rides"]}
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                        color: "#111827",
                      }}
                    />

                    <Bar
                      dataKey="rides"
                      name="Total Rides"
                      fill="#425575ff"
                      radius={[6, 6, 0, 0]} // rounded top corners
                      maxBarSize={60}
                    >
                      <LabelList
                        dataKey="rides"
                        position="top"
                        formatter={(v) => v.toLocaleString()}
                        style={{ fill: "#111827", fontSize: 12, fontWeight: 500 }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-400 text-sm text-center">No ride type data available.</p>
              )}
            </section>

          </div>

          {/* === ROW 3: Growth, Peak Hours, Ratings === */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Customer Growth */}
            <section className="bg-white dark:bg-[#181A20] rounded-2xl shadow p-4">
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
                  <Line type="monotone" dataKey="new_customers" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </section>

            {/* Peak Booking Hours */}
<section className="bg-white dark:bg-[#181A20] rounded-2xl shadow p-4 border border-gray-200 dark:border-gray-700">
  <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
    <FaChartLine className="text-cyan-500" />
    Peak Booking Hours
  </h2>

  {Array.isArray(peakHours) && peakHours.length > 0 ? (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart
        data={peakHours}
        margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
      >
        {/* 🌅 Define the sunlight → sunset → moonlight gradient */}
        <defs>
          <linearGradient id="sunMoonGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#a978dcff" />       
            <stop offset="35%" stopColor="#d0954cd0" />      
            <stop offset="70%" stopColor="#e1cd84f3" />      
            <stop offset="100%" stopColor="#345895ff" />     
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="5 5" opacity={0.5} />

        {/* Time (X-Axis) */}
        <XAxis
          dataKey="hour"
          tickFormatter={(h) =>
            h === "0000" ? " 0000" : h === "2300" ? "2300 " : h
          }
          tick={{ fontSize: 12, fill: "#888" }}
          label={{
            value: "Time of Day (24H Format)",
            position: "insideBottom",
            offset: -5,
            style: { fill: "#888", fontSize: 12 },
          }}
        />

        {/* Number of Bookings (Y-Axis) */}
        <YAxis
          tick={{ fontSize: 12, fill: "#888" }}
          label={{
            value: "Number of Bookings",
            angle: -90,
            position: "insideLeft",
            style: { fill: "#888", fontSize: 12 },
          }}
        />

        {/* Tooltip */}
        <Tooltip
          contentStyle={{
            backgroundColor: "#ffffffee",
            borderRadius: "8px",
            border: "1px solid #ddd",
          }}
          labelFormatter={(h) => `Hour: ${h}`}
          formatter={(v) => [
            `${v?.toLocaleString?.() ?? v} rides`,
            "Bookings",
          ]}
        />

        {/* Line (with fallback for backend key) */}
        <Line
          type="monotone"
          dataKey={
            peakHours[0]?.total_rides
              ? "total_rides"
              : peakHours[0]?.total_bookings
              ? "total_bookings"
              : Object.keys(peakHours[0])[1] // auto-detect fallback key
          }
          stroke="url(#sunMoonGradient)"
          strokeWidth={3}
          dot={{ r: 2, stroke: "#fff", strokeWidth: 0 }}
          activeDot={{ r: 6, fill: "#FFD93D", stroke: "#fff" }}
        />
      </LineChart>
    </ResponsiveContainer>
  ) : (
    <p className="text-gray-400 text-sm text-center">
      No hourly data available.
    </p>
  )}
</section>


          </div>

          {/* Ratings vs Spending
          <section className="bg-white dark:bg-[#181A20] rounded-2xl shadow p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FaStar className="text-yellow-400" />
              Ratings vs Total Spending
            </h2>
            {ratingsVsSpend.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <ScatterChart margin={{ top: 20, right: 40, bottom: 40, left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis
                    type="number"
                    dataKey="total_spent"
                    name="Total Spent"
                    tickFormatter={(v) => `$${v.toLocaleString()}`}
                    label={{ value: "Total Spending ($)", position: "bottom", offset: 10 }}
                  />
                  <YAxis
                    type="number"
                    dataKey="avg_rating"
                    name="Avg Rating"
                    domain={[0, 5]}
                    label={{ value: "Average Rating", angle: -90, position: "left" }}
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    isAnimationActive={false}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const point = payload[0].payload;
                        const totalSpent = Number(point.total_spent) || 0;
                        const avgRating = Number(point.avg_rating) || 0;
                        return (
                          <div
                            style={{
                              backgroundColor: "#fff",
                              color: "#000",
                              padding: "8px 12px",
                              borderRadius: "8px",
                              boxShadow: "0 0 8px rgba(0,0,0,0.2)",
                            }}
                          >
                            <p>Total Spending: ${totalSpent.toLocaleString()}</p>
                            <p>Average Rating: {avgRating.toFixed(2)} ★</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter data={ratingsVsSpend} fill="#facc15" r={6} opacity={0.8} />
                </ScatterChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-sm text-center">
                No ratings vs spending data available.
              </p>
            )}
          </section> */}
        </main>
      </div>
    </div>
  );
}
