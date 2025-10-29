// src/api/mongoAPI.js
// Simple client for the three MongoDB functions.
// Adjust BASE if your dev origin or port differs.

const BASE = "http://localhost:5002/api/mongo";

async function handle(res) {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}${text ? ` – ${text}` : ""}`);
  }
  return res.json();
}

// 1) Trip Replay
export async function getTripReplay(bookingId) {
  if (!bookingId) throw new Error("bookingId is required");
  const res = await fetch(`${BASE}/trips/${encodeURIComponent(bookingId)}/replay`);
  return handle(res);
}

// 2) Dynamic Ride Recommendation (profile fetch)
export async function getCustomerProfile(customerId) {
  if (!customerId) throw new Error("customerId is required");
  const res = await fetch(`${BASE}/customers/${encodeURIComponent(customerId)}/profile`);
  return handle(res);
}

// 3) Promotions & Experiments
export async function getCustomerSnapshot(customerId) {
  if (!customerId) throw new Error("customerId is required");
  const res = await fetch(`${BASE}/customers/${encodeURIComponent(customerId)}/snapshot`);
  return handle(res);
}

export async function postDecision({ customerId, vehicleType, hour, dayOfWeek }) {
  const res = await fetch(`${BASE}/decide`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ customerId, vehicleType, hour, dayOfWeek })
  });
  return handle(res);
}

// Optional: health check (useful during development)
export async function getMongoHealth() {
  const res = await fetch(`${BASE}/health`);
  return handle(res);
}
