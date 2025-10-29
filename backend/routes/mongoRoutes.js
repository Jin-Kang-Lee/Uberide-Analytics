// backend/routes/mongoRoutes.js
import express from "express";
import mongoose from "mongoose";

const router = express.Router();
const { Schema, models, model } = mongoose;

// ---------- helpers ----------
const getModel = (name, schema, collection) =>
  models[name] || model(name, schema || new Schema({}, { strict: false, collection }));

const toNumberOrNull = (v) => (v === null || v === undefined || v === "" ? null : Number(v));
const toStringOrNull = (v) => (v === null || v === undefined || v === "" ? null : String(v));
const truthy = (v) => v !== null && v !== undefined && v !== "";

// Build a Date from Date + Time fields if present
const combineDateTime = (dateField, timeField) => {
  if (!truthy(dateField) && !truthy(timeField)) return null;
  // If Date is already ISO with time, prefer it
  if (truthy(dateField) && String(dateField).includes("T")) {
    const d = new Date(dateField);
    return isNaN(d) ? null : d;
  }
  const dPart = truthy(dateField) ? String(dateField).split("T")[0] : "1970-01-01";
  const tPart = truthy(timeField) ? String(timeField) : "00:00:00";
  const iso = `${dPart}T${tPart}.000Z`;
  const d = new Date(iso);
  return isNaN(d) ? null : d;
};

// ---------- models ----------
const TripsEvents = getModel(
  "TripsEvents",
  new Schema(
    {
      _id: String,
      booking_id: String,
      customer_id: String,
      status: String,
      customer_rating: Number,
      events: Array,
      createdAt: Date,
      lastEventAt: Date,
    },
    { strict: false, collection: "trips_events" }
  )
);

const CustomerProfiles = getModel(
  "CustomerProfiles",
  new Schema(
    {
      _id: String, // customer id
      counts: {
        bookings: Number,
        completed: Number,
        no_driver_found: Number,
        incomplete: Number,
      },
      sums: {
        booking_value: Number,
        ride_distance: Number,
        driver_ratings: Number,
        customer_rating: Number,
        // maintain own counters for averages
        n_booking_value: Number,
        n_ride_distance: Number,
        n_driver_ratings: Number,
        n_customer_rating: Number,
      },
      averages: {
        booking_value: Number,
        ride_distance: Number,
        driver_ratings: Number,
        customer_rating: Number,
      },
      preferences: {
        most_used_vehicle_type: String,
        most_used_payment_method: String,
        top_pickup_locations: Array,
        top_drop_locations: Array,
        top_hours: Array,
        top_days: Array,

        // internal counters to derive "most used"
        vehicle_counts: Object,
        payment_counts: Object,
        pickup_counts: Object,
        drop_counts: Object,
        hour_counts: Object,
        day_counts: Object,
      },
    },
    { strict: false, collection: "customer_profiles" }
  )
);

const CustomerSnapshots = getModel(
  "CustomerSnapshots",
  new Schema({ _id: String }, { strict: false, collection: "customer_snapshots" })
);

// Raw ingestion layer (Option 1)
const BookingsClean = getModel(
  "BookingsClean",
  new Schema(
    {},
    { strict: false, collection: "bookings_clean" }
  )
);

// ---------------- health ----------------
router.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "mongo-functions",
    collections: ["bookings_clean", "trips_events", "customer_profiles", "customer_snapshots"],
  });
});

// =================== 1) Trip Replay (READ from trips_events) ======================
router.get("/trips/:bookingId/replay", async (req, res) => {
  try {
    const bookingId = (req.params.bookingId || "").trim();
    if (!bookingId) return res.status(400).json({ error: "bookingId is required" });

    const doc = await TripsEvents.findOne({ booking_id: bookingId }).lean();
    if (!doc) {
      return res.status(404).json({
        error: `No trip event found for booking_id: ${bookingId}`,
      });
    }

    const normalizeDate = (val) => {
      if (!val) return null;
      if (val instanceof Date) return val.toISOString();
      if (val.$date) return val.$date;
      return val;
    };

    const events = Array.isArray(doc.events)
      ? doc.events.map((e) => ({
          type: e?.type || "Unknown",
          t: normalizeDate(e?.t),
          meta: e?.meta || {},
        }))
      : [];

    res.json({
      booking_id: doc.booking_id,
      customer_id: doc.customer_id || null,
      status: doc.status || "Unknown",
      customer_rating: doc.customer_rating ?? null,
      createdAt: normalizeDate(doc.createdAt),
      lastEventAt: normalizeDate(doc.lastEventAt),
      events,
    });
  } catch (err) {
    console.error("❌ Trip replay fetch failed:", err);
    res.status(500).json({ error: "Internal server error while fetching trip replay" });
  }
});

