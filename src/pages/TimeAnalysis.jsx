import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import {
  fetchTimeHeatmap,
  fetchHourlyTimeSeries,
} from "../services/mongoAPI";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

// Simple heat cell
function HeatCell({ value, max }) {
  const pct = max ? value / max : 0;
  const bg = `rgba(37, 99, 235, ${0.1 + pct * 0.9})`; // blue with intensity
  return (
    <div className="h-8 text-xs flex items-center justify-center rounded" style={{ background: bg }}>
      {value?.toLocaleString?.() ?? "0"}
    </div>
  );
}

export default function TimeAnalysis() {
  const [heat, setHeat] = useState([]);
  const [hourly, setHourly] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [h, t] = await Promise.all([fetchTimeHeatmap(), fetchHourlyTimeSeries()]);
        setHeat(h || []);
        setHourly(t || []);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const maxBookings = useMemo(() => Math.max(0, ...heat.map(d => Number(d.bookings || 0))), [heat]);

  // Build matrix [dow(0..6)] x [hour(0..23)]
  const matrix = useMemo(() => {
    const m = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
    heat.forEach(({ dow, hour, bookings }) => {
      if (dow >= 0 && dow <= 6 && hour >= 0 && hour <= 23) {
        m[dow][hour] = Number(bookings || 0);
      }
    });
    return m;
  }, [heat]);

  const dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  if (loading) return <div className="p-6">Loading…</div>;
  if (err) return <div className="p-6 text-red-600">Error: {err}</div>;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1">
        <Navbar title="Reliability & Demand by Time" />
        <div className="p-6 space-y-8">

          {/* Heatmap */}
          <div className="bg-white rounded-2xl shadow p-4">
            <h3 className="text-lg font-semibold mb-2">Weekly Heatmap (Bookings)</h3>
            <div className="overflow-x-auto">
              <div className="grid" style={{ gridTemplateColumns: `100px repeat(24, minmax(32px, 1fr))`, gap: 6 }}>
                {/* Header row */}
                <div></div>
                {Array.from({ length: 24 }, (_, h) => <div key={h} className="text-center text-xs text-gray-500">{h}</div>)}
                {/* Rows */}
                {matrix.map((row, d) => (
                  <React.Fragment key={d}>
                    <div className="text-xs text-gray-600 flex items-center">{dayNames[d]}</div>
                    {row.map((val, h) => (
                      <HeatCell key={`${d}-${h}`} value={val} max={maxBookings} />
                    ))}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          {/* Lines: completion, cancellation */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow p-4">
              <h3 className="text-lg font-semibold mb-2">Hourly Completion & Cancellation</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={hourly}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip formatter={(v, name) => name.includes("rate") ? `${(v * 100).toFixed(1)}%` : v} />
                  <Legend />
                  <Line type="monotone" dataKey="completion_rate" name="Completion Rate" dot={false} />
                  <Line type="monotone" dataKey="cancellation_rate" name="Cancellation Rate" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Lines: VTAT / CTAT */}
            <div className="bg-white rounded-2xl shadow p-4">
              <h3 className="text-lg font-semibold mb-2">Hourly VTAT / CTAT (min)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={hourly}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="avg_vtat" name="Avg VTAT" dot={false} />
                  <Line type="monotone" dataKey="avg_ctat" name="Avg CTAT" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="text-sm text-gray-500">
            Use the darkest heatmap cells and high cancellation/low completion hours to schedule incentives and surge. Target CTAT ≤ 15 min.
          </div>
        </div>
      </div>
    </div>
  );
}
