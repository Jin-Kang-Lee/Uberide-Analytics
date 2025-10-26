// backend/routes/mongoRoutes.js
import express from "express";
import mongoose from "mongoose";
const router = express.Router();

// Flexible models over existing collections (explicit collection binding)
const TimeBuckets = mongoose.model(
  "TimeBuckets",
  new mongoose.Schema({}, { strict: false, collection: "time_buckets" })
);
const LocationStats = mongoose.model(
  "LocationStats",
  new mongoose.Schema({}, { strict: false, collection: "location_stats" })
);
const VehicleStats = mongoose.model(
  "VehicleStats",
  new mongoose.Schema({}, { strict: false, collection: "vehicle_stats" })
);
const CustomerProfiles = mongoose.model(
  "CustomerProfiles",
  new mongoose.Schema({}, { strict: false, collection: "customer_profiles" })
);

// ---------- Executive Summary ----------
router.get("/summary", async (_req, res) => {
  try {
    const [doc] = await TimeBuckets.aggregate([
      {
        $project: {
          // counts (support both shapes)
          bookings_raw: { $ifNull: ["$counts.bookings", "$total_bookings"] },
          completed_raw: { $ifNull: ["$counts.completed", "$completed"] },
          no_driver_raw: { $ifNull: ["$counts.no_driver_found", "$no_driver_found"] },
          // time
          vtat_raw: { $ifNull: ["$speed.avg_vtat", "$avg_vtat"] },
          ctat_raw: { $ifNull: ["$speed.avg_ctat", "$avg_ctat"] },
          // experience / economics
          rating_raw: { $ifNull: ["$experience.avg_customer_rating", "$avg_customer_rating"] },
          fare_raw:   { $ifNull: ["$economics.avg_booking_value", "$avg_booking_value"] },
        }
      },
      {
        $project: {
          bookings:   { $toDouble: { $ifNull: ["$bookings_raw", 0] } },
          completed:  { $toDouble: { $ifNull: ["$completed_raw", 0] } },
          no_driver:  { $toDouble: { $ifNull: ["$no_driver_raw", 0] } },
          avg_vtat_val: { $convert: { input: "$vtat_raw", to: "double", onError: null, onNull: null } },
          avg_ctat_val: { $convert: { input: "$ctat_raw", to: "double", onError: null, onNull: null } },
          rating_val:   { $convert: { input: "$rating_raw", to: "double", onError: null, onNull: null } },
          fare_val:     { $convert: { input: "$fare_raw",   to: "double", onError: null, onNull: null } },
        }
      },
      {
        $group: {
          _id: null,
          total_rides: { $sum: "$bookings" },
          completed:   { $sum: "$completed" },
          no_driver:   { $sum: "$no_driver" },
          sum_bookings:{ $sum: "$bookings" },
          avg_vtat:    { $avg: "$avg_vtat_val" },
          avg_ctat:    { $avg: "$avg_ctat_val" },
          avg_rating:  { $avg: "$rating_val" },
          avg_fare:    { $avg: "$fare_val" },
        }
      },
      {
        $project: {
          _id: 0,
          total_rides: 1,
          completion_rate: {
            $cond: [{ $gt: ["$sum_bookings", 0] }, { $divide: ["$completed", "$sum_bookings"] }, null]
          },
          no_driver_rate: {
            $cond: [{ $gt: ["$sum_bookings", 0] }, { $divide: ["$no_driver", "$sum_bookings"] }, null]
          },
          avg_vtat: 1,
          avg_ctat: 1,
          avg_customer_rating: "$avg_rating",
          avg_fare: 1
        }
      }
    ]);

    res.json(
      doc || {
        total_rides: 0, completion_rate: null, no_driver_rate: null,
        avg_vtat: null, avg_ctat: null, avg_customer_rating: null, avg_fare: null
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to compute summary" });
  }
});

// ---------- Reliability & Time ----------
router.get("/time/hourly", async (_req, res) => {
  try {
    const data = await TimeBuckets.aggregate([
      { $sort: { dow: 1, hour: 1 } },
      {
        $project: {
          _id: 0,
          dow: 1,
          hour: 1,
          bookings: "$counts.bookings",
          completion_rate: "$rates.completion_rate",
          cancellation_rate: "$rates.cancellation_rate",
          avg_vtat: "$speed.avg_vtat",
          avg_ctat: "$speed.avg_ctat"
        }
      }
    ]);
    res.json(data);
  } catch {
    res.status(500).json({ error: "Failed to fetch hourly metrics" });
  }
});

router.get("/time/heatmap", async (_req, res) => {
  try {
    const heat = await TimeBuckets.aggregate([
      { $group: { _id: { dow: "$dow", hour: "$hour" }, bookings: { $sum: "$counts.bookings" } } },
      { $project: { _id: 0, dow: "$_id.dow", hour: "$_id.hour", bookings: 1 } },
      { $sort: { dow: 1, hour: 1 } }
    ]);
    res.json(heat);
  } catch {
    res.status(500).json({ error: "Failed to fetch heatmap" });
  }
});

// ---------- Zone Performance ----------
router.get("/locations/top", async (_req, res) => {
  try {
    const data = await LocationStats.aggregate([
      {
        $project: {
          _id: 0,
          pickup_location: 1,
          bookings: "$counts.bookings",
          completion_rate: "$rates.completion_rate",
          avg_vtat: "$speed.avg_vtat",
          avg_ctat: "$speed.avg_ctat",
          avg_customer_rating: "$quality.avg_customer_rating"
        }
      },
      { $sort: { bookings: -1 } },
      { $limit: 50 }
    ]);
    res.json(data);
  } catch {
    res.status(500).json({ error: "Failed to fetch locations" });
  }
});

router.get("/locations/problem-zones", async (_req, res) => {
  try {
    const TARGET_COMPLETION = 0.9;
    const MAX_CTAT = 15;

    const data = await LocationStats.aggregate([
      {
        $project: {
          _id: 0,
          pickup_location: 1,
          completion_rate: "$rates.completion_rate",
          avg_ctat: "$speed.avg_ctat",
          avg_customer_rating: "$quality.avg_customer_rating"
        }
      },
      // Rank by severity for top-5 surfacing
      {
        $addFields: {
          sev_completion: {
            $max: [0, { $subtract: [TARGET_COMPLETION, { $ifNull: ["$completion_rate", 0] }] }]
          },
          sev_ctat: {
            $max: [0, { $subtract: [{ $ifNull: ["$avg_ctat", 0] }, MAX_CTAT] }]
          },
          sev_rating: {
            $max: [0, { $subtract: [4.5, { $ifNull: ["$avg_customer_rating", 0] }] }]
          }
        }
      },
      {
        $addFields: {
          severity: {
            $add: [
              { $multiply: ["$sev_completion", 2] },
              "$sev_ctat",
              "$sev_rating"
            ]
          }
        }
      },
      {
        $match: {
          $or: [
            { completion_rate: { $lt: TARGET_COMPLETION } },
            { avg_ctat: { $gt: MAX_CTAT } },
            { avg_customer_rating: { $lt: 4.5 } }
          ]
        }
      },
      { $sort: { severity: -1 } },
      { $limit: 5 }
    ]);

    res.json(data);
  } catch {
    res.status(500).json({ error: "Failed to fetch problem zones" });
  }
});

// ---------- Fleet ----------
router.get("/vehicles/metrics", async (_req, res) => {
  try {
    const data = await VehicleStats.aggregate([
      {
        $project: {
          _id: 0,
          vehicle_type: 1,
          bookings: "$counts.bookings",
          completion_rate: "$reliability.completion_rate",
          avg_vtat: "$speed.avg_vtat",
          avg_ctat: "$speed.avg_ctat",
          avg_customer_rating: "$experience.avg_customer_rating"
        }
      },
      { $sort: { bookings: -1 } }
    ]);
    res.json(data);
  } catch {
    res.status(500).json({ error: "Failed to fetch vehicle metrics" });
  }
});

// ---------- Customers ----------
router.get("/customers/top", async (_req, res) => {
  try {
    const data = await CustomerProfiles.aggregate([
      {
        $project: {
          _id: 0,
          customer_id: 1,
          rides: "$counts.bookings",
          avg_booking_value: "$averages.booking_value",
          avg_customer_rating: "$averages.customer_rating",
          preferred_vehicle_type: "$preferences.most_used_vehicle_type"
        }
      },
      { $sort: { rides: -1 } },
      { $limit: 50 }
    ]);
    res.json(data);
  } catch {
    res.status(500).json({ error: "Failed to fetch customers" });
  }
});

export default router;