// =================== 2) CRUD on trips_events (Update/Delete for admin) ======================
router.put("/trips/:bookingId", async (req, res) => {
  try {
    const bookingId = (req.params.bookingId || "").trim();
    const update = req.body || {};
    if (!bookingId) return res.status(400).json({ error: "bookingId is required" });

    const result = await TripsEvents.findOneAndUpdate(
      { booking_id: bookingId },
      { $set: update, lastEventAt: new Date() },
      { new: true }
    );

    if (!result) return res.status(404).json({ error: "Trip not found for update" });
    res.json(result);
  } catch (err) {
    console.error("❌ Trip update failed:", err);
    res.status(500).json({ error: "Failed to update trip" });
  }
});

router.delete("/trips/:bookingId", async (req, res) => {
  try {
    const bookingId = (req.params.bookingId || "").trim();
    if (!bookingId) return res.status(400).json({ error: "bookingId is required" });

    const result = await TripsEvents.findOneAndDelete({ booking_id: bookingId });
    if (!result) return res.status(404).json({ error: "Trip not found for deletion" });

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Trip delete failed:", err);
    res.status(500).json({ error: "Failed to delete trip" });
  }
});

// =================== 3) CREATE/UPDATE/DELETE on bookings_clean (Option 1) ======================

// Normalize incoming body (supports either spaced labels or camel_case)
function normalizeBookingPayload(body = {}) {
  // Accept both: "Booking ID" or booking_id, etc.
  const get = (...keys) => {
    for (const k of keys) {
      if (body[k] !== undefined) return body[k];
    }
    return null;
  };

  const DateField = get("Date", "date");
  const TimeField = get("Time", "time");
  const DateTime = combineDateTime(DateField, TimeField);

  const out = {
    // Keep the original, user-facing fields so your existing tools remain compatible
    Date: toStringOrNull(DateField),
    Time: toStringOrNull(TimeField),
    "Booking ID": toStringOrNull(get("Booking ID", "booking_id")),
    "Booking Status": toStringOrNull(get("Booking Status", "status")),
    "Customer ID": toStringOrNull(get("Customer ID", "customer_id")),
    "Vehicle Type": toStringOrNull(get("Vehicle Type", "vehicle_type")),
    "Pickup Location": toStringOrNull(get("Pickup Location", "pickup_location")),
    "Drop Location": toStringOrNull(get("Drop Location", "drop_location")),
    "Avg VTAT": toNumberOrNull(get("Avg VTAT", "avg_vtat")),
    "Avg CTAT": toNumberOrNull(get("Avg CTAT", "avg_ctat")),
    "Cancelled Rides by Customer": toNumberOrNull(get("Cancelled Rides by Customer", "cancels_by_customer")),
    "Reason for cancelling by Customer": toStringOrNull(get("Reason for cancelling by Customer", "cancel_reason_customer")),
    "Cancelled Rides by Driver": toNumberOrNull(get("Cancelled Rides by Driver", "cancels_by_driver")),
    "Driver Cancellation Reason": toStringOrNull(get("Driver Cancellation Reason", "driver_cancel_reason")),
    "Incomplete Rides": toNumberOrNull(get("Incomplete Rides", "incomplete_rides")),
    "Incomplete Rides Reason": toStringOrNull(get("Incomplete Rides Reason", "incomplete_reason")),
    "Booking Value": toNumberOrNull(get("Booking Value", "booking_value")),
    "Ride Distance": toNumberOrNull(get("Ride Distance", "ride_distance")),
    "Driver Ratings": toNumberOrNull(get("Driver Ratings", "driver_ratings")),
    "Customer Rating": toNumberOrNull(get("Customer Rating", "customer_rating")),
    "Payment Method": toStringOrNull(get("Payment Method", "payment_method")),
    DayOfWeek: toStringOrNull(get("DayOfWeek", "dayOfWeek")),
    Hour: toNumberOrNull(get("Hour", "hour")),
    DateTime: DateTime ? `${DateField ?? ""} ${TimeField ?? ""}`.trim() : null, // keep the human string
  };

  // Also include canonical shadow fields for change-stream processors
  out._canonical = {
    booking_id: out["Booking ID"],
    status: out["Booking Status"],
    customer_id: out["Customer ID"],
    vehicle_type: out["Vehicle Type"],
    pickup_location: out["Pickup Location"],
    drop_location: out["Drop Location"],
    avg_vtat: out["Avg VTAT"],
    avg_ctat: out["Avg CTAT"],
    cancels_by_customer: out["Cancelled Rides by Customer"],
    cancel_reason_customer: out["Reason for cancelling by Customer"],
    cancels_by_driver: out["Cancelled Rides by Driver"],
    driver_cancel_reason: out["Driver Cancellation Reason"],
    incomplete_rides: out["Incomplete Rides"],
    incomplete_reason: out["Incomplete Rides Reason"],
    booking_value: out["Booking Value"],
    ride_distance: out["Ride Distance"],
    driver_ratings: out["Driver Ratings"],
    customer_rating: out["Customer Rating"],
    payment_method: out["Payment Method"],
    dayOfWeek: out.DayOfWeek,
    hour: out.Hour,
    dateObj: combineDateTime(out.Date, out.Time),
  };

  return out;
}

