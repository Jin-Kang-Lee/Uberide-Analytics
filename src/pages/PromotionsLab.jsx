import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

export default function PromotionsLab() {
  const [customerId, setCustomerId] = useState("");
  const [vehicleType, setVehicleType] = useState("Bike");
  const [hour, setHour] = useState(18);
  const [dayOfWeek, setDayOfWeek] = useState("Sunday");
  const [snapshot, setSnapshot] = useState(null);
  const [decision, setDecision] = useState(null);
  const [err, setErr] = useState("");

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
        `http://localhost:5002/api/mongo/customers/${encodeURIComponent(customerId)}/snapshot`
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

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0B0E11] text-gray-800 dark:text-gray-200">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />

        <main className="p-6 space-y-8 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-semibold text-green-700 dark:text-green-400">
              🎯 Promotions Lab (MongoDB Experiments)
            </h1>
          </div>

          {/* Description */}
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Simulate customer behavior using snapshots from{" "}
            <code>customer_snapshots</code> and evaluate promotional logic
            through the <code>/decide</code> endpoint.
          </p>

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

            <div className="flex gap-3 mt-3">
              <button
                onClick={loadSnapshot}
                className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded"
              >
                Load Snapshot
              </button>
              <button
                onClick={getDecision}
                className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded"
              >
                Get Decision
              </button>
            </div>

            {err && <p className="text-red-600 mt-2">{err}</p>}
          </div>

          {/* Snapshot Display */}
          {snapshot && (
            <div className="bg-white dark:bg-[#1A1D21] border border-gray-100 dark:border-gray-700 rounded-xl p-4">
              <h2 className="text-xl font-semibold text-green-600 mb-2">
                📋 Customer Snapshot
              </h2>
              <pre className="bg-gray-50 dark:bg-[#111318] p-3 rounded text-xs overflow-x-auto">
                {JSON.stringify(snapshot, null, 2)}
              </pre>
            </div>
          )}

          {/* Decision Display */}
          {decision && (
            <div className="bg-white dark:bg-[#1A1D21] border border-gray-100 dark:border-gray-700 rounded-xl p-4">
              <h2 className="text-xl font-semibold text-green-600 mb-2">
                💡 Decision Result
              </h2>
              {decision.action?.kind === "discount" ? (
                <div className="inline-block bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 px-3 py-1 rounded-full mb-3">
                  ✅ {decision.action.valuePct}% Discount Applied
                </div>
              ) : (
                <div className="inline-block bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-300 px-3 py-1 rounded-full mb-3">
                  ℹ️ No Promotion
                </div>
              )}
              <pre className="bg-gray-50 dark:bg-[#111318] p-3 rounded text-xs overflow-x-auto">
                {JSON.stringify(decision, null, 2)}
              </pre>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
