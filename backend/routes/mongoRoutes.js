import express from "express";
import mongoose from "mongoose";

const router = express.Router();
const { Schema, models, model } = mongoose;

/* -------------------------- helpers & primitives -------------------------- */
const getModel = (name, schema, collection) =>
  models[name] || model(name, schema || new Schema({}, { strict: false, collection }));

const toNumberOrNull = (v) =>
  v === null || v === undefined || v === "" ? null : Number(v);
const toStringOrNull = (v) =>
  v === null || v === undefined || v === "" ? null : String(v);
const truthy = (v) => v !== null && v !== undefined && v !== "";

/* --------------------------------- models -------------------------------- */
const BookingsClean = getModel(
  "BookingsClean",
  new Schema({}, { strict: false, collection: "bookings_clean" })
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

        // internal counters
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

/* ---------------------------------- health --------------------------------- */
router.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "mongo-functions",
    collections: ["bookings_clean", "customer_profiles", "customer_snapshots"],
  });
});

/* -------------------------- utility helpers ------------------------------- */
function combineDateTime(date, time) {
  if (!date) return null;
  try {
    const iso = time ? `${date}T${time}` : date;
    return new Date(iso);
  } catch {
    return null;
  }
}

/* -------------------------- normalization (payload) ------------------------ */
// Accept both human labels and camel/snake keys.
function normalizeBookingPayload(body = {}) {
  const get = (...keys) => {
    for (const k of keys) {
      if (body[k] !== undefined) return body[k];
    }
    return null;
  };

  const DateField = get("Date", "date");
  const TimeField = get("Time", "time");
  const dateObj = combineDateTime(DateField, TimeField);

  const out = {
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

    // Convenience human string (unchanged from your design)
    DateTime: dateObj ? `${DateField ?? ""} ${TimeField ?? ""}`.trim() : null,
  };

  // Canonical shadow (used by watchers / aggregations)
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
    dateObj,
  };

  return out;
}

// Projection returned to the client: labels + updatedAt
const presentBookingDoc = (raw = {}) => {
  // Pass through original fields (labels) and surface updatedAt
  const doc = {
    Date: raw?.Date ?? null,
    Time: raw?.Time ?? null,
    "Booking ID": raw?.["Booking ID"] ?? null,
    "Booking Status": raw?.["Booking Status"] ?? null,
    "Customer ID": raw?.["Customer ID"] ?? null,
    "Vehicle Type": raw?.["Vehicle Type"] ?? null,
    "Pickup Location": raw?.["Pickup Location"] ?? null,
    "Drop Location": raw?.["Drop Location"] ?? null,
    "Avg VTAT": raw?.["Avg VTAT"] ?? null,
    "Avg CTAT": raw?.["Avg CTAT"] ?? null,
    "Cancelled Rides by Customer": raw?.["Cancelled Rides by Customer"] ?? null,
    "Reason for cancelling by Customer": raw?.["Reason for cancelling by Customer"] ?? null,
    "Cancelled Rides by Driver": raw?.["Cancelled Rides by Driver"] ?? null,
    "Driver Cancellation Reason": raw?.["Driver Cancellation Reason"] ?? null,
    "Incomplete Rides": raw?.["Incomplete Rides"] ?? null,
    "Incomplete Rides Reason": raw?.["Incomplete Rides Reason"] ?? null,
    "Booking Value": raw?.["Booking Value"] ?? null,
    "Ride Distance": raw?.["Ride Distance"] ?? null,
    "Driver Ratings": raw?.["Driver Ratings"] ?? null,
    "Customer Rating": raw?.["Customer Rating"] ?? null,
    "Payment Method": raw?.["Payment Method"] ?? null,
    DateTime: raw?.DateTime ?? null,
    DayOfWeek: raw?.DayOfWeek ?? null,
    Hour: raw?.Hour ?? null,
    updatedAt: raw?.updatedAt ?? null, // shown as “Date & Time Last Updated”
  };
  return doc;
};