router.post("/bookings", async (req, res) => {
  try {
    const norm = normalizeBookingPayload(req.body || {});
    if (!norm._canonical.booking_id) {
      return res.status(400).json({ error: "Booking ID is required" });
    }
    const created = await BookingsClean.create(norm);
    res.json({
      ok: true,
      booking_id: norm._canonical.booking_id,
      insertedId: created._id,
      ...norm,
    });
  } catch (err) {
    console.error("❌ Booking create failed:", err);
    res.status(500).json({ error: "Failed to create booking in bookings_clean" });
  }
});

// optional raw update/delete on bookings_clean
router.put("/bookings/:bookingId", async (req, res) => {
  try {
    const bookingId = (req.params.bookingId || "").trim();
    if (!bookingId) return res.status(400).json({ error: "bookingId is required" });
    const norm = normalizeBookingPayload(req.body || {});
    const updated = await BookingsClean.findOneAndUpdate(
      { "Booking ID": bookingId },
      { $set: norm },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Booking not found" });
    res.json({ ok: true, booking_id: bookingId, updated });
  } catch (err) {
    console.error("❌ Booking update failed:", err);
    res.status(500).json({ error: "Failed to update booking in bookings_clean" });
  }
});

router.delete("/bookings/:bookingId", async (req, res) => {
  try {
    const bookingId = (req.params.bookingId || "").trim();
    if (!bookingId) return res.status(400).json({ error: "bookingId is required" });
    const del = await BookingsClean.findOneAndDelete({ "Booking ID": bookingId });
    if (!del) return res.status(404).json({ error: "Booking not found" });
    res.json({ ok: true, booking_id: bookingId });
  } catch (err) {
    console.error("❌ Booking delete failed:", err);
    res.status(500).json({ error: "Failed to delete booking in bookings_clean" });
  }
});

// =================== 4) LIVE UPDATES from trips_events (SSE) ======================
router.get("/trips/stream", async (req, res) => {
  try {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const changeStream = TripsEvents.watch([], { fullDocument: "updateLookup" });
    changeStream.on("change", (change) => {
      res.write(`data: ${JSON.stringify(change)}\n\n`);
    });
    req.on("close", () => changeStream.close());
  } catch (err) {
    console.error("❌ Trip stream failed:", err);
    res.status(500).json({ error: "Failed to stream changes" });
  }
});

// =================== 5) Profile & Decision APIs (unchanged) ======================
router.get("/customers/:id/profile", async (req, res) => {
  try {
    const cid = (req.params.id || "").trim();
    if (!cid) return res.status(400).json({ error: "customer id is required" });

    const doc = await CustomerProfiles.findOne({ _id: cid }).lean();
    if (!doc) return res.status(404).json({ error: "Profile not found for given ID" });

    res.json(doc);
  } catch (err) {
    console.error("❌ Profile fetch failed:", err);
    res.status(500).json({ error: "Failed to fetch customer profile" });
  }
});

router.get("/customers/:id/snapshot", async (req, res) => {
  try {
    const cid = (req.params.id || "").trim();
    if (!cid) return res.status(400).json({ error: "customer id is required" });

    const snap = await CustomerSnapshots.findOne({ _id: cid }).lean();
    if (!snap) return res.status(404).json({ error: "Snapshot not found for ID" });

    res.json(snap);
  } catch (err) {
    console.error("❌ Snapshot fetch failed:", err);
    res.status(500).json({ error: "Failed to fetch snapshot" });
  }
});

router.post("/decide", async (req, res) => {
  try {
    const { customerId, vehicleType, hour, dayOfWeek } = req.body || {};
    if (!customerId) return res.status(400).json({ error: "customerId required" });

    const snap = await CustomerSnapshots.findOne({ _id: customerId }).lean();
    if (!snap) return res.status(404).json({ error: "Snapshot not found for ID" });

    const rating = Number(snap?.metrics?.avg_customer_rating ?? 0);
    const weekday = ["Monday","Tuesday","Wednesday","Thursday","Friday"].includes(dayOfWeek || "");
    let action = { kind: "none" };

    if (rating >= 4.5 && weekday && Number(hour) >= 6 && Number(hour) < 10 && ["Sedan","Premier"].includes(vehicleType)) {
      action = { kind: "discount", valuePct: 10, rationale: "High rating weekday AM commuter" };
    } else if ((snap?.metrics?.cancels_by_customer ?? 0) >= 2) {
      action = { kind: "discount", valuePct: 5, rationale: "Reduce churn (recent cancels)" };
    }

    res.json({ customerId, context: { vehicleType, hour: Number(hour), dayOfWeek }, snapshot_metrics: snap?.metrics ?? null, action });
  } catch (err) {
    console.error("❌ Decide failed:", err);
    res.status(500).json({ error: "Failed to compute decision" });
  }
});

// =================== 6) Change Stream: bookings_clean → derived updates ======================
//
// This watcher runs once (idempotent). It listens for inserts/updates on bookings_clean and
// incrementally updates trips_events and customer_profiles.
//
// Requires a replica set (e.g., on dev: `rs.initiate()`).
//
let bookingsWatcherStarted = false;

async function startBookingsWatcher() {
  if (bookingsWatcherStarted) return;
  bookingsWatcherStarted = true;

  try {
    const cs = BookingsClean.watch([], { fullDocument: "updateLookup" });
    cs.on("change", async (change) => {
      try {
        if (!change.fullDocument) return;

        const raw = change.fullDocument;
        const c = raw._canonical || {};
        const booking_id = c.booking_id || raw["Booking ID"];
        const customer_id = c.customer_id || raw["Customer ID"];
        const status = c.status || raw["Booking Status"];
        const dateObj = c.dateObj || (raw.DateTime ? new Date(raw.DateTime) : null);

        // ---- 1) Upsert into trips_events ----
        if (booking_id) {
          const eventType =
            status?.toUpperCase() === "COMPLETED" ? "COMPLETED"
            : status?.toUpperCase() === "CANCELLED" ? "CANCELLED"
            : status?.toUpperCase() === "INCOMPLETE" ? "INCOMPLETE"
            : "BOOKED";

          // Build a small meta snapshot
          const meta = {
            "Pickup Location": c.pickup_location ?? raw["Pickup Location"] ?? null,
            "Drop Location": c.drop_location ?? raw["Drop Location"] ?? null,
            "Ride Distance": c.ride_distance ?? raw["Ride Distance"] ?? null,
            "Vehicle Type": c.vehicle_type ?? raw["Vehicle Type"] ?? null,
            "Payment Method": c.payment_method ?? raw["Payment Method"] ?? null,
            "Booking Value": c.booking_value ?? raw["Booking Value"] ?? null,
            DayOfWeek: c.dayOfWeek ?? raw.DayOfWeek ?? null,
            Hour: c.hour ?? raw.Hour ?? null,
          };

          await TripsEvents.updateOne(
            { booking_id },
            [
              {
                $set: {
                  _id: booking_id,
                  booking_id,
                  customer_id: customer_id ?? "$customer_id",
                  status: status ?? "$status",
                  customer_rating: c.customer_rating ?? raw["Customer Rating"] ?? "$customer_rating",
                  createdAt: { $ifNull: ["$createdAt", dateObj ?? new Date()] },
                  lastEventAt: new Date(),
                  events: {
                    $let: {
                      vars: { ev: { type: eventType, t: dateObj ?? new Date(), meta } },
                      in: {
                        $cond: [
                          { $isArray: "$events" },
                          { $concatArrays: ["$events", ["$$ev"]] },
                          ["$$ev"],
                        ],
                      },
                    },
                  },
                },
              },
            ],
            { upsert: true }
          );
        }

        // ---- 2) Incrementally update customer_profiles ----
        if (customer_id) {
          const incObj = {
            "counts.bookings": 1,
          };
          if ((status || "").toLowerCase() === "completed") {
            incObj["counts.completed"] = 1;
          }
          // rolling sums + n for averages
          if (truthy(c.booking_value ?? raw["Booking Value"])) {
            incObj["sums.booking_value"] = Number(c.booking_value ?? raw["Booking Value"]);
            incObj["sums.n_booking_value"] = 1;
          }
          if (truthy(c.ride_distance ?? raw["Ride Distance"])) {
            incObj["sums.ride_distance"] = Number(c.ride_distance ?? raw["Ride Distance"]);
            incObj["sums.n_ride_distance"] = 1;
          }
          if (truthy(c.driver_ratings ?? raw["Driver Ratings"])) {
            incObj["sums.driver_ratings"] = Number(c.driver_ratings ?? raw["Driver Ratings"]);
            incObj["sums.n_driver_ratings"] = 1;
          }
          if (truthy(c.customer_rating ?? raw["Customer Rating"])) {
            incObj["sums.customer_rating"] = Number(c.customer_rating ?? raw["Customer Rating"]);
            incObj["sums.n_customer_rating"] = 1;
          }

          const vehicle = c.vehicle_type ?? raw["Vehicle Type"];
          const payment = c.payment_method ?? raw["Payment Method"];
          const pickup = c.pickup_location ?? raw["Pickup Location"];
          const drop = c.drop_location ?? raw["Drop Location"];
          const hour = c.hour ?? raw.Hour;
          const day = c.dayOfWeek ?? raw.DayOfWeek;

          const $inc = incObj;
          const $setOnInsert = {
            counts: { bookings: 0, completed: 0, no_driver_found: 0, incomplete: 0 },
            sums: {
              booking_value: 0, ride_distance: 0, driver_ratings: 0, customer_rating: 0,
              n_booking_value: 0, n_ride_distance: 0, n_driver_ratings: 0, n_customer_rating: 0,
            },
            averages: { booking_value: 0, ride_distance: 0, driver_ratings: 0, customer_rating: 0 },
            preferences: {
              most_used_vehicle_type: null,
              most_used_payment_method: null,
              top_pickup_locations: [],
              top_drop_locations: [],
              top_hours: [],
              top_days: [],
              vehicle_counts: {},
              payment_counts: {},
              pickup_counts: {},
              drop_counts: {},
              hour_counts: {},
              day_counts: {},
            },
          };

          // First stage: $inc + setOnInsert + bump counters
          const update = { $inc, $setOnInsert };

          // Increment preference counters dynamically
          if (vehicle) update.$inc[`preferences.vehicle_counts.${vehicle}`] = 1;
          if (payment) update.$inc[`preferences.payment_counts.${payment}`] = 1;
          if (pickup) update.$inc[`preferences.pickup_counts.${pickup}`] = 1;
          if (drop)   update.$inc[`preferences.drop_counts.${drop}`] = 1;
          if (hour !== null && hour !== undefined) update.$inc[`preferences.hour_counts.${hour}`] = 1;
          if (day) update.$inc[`preferences.day_counts.${day}`] = 1;

          // Apply the $inc update
          await CustomerProfiles.updateOne({ _id: customer_id }, update, { upsert: true });

          // Second stage: recompute averages + top preferences using pipeline update
          await CustomerProfiles.updateOne(
            { _id: customer_id },
            [
              {
                $set: {
                  "averages.booking_value": {
                    $cond: [
                      { $gt: ["$sums.n_booking_value", 0] },
                      { $divide: ["$sums.booking_value", "$sums.n_booking_value"] },
                      0,
                    ],
                  },
                  "averages.ride_distance": {
                    $cond: [
                      { $gt: ["$sums.n_ride_distance", 0] },
                      { $divide: ["$sums.ride_distance", "$sums.n_ride_distance"] },
                      0,
                    ],
                  },
                  "averages.driver_ratings": {
                    $cond: [
                      { $gt: ["$sums.n_driver_ratings", 0] },
                      { $divide: ["$sums.driver_ratings", "$sums.n_driver_ratings"] },
                      0,
                    ],
                  },
                  "averages.customer_rating": {
                    $cond: [
                      { $gt: ["$sums.n_customer_rating", 0] },
                      { $divide: ["$sums.customer_rating", "$sums.n_customer_rating"] },
                      0,
                    ],
                  },
                },
              },
              // Derive "most used" and top arrays from *_counts (convert object → array, sort, slice)
              {
                $set: {
                  "preferences.most_used_vehicle_type": {
                    $let: {
                      vars: {
                        arr: { $objectToArray: "$preferences.vehicle_counts" }
                      },
                      in: {
                        $getField: {
                          field: "k",
                          input: { $first: { $slice: [{ $sortArray: { input: "$$arr", sortBy: { v: -1 } } }, 1] } }
                        }
                      }
                    }
                  },
                  "preferences.most_used_payment_method": {
                    $let: {
                      vars: { arr: { $objectToArray: "$preferences.payment_counts" } },
                      in: {
                        $getField: {
                          field: "k",
                          input: { $first: { $slice: [{ $sortArray: { input: "$$arr", sortBy: { v: -1 } } }, 1] } }
                        }
                      }
                    }
                  },
                  "preferences.top_pickup_locations": {
                    $map: {
                      input: { $slice: [{ $sortArray: { input: { $objectToArray: "$preferences.pickup_counts" }, sortBy: { v: -1 } } }, 5] },
                      as: "it",
                      in: { pickup_location: "$$it.k", count: "$$it.v" }
                    }
                  },
                  "preferences.top_drop_locations": {
                    $map: {
                      input: { $slice: [{ $sortArray: { input: { $objectToArray: "$preferences.drop_counts" }, sortBy: { v: -1 } } }, 5] },
                      as: "it",
                      in: { drop_location: "$$it.k", count: "$$it.v" }
                    }
                  },
                  "preferences.top_hours": {
                    $map: {
                      input: { $slice: [{ $sortArray: { input: { $objectToArray: "$preferences.hour_counts" }, sortBy: { v: -1 } } }, 5] },
                      as: "it",
                      in: { hour: { $toInt: "$$it.k" }, count: "$$it.v" }
                    }
                  },
                  "preferences.top_days": {
                    $map: {
                      input: { $slice: [{ $sortArray: { input: { $objectToArray: "$preferences.day_counts" }, sortBy: { v: -1 } } }, 5] },
                      as: "it",
                      in: { dayOfWeek: "$$it.k", count: "$$it.v" }
                    }
                  },
                }
              }
            ]
          );
        }
      } catch (err) {
        console.error("⚠️ ChangeStream processor error:", err);
      }
    });

    cs.on("error", (e) => {
      console.error("❌ bookings_clean ChangeStream error:", e);
    });

    console.log("✅ bookings_clean ChangeStream watcher started.");
  } catch (err) {
    console.error("❌ Failed to start bookings_clean watcher:", err);
  }
}

// Start watcher when routes file is loaded and connection is ready
if (mongoose.connection.readyState === 1) {
  startBookingsWatcher();
} else {
  mongoose.connection.once("open", () => startBookingsWatcher());
}

export default router;
