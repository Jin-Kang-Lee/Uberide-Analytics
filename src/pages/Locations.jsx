import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { fetchTopLocations, fetchProblemZones } from "../services/mongoAPI";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

export default function Locations() {
  const [top, setTop] = useState([]);
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [a, b] = await Promise.all([fetchTopLocations(), fetchProblemZones()]);
        setTop(a || []);
        setProblems(b || []);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const top10 = useMemo(() => (top || []).slice(0, 10), [top]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (err) return <div className="p-6 text-red-600">Error: {err}</div>;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1">
        <Navbar title="Zone Performance" />
        <div className="p-6 space-y-8">

          {/* Top 10 by rides */}
          <div className="bg-white rounded-2xl shadow p-4">
            <h3 className="text-lg font-semibold mb-2">Top Pickup Locations by Rides</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={top10}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="pickup_location" tick={{ fontSize: 12 }} interval={0} angle={-20} height={60} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="bookings" name="Rides" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Completion rate & speed & rating (bars) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl shadow p-4">
              <h3 className="text-base font-semibold mb-2">Completion Rate</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={[...top].sort((a,b) => (a.completion_rate ?? 0) - (b.completion_rate ?? 0)).slice(0,10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="pickup_location" tick={{ fontSize: 11 }} interval={0} angle={-20} height={60} />
                  <YAxis />
                  <Tooltip formatter={(v) => `${(v * 100).toFixed(1)}%`} />
                  <Bar dataKey="completion_rate" name="Completion" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-2xl shadow p-4">
              <h3 className="text-base font-semibold mb-2">Avg VTAT / CTAT (min)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={top10}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="pickup_location" tick={{ fontSize: 11 }} interval={0} angle={-20} height={60} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="avg_vtat" name="VTAT" />
                  <Bar dataKey="avg_ctat" name="CTAT" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-2xl shadow p-4">
              <h3 className="text-base font-semibold mb-2">Avg Customer Rating</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={top10}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="pickup_location" tick={{ fontSize: 11 }} interval={0} angle={-20} height={60} />
                  <YAxis domain={[0,5]} />
                  <Tooltip />
                  <Bar dataKey="avg_customer_rating" name="Rating" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Problem Zones */}
          <div className="bg-white rounded-2xl shadow p-4">
            <h3 className="text-lg font-semibold mb-3">Problem Zones</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="py-2 pr-4">Pickup Location</th>
                    <th className="py-2 pr-4">Completion</th>
                    <th className="py-2 pr-4">Avg CTAT (min)</th>
                    <th className="py-2 pr-4">Avg Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {problems.map((z, i) => (
                    <tr key={i} className="border-t">
                      <td className="py-2 pr-4">{z.pickup_location}</td>
                      <td className="py-2 pr-4">{(z.completion_rate * 100).toFixed(1)}%</td>
                      <td className="py-2 pr-4">{Number(z.avg_ctat ?? 0).toFixed(2)}</td>
                      <td className="py-2 pr-4">{Number(z.avg_customer_rating ?? 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Stub for action */}
            <div className="mt-3 text-xs text-gray-500">
              Tip: Use these to schedule targeted 7–9am incentives.
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
