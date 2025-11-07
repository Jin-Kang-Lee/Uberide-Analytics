import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

/* ------------------------------- helpers -------------------------------- */
function fmtTime(input) {
  if (!input) return "—";
  if (typeof input === "object" && input.$date) {
    const d = new Date(input.$date);
    return isNaN(d) ? String(input.$date) : d.toLocaleString();
  }
  const d = new Date(input);
  return isNaN(d) ? String(input) : d.toLocaleString();
}

const labelList = [
  ["Date", ""],
  ["Time", ""],
  ["Booking ID", ""],
  ["Booking Status", ""],
  ["Customer ID", ""],
  ["Vehicle Type", ""],
  ["Pickup Location", ""],
  ["Drop Location", ""],
  ["Avg VTAT", ""],
  ["Avg CTAT", ""],
  ["Cancelled Rides by Customer", ""],
  ["Reason for cancelling by Customer", ""],
  ["Cancelled Rides by Driver", ""],
  ["Driver Cancellation Reason", ""],
  ["Incomplete Rides", ""],
  ["Incomplete Rides Reason", ""],
  ["Booking Value", ""],
  ["Ride Distance", ""],
  ["Driver Ratings", ""],
  ["Customer Rating", ""],
  ["Payment Method", ""],
  ["DateTime", ""],
  ["DayOfWeek", ""],
  ["Hour", ""],
];

const emptyToNull = (v) => (v === "" ? null : v);

