const BASE = "http://localhost:5002/api/mongo";

/* ------------------------- Helper: response handler ------------------------- */
async function handle(res) {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}${text ? ` – ${text}` : ""}`);
  }
  return res.json();
}

/* ----------------------------- Bookings / Replay ----------------------------- */
export async function getTripReplay(bookingId) {
  const res = await fetch(`${BASE}/bookings/${encodeURIComponent(bookingId)}`);
  return handle(res);
}

/* ----------------------------- Customer Profile ----------------------------- */
export async function getCustomerProfile(customerId) {
  const res = await fetch(`${BASE}/customers/${encodeURIComponent(customerId)}/profile`);
  return handle(res);
}

/* ------------------------------ Customer Snapshot ---------------------------- */
export async function getCustomerSnapshot(customerId) {
  const res = await fetch(`${BASE}/customers/${encodeURIComponent(customerId)}/snapshot`);
  return handle(res);
}

/* --------------------------------- Decision ---------------------------------- */
export async function postDecision({ customerId, vehicleType, hour, dayOfWeek }) {
  const res = await fetch(`${BASE}/decide`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ customerId, vehicleType, hour, dayOfWeek }),
  });
  return handle(res);
}

/* ----------------------------- Dashboard Metrics ----------------------------- */
export async function getAggregatedSummary() {
  const res = await fetch(`${BASE}/summary`);
  return handle(res);
}

export async function getAllCustomers() {
  const res = await fetch(`${BASE}/customers`);
  return handle(res);
}

/* ---------------------------------- Health ----------------------------------- */
export async function getMongoHealth() {
  const res = await fetch(`${BASE}/health`);
  return handle(res);
}
