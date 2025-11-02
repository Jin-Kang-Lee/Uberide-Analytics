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


          {/* Controls Section */}
          <div className="bg-white dark:bg-[#1A1D21] border border-gray-100 dark:border-gray-700 rounded-xl p-5 space-y-4">
            {/* Title */}
            <h2 className="text-lg font-semibold text-gray-800 dark:text-yellow-400">
              Booking CRUD Operations
            </h2>

            {/* Input + Buttons */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <input
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Enter Booking ID (e.g., CNR2948784)"
                className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#111318] rounded px-3 py-2 w-full sm:w-96 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={fetchBooking}
                  disabled={loading}
                  className={`px-4 py-2 rounded text-white ${
                    loading
                      ? "bg-green-400 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {loading ? "Loading…" : "Load"}
                </button>

                <button
                  onClick={openCreateModal}
                  className="px-4 py-2 rounded text-white bg-blue-600 hover:bg-blue-700"
                >
                  Create
                </button>

                <button
                  onClick={openEditModal}
                  className="px-4 py-2 rounded text-white bg-yellow-500 hover:bg-yellow-600"
                  disabled={!data}
                >
                  Update
                </button>

                <button
                  onClick={deleteBooking}
                  className="px-4 py-2 rounded text-white bg-red-600 hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>

            {err && <p className="mt-2 text-sm text-red-500">{err}</p>}
          </div>

          {/* Booking Details */}
          <div className="bg-white dark:bg-[#1A1D21] border border-gray-100 dark:border-gray-700 rounded-xl p-4">
            <h2 className="text-xl font-semibold mb-3">Booking</h2>
            {data ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {labelList.map(([label]) => (
                    <div key={label}>
                      <span className="font-medium">{label}:</span>{" "}
                      {data[label] === null || data[label] === undefined || data[label] === ""
                        ? "—"
                        : String(data[label])}
                    </div>
                  ))}
                  <div>
                    <span className="font-medium">Date &amp; Time Last Updated:</span>{" "}
                    {fmtTime(data.updatedAt)}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">
                Enter a booking ID and click <em>Load</em> to view details.
              </p>
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
