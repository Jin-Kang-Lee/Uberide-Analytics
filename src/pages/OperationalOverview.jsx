// src/pages/OperationalOverview.jsx
import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import StatsCard from "../components/StatsCard";
import {
  fetchMongoSummary,
  fetchTimeHeatmap,
  fetchHourlyTimeSeries,
  fetchProblemZones,
  fetchVehicleMetrics,
  fetchTopCustomers,
} from "../services/mongoAPI";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, BarChart, Bar, ReferenceLine
} from "recharts";

function HeatCell({ value, max }) {
  const pct = max ? value / max : 0;
  const bg = `rgba(37,99,235,${0.1 + pct * 0.9})`;
  return (
    <div
      className="h-8 text-xs flex items-center justify-center rounded"
      style={{ background: bg }}
    >
      {value ?? 0}
    </div>
  );
}

export default function OperationalOverview() {
  const [kpi, setKpi] = useState(null);
  const [heat, setHeat] = useState([]);
  const [hourly, setHourly] = useState([]);
  const [locProblems, setLocProblems] = useState([]);
  const [fleet, setFleet] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [k, hmap, hseries, probLoc, vMetrics, topCust] = await Promise.all([
          fetchMongoSummary(),
          fetchTimeHeatmap(),
          fetchHourlyTimeSeries(),
          fetchProblemZones(),
          fetchVehicleMetrics(),
          fetchTopCustomers(),
        ]);
        setKpi(k || null);
        setHeat(hmap || []);
        setHourly(hseries || []);
        setLocProblems(probLoc || []);
        setFleet(vMetrics || []);
        setCustomers(topCust || []);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const pct = (x) => (x == null ? "—" : `${(x * 100).toFixed(1)}%`);
  const pctFmt = (x) => `${(x * 100).toFixed(1)}%`;
  const num = (x) => (x == null ? "—" : Number(x).toLocaleString());
  const two = (x) => (x == null ? "—" : Number(x).toFixed(2));

  const maxBookings = useMemo(
    () => Math.max(0, ...heat.map((d) => Number(d.bookings || 0))),
    [heat]
  );

  const matrix = useMemo(() => {
    const m = Array.from({ length: 7 }, () =>
      Array.from({ length: 24 }, () => 0)
    );
    heat.forEach(({ dow, hour, bookings }) => {
      if (dow >= 0 && dow <= 6 && hour >= 0 && hour <= 23)
        m[dow][hour] = Number(bookings || 0);
    });
    return m;
  }, [heat]);

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Average the series per hour (reduce noise; clearer patterns)
  const hourAgg = useMemo(() => {
    const buckets = Array.from({ length: 24 }, () => ({
      hour: 0,
      n: 0,
      completion_rate: 0,
      cancellation_rate: 0,
      avg_vtat: 0,
      avg_ctat: 0,
    }));
    (hourly || []).forEach((r) => {
      const h = Number(r.hour);
      if (h >= 0 && h <= 23) {
        buckets[h].hour = h;
        buckets[h].n += 1;
        buckets[h].completion_rate += Number(r.completion_rate ?? 0);
        buckets[h].cancellation_rate += Number(r.cancellation_rate ?? 0);
        buckets[h].avg_vtat += Number(r.avg_vtat ?? 0);
        buckets[h].avg_ctat += Number(r.avg_ctat ?? 0);
      }
    });
    return buckets.map((b) =>
      b.n
        ? {
            hour: b.hour,
            completion_rate: b.completion_rate / b.n,
            cancellation_rate: b.cancellation_rate / b.n,
            avg_vtat: b.avg_vtat / b.n,
            avg_ctat: b.avg_ctat / b.n,
          }
        : { hour: b.hour, completion_rate: 0, cancellation_rate: 0, avg_vtat: 0, avg_ctat: 0 }
    );
  }, [hourly]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (err) return <div className="p-6 text-red-600">Error: {err}</div>;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1">
        <Navbar title="Operational Overview" />

        {/* 1) Executive Summary KPIs */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatsCard title="Total Rides" value={num(kpi?.total_rides)} />
          <StatsCard title="Completion Rate" value={pct(kpi?.completion_rate)} />
          <StatsCard title="No-Driver Rate" value={pct(kpi?.no_driver_rate)} />
          <StatsCard title="Avg VTAT (min)" value={two(kpi?.avg_vtat)} />
          <StatsCard title="Avg CTAT (min)" value={two(kpi?.avg_ctat)} />
          <StatsCard title="Avg Customer Rating" value={two(kpi?.avg_customer_rating)} />
        </div>

        {/* 2) Left/Right columns */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT: Reliability & Time */}
          <div className="space-y-6">
            {/* 2A) Heatmap */}
            <div className="bg-white rounded-2xl shadow p-4">
              <h3 className="text-lg font-semibold mb-2">Weekly Heatmap (Bookings)</h3>
              <div className="overflow-x-auto">
                <div
                  className="grid"
                  style={{
                    gridTemplateColumns: `100px repeat(24, minmax(32px, 1fr))`,
                    gap: 6,
                  }}
                >
                  <div></div>
                  {Array.from({ length: 24 }, (_, h) => (
                    <div key={h} className="text-center text-xs text-gray-500">
                      {h}
                    </div>
                  ))}
                  {matrix.map((row, d) => (
                    <React.Fragment key={d}>
                      <div className="text-xs text-gray-600 flex items-center">
                        {dayNames[d]}
                      </div>
                      {row.map((val, h) => (
                        <HeatCell key={`${d}-${h}`} value={val} max={maxBookings} />
                      ))}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>

            {/* 2B) Completion & Cancellation with target line */}
            <div className="bg-white rounded-2xl shadow p-4">
              <h3 className="text-lg font-semibold mb-2">Hourly Completion & Cancellation</h3>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={hourAgg}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} domain={[0, 1]} />
                  <Tooltip formatter={(v, name) => name.includes("Rate") ? pctFmt(v) : v} />
                  <Legend />
                  <Line type="monotone" dataKey="completion_rate" name="Completion Rate" dot={false} />
                  <Line type="monotone" dataKey="cancellation_rate" name="Cancellation Rate" dot={false} />
                  <ReferenceLine y={0.9} stroke="#22c55e" strokeDasharray="4 4" label={{ value: "Target 90%", position: "left" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* 2C) VTAT / CTAT with SLA line */}
            <div className="bg-white rounded-2xl shadow p-4">
              <h3 className="text-lg font-semibold mb-2">Hourly VTAT / CTAT (min)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={hourAgg}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis unit=" min" />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="avg_vtat" name="Avg VTAT" dot={false} />
                  <Line type="monotone" dataKey="avg_ctat" name="Avg CTAT" dot={false} />
                  <ReferenceLine y={15} stroke="#ef4444" strokeDasharray="4 4" label={{ value: "Max 15 min", position: "left" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* RIGHT: Locations & Fleet */}
          <div className="space-y-6">
            {/* 3) Problem Zones Top-5 with action */}
            <div className="bg-white rounded-2xl shadow p-4">
              <h3 className="text-lg font-semibold mb-2">Problem Zones (Top 5)</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th className="py-2 pr-4">Pickup Location</th>
                      <th className="py-2 pr-4">Completion</th>
                      <th className="py-2 pr-4">Avg CTAT (min)</th>
                      <th className="py-2 pr-4">Avg Rating</th>
                      <th className="py-2 pr-4">Suggested Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {locProblems.slice(0, 5).map((z, i) => {
                      const lowCompletion = (z.completion_rate ?? 1) < 0.9;
                      const slowCTAT = (z.avg_ctat ?? 0) > 15;
                      const lowRating = (z.avg_customer_rating ?? 5) < 4.5;

                      let action = "Monitor";
                      if (lowCompletion) {
                        action = "Boost supply 7–9am; targeted driver incentive";
                      } else if (slowCTAT) {
                        action = "Tighten dispatch radius or staging";
                      } else if (lowRating) {
                        action = "Customer recovery offers / QA coaching";
                      }

                      return (
                        <tr key={i} className="border-t">
                          <td className="py-2 pr-4">{z.pickup_location}</td>
                          <td className="py-2 pr-4">
                            {(Number(z.completion_rate || 0) * 100).toFixed(1)}%
                          </td>
                          <td className="py-2 pr-4">{Number(z.avg_ctat ?? 0).toFixed(2)}</td>
                          <td className="py-2 pr-4">{Number(z.avg_customer_rating ?? 0).toFixed(2)}</td>
                          <td className="py-2 pr-4 text-xs text-gray-600">{action}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Tip: schedule 7–9am incentives for highlighted zones.
              </div>
            </div>

            {/* 4) Fleet small multiples */}
            <div className="bg-white rounded-2xl shadow p-4">
              <h3 className="text-lg font-semibold mb-3">Fleet Performance</h3>

              {/* Utilization (Rides) */}
              <div className="mb-6">
                <h4 className="font-medium mb-1">Utilization (Rides)</h4>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={fleet}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="vehicle_type" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="bookings" name="Rides" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Reliability (Completion %) */}
              <div className="mb-6">
                <h4 className="font-medium mb-1">Reliability (Completion %)</h4>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={fleet}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="vehicle_type" />
                    <YAxis tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} domain={[0, 1]} />
                    <Tooltip formatter={(v) => pctFmt(v)} />
                    <ReferenceLine y={0.9} stroke="#22c55e" strokeDasharray="4 4" />
                    <Bar dataKey="completion_rate" name="Completion %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Speed (VTAT / CTAT) */}
              <div className="mb-6">
                <h4 className="font-medium mb-1">Speed (min)</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={fleet}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="vehicle_type" />
                    <YAxis unit=" min" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="avg_vtat" name="Avg VTAT" />
                    <Bar dataKey="avg_ctat" name="Avg CTAT" />
                    <ReferenceLine y={15} stroke="#ef4444" strokeDasharray="4 4" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Experience (Avg Rating) */}
              <div>
                <h4 className="font-medium mb-1">Experience (Avg Rating)</h4>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={fleet}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="vehicle_type" />
                    <YAxis domain={[0, 5]} />
                    <Tooltip />
                    <Bar dataKey="avg_customer_rating" name="Avg Rating" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Lower row: Customers */}
        <div className="p-6">
          <div className="bg-white rounded-2xl shadow p-4">
            <h3 className="text-lg font-semibold mb-2">Top Customers</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="py-2 pr-4">Customer</th>
                    <th className="py-2 pr-4">Rides</th>
                    <th className="py-2 pr-4">Avg Booking Value</th>
                    <th className="py-2 pr-4">Avg Rating</th>
                    <th className="py-2 pr-4">Preferred Vehicle</th>
                    <th className="py-2 pr-4">Recommended Action</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.slice(0, 20).map((r, i) => {
                    const rides = Number(r.rides || 0);
                    const val = Number(r.avg_booking_value || 0);
                    const rate = Number(r.avg_customer_rating || 0);
                    const veh = r.preferred_vehicle_type || "—";
                    const action =
                      rides >= 5 || val >= 500
                        ? "Loyalty reward / VIP tier"
                        : rate < 4.2
                        ? "Recovery voucher; feedback follow-up"
                        : `Promo on ${veh}`;
                    return (
                      <tr key={i} className="border-t">
                        <td className="py-2 pr-4">{r.customer_id}</td>
                        <td className="py-2 pr-4">{rides.toLocaleString()}</td>
                        <td className="py-2 pr-4">{val.toFixed(2)}</td>
                        <td className="py-2 pr-4">{rate.toFixed(2)}</td>
                        <td className="py-2 pr-4">{veh}</td>
                        <td className="py-2 pr-4 text-xs text-gray-600">{action}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Use high-ride cohorts for loyalty; match promos to preferred vehicle types.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