/* ------------------------------ CRUD: bookings ----------------------------- */
// Create
router.post("/bookings", async (req, res) => {
  try {
    const norm = normalizeBookingPayload(req.body || {});
    if (!norm._canonical.booking_id) {
      return res.status(400).json({ error: "Booking ID is required" });
    }

    // 👇 Duplicate prevention
    const exists = await BookingsClean.findOne({ "Booking ID": norm._canonical.booking_id });
    if (exists) {
      return res.status(409).json({
        error: `Booking ID "${norm._canonical.booking_id}" already exists — please use another one.`,
      });
    }

    const now = new Date();
    const doc = { ...norm, createdAt: now, updatedAt: now };
    const created = await BookingsClean.create(doc);

    res.json({
      ok: true,
      booking_id: norm._canonical.booking_id,
      insertedId: created._id,
      ...presentBookingDoc(doc),
    });
  } catch (err) {
    console.error("❌ Booking create failed:", err);
    res.status(500).json({ error: "Failed to create booking in bookings_clean" });
  }
});

/* --------------------------- BOOKINGS OVERVIEW --------------------------- */
router.get("/bookings/overview", async (_req, res) => {
  try {
    const getModel = (name, collection) =>
      mongoose.models[name] ||
      mongoose.model(name, new mongoose.Schema({}, { strict: false }), collection);

    const BookingsClean = getModel("BookingsClean", "bookings_clean");

    const result = await BookingsClean.aggregate([
      {
        $group: {
          _id: null,
          total_bookings: { $sum: 1 },
          avg_vtat: { $avg: { $ifNull: ["$Avg VTAT", 0] } },
          avg_ctat: { $avg: { $ifNull: ["$Avg CTAT", 0] } },
          avg_customer_rating: { $avg: { $ifNull: ["$Customer Rating", 0] } },
          cancelled: {
            $sum: {
              $cond: [{ $eq: ["$Booking Status", "Cancelled"] }, 1, 0],
            },
          },
        },
      },
    ]);

    res.json(result[0] || {
      total_bookings: 0,
      avg_vtat: 0,
      avg_ctat: 0,
      avg_customer_rating: 0,
      cancelled: 0,
    });
  } catch (err) {
    console.error("❌ Overview query failed:", err);
    res.status(500).json({ error: "Failed to fetch overview" });
  }
});



/* ------------------------------ CRUD: bookings ----------------------------- */
// Read single booking
router.get("/bookings/:bookingId", async (req, res) => {
  try {
    const bookingId = (req.params.bookingId || "").trim();
    if (!bookingId) return res.status(400).json({ error: "bookingId is required" });

    const doc = await BookingsClean.findOne({ "Booking ID": bookingId }).lean();
    if (!doc) return res.status(404).json({ error: "No booking found" });

    res.json(doc);
  } catch (err) {
    console.error("❌ Booking fetch failed:", err);
    res.status(500).json({ error: "Internal server error while fetching booking" });
  }
});

// /* ---------------------- CREATE BOOKING ---------------------- */
// router.post("/bookings", async (req, res) => {
//   try {
//     const BookingsClean =
//       mongoose.models.BookingsClean ||
//       mongoose.model("BookingsClean", new mongoose.Schema({}, { strict: false }), "bookings_clean");

//     const payload = req.body || {};
//     const bookingId = (payload["Booking ID"] || "").trim();

//     // Check if Booking ID is provided
//     if (!bookingId) {
//       return res.status(400).json({ error: "Booking ID is required" });
//     }

//     // Check for duplicate Booking ID
//     const existing = await BookingsClean.findOne({ "Booking ID": bookingId }).lean();
//     if (existing) {
//       return res.status(409).json({ error: "Booking ID already exists" });
//     }

//     // Create new document
//     const doc = await BookingsClean.create(payload);
//     res.json(doc);
//   } catch (err) {
//     console.error("❌ Booking create failed:", err);
//     res.status(500).json({ error: "Internal server error while creating booking" });
//   }
// });


/* ---------------------- UPDATE BOOKING ---------------------- */
router.put("/bookings/:bookingId", async (req, res) => {
  try {
    const bookingId = req.params.bookingId.trim();
    const BookingsClean =
      mongoose.models.BookingsClean ||
      mongoose.model("BookingsClean", new mongoose.Schema({}, { strict: false }), "bookings_clean");

    const updated = await BookingsClean.findOneAndUpdate(
      { "Booking ID": bookingId },
      { $set: req.body },
      { new: true }
    ).lean();

    if (!updated) return res.status(404).json({ error: "No booking found" });
    res.json(updated);
  } catch (err) {
    console.error("❌ Update booking failed:", err);
    res.status(500).json({ error: "Failed to update booking" });
  }
});

