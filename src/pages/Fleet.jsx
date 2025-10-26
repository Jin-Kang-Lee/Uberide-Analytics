import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { fetchVehicleMetrics } from "../services/mongoAPI";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

export default function Fleet() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const d = await fetchVehicleMetrics();
        setData(d || []);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="p-6">Loading…</div>;
  if (err) return <div className="p-6 text-red-600">Error: {err}</div>;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1">
        <Navbar title="Fleet Performance" />
        <div className="p-6 space-y-8">
          <div className="bg-white rounded-2xl shadow p-4">
            <h3 className="text-lg font-semibold mb-2">Utilization, Reliability & Experience by Vehicle Type</h3>
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="vehicle_type" />
                <YAxis />
                <Tooltip formatter={(v, n) => n === "Completion Rate" ? `${(v * 100).toFixed(1)}%` : v} />
                <Legend />
                <Bar dataKey="bookings" name="Rides" />
                <Bar dataKey="completion_rate" name="Completion Rate" />
                <Bar dataKey="avg_vtat" name="Avg VTAT" />
                <Bar dataKey="avg_ctat" name="Avg CTAT" />
                <Bar dataKey="avg_customer_rating" name="Avg Rating" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
