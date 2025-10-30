// src/pages/ManageBookings.jsx
import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import {
  fetchBookingsPaged,
  updateBooking,
  deleteBooking,
  createBooking,
  validateCustomer,
  fetchVehicleTypes,
  fetchLocations,
  lockBooking,
  unlockBooking,
} from "../services/api";

const BASE_STATUS_OPTIONS = ["Pending", "Completed", "Cancelled"];
const PAYMENT_OPTIONS = ["Cash", "Card", "UPI", "Uber Wallet"];

export default function ManageBookings() {
  // ---------- actor (used for locking) ----------
  const [actorName, setActorName] = useState(
    () => localStorage.getItem("actorName") || ""
  );
  useEffect(() => {
    if (actorName?.trim()) localStorage.setItem("actorName", actorName.trim());
  }, [actorName]);

  // ---------- table state ----------
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const limit = 25;

  // ---------- create modal state ----------
  const [showModal, setShowModal] = useState(false);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [locations, setLocations] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [ok, setOk] = useState(null);
  const [err, setErr] = useState(null);
  const [customerInput, setCustomerInput] = useState("");
  const [customerVerified, setCustomerVerified] = useState(false);
  const [customerChecking, setCustomerChecking] = useState(false);

  const [form, setForm] = useState({
    customer_id: "",
    vehicle_type_id: "",
    pickup_location_id: "",
    drop_location_id: "",
    booking_ts: "",
    status: "Pending",
    booking_value: "",
    ride_distance: "",
    payment_method: "",
    currency: "INR",
  });

  // ---------- derive status options (include values from rows, e.g., "Incomplete") ----------
  const STATUS_OPTIONS = useMemo(() => {
    const fromRows = bookings.map(b => b.status).filter(Boolean);
    return Array.from(new Set([...BASE_STATUS_OPTIONS, ...fromRows]));
  }, [bookings]);

  // ---------- table data ----------
  useEffect(() => {
    loadBookings();
  }, [page, search]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const offset = (page - 1) * limit;
      const res = await fetchBookingsPaged({ limit, offset, search });
      // expect each row to include locked_by (nullable) and locked_at (optional)
      setBookings(res.data || []);
      setTotal(res.total || 0);
    } catch (e) {
      console.error("Failed to fetch bookings:", e);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  // ---------- inline edit with locking ----------
  const handleEdit = async (b) => {
    // name is required for locking — keep it lightweight
    const actor = (actorName || "").trim();
    if (!actor) {
      alert("Enter your name (top-right) before editing so others can see who is editing.");
      return;
    }
    try {
      // ask server to acquire the lock
      const resp = await lockBooking(b.booking_id, actor);
      if (!resp?.ok) {
        // someone else is already editing; backend should return locked_by
        const who = resp?.locked_by || "someone else";
        alert(`This row is currently being edited by ${who}. Try again later.`);
        // refresh to show chip
        await loadBookings();
        return;
      }
      // got the lock — go into edit mode
      setEditingId(b.booking_id);
      setEditForm({
        status: b.status,
        booking_value: b.booking_value,
        ride_distance: b.ride_distance,
        payment_method: b.payment_method,
      });
      // reflect lock in the UI immediately
      setBookings(prev =>
        prev.map(x =>
          x.booking_id === b.booking_id ? { ...x, locked_by: actor } : x
        )
      );
    } catch (e) {
      console.error("Lock failed:", e);
      alert("Could not acquire lock. Please try again.");
    }
  };

  const onEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((p) => ({ ...p, [name]: value }));
  };

  const releaseLock = async (id) => {
    try {
      const actor = (actorName || "").trim();
      if (!actor) return;
      await unlockBooking(id, actor);
    } catch (e) {
      // non-fatal; just log
      console.warn("Unlock failed (non-fatal):", e);
    } finally {
      // refresh row states
      loadBookings();
    }
  };

  const handleSave = async (id) => {
    try {
      await updateBooking(id, editForm);
      setEditingId(null);
      await releaseLock(id);
    } catch (err) {
      console.error("Update failed:", err);
      alert("Update failed.");
    }
  };

  const handleCancel = async (id) => {
    setEditingId(null);
    await releaseLock(id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Delete booking ${id}?`)) return;
    try {
      await deleteBooking(id);
      await loadBookings();
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Delete failed.");
    }
  };

    // ---------- 🆕 release lock automatically on refresh/close ----------
  useEffect(() => {
    const handleUnload = async () => {
      if (editingId) {
        try {
          const actor = (actorName || "").trim();
          if (actor) await unlockBooking(editingId, actor);
        } catch (e) {
          console.warn("Unlock on unload failed:", e);
        }
      }
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [editingId, actorName]);

  

  // ---------- modal: verify customer ----------
  const onVerifyCustomer = async () => {
    if (!customerInput) return;
    setCustomerChecking(true);
    setErr(null);
    try {
      const r = await validateCustomer(customerInput.trim());
      if (r?.exists) {
        setCustomerVerified(true);
        setForm((f) => ({ ...f, customer_id: String(r.customer_id) }));
      } else {
        setCustomerVerified(false);
        setErr("Customer not found.");
      }
    } catch (e) {
      console.error("Validate customer failed", e);
      setCustomerVerified(false);
      setErr("Validation failed. Try again.");
    } finally {
      setCustomerChecking(false);
    }
  };

  // ---------- modal: validation & submit ----------
  const validationError = useMemo(() => {
    if (!form.customer_id || !customerVerified) return "Please verify a valid customer ID.";
    if (!form.vehicle_type_id) return "Select a vehicle type.";
    if (!form.pickup_location_id) return "Select a pickup location.";
    if (!form.drop_location_id) return "Select a drop location.";
    if (form.pickup_location_id && form.drop_location_id &&
        String(form.pickup_location_id) === String(form.drop_location_id))
      return "Pickup and drop locations must be different.";
    if (!form.booking_ts) return "Choose a booking time.";
    if (!form.payment_method) return "Select a payment method.";
    if (form.booking_value === "" || Number(form.booking_value) < 0)
      return "Enter a valid booking value (>= 0).";
    if (form.ride_distance === "" || Number(form.ride_distance) < 0)
      return "Enter a valid ride distance (>= 0).";
    return null;
  }, [form, customerVerified]);

  const resetForm = () => {
    setForm({
      customer_id: "",
      vehicle_type_id: "",
      pickup_location_id: "",
      drop_location_id: "",
      booking_ts: "",
      status: "Pending",
      booking_value: "",
      ride_distance: "",
      payment_method: "",
      currency: "INR",
    });
    setCustomerInput("");
    setCustomerVerified(false);
    setErr(null);
    setOk(null);
  };

  const closeModal = () => {
    resetForm();
    setShowModal(false);
  };

  const onCreate = async (e) => {
    e.preventDefault();
    setOk(null);
    setErr(null);
    if (validationError) {
      setErr(validationError);
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        customer_id: String(form.customer_id).trim(),
        vehicle_type_id: Number(form.vehicle_type_id),
        pickup_location_id: Number(form.pickup_location_id),
        drop_location_id: Number(form.drop_location_id),
        booking_ts: new Date(form.booking_ts).toISOString(),
        status: form.status,
        booking_value: Number(form.booking_value),
        ride_distance: Number(form.ride_distance),
        payment_method: form.payment_method,
        currency: form.currency || "INR",
      };
      await createBooking(payload);
      setOk("Booking created successfully.");
      await loadBookings();
      closeModal();
    } catch (e) {
      console.error("Create booking failed", e);
      setErr(e?.response?.data?.error || e?.message || "Could not create booking.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0B0E11] text-gray-800 dark:text-gray-200">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />

        <main className="p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-4 gap-3">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-yellow-400">
              📋 Manage Bookings
            </h2>

            {/* your name for lock display */}
            <input
              value={actorName}
              onChange={(e) => setActorName(e.target.value)}
              placeholder="Your name (shows in locks)"
              className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#0B0E11] border border-gray-300 dark:border-gray-700"
              style={{ minWidth: 220 }}
            />

            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white"
            >
              ➕ Create Booking
            </button>
          </div>

          {/* Search */}
          <div className="flex mb-4 gap-2">
            <input
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              placeholder="Search Booking ID (e.g., CNR1058307)"
              className="flex-1 p-2 border rounded-xl bg-gray-50 dark:bg-[#0B0E11] border-gray-300 dark:border-gray-700"
            />
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-[#181A20] rounded-2xl p-4 shadow-sm overflow-x-auto">
            {loading ? (
              <p className="animate-pulse">Loading bookings…</p>
            ) : bookings.length === 0 ? (
              <p>No bookings found.</p>
            ) : (
              <table className="w-full text-sm border-collapse">
                <thead className="bg-gray-100 dark:bg-[#0B0E11]">
                  <tr>
                    <th className="p-2 text-left border-b">Booking ID</th>
                    <th className="p-2 text-left border-b">Customer ID</th>
                    <th className="p-2 text-left border-b">Status</th>
                    <th className="p-2 text-left border-b">Fare (₹)</th>
                    <th className="p-2 text-left border-b">Distance (km)</th>
                    <th className="p-2 text-left border-b">Payment</th>
                    <th className="p-2 text-left border-b">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => {
                    const lockedBy = b.locked_by || "";
                    const lockedBySomeoneElse =
                      lockedBy && lockedBy !== (actorName || "").trim();

                    return (
                      <tr key={b.booking_id} className="border-b hover:bg-gray-50 dark:hover:bg-[#222531]">
                        <td className="p-2">
                          <div className="flex items-center gap-3">
                            <span>{b.booking_id}</span>
                            {lockedBy && (
                              <span
                                className={`text-xs px-3 py-1 rounded-full border ${
                                  lockedBySomeoneElse
                                    ? "border-amber-400 text-amber-700 bg-amber-50"
                                    : "border-emerald-400 text-emerald-700 bg-emerald-50"
                                }`}
                              >
                                editing by: <em>{lockedBy}</em>
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-2">{b.customer_id}</td>

                        {editingId === b.booking_id ? (
                          <>
                            <td className="p-2">
                              <select
                                name="status"
                                value={editForm.status}
                                onChange={onEditChange}
                                className="border rounded px-2 py-1"
                              >
                                {STATUS_OPTIONS.map((s) => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                            </td>
                            <td className="p-2">
                              <input
                                name="booking_value"
                                type="number"
                                value={editForm.booking_value}
                                onChange={onEditChange}
                                className="border rounded px-2 py-1 w-24"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                name="ride_distance"
                                type="number"
                                value={editForm.ride_distance}
                                onChange={onEditChange}
                                className="border rounded px-2 py-1 w-24"
                              />
                            </td>
                            <td className="p-2">
                              <select
                                name="payment_method"
                                value={editForm.payment_method ?? b.payment_method ?? ""}
                                onChange={onEditChange}
                                className="border rounded px-2 py-1"
                              >
                                <option value="">Select method…</option>
                                {PAYMENT_OPTIONS.map((p) => (
                                  <option key={p} value={p}>{p}</option>
                                ))}
                              </select>
                            </td>
                            <td className="p-2 flex gap-2">
                              <button
                                onClick={() => handleSave(b.booking_id)}
                                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-xl"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => handleCancel(b.booking_id)}
                                className="px-3 py-1 border rounded-xl"
                              >
                                Cancel
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="p-2">{b.status}</td>
                            <td className="p-2">{b.booking_value}</td>
                            <td className="p-2">{b.ride_distance}</td>
                            <td className="p-2">{b.payment_method}</td>
                            <td className="p-2 flex gap-3">
                              {/* Edit Button */}
                                <button
                                  onClick={() => {
                                    // prevent starting a new edit while another is active
                                    if (editingId && editingId !== b.booking_id) {
                                      alert("Finish your current edit before editing another booking.");
                                      return;
                                    }
                                    handleEdit(b);
                                  }}
                                  className="text-yellow-500 hover:text-yellow-600"
                                  title="Edit"
                                  disabled={lockedBySomeoneElse}
                                >
                                  ✏️
                                </button>

                                {/* Delete Button */}
                                <button
                                  onClick={() => handleDelete(b.booking_id)}
                                  className="text-red-500 hover:text-red-600"
                                  title="Delete"
                                  disabled={lockedBySomeoneElse}
                                >
                                  🗑
                                </button>

                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 text-sm">
            <span>
              Showing {bookings.length ? (page - 1) * limit + bookings.length : 0} of {total}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1 border rounded-xl disabled:opacity-50"
              >
                Previous
              </button>
              <span>
                Page {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1 border rounded-xl disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </main>

        {/* ---------- CREATE BOOKING MODAL ---------- */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-[#181A20] rounded-2xl p-6 w-full max-w-3xl shadow-xl overflow-y-auto max-h-[90vh]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-yellow-400">
                  ➕ Create Booking
                </h3>
                <button
                  onClick={closeModal}
                  className="px-3 py-1 border rounded-xl hover:bg-gray-50 dark:hover:bg-[#222531]"
                >
                  ✕
                </button>
              </div>

              {err && (
                <div className="mb-3 rounded-lg border border-red-300 bg-red-50/60 text-red-700 px-4 py-2">
                  {err}
                </div>
              )}
              {ok && (
                <div className="mb-3 rounded-lg border border-green-300 bg-green-50/60 text-green-700 px-4 py-2">
                  {ok}
                </div>
              )}

              <form onSubmit={onCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Customer verify */}
                <div className="md:col-span-2">
                  <label className="block text-sm mb-1">Customer ID</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter customer ID"
                      value={customerInput}
                      onChange={(e) => {
                        setCustomerInput(e.target.value);
                        setCustomerVerified(false);
                        setOk(null);
                      }}
                      className="w-full rounded-xl bg-gray-50 dark:bg-[#0B0E11] border border-gray-300 dark:border-gray-700 p-2"
                    />
                    <button
                      type="button"
                      disabled={!customerInput || customerChecking}
                      onClick={onVerifyCustomer}
                      className="px-4 py-2 rounded-2xl border border-gray-300 dark:border-gray-700 disabled:opacity-60"
                    >
                      {customerChecking ? "Checking…" : "Verify"}
                    </button>
                  </div>
                  {customerVerified && (
                    <div className="mt-1 text-sm text-green-600">Customer exists ✓</div>
                  )}
                  {!customerVerified && customerInput && !customerChecking && (
                    <div className="mt-1 text-sm text-red-600">Not verified</div>
                  )}
                </div>

                {/* Vehicle Type */}
                <div>
                  <label className="block text-sm mb-1">Vehicle Type</label>
                  <select
                    name="vehicle_type_id"
                    value={form.vehicle_type_id}
                    onChange={(e) => setForm((f) => ({ ...f, vehicle_type_id: e.target.value }))}
                    className="w-full rounded-xl bg-gray-50 dark:bg-[#0B0E11] border border-gray-300 dark:border-gray-700 p-2"
                  >
                    <option value="">Select vehicle type…</option>
                    {vehicleTypes.map((v) => (
                      <option key={v.vehicle_type_id} value={v.vehicle_type_id}>
                        {v.type_name || `ID ${v.vehicle_type_id}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Pickup */}
                <div>
                  <label className="block text-sm mb-1">Pickup Location</label>
                  <select
                    name="pickup_location_id"
                    value={form.pickup_location_id}
                    onChange={(e) => setForm((f) => ({ ...f, pickup_location_id: e.target.value }))}
                    className="w-full rounded-xl bg-gray-50 dark:bg-[#0B0E11] border border-gray-300 dark:border-gray-700 p-2"
                  >
                    <option value="">Select pickup…</option>
                    {locations.map((l) => (
                      <option key={l.location_id} value={l.location_id}>
                        {l.location_name || l.city || `ID ${l.location_id}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Drop */}
                <div>
                  <label className="block text-sm mb-1">Drop Location</label>
                  <select
                    name="drop_location_id"
                    value={form.drop_location_id}
                    onChange={(e) => setForm((f) => ({ ...f, drop_location_id: e.target.value }))}
                    className="w-full rounded-xl bg-gray-50 dark:bg-[#0B0E11] border border-gray-300 dark:border-gray-700 p-2"
                  >
                    <option value="">Select drop…</option>
                    {locations.map((l) => (
                      <option key={l.location_id} value={l.location_id}>
                        {l.location_name || l.city || `ID ${l.location_id}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Booking time */}
                <div>
                  <label className="block text-sm mb-1">Booking Time</label>
                  <input
                    type="datetime-local"
                    name="booking_ts"
                    value={form.booking_ts}
                    onChange={(e) => setForm((f) => ({ ...f, booking_ts: e.target.value }))}
                    className="w-full rounded-xl bg-gray-50 dark:bg-[#0B0E11] border border-gray-300 dark:border-gray-700 p-2"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm mb-1">Status</label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                    className="w-full rounded-xl bg-gray-50 dark:bg-[#0B0E11] border border-gray-300 dark:border-gray-700 p-2"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Fare */}
                <div>
                  <label className="block text-sm mb-1">Fare (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="booking_value"
                    value={form.booking_value}
                    onChange={(e) => setForm((f) => ({ ...f, booking_value: e.target.value }))}
                    placeholder="e.g., 350.00"
                    className="w-full rounded-xl bg-gray-50 dark:bg-[#0B0E11] border border-gray-300 dark:border-gray-700 p-2"
                  />
                </div>

                {/* Distance */}
                <div>
                  <label className="block text-sm mb-1">Distance (km)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="ride_distance"
                    value={form.ride_distance}
                    onChange={(e) => setForm((f) => ({ ...f, ride_distance: e.target.value }))}
                    placeholder="e.g., 12.4"
                    className="w-full rounded-xl bg-gray-50 dark:bg-[#0B0E11] border border-gray-300 dark:border-gray-700 p-2"
                  />
                </div>

                {/* Payment */}
                <div>
                  <label className="block text-sm mb-1">Payment Method</label>
                  <select
                    name="payment_method"
                    value={form.payment_method}
                    onChange={(e) => setForm((f) => ({ ...f, payment_method: e.target.value }))}
                    className="w-full rounded-xl bg-gray-50 dark:bg-[#0B0E11] border border-gray-300 dark:border-gray-700 p-2"
                  >
                    <option value="">Select method…</option>
                    {PAYMENT_OPTIONS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                {/* Currency (read-only) */}
                <div>
                  <label className="block text-sm mb-1">Currency</label>
                  <input
                    name="currency"
                    value={form.currency}
                    disabled
                    className="w-full rounded-xl bg-gray-100 dark:bg-[#0B0E11] border border-gray-300 dark:border-gray-700 p-2"
                  />
                </div>

                {/* modal buttons */}
                <div className="md:col-span-2 flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={submitting || !customerVerified}
                    className="px-5 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white"
                  >
                    {submitting ? "Saving…" : "Create Booking"}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-5 py-2 rounded-2xl border border-gray-300 dark:border-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