/* ---------------------- DELETE BOOKING ---------------------- */
router.delete("/bookings/:bookingId", async (req, res) => {
  try {
    const bookingId = req.params.bookingId.trim();
    const BookingsClean =
      mongoose.models.BookingsClean ||
      mongoose.model("BookingsClean", new mongoose.Schema({}, { strict: false }), "bookings_clean");

    const deleted = await BookingsClean.findOneAndDelete({ "Booking ID": bookingId }).lean();

    if (!deleted) return res.status(404).json({ error: "No booking found" });
    res.json({ success: true, deleted });
  } catch (err) {
    console.error("❌ Delete booking failed:", err);
    res.status(500).json({ error: "Failed to delete booking" });
  }
});

// DEBUG ROUTE — to inspect actual MongoDB data
router.get("/bookings/debug", async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const docs = await db.collection("bookings_clean").find().limit(3).toArray();
    res.json(docs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch debug data" });
  }
});


// In mongoRoutes.js
router.get("/bookings/recommendations", async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const collection = db.collection("bookings_clean");

    const results = await collection.aggregate([
      {
        $facet: {
          topDrivers: [
            {
              $group: {
                _id: "$Driver ID",
                avgRating: { $avg: "$Customer Rating" },
                completionRate: {
                  $avg: {
                    $cond: [{ $eq: ["$Booking Status", "Completed"] }, 1, 0],
                  },
                },
                totalRides: { $sum: 1 },
              },
            },
            { $sort: { avgRating: -1, completionRate: -1, totalRides: -1 } },
            { $limit: 5 },
          ],

          topLocations: [
            {
              $group: {
                _id: "$Pickup Location",
                totalBookings: { $sum: 1 },
                avgCTAT: { $avg: "$Avg CTAT" },
              },
            },
            { $sort: { totalBookings: -1 } },
            { $limit: 5 },
          ],
        },
      },
    ]).toArray();

    res.json(results[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch recommendations" });
  }
});

/* ------------------ COMPLEX QUERY: Global Recommendations ------------------ */
router.get("/bookings/global-recommendations", async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const collection = db.collection("bookings_clean");

    console.log("🔍 Connected to collection:", collection.collectionName);

    // Run aggregation pipeline
    const result = await collection
      .aggregate([
        {
          $facet: {
            // 🚙️ Top 5 Vehicle Types
            topVehicles: [
              {
                $match: {
                  "Vehicle Type": { $exists: true, $ne: null, $ne: "" },
                },
              },
              {
                $group: {
                  _id: "$Vehicle Type",
                  avgCustomerRating: {
                    $avg: { $ifNull: ["$Customer Rating", 0] },
                  },
                  avgDriverRating: {
                    $avg: { $ifNull: ["$Driver Ratings", 0] },
                  },
                  avgBookingValue: {
                    $avg: { $ifNull: ["$Booking Value", 0] },
                  },
                  avgVTAT: { $avg: { $ifNull: ["$Avg VTAT", 0] } },
                  avgCTAT: { $avg: { $ifNull: ["$Avg CTAT", 0] } },
                  totalRides: { $sum: 1 },
                },
              },
              { $sort: { totalRides: -1, avgCustomerRating: -1 } },
              { $limit: 5 },
            ],

            // 💳 Top 5 Payment Methods
            topPaymentMethods: [
              {
                $match: {
                  "Payment Method": { $exists: true, $ne: null, $ne: "" },
                },
              },
              {
                $group: {
                  _id: "$Payment Method",
                  totalBookings: { $sum: 1 },
                  avgBookingValue: {
                    $avg: { $ifNull: ["$Booking Value", 0] },
                  },
                  avgCustomerRating: {
                    $avg: { $ifNull: ["$Customer Rating", 0] },
                  },
                },
              },
              { $sort: { totalBookings: -1 } },
              { $limit: 5 },
            ],

            // 📍 Top 5 Pickup Locations
            topPickupLocations: [
              {
                $match: {
                  "Pickup Location": { $exists: true, $ne: null, $ne: "" },
                },
              },
              {
                $group: {
                  _id: "$Pickup Location",
                  totalBookings: { $sum: 1 },
                },
              },
              { $sort: { totalBookings: -1 } },
              { $limit: 5 },
            ],
          },
        },
      ])
      .toArray();

    const finalData =
      result && result[0]
        ? result[0]
        : { topVehicles: [], topPaymentMethods: [], topPickupLocations: [] };

    console.log("✅ Aggregation completed successfully.");
    console.log(
      "📊 Preview:",
      JSON.stringify(
        {
          topVehicles: finalData.topVehicles?.length || 0,
          topPaymentMethods: finalData.topPaymentMethods?.length || 0,
          topPickupLocations: finalData.topPickupLocations?.length || 0,
        },
        null,
        2
      )
    );

    res.json(finalData);
  } catch (err) {
    console.error("❌ Error in /bookings/global-recommendations:", err);
    res
      .status(500)
      .json({ error: "Failed to fetch global recommendations", details: err.message });
  }
});

