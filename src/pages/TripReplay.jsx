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
const emptyToNull = (v) => (v === "" ? null : v);

export default function TripReplay() {
  const [bookingId, setBookingId] = useState("");
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState([]); // change stream logs

  // ------- Edit modal -------
  const [showEdit, setShowEdit] = useState(false);
  const [editData, setEditData] = useState({});

  // ------- Create modal (Option 1: insert into bookings_clean) -------
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    Date: "",                         // ISO date (YYYY-MM-DD or full ISO)
    Time: "",                         // HH:mm:ss
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
    DayOfWeek: "",
    Hour: "",
  });

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
    // Send as-is (with empty → null), backend will normalize/canonicalize
    const payload = {};
    Object.entries(createForm).forEach(([k, v]) => {
      const n = (typeof v === "string" ? v.trim() : v);
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

      // The Change Stream will propagate to trips_events and your SSE listener
      setShowCreate(false);
      // auto-select this booking id for convenience
      if (!bookingId && (json?.booking_id || json?.["Booking ID"])) {
        setBookingId(json.booking_id || json["Booking ID"]);
      }
    } catch (e) {
      setErr(`Create failed: ${e.message}`);
    }
  };

  // ---------- READ (Replay from trips_events) ----------
  const fetchReplay = useCallback(async () => {
    setErr("");
    setData(null);
    const id = bookingId.trim();
    if (!id) {
      setErr("Enter a Booking ID");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(
        `http://localhost:5002/api/mongo/trips/${encodeURIComponent(id)}/replay`
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
      setData(json);
    } catch (e) {
      setErr(`Failed to load replay: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  // ---------- UPDATE (edit fields on trips_events) ----------
  const openEditModal = () => {
    if (!data) return setErr("Load a booking first before editing.");
    setEditData({
      ...data,
    });
    setShowEdit(true);
  };

  const saveEdits = async () => {
    const id = (data?.booking_id || bookingId || "").trim();
    if (!id) return setErr("Enter or load a booking ID to update.");

    // Allow arbitrary updates to the trips_events document
    const body = { ...editData };
    try {
      const res = await fetch(
        `http://localhost:5002/api/mongo/trips/${encodeURIComponent(id)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
      setData(json);
      setErr("");
      setShowEdit(false);
    } catch (e) {
      setErr(`Update failed: ${e.message}`);
    }
  };

  // ---------- DELETE (delete trips_events doc) ----------
  const deleteTrip = async () => {
    const id = bookingId.trim();
    if (!id) return setErr("Enter a booking ID to delete.");
    try {
      const res = await fetch(
        `http://localhost:5002/api/mongo/trips/${encodeURIComponent(id)}`,
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

  // ---------- Change Stream Listener (SSE) ----------
  useEffect(() => {
    const es = new EventSource("http://localhost:5002/api/mongo/trips/stream");
    es.onmessage = (e) => {
      try {
        const change = JSON.parse(e.data);
        setLog((prev) => [change, ...prev.slice(0, 30)]);
        if (
          data &&
          change.fullDocument?.booking_id === data.booking_id
        ) {
          // Refresh the replay view with the new fullDocument (trips_events)
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
  }, [data]);

  const onKeyDown = (e) => {
    if (e.key === "Enter") fetchReplay();
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0B0E11] text-gray-800 dark:text-gray-200">
      {/* Sidebar */}
      <Sidebar />

      {/* Main column */}
      <div className="flex-1 flex flex-col">
        <Navbar />

        <main className="p-6 space-y-8 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-semibold text-gray-800 dark:text-yellow-400">
              Trip Replay (MongoDB · Create → bookings_clean · Live Updates)
            </h1>
          </div>

          {/* Input Controls */}
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
                  onClick={fetchReplay}
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

          {/* Booking Summary */}
          <div className="bg-white dark:bg-[#1A1D21] border border-gray-100 dark:border-gray-700 rounded-xl p-4">
            <h2 className="text-xl font-semibold mb-3">Booking</h2>
            {data ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div><span className="font-medium">Booking ID:</span> {data.booking_id ?? "—"}</div>
                <div><span className="font-medium">Customer ID:</span> {data.customer_id ?? "—"}</div>
                <div><span className="font-medium">Status:</span> {data.status ?? "—"}</div>
                <div><span className="font-medium">Customer Rating:</span> {data.customer_rating ?? "—"}</div>
                <div><span className="font-medium">Created At:</span> {fmtTime(data.createdAt)}</div>
                <div><span className="font-medium">Last Event At:</span> {fmtTime(data.lastEventAt)}</div>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">
                Enter a booking ID and click <em>Load</em> to view replay.
              </p>
            )}
          </div>

          {/* Events Timeline */}
          <div className="bg-white dark:bg-[#1A1D21] border border-gray-100 dark:border-gray-700 rounded-xl p-4">
            <h2 className="text-xl font-semibold mb-3">Events</h2>
            {!data && <p className="text-gray-500 dark:text-gray-400">No events to display.</p>}
            {data?.events?.length ? (
              <ul className="space-y-3">
                {data.events.map((ev, idx) => (
                  <li key={idx} className="border border-gray-100 dark:border-gray-700 rounded-lg p-3">
                    <div className="text-sm">
                      <b>{fmtTime(ev?.t)}</b>{" "}
                      <span className="uppercase tracking-wide ml-2">{ev?.type || "Unknown"}</span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {ev?.meta?.["Pickup Location"] && <span><b>Pickup:</b> {ev.meta["Pickup Location"]} </span>}
                      {ev?.meta?.["Drop Location"] && <span>• <b>Drop:</b> {ev.meta["Drop Location"]} </span>}
                      {typeof ev?.meta?.["Ride Distance"] === "number" && <span>• <b>Dist:</b> {ev.meta["Ride Distance"]} km </span>}
                      {ev?.meta?.["Vehicle Type"] && <span>• <b>Vehicle:</b> {ev.meta["Vehicle Type"]}</span>}
                    </div>
                    <pre className="text-xs bg-gray-50 dark:bg-[#111318] p-2 rounded mt-2 overflow-x-auto">
                      {JSON.stringify(ev?.meta ?? {}, null, 2)}
                    </pre>
                  </li>
                ))}
              </ul>
            ) : (
              data && <p className="text-gray-500 dark:text-gray-400">No events found for this booking.</p>
            )}
          </div>

          {/* Live Change Stream Log */}
          <div className="bg-white dark:bg-[#1A1D21] border border-gray-100 dark:border-gray-700 rounded-xl p-4">
            <h2 className="text-xl font-semibold mb-3">Live MongoDB Updates</h2>
            {log.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">Listening for MongoDB changes…</p>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-y-auto text-sm">
                {log.map((entry, idx) => (
                  <li key={idx} className="border border-gray-100 dark:border-gray-700 rounded-lg p-2">
                    <div className="font-medium text-blue-600 dark:text-yellow-400">
                      {String(entry.operationType || "").toUpperCase()}
                    </div>
                    <div className="text-xs">
                      {entry.fullDocument?.booking_id ? `Booking ID: ${entry.fullDocument.booking_id}` : "—"}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </main>
      </div>

      {/* ------- Create Modal (fields only; no JSON) ------- */}
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

      {/* ------- Edit Modal (trips_events document) ------- */}
      {showEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-[#1A1D21] border border-gray-700 p-6 rounded-xl w-full max-w-2xl text-gray-200">
            <h2 className="text-xl font-semibold mb-4">Edit Trip (trips_events)</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {["booking_id", "customer_id", "status", "customer_rating", "createdAt", "lastEventAt"].map((k) => (
                <div key={k} className="flex flex-col">
                  <label className="text-sm mb-1">{k}</label>
                  <input
                    className="border border-gray-600 bg-[#111318] rounded px-2 py-1 text-sm"
                    value={String(editData[k] ?? "")}
                    onChange={(e) =>
                      setEditData((prev) => ({ ...prev, [k]: e.target.value }))
                    }
                  />
                </div>
              ))}
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
