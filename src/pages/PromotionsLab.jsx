import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { ClipboardList, BadgePercent, Info } from "lucide-react";


export default function PromotionsLab() {
  const [customerId, setCustomerId] = useState("");
  const [vehicleType, setVehicleType] = useState("Bike");
  const [hour, setHour] = useState(18);
  const [dayOfWeek, setDayOfWeek] = useState("Sunday");
  const [snapshot, setSnapshot] = useState(null);
  const [decision, setDecision] = useState(null);
  const [err, setErr] = useState("");
  const [eligibility, setEligibility] = useState(null);

  // Automatically load eligibility facets when page opens
  useEffect(() => {
    const fetchEligibility = async () => {
      try {
        const base = `http://localhost:5002/api/mongo/promotions/eligibility-facets?hour=${Number(
          hour
        )}&day=${encodeURIComponent(dayOfWeek)}&vehicle=${encodeURIComponent(
          vehicleType
        )}`;

        const r = await fetch(base);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = await r.json();
        setEligibility(data);
      } catch (e) {
        setErr(`Failed to load eligibility facets: ${e.message}`);
      }
    };

    fetchEligibility();
  }, []); // runs once when page loads

  const loadSnapshot = async () => {
    setErr("");
    setSnapshot(null);
    setDecision(null);
    if (!customerId.trim()) {
      setErr("Enter a Customer ID first");
      return;
    }
    try {
      const res = await fetch(
        `http://localhost:5002/api/mongo/customers/${encodeURIComponent(
          customerId
        )}/snapshot`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSnapshot(await res.json());
    } catch (e) {
      setErr(`Failed to load snapshot: ${e.message}`);
    }
  };

  const getDecision = async () => {
    setErr("");
    setDecision(null);
    try {
      const res = await fetch(`http://localhost:5002/api/mongo/decide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          vehicleType,
          hour: Number(hour),
          dayOfWeek,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setDecision(await res.json());
    } catch (e) {
      setErr(`Failed to get decision: ${e.message}`);
    }
  };

  // tiny internal component to render the three facet cards
function EligibilityCards({ data, context }) {
  if (!data) return null;

  const bands = Array.isArray(data.suggestedBand) ? data.suggestedBand : [];
  const byRating = Array.isArray(data.byRating) ? data.byRating : [];
  const byRide = Array.isArray(data.byRideCount) ? data.byRideCount : [];

  const totalEligible = bands.reduce((s, b) => s + (b.customers || 0), 0);
  const pct = (n) =>
    totalEligible ? ((n / totalEligible) * 100).toFixed(1) + "%" : "0%";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
      {/* Suggested Bands */}
      <div className="bg-gradient-to-b from-green-50 to-white dark:from-[#111318] dark:to-[#1A1D21] border border-green-200 dark:border-green-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-green-700 dark:text-green-300">
            Suggested Bands
          </h3>
          <span className="text-xs font-medium text-gray-500">
            {context?.vehicleType} • {context?.hour}:00 • {context?.dayOfWeek}
          </span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Total Eligible:{" "}
          <span className="font-semibold text-green-700 dark:text-green-300">
            {totalEligible}
          </span>
        </p>
        <ul className="divide-y divide-gray-200 dark:divide-gray-800 text-sm">
          {bands.length ? (
            bands.map((b, i) => (
              <li
                key={i}
                className="py-2 flex justify-between hover:bg-green-50 dark:hover:bg-[#161a1d] rounded-md px-2 transition-colors"
              >
                <span className="font-medium">{b._id}</span>
                <span className="text-gray-600 dark:text-gray-300">
                  {b.customers}{" "}
                  <span className="text-green-600 dark:text-green-400">
                    ({pct(b.customers)})
                  </span>
                </span>
              </li>
            ))
          ) : (
            <li className="py-2 text-gray-500 text-center">No data</li>
          )}
        </ul>
      </div>

      {/* By Rating */}
      <div className="bg-gradient-to-b from-yellow-50 to-white dark:from-[#111318] dark:to-[#1A1D21] border border-yellow-200 dark:border-yellow-700 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
        <h3 className="text-lg font-semibold text-yellow-700 dark:text-yellow-400 mb-3">
          By Rating
        </h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
              <th className="py-2 text-left">Range</th>
              <th className="py-2 text-right">Count</th>
            </tr>
          </thead>
          <tbody>
            {byRating.length ? (
              byRating.map((r, i) => {
                const label =
                  typeof r._id === "object"
                    ? `${r._id.min ?? ""}${
                        r._id.min !== undefined ? "–" : ""
                      }${r._id.max ?? ""}`
                    : String(r._id);
                return (
                  <tr
                    key={i}
                    className="hover:bg-yellow-50 dark:hover:bg-[#161a1d] transition-colors"
                  >
                    <td className="py-2">{label}</td>
                    <td className="py-2 text-right text-gray-800 dark:text-gray-100">
                      {r.count}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={2}
                  className="py-2 text-gray-500 text-center italic"
                >
                  No data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* By Ride Count */}
      <div className="bg-gradient-to-b from-indigo-50 to-white dark:from-[#111318] dark:to-[#1A1D21] border border-indigo-200 dark:border-indigo-700 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
        <h3 className="text-lg font-semibold text-indigo-700 dark:text-indigo-400 mb-3">
          By Ride Count
        </h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
              <th className="py-2 text-left">Range</th>
              <th className="py-2 text-right">Count</th>
            </tr>
          </thead>
          <tbody>
            {byRide.length ? (
              byRide.map((r, i) => {
                const label =
                  typeof r._id === "object"
                    ? `${r._id.min ?? ""}${
                        r._id.min !== undefined ? "–" : ""
                      }${r._id.max ?? ""}`
                    : String(r._id);
                return (
                  <tr
                    key={i}
                    className="hover:bg-indigo-50 dark:hover:bg-[#161a1d] transition-colors"
                  >
                    <td className="py-2">{label}</td>
                    <td className="py-2 text-right text-gray-800 dark:text-gray-100">
                      {r.count}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={2}
                  className="py-2 text-gray-500 text-center italic"
                >
                  No data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0B0E11] text-gray-800 dark:text-gray-200">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />

        <main className="p-6 space-y-8 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-semibold text-green-700 dark:text-green-400 flex items-center gap-2">
              <BadgePercent className="w-8 h-8 text-green-700 dark:text-green-400" />
              Promotions Lab
            </h1>

          </div>

          {/* Description */}
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Simulate customer behavior using snapshots from{" "}
            <code>customer_snapshots</code> and evaluate promotional logic
            through the <code>/decide</code> endpoint.
          </p>

          {/* Eligibility Facets */}
          {eligibility && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold text-green-600 dark:text-green-400 mb-3 flex items-center gap-2">
                Eligibility Overview
              </h2>
              <EligibilityCards
                data={eligibility}
                context={{ vehicleType, hour: Number(hour), dayOfWeek }}
              />
            </div>
          )}

          {/* Controls Section */}
          <div className="bg-white dark:bg-[#1A1D21] border border-gray-100 dark:border-gray-700 rounded-xl p-5 space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-yellow-400">
              Promotion Simulation Inputs
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input
                className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#111318] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter Customer ID (e.g., CID7747807)"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
              />

              <select
                className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#111318] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
              >
                <option>Bike</option>
                <option>Auto</option>
                <option>Car</option>
                <option>Premier</option>
              </select>

              <input
                type="number"
                min="0"
                max="23"
                className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#111318] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                value={hour}
                onChange={(e) => setHour(e.target.value)}
              />

              <select
                className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#111318] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value)}
              >
                {[
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                  "Sunday",
                ].map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap gap-3 mt-5">
              {/* Load Snapshot Button */}
              <button
                onClick={loadSnapshot}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all 
                          bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md 
                          hover:shadow-lg hover:scale-[1.03] active:scale-[0.97]"
              >
                <ClipboardList className="w-5 h-5" />
                Load Snapshot
              </button>

              {/* Get Decision Button */}
              <button
                onClick={getDecision}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all 
                          bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md 
                          hover:shadow-lg hover:scale-[1.03] active:scale-[0.97]"
              >
                <BadgePercent className="w-5 h-5" />
                Get Decision
              </button>
            </div>
            </div> 


        {snapshot && (
          <div className="bg-white dark:bg-[#1A1D21] border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-md transition-all duration-200">
            <h2 className="text-2xl font-semibold text-green-600 mb-6 flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-green-600 dark:text-green-400" />
              Customer Snapshot
            </h2>


            {/* --- Top IDs --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 dark:bg-[#111318] rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm text-gray-500">Customer ID</h3>
                <p className="font-semibold text-gray-800 dark:text-gray-100">
                  {snapshot._id}
                </p>
              </div>

            </div>

            {/* --- Metrics Section --- */}
            {snapshot.metrics && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Metrics
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Object.entries(snapshot.metrics).map(([key, val]) => (
                    <div
                      key={key}
                      className="bg-gray-50 dark:bg-[#111318] p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <h4 className="text-sm text-gray-500 capitalize">
                        {key.replace(/_/g, " ")}
                      </h4>
                      <p className="font-semibold text-gray-800 dark:text-gray-100">
                        {val === null || val === undefined ? "—" : String(val)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* --- Preferences Section --- */}
            {snapshot.preferences && (
              <div>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Preferences
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Preferred Payment */}
                  <div className="bg-gray-50 dark:bg-[#111318] p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h4 className="text-sm text-gray-500">
                      Preferred Payment Method
                    </h4>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">
                      {snapshot.preferences.preferred_payment_method || "—"}
                    </p>
                  </div>

                  {/* Top Hours */}
                  {Array.isArray(snapshot.preferences.top_hours) &&
                    snapshot.preferences.top_hours.length > 0 && (
                      <div className="bg-gray-50 dark:bg-[#111318] p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <h4 className="text-sm text-gray-500 mb-2">Top Hours</h4>
                        <ul className="space-y-1 text-sm">
                          {snapshot.preferences.top_hours.map((h, i) => (
                            <li key={i}>
                              Hour {h.hour}:{" "}
                              <span className="font-medium text-gray-800 dark:text-gray-100">
                                {h.count} rides
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {/* Top Days */}
                  {Array.isArray(snapshot.preferences.top_days) &&
                    snapshot.preferences.top_days.length > 0 && (
                      <div className="bg-gray-50 dark:bg-[#111318] p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <h4 className="text-sm text-gray-500 mb-2">Top Days</h4>
                        <ul className="space-y-1 text-sm">
                          {snapshot.preferences.top_days.map((d, i) => (
                            <li key={i}>
                              {d.dayOfWeek}:{" "}
                              <span className="font-medium text-gray-800 dark:text-gray-100">
                                {d.count} rides
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {/* Vehicle Top 2 */}
                  {Array.isArray(snapshot.preferences.vehicle_top2) &&
                    snapshot.preferences.vehicle_top2.length > 0 && (
                      <div className="bg-gray-50 dark:bg-[#111318] p-4 rounded-lg border border-gray-200 dark:border-gray-700 col-span-full">
                        <h4 className="text-sm text-gray-500 mb-2">Top Vehicles</h4>
                        <div className="flex flex-wrap gap-2">
                          {snapshot.preferences.vehicle_top2.map((v, i) => (
                            <span
                              key={i}
                              className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 px-3 py-1 rounded-full text-sm"
                            >
                              {v.vehicle_type} ({v.count})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Decision Display */}
          {decision && (
            <div className="bg-gradient-to-b from-green-50 to-white dark:from-[#111318] dark:to-[#1A1D21] border border-green-200 dark:border-green-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 mt-6">
              <h2 className="text-2xl font-semibold text-green-700 dark:text-green-400 mb-4 flex items-center gap-2">
                💡 Decision Result
              </h2>

              {/* Summary banner */}
              <div className="flex items-center justify-between bg-green-100 dark:bg-green-900/40 border border-green-200 dark:border-green-700 rounded-xl p-4 mb-5">
                {decision.action?.kind === "discount" ? (
                  <div>
                    <h3 className="text-lg font-semibold text-green-800 dark:text-green-300">
                      {decision.action.valuePct}% Discount Applied
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      This customer qualifies for a {decision.action.valuePct}% discount based on
                      {decision.reason ? ` ${decision.reason}` : " eligibility analysis"}.
                    </p>
                  </div>
                ) : (
                  <div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-300 flex items-center gap-2">
                        <Info className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        No Promotion Applied
                      </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      This customer does not meet the criteria for a discount or reward.
                    </p>
                  </div>
                )}
              </div>

              {/* Structured details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-gray-50 dark:bg-[#111318] p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm text-gray-500">Decision Type</h4>
                  <p className="font-semibold text-gray-800 dark:text-gray-100 capitalize">
                    {decision.action?.kind || "N/A"}
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-[#111318] p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm text-gray-500">Value / Percentage</h4>
                  <p className="font-semibold text-gray-800 dark:text-gray-100">
                    {decision.action?.valuePct
                      ? `${decision.action.valuePct}%`
                      : decision.action?.value || "—"}
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-[#111318] p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm text-gray-500">Status</h4>
                  <p className="font-semibold text-gray-800 dark:text-gray-100">
                    {decision.status || "Completed"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