/* ------------------------ Profiles, Snapshots, Decide ---------------------- */
// Fetch customer profile
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

// Fetch customer snapshot
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

// Decision logic
router.post("/decide", async (req, res) => {
  try {
    const { customerId, vehicleType, hour, dayOfWeek } = req.body || {};
    if (!customerId) return res.status(400).json({ error: "customerId required" });

    const snap = await CustomerSnapshots.findOne({ _id: customerId }).lean();
    if (!snap) return res.status(404).json({ error: "Snapshot not found for ID" });

    const rating = Number(snap?.metrics?.avg_customer_rating ?? 0);
    const weekday = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].includes(dayOfWeek || "");
    let action = { kind: "none" };

    if (rating >= 4.5 && weekday && Number(hour) >= 6 && Number(hour) < 10 && ["Sedan", "Premier"].includes(vehicleType)) {
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


// ================================================================
// 💡 Promotions Decision Logic (/api/mongo/decide)
// ================================================================
router.post("/decide", async (req, res) => {
  try {
    const { customerId, vehicleType, hour, dayOfWeek } = req.body;
    if (!customerId)
      return res.status(400).json({ error: "Missing customerId" });

    const db = mongoose.connection.db;
    const customers = db.collection("customer_snapshots");

    // Step 1: Load customer's latest snapshot
    const snapshot = await customers.findOne({ "Customer ID": customerId });
    if (!snapshot)
      return res.status(404).json({ error: "Customer not found" });

    // Step 2: Derive engagement & behavior metrics
    const totalRides = snapshot["Total Rides"] || 0;
    const avgRating = snapshot["Average Rating"] || 0;
    const lastActiveDays = snapshot["Days Since Last Ride"] || 999;

    // Step 3: Apply promotional rules
    let promo = null;

    // Rule A: New or inactive users → 20% discount
    if (totalRides < 5 || lastActiveDays > 14) {
      promo = { kind: "discount", valuePct: 20, reason: "Reactivation offer" };
    }

    // Rule B: Loyal users (many rides + high rating) → 10%
    else if (totalRides >= 50 && avgRating >= 4.5) {
      promo = { kind: "discount", valuePct: 10, reason: "Loyalty reward" };
    }

    // Rule C: Off-peak hour (before 8AM or after 9PM) → 15%
    else if (hour < 8 || hour > 21) {
      promo = { kind: "discount", valuePct: 15, reason: "Off-peak incentive" };
    }

    // Rule D: Weekends + Bike type → 25%
    else if (["Saturday", "Sunday"].includes(dayOfWeek) && vehicleType === "Bike") {
      promo = { kind: "discount", valuePct: 25, reason: "Weekend bike promo" };
    }

    // Default → No promotion
    const decision = promo
      ? {
          action: promo,
          eligible: true,
          appliedAt: new Date(),
          criteriaMatched: promo.reason,
        }
      : {
          action: { kind: "none" },
          eligible: false,
          criteriaMatched: "No rules matched",
        };

    res.json(decision);
  } catch (err) {
    console.error("❌ Error in /decide:", err);
    res.status(500).json({ error: "Failed to evaluate promotion" });
  }
});


// GET /api/mongo/promotions/eligibility-facets?hour=18&day=Sunday&vehicle=Bike&forCustomer=CID123
router.get("/promotions/eligibility-facets", async (req, res) => {
  try {
    const hour = Number(req.query.hour ?? 18);
    const day = String(req.query.day ?? "Sunday");
    const vehicle = String(req.query.vehicle ?? "Bike"); // reserved for future filters
    const forCustomer = String(req.query.forCustomer || "").trim();

    const db = mongoose.connection.db;
    const snaps = db.collection("customer_snapshots");

    // ---- (A) Optional cohort anchor based on a reference customer
    let cohortMatch = null;
    if (forCustomer) {
      const ref = await snaps.findOne({ _id: forCustomer });
      if (ref) {
        // NOTE: ref fields may be strings in your dataset; coerce to numbers for windows
        const refRides = typeof ref["Total Rides"] === "number" ? ref["Total Rides"] : Number(ref["Total Rides"]);
        const refRating = typeof ref["Average Rating"] === "number" ? ref["Average Rating"] : Number(ref["Average Rating"]);
        const refLast = typeof ref["Days Since Last Ride"] === "number" ? ref["Days Since Last Ride"] : Number(ref["Days Since Last Ride"]);

        cohortMatch = {
          ...(Number.isFinite(refRides)
            ? { "Total Rides": { $gte: Math.max(0, refRides - 10), $lte: refRides + 10 } }
            : {}),
          ...(Number.isFinite(refRating)
            ? { "Average Rating": { $gte: refRating - 0.5, $lte: refRating + 0.5 } }
            : {}),
          ...(Number.isFinite(refLast)
            ? { "Days Since Last Ride": { $gte: Math.max(0, refLast - 7), $lte: refLast + 7 } }
            : {}),
        };
      }
    }

    const pipeline = [
      // ---- (B) Apply cohort narrowing first (if any)
      ...(cohortMatch ? [{ $match: cohortMatch }] : []),

      // ---- (C) Cast types once so numeric math/buckets work (avoids "other")
      {
        $addFields: {
          _totalRides: {
            $cond: [
              { $in: [{ $type: "$Total Rides" }, ["int", "long", "double", "decimal"]] },
              "$Total Rides",
              {
                $cond: [
                  { $eq: [{ $type: "$Total Rides" }, "string"] },
                  { $toInt: { $trim: { input: "$Total Rides" } } },
                  null
                ]
              }
            ]
          },
          _avgRating: {
            $cond: [
              { $in: [{ $type: "$Average Rating" }, ["int", "long", "double", "decimal"]] },
              "$Average Rating",
              {
                $cond: [
                  { $eq: [{ $type: "$Average Rating" }, "string"] },
                  { $toDouble: { $trim: { input: "$Average Rating" } } },
                  null
                ]
              }
            ]
          }
        }
      },

      // ---- (D) Rule-based eligibility using the casted fields
      {
        $match: {
          $expr: {
            $or: [
              // Reactivation
              { $lt: ["$_totalRides", 5] },
              // Loyalty (weekday morning)
              {
                $and: [
                  { $gte: ["$_avgRating", 4.5] },
                  { $in: [day, ["Monday","Tuesday","Wednesday","Thursday","Friday"]] },
                  { $and: [{ $gte: [hour, 6] }, { $lt: [hour, 10] }] }
                ]
              },
              // Off-peak (late night or very early)
              { $or: [{ $lt: [hour, 8] }, { $gt: [hour, 21] }] }
            ]
          }
        }
      },

      // ---- (E) Facets (use casted fields for buckets)
      {
        $facet: {
          byRating: [
            {
              $bucket: {
                groupBy: "$_avgRating",
                boundaries: [0, 3, 3.5, 4, 4.5, 5.1],
                default: "other",
                output: { count: { $sum: 1 } }
              }
            }
          ],
          byRideCount: [
            {
              $bucket: {
                groupBy: "$_totalRides",
                boundaries: [0, 5, 20, 50, 100, 10000],
                default: "other",
                output: { count: { $sum: 1 } }
              }
            }
          ],
          byDayHour: [
            { $project: { DayOfWeek: 1, Hour: 1 } },
            { $group: { _id: { d: "$DayOfWeek", h: "$Hour" }, n: { $sum: 1 } } },
            { $sort: { "_id.d": 1, "_id.h": 1 } }
          ],
          suggestedBand: [
            {
              $project: {
                band: {
                  $switch: {
                    branches: [
                      { case: { $lt: ["$_totalRides", 5] }, then: "20% Reactivation" },
                      {
                        case: {
                          $and: [
                            { $gte: ["$_avgRating", 4.5] },
                            { $in: [day, ["Monday","Tuesday","Wednesday","Thursday","Friday"]] },
                            { $and: [{ $gte: [hour, 6] }, { $lt: [hour, 10] }] }
                          ]
                        },
                        then: "10% Loyalty (AM commute)"
                      },
                      { case: { $or: [{ $lt: [hour, 8] }, { $gt: [hour, 21] }] }, then: "15% Off-peak" }
                    ],
                    default: "No promo"
                  }
                }
              }
            },
            { $group: { _id: "$band", customers: { $sum: 1 } } },
            { $sort: { customers: -1 } }
          ]
        }
      }
    ];

    const [out] = await snaps.aggregate(pipeline).toArray();
    res.json(out ?? { byRating: [], byRideCount: [], byDayHour: [], suggestedBand: [] });
  } catch (err) {
    console.error("❌ eligibility-facets failed:", err);
    res.status(500).json({ error: "Failed to compute eligibility facets" });
  }
});







/* ----------------------------- Dashboard Routes ---------------------------- */
// Overall KPI summary
router.get("/summary", async (_req, res) => {
  try {
    const result = await BookingsClean.aggregate([
      {
        $group: {
          _id: null,
          total_bookings: { $sum: 1 },
          avg_vtat: { $avg: "$Avg VTAT" },
          avg_ctat: { $avg: "$Avg CTAT" },
          avg_customer_rating: { $avg: "$Customer Rating" },
        },
      },
    ]);
    const data = result[0] || { total_bookings: 0, avg_vtat: 0, avg_ctat: 0, avg_customer_rating: 0 };
    res.json(data);
  } catch (err) {
    console.error("❌ Summary fetch failed:", err);
    res.status(500).json({ error: "Failed to fetch overall summary" });
  }
});

// Customer list
router.get("/customers", async (_req, res) => {
  try {
    const customers = await CustomerProfiles.find({}, { _id: 1 }).limit(100).lean();
    res.json(customers);
  } catch (err) {
    console.error("❌ Customer list fetch failed:", err);
    res.status(500).json({ error: "Failed to fetch customers" });
  }
});


/* ------------------- ChangeStream: bookings_clean → profiles ----------------
   We keep incremental aggregation to customer_profiles only.
--------------------------------------------------------------------------- */
let watcherStarted = false;

async function startBookingsWatcher() {
  if (watcherStarted) return;
  watcherStarted = true;

  try {
    const cs = BookingsClean.watch([], { fullDocument: "updateLookup" });
    cs.on("change", async (change) => {
      try {
        const raw = change.fullDocument;
        if (!raw) return;

        const c = raw._canonical || {};
        const customer_id = c.customer_id || raw["Customer ID"];
        const status = c.status || raw["Booking Status"];

        if (!customer_id) return;

        const incObj = { "counts.bookings": 1 };
        if ((status || "").toLowerCase() === "completed") {
          incObj["counts.completed"] = 1;
        }

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

        const update = { $inc, $setOnInsert };
        if (vehicle) update.$inc[`preferences.vehicle_counts.${vehicle}`] = 1;
        if (payment) update.$inc[`preferences.payment_counts.${payment}`] = 1;
        if (pickup) update.$inc[`preferences.pickup_counts.${pickup}`] = 1;
        if (drop)   update.$inc[`preferences.drop_counts.${drop}`] = 1;
        if (hour !== null && hour !== undefined) update.$inc[`preferences.hour_counts.${hour}`] = 1;
        if (day) update.$inc[`preferences.day_counts.${day}`] = 1;

        await CustomerProfiles.updateOne({ _id: customer_id }, update, { upsert: true });

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
            {
              $set: {
                "preferences.most_used_vehicle_type": {
                  $let: {
                    vars: { arr: { $objectToArray: "$preferences.vehicle_counts" } },
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

if (mongoose.connection.readyState === 1) {
  startBookingsWatcher();
} else {
  mongoose.connection.once("open", () => startBookingsWatcher());
}

export default router;