/* ------------------------------ component ------------------------------- */
export default function TripReplay() {
  const [bookingId, setBookingId] = useState("");
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState(null); // 🆕 for complex query overview

  // Create / Update modals
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(
    labelList.reduce((acc, [label]) => ({ ...acc, [label]: "" }), {})
  );

  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState(
    labelList.reduce((acc, [label]) => ({ ...acc, [label]: "" }), {})
  );

  /* -------------------------- LOAD OVERVIEW (AGGREGATES) -------------------------- */
  useEffect(() => {
    async function loadOverview() {
      try {
        const res = await fetch("http://localhost:5002/api/mongo/bookings/overview");
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
        setOverview(json);
      } catch (e) {
        console.error("Failed to load overview:", e);
      }
    }
    loadOverview();
  }, []);

  /* ------------------------------- CREATE ------------------------------- */
const openCreateModal = async () => {
  setErr("");

  const id = (bookingId || "").trim();
  if (!id) {
    setErr("Please enter a Booking ID before creating.");
    return;
  }

  try {
    // Check if booking already exists before opening the modal
    const res = await fetch(
      `http://localhost:5002/api/mongo/bookings/${encodeURIComponent(id)}`
    );
    if (res.ok) {
      // booking found
      const existing = await res.json();
      if (existing && existing["Booking ID"]) {
        setErr(`Booking ID ${id} already exists.`);
        return; // don’t open modal
      }
    }
  } catch (err) {
    console.warn("⚠️ Could not check booking existence:", err);
  }

  // Only open the modal if it doesn't already exist
  setCreateForm((prev) => ({
    ...prev,
    ["Booking ID"]: id,
  }));
  setShowCreate(true);
};


  const submitCreate = async () => {
    setErr("");
    const payload = {};
    Object.entries(createForm).forEach(([k, v]) => {
      const n = typeof v === "string" ? v.trim() : v;
      payload[k] = n === "" ? null : n;
    });

    try {
      const res = await fetch("http://localhost:5002/api/mongo/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
      setShowCreate(false);
      if (!bookingId && (json?.["Booking ID"] || json?.booking_id)) {
        setBookingId(json["Booking ID"] || json.booking_id);
      }
    } catch (e) {
      setErr(`Create failed: ${e.message}`);
    }
  };

  /* -------------------------------- READ -------------------------------- */
  const fetchBooking = useCallback(async () => {
    setErr("");
    setData(null);
    const id = (bookingId || "").trim();
    if (!id) {
      setErr("Enter a Booking ID");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(
        `http://localhost:5002/api/mongo/bookings/${encodeURIComponent(id)}`
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
      setData(json);
    } catch (e) {
      setErr(`Failed to load booking: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  /* ------------------------------- UPDATE ------------------------------- */
  const openEditModal = () => {
    if (!data) return setErr("Load a booking first before editing.");
    const prefill = {};
    labelList.forEach(([label]) => {
      prefill[label] = data?.[label] ?? "";
    });
    setEditForm(prefill);
    setShowEdit(true);
  };

  const saveEdits = async () => {
    const id = (bookingId || editForm["Booking ID"] || "").trim();
    if (!id) return setErr("Enter or load a booking ID to update.");

    const body = {};
    Object.entries(editForm).forEach(([k, v]) => {
      const n = typeof v === "string" ? v.trim() : v;
      body[k] = n === "" ? null : n;
    });

    try {
      const res = await fetch(
        `http://localhost:5002/api/mongo/bookings/${encodeURIComponent(id)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
      setData(json);
      setShowEdit(false);
      setErr("");
    } catch (e) {
      setErr(`Update failed: ${e.message}`);
    }
  };

  /* -------------------------------- DELETE ------------------------------- */
  const deleteBooking = async () => {
    const id = (bookingId || "").trim();
    if (!id) return setErr("Enter a booking ID to delete.");
    try {
      const res = await fetch(
        `http://localhost:5002/api/mongo/bookings/${encodeURIComponent(id)}`,
        { method: "DELETE" }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
      setData(null);
      setErr("");
    } catch (e) {
      setErr(`Delete failed: ${e.message}`);
    }
  };

  /* ------------------------------ SSE (bookings) ------------------------------ */
  useEffect(() => {
    const es = new EventSource("http://localhost:5002/api/mongo/bookings/stream");
    es.onmessage = (e) => {
      try {
        const change = JSON.parse(e.data);
        const id = data?.["Booking ID"] || bookingId;
        if (id && change?.booking_id === id) {
          setData(change.fullDocument);
        }
      } catch {
        /* ignore bad payloads */
      }
    };
    es.onerror = () => {
      console.warn("⚠️ SSE connection lost, retrying…");
    };
    return () => es.close();
  }, [data, bookingId]);

  const onKeyDown = (e) => {
    if (e.key === "Enter") fetchBooking();
  };

  /* --------------------------------- UI --------------------------------- */
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0B0E11] text-gray-800 dark:text-gray-200">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />

        <main className="p-6 space-y-8 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-semibold text-gray-800 dark:text-yellow-400">
              Trip Replay (Live Updates)
            </h1>
          </div>

          {/* ------------------- OVERVIEW SECTION (AGGREGATED) ------------------- */}
          {overview && (
            <div className="bg-white dark:bg-[#1A1D21] border border-gray-100 dark:border-gray-700 rounded-xl p-4">
              <h2 className="text-xl font-semibold mb-3 text-Black-400">
                Bookings Overview
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-600/30">
                  <p className="text-sm text-gray-400">Total Bookings</p>
                  <p className="text-2xl font-semibold text-emerald-400">
                    {overview.total_bookings ?? "—"}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-600/30">
                  <p className="text-sm text-gray-400">Average VTAT</p>
                  <p className="text-2xl font-semibold text-blue-400">
                    {overview.avg_vtat ? overview.avg_vtat.toFixed(2) : "—"}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 border border-indigo-600/30">
                  <p className="text-sm text-gray-400">Average CTAT</p>
                  <p className="text-2xl font-semibold text-indigo-400">
                    {overview.avg_ctat ? overview.avg_ctat.toFixed(2) : "—"}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-gradient-to-br from-rose-500/10 to-rose-500/5 border border-rose-600/30">
                  <p className="text-sm text-gray-400">Average Rating</p>
                  <p className="text-2xl font-semibold text-rose-400">
                    {overview.avg_customer_rating
                      ? overview.avg_customer_rating.toFixed(1)
                      : "—"}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border border-yellow-600/30">
                  <p className="text-sm text-gray-400">Total Cancelled</p>
                  <p className="text-2xl font-semibold text-yellow-400">
                    {overview.cancelled ?? "—"}
                  </p>
                </div>
              </div>
            </div>
          )}


      {/* ------------------- Controls Section ------------------- */}
      <div className="bg-white dark:bg-[#1A1D21] border border-gray-100 dark:border-gray-700 rounded-2xl p-6 shadow-sm transition-all duration-300 hover:shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-yellow-400">
            Booking Controls
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Booking ID Input */}
          <input
            value={bookingId}
            onChange={(e) => setBookingId(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Enter Booking ID (e.g., CNR2948784)"
            className="flex-1 w-full sm:w-96 px-4 py-2.5 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#0f1114] dark:to-[#161a1e] border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner transition-all"
          />

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {/* Load */}
            <button
              onClick={fetchBooking}
              disabled={loading}
              className={`relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm shadow-md transition-all duration-300 ${
                loading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white hover:shadow-blue-500/30 active:scale-[0.97]"
              }`}
            >
              {loading ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                  Loading
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1 4h-1m1-4h-1m-2 0H8m8-4h.01M12 12v1m-6 6h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  Load
                </>
              )}
            </button>

            {/* Create */}
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm text-white bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-md hover:shadow-emerald-500/30 active:scale-[0.97] transition-all duration-300"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create
            </button>

            {/* Update */}
            <button
              onClick={openEditModal}
              disabled={!data}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm shadow-md transition-all duration-300 ${
                data
                  ? "text-white bg-gradient-to-br from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 hover:shadow-amber-400/30 active:scale-[0.97]"
                  : "bg-gray-300 dark:bg-gray-700 cursor-not-allowed text-gray-400"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2v-5m-7-4l7 7m0 0L13 7m7 7H13"
                />
              </svg>
              Update
            </button>

            {/* Delete */}
            <button
              onClick={deleteBooking}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm text-white bg-gradient-to-br from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 shadow-md hover:shadow-rose-500/30 active:scale-[0.97] transition-all duration-300"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Delete
            </button>
          </div>
        </div>

        {err && <p className="mt-2 text-sm text-red-500">{err}</p>}
      </div>

      {/* -------------------- Booking Details -------------------- */}
      <div className="bg-white dark:bg-[#1A1D21] border border-gray-100 dark:border-gray-700 rounded-xl p-6 transition-all duration-300 shadow-sm hover:shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-yellow-400 flex items-center gap-2">
          <span className="material-icons text-blue-500">Booking Details</span>
        </h2>
        {loading ? (
          <div className="animate-pulse space-y-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"
              ></div>
            ))}
          </div>
        ) : data ? (
          // Data Grid
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm animate-fadeIn">
              {labelList.map(([label]) => (
                <div
                  key={label}
                  className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-1 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 rounded transition-colors duration-200"
                >
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {label}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 truncate max-w-[60%] text-right">
                    {data[label] === null ||
                    data[label] === undefined ||
                    data[label] === ""
                      ? "—"
                      : String(data[label])}
                  </span>
                </div>
              ))}

              <div className="flex justify-between items-center border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Date &amp; Time Last Updated:
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  {fmtTime(data.updatedAt)}
                </span>
              </div>
            </div>
          </>
        ) : (
          // Empty State
          <div className="flex flex-col items-center justify-center py-10 text-center animate-fadeIn">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No booking loaded yet. Enter a Booking ID and click{" "}
              <span className="font-semibold text-blue-500">Load</span> to view details.
            </p>
          </div>
        )}
      </div>

        </main>
      </div>

      {/* ---------------------- Create Modal (labels) ---------------------- */}
      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-[#1A1D21] border border-gray-700 p-6 rounded-xl w-full max-w-5xl text-gray-200">
            <h2 className="text-xl font-semibold mb-4">Create Booking (bookings_clean)</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {labelList.map(([label]) => (
                <div className="flex flex-col" key={label}>
                  <label className="text-sm mb-1">{label}</label>
                  <input
                    className="border border-gray-600 bg-[#111318] rounded px-2 py-1 text-sm"
                    value={createForm[label] ?? ""}
                    onChange={(e) =>
                      setCreateForm((p) => ({ ...p, [label]: e.target.value }))
                    }
                    placeholder=""
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={submitCreate}
                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------- Edit Modal (labels) ----------------------- */}
      {showEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-[#1A1D21] border border-gray-700 p-6 rounded-xl w-full max-w-5xl text-gray-200">
            <h2 className="text-xl font-semibold mb-4">Edit Booking (bookings_clean)</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {labelList.map(([label]) => {
                const readOnly =
                  label === "Booking ID" || label === "Customer ID";
                return (
                  <div className="flex flex-col" key={label}>
                    <label className="text-sm mb-1">{label}</label>
                    <input
                      className={`border border-gray-600 bg-[#111318] rounded px-2 py-1 text-sm ${
                        readOnly ? "opacity-70 cursor-not-allowed" : ""
                      }`}
                      value={editForm[label] ?? ""}
                      onChange={(e) =>
                        setEditForm((p) => ({ ...p, [label]: e.target.value }))
                      }
                      disabled={readOnly}
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowEdit(false)}
                className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={saveEdits}
                className="px-4 py-2 rounded bg-green-600 hover:bg-green-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
