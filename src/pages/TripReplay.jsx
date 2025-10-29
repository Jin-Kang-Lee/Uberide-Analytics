import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

// ---- helpers ----
function fmtTime(input) {
  if (!input) return "—";
  if (typeof input === "object" && input.$date) {
    const d = new Date(input.$date);
    return isNaN(d) ? String(input.$date) : d.toLocaleString();
  }
  const d = new Date(input);
  return isNaN(d) ? String(input) : d.toLocaleString();
}

export default function TripReplay() {
  const [bookingId, setBookingId] = useState("");
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // ------- Create modal -------
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    Date: "",
    Time: "",
    "Booking ID": "",
    "Booking Status": "",
    "Customer ID": "",
    "Vehicle Type": "",
    "Pickup Location": "",
    "Drop Location": "",
    "Avg VTAT": "",
    "Avg CTAT": "",
    "Cancelled Rides by Customer": "",
    "Reason for cancelling by Customer": "",
    "Cancelled Rides by Driver": "",
    "Driver Cancellation Reason": "",
    "Incomplete Rides": "",
    "Incomplete Rides Reason": "",
    "Booking Value": "",
    "Ride Distance": "",
    "Driver Ratings": "",
    "Customer Rating": "",
    "Payment Method": "",
    DateTime: "",
    DayOfWeek: "",
    Hour: "",
  });

  // ------- Edit modal (same fields as create; Booking ID & Customer ID are read-only) -------
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ ...createForm });

  // ---------- CREATE (to bookings_clean) ----------
  const openCreateModal = () => {
    setErr("");
    setCreateForm((prev) => ({
      ...prev,
      "Booking ID": bookingId || prev["Booking ID"],
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
      if (!bookingId && (json?.booking_id || json?.["Booking ID"])) {
        setBookingId(json.booking_id || json["Booking ID"]);
        await fetchReplay(json.booking_id || json["Booking ID"]);
      }
    } catch (e) {
      setErr(`Create failed: ${e.message}`);
    }
  };

  // ---------- READ (from bookings_clean) ----------
  const fetchReplay = useCallback(
    async (idOverride) => {
      setErr("");
      setData(null);
      const id = (idOverride ?? bookingId).trim();
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
    },
    [bookingId]
  );

  // ---------- UPDATE (PUT to bookings_clean; same fields as create; Booking/Customer IDs locked) ----------
  const openEditModal = () => {
    if (!data) return setErr("Load a booking first before editing.");
    const src = data;
    setEditForm({
      Date: src?.Date ?? "",
      Time: src?.Time ?? "",
      "Booking ID": src?.["Booking ID"] ?? "",
      "Booking Status": src?.["Booking Status"] ?? "",
      "Customer ID": src?.["Customer ID"] ?? "",
      "Vehicle Type": src?.["Vehicle Type"] ?? "",
      "Pickup Location": src?.["Pickup Location"] ?? "",
      "Drop Location": src?.["Drop Location"] ?? "",
      "Avg VTAT": src?.["Avg VTAT"] ?? "",
      "Avg CTAT": src?.["Avg CTAT"] ?? "",
      "Cancelled Rides by Customer": src?.["Cancelled Rides by Customer"] ?? "",
      "Reason for cancelling by Customer":
        src?.["Reason for cancelling by Customer"] ?? "",
      "Cancelled Rides by Driver": src?.["Cancelled Rides by Driver"] ?? "",
      "Driver Cancellation Reason": src?.["Driver Cancellation Reason"] ?? "",
      "Incomplete Rides": src?.["Incomplete Rides"] ?? "",
      "Incomplete Rides Reason": src?.["Incomplete Rides Reason"] ?? "",
      "Booking Value": src?.["Booking Value"] ?? "",
      "Ride Distance": src?.["Ride Distance"] ?? "",
      "Driver Ratings": src?.["Driver Ratings"] ?? "",
      "Customer Rating": src?.["Customer Rating"] ?? "",
      "Payment Method": src?.["Payment Method"] ?? "",
      DateTime: src?.DateTime ?? "",
      DayOfWeek: src?.DayOfWeek ?? "",
      Hour: src?.Hour ?? "",
    });
    setShowEdit(true);
  };

  const submitEdit = async () => {
    const id = (data?.["Booking ID"] || bookingId || "").trim();
    if (!id) return setErr("Enter or load a booking ID to update.");

    const payload = {};
    Object.entries(editForm).forEach(([k, v]) => {
      const n = typeof v === "string" ? v.trim() : v;
      payload[k] = n === "" ? null : n;
    });

    try {
      const res = await fetch(
        `http://localhost:5002/api/mongo/bookings/${encodeURIComponent(id)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
      setShowEdit(false);
      await fetchReplay(id);
    } catch (e) {
      setErr(`Update failed: ${e.message}`);
    }
  };

  // ---------- DELETE (delete bookings_clean doc) ----------
  const deleteTrip = async () => {
    const id = bookingId.trim();
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

  // ---------- Change Stream Listener (SSE on bookings_clean) ----------
  useEffect(() => {
    const es = new EventSource("http://localhost:5002/api/mongo/trips/stream");
    es.onmessage = async (e) => {
      try {
        const change = JSON.parse(e.data);
        const doc = change?.fullDocument || {};
        const changedId =
          doc?._canonical?.booking_id || doc?.["Booking ID"] || "";
        if (changedId && changedId === bookingId.trim()) {
          await fetchReplay(changedId);
        }
      } catch {
        /* ignore bad payloads */
      }
    };
    es.onerror = () => {
      console.warn("⚠️ SSE connection lost, retrying…");
    };
    return () => es.close();
  }, [bookingId, fetchReplay]);

  const onKeyDown = (e) => {
    if (e.key === "Enter") fetchReplay();
  };

  // ---- field list for display in order ----
  const FIELD_ORDER = [
    "Date",
    "Time",
    "Booking ID",
    "Booking Status",
    "Customer ID",
    "Vehicle Type",
    "Pickup Location",
    "Drop Location",
    "Avg VTAT",
    "Avg CTAT",
    "Cancelled Rides by Customer",
    "Reason for cancelling by Customer",
    "Cancelled Rides by Driver",
    "Driver Cancellation Reason",
    "Incomplete Rides",
    "Incomplete Rides Reason",
    "Booking Value",
    "Ride Distance",
    "Driver Ratings",
    "Customer Rating",
    "Payment Method",
    "DateTime",
    "DayOfWeek",
    "Hour",
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0B0E11] text-gray-800 dark:text-gray-200">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />

        <main className="p-6 space-y-8 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-semibold text-gray-800 dark:text-yellow-400">
              Trip Replay (MongoDB · Create/Update → bookings_clean)
            </h1>
          </div>

          {/* Controls */}
          <div className="bg-white dark:bg-[#1A1D21] border border-gray-100 dark:border-gray-700 rounded-xl p-4">
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
                  onClick={() => fetchReplay()}
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
                  onClick={deleteTrip}
                  className="px-4 py-2 rounded text-white bg-red-600 hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
            {err && <p className="mt-3 text-sm text-red-500">{err}</p>}
          </div>

          {/* Booking Details */}
          <div className="bg-white dark:bg-[#1A1D21] border border-gray-100 dark:border-gray-700 rounded-xl p-4">
            <h2 className="text-xl font-semibold mb-3">Booking</h2>

            {!data ? (
              <p className="text-gray-500 dark:text-gray-400">
                Enter a booking ID and click <em>Load</em> to view booking details.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                  {FIELD_ORDER.map((label) => (
                    <div key={label}>
                      <span className="font-medium">{label}:</span>{" "}
                      {data?.[label] ?? "—"}
                    </div>
                  ))}
                  {/* Last Updated */}
                  <div className="col-span-1 sm:col-span-2 lg:col-span-3 mt-2">
                    <span className="font-medium">Date &amp; Time Last Updated:</span>{" "}
                    {fmtTime(data?.lastUpdatedAt || data?.updatedAt)}
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {/* ------- Create Modal ------- */}
      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-[#1A1D21] border border-gray-700 p-6 rounded-xl w-full max-w-5xl text-gray-200">
            <h2 className="text-xl font-semibold mb-4">Create Booking (bookings_clean)</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                ["Date", "e.g., 2024-05-19 or 2024-05-19T00:00:00.000Z"],
                ["Time", "e.g., 18:47:16"],
                ["Booking ID", "e.g., CNR2948784"],
                ["Booking Status", "Completed / Created / Cancelled / Incomplete"],
                ["Customer ID", "e.g., CID7747807"],
                ["Vehicle Type", "Bike / Auto / Sedan ..."],
                ["Pickup Location", "e.g., Rohini West"],
                ["Drop Location", "e.g., Yamuna Bank"],
                ["Avg VTAT", "number (mins) or blank"],
                ["Avg CTAT", "number (mins) or blank"],
                ["Cancelled Rides by Customer", "number or blank"],
                ["Reason for cancelling by Customer", "text or blank"],
                ["Cancelled Rides by Driver", "number or blank"],
                ["Driver Cancellation Reason", "text or blank"],
                ["Incomplete Rides", "number or blank"],
                ["Incomplete Rides Reason", "text or blank"],
                ["Booking Value", "number (₹) e.g., 626"],
                ["Ride Distance", "number (km) e.g., 27.96"],
                ["Driver Ratings", "float e.g., 3.9"],
                ["Customer Rating", "float e.g., 4.3"],
                ["Payment Method", "e.g., Uber Wallet"],
                ["DateTime", "e.g., 2024-05-19 18:47:16"],
                ["DayOfWeek", "e.g., Sunday"],
                ["Hour", "0-23"],
              ].map(([label, ph]) => (
                <div className="flex flex-col" key={label}>
                  <label className="text-sm mb-1">{label}</label>
                  <input
                    className="border border-gray-600 bg-[#111318] rounded px-2 py-1 text-sm"
                    value={createForm[label] ?? ""}
                    onChange={(e) =>
                      setCreateForm((p) => ({ ...p, [label]: e.target.value }))
                    }
                    placeholder={ph}
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

      {/* ------- Edit Modal (same fields; Booking ID & Customer ID disabled) ------- */}
      {showEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-[#1A1D21] border border-gray-700 p-6 rounded-xl w-full max-w-5xl text-gray-200">
            <h2 className="text-xl font-semibold mb-4">Update Booking (bookings_clean)</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Object.entries(editForm).map(([label, value]) => {
                const isLocked =
                  label === "Booking ID" || label === "Customer ID";
                return (
                  <div className="flex flex-col" key={label}>
                    <label className="text-sm mb-1">{label}</label>
                    <input
                      disabled={isLocked}
                      className={`border border-gray-600 bg-[#111318] rounded px-2 py-1 text-sm ${
                        isLocked ? "opacity-70 cursor-not-allowed" : ""
                      }`}
                      value={value ?? ""}
                      onChange={(e) =>
                        setEditForm((p) => ({ ...p, [label]: e.target.value }))
                      }
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowEdit(false)}
                className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={submitEdit}
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
