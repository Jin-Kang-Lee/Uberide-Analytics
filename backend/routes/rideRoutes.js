import express from "express";
import mongoose from "mongoose";

const router = express.Router();
const db = mongoose.connection;

// ============================================================================
// 1️⃣  SUMMARY (for KPI cards)
// ============================================================================
router.get("/summary", async (req, res) => {
  try {
    const bookings = db.collection("bookings_clean");

    const totalBookings = await bookings.countDocuments();

    const [revenue] = await bookings
      .aggregate([{ $group: { _id: null, total: { $sum: "$fare_amount" } } }])
      .toArray();

    const [distance] = await bookings
      .aggregate([{ $group: { _id: null, avg: { $avg: "$ride_distance" } } }])
      .toArray();

    const [rating] = await bookings
      .aggregate([{ $group: { _id: null, avg: { $avg: "$customer_rating" } } }])
      .toArray();

    const summary = {
      totalBookings,
      totalRevenue: revenue?.total?.toFixed(2) || 0,
      avgDistance: distance?.avg?.toFixed(2) || 0,
      avgRating: rating?.avg?.toFixed(2) || 0,
      completionRate: 95.6, // placeholder
    };

    res.json(summary);
  } catch (error) {
    console.error("❌ Mongo summary error:", error);
    res.status(500).json({ error: "Failed to fetch summary data" });
  }
});

// ============================================================================
// 2️⃣  BOOKING STATUS BREAKDOWN (Donut chart)
// ============================================================================
router.get("/booking-status", async (req, res) => {
  try {
    const bookings = db.collection("bookings_clean");

    const result = await bookings
      .aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ])
      .toArray();

    const formatted = result.map((r) => ({
      status: r._id || "Unknown",
      count: r.count,
    }));

    res.json(formatted);
  } catch (error) {
    console.error("❌ Error fetching booking status:", error);
    res.status(500).json({ error: "Failed to fetch booking status" });
  }
});

// ============================================================================
// 3️⃣  WEEKLY BOOKING PATTERNS (Bar chart)
// ============================================================================
router.get("/weekly-trends", async (req, res) => {
  try {
    const timeBuckets = db.collection("time_buckets");

    const result = await timeBuckets
      .aggregate([
        { $group: { _id: "$week", total: { $sum: "$total_bookings" } } },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    const formatted = result.map((r) => ({
      week: r._id,
      rides: r.total,
    }));

    res.json(formatted);
  } catch (error) {
    console.error("❌ Error fetching weekly trends:", error);
    res.status(500).json({ error: "Failed to fetch weekly trends" });
  }
});

// ============================================================================
// 4️⃣  RIDES TREND OVER TIME (Line chart)
// ============================================================================
router.get("/rides-trend", async (req, res) => {
  try {
    const timeBuckets = db.collection("time_buckets");

    const result = await timeBuckets
      .aggregate([
        { $group: { _id: "$date", rides: { $sum: "$total_bookings" } } },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    const formatted = result.map((r) => ({
      date: r._id,
      rides: r.rides,
    }));

    res.json(formatted);
  } catch (error) {
    console.error("❌ Error fetching rides trend:", error);
    res.status(500).json({ error: "Failed to fetch rides trend" });
  }
});

// ============================================================================
// 🚗  VEHICLE ANALYTICS (For MongoVehicles.jsx dashboard)
// ============================================================================

// 🔹 1. Bookings by Vehicle Type
router.get("/vehicle-stats/bookings", async (req, res) => {
  try {
    const vehicles = db.collection("vehicle_stats");
    const data = await vehicles
      .aggregate([
        { $group: { _id: "$vehicle_type", rides: { $sum: "$total_bookings" } } },
        { $sort: { rides: -1 } },
      ])
      .toArray();

    res.json(data.map((v) => ({ vehicle_type: v._id, rides: v.rides })));
  } catch (err) {
    console.error("❌ Error fetching vehicle bookings:", err);
    res.status(500).json({ error: "Failed to fetch vehicle bookings" });
  }
});

// 🔹 2. Completion Rate by Vehicle Type
router.get("/vehicle-stats/completion", async (req, res) => {
  try {
    const vehicles = db.collection("vehicle_stats");
    const data = await vehicles
      .aggregate([
        {
          $group: {
            _id: "$vehicle_type",
            completionRate: { $avg: "$completion_rate" },
          },
        },
        { $sort: { completionRate: -1 } },
      ])
      .toArray();

    res.json(
      data.map((v) => ({
        vehicle_type: v._id,
        completionRate: v.completionRate?.toFixed(2) || 0,
      }))
    );
  } catch (err) {
    console.error("❌ Error fetching vehicle completion:", err);
    res.status(500).json({ error: "Failed to fetch completion rate" });
  }
});

// 🔹 3. Revenue Distribution by Vehicle Type
router.get("/vehicle-stats/revenue", async (req, res) => {
  try {
    const vehicles = db.collection("vehicle_stats");
    const data = await vehicles
      .aggregate([
        { $group: { _id: "$vehicle_type", revenue: { $sum: "$total_revenue" } } },
        { $sort: { revenue: -1 } },
      ])
      .toArray();

    res.json(data.map((v) => ({ vehicle_type: v._id, revenue: v.revenue })));
  } catch (err) {
    console.error("❌ Error fetching revenue:", err);
    res.status(500).json({ error: "Failed to fetch revenue" });
  }
});

// 🔹 4. Average Ratings by Vehicle Type
router.get("/vehicle-stats/ratings", async (req, res) => {
  try {
    const feedback = db.collection("feedback_ratings");
    const data = await feedback
      .aggregate([
        { $group: { _id: "$vehicle_type", avgRating: { $avg: "$rating" } } },
        { $sort: { avgRating: -1 } },
      ])
      .toArray();

    res.json(
      data.map((v) => ({
        vehicle_type: v._id,
        avgRating: v.avgRating?.toFixed(2) || 0,
      }))
    );
  } catch (err) {
    console.error("❌ Error fetching ratings:", err);
    res.status(500).json({ error: "Failed to fetch ratings" });
  }
});

// 🔹 5. Reliability Breakdown (Cancellations by Reason)
router.get("/vehicle-stats/reliability", async (req, res) => {
  try {
    const metadata = db.collection("ride_metadata");
    const data = await metadata
      .aggregate([
        { $group: { _id: "$cancel_reason", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ])
      .toArray();

    res.json(
      data.map((v) => ({
        reason: v._id || "Unknown",
        count: v.count,
      }))
    );
  } catch (err) {
    console.error("❌ Error fetching reliability data:", err);
    res.status(500).json({ error: "Failed to fetch reliability breakdown" });
  }
});

// 🔹 6. Average VTAT & CTAT Trends
router.get("/vehicle-stats/vtat", async (req, res) => {
  try {
    const stats = db.collection("vehicle_stats");
    const data = await stats
      .aggregate([
        {
          $group: {
            _id: "$vehicle_type",
            avgVTAT: { $avg: "$avg_vtat" },
            avgCTAT: { $avg: "$avg_ctat" },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    res.json(
      data.map((v) => ({
        vehicle_type: v._id,
        avgVTAT: v.avgVTAT?.toFixed(2) || 0,
        avgCTAT: v.avgCTAT?.toFixed(2) || 0,
      }))
    );
  } catch (err) {
    console.error("❌ Error fetching VTAT/CTAT:", err);
    res.status(500).json({ error: "Failed to fetch turnaround trends" });
  }
});


// -----------------------------------------------------------------------------
// 🚗 VEHICLE DASHBOARD ROUTES (MongoDB)
// -----------------------------------------------------------------------------
router.get("/mongo/vehicle-bookings", async (req, res) => {
  try {
    const stats = db.collection("vehicle_stats");
    const data = await stats.find({}, { projection: { _id: 0, vehicle_type: 1, total_bookings: 1 } }).toArray();
    res.json(data.map(v => ({ vehicle_type: v.vehicle_type, rides: v.total_bookings || 0 })));
  } catch (err) {
    console.error("❌ Error fetching vehicle bookings:", err);
    res.status(500).json({ error: "Failed to fetch vehicle bookings" });
  }
});

router.get("/mongo/vehicle-completion", async (req, res) => {
  try {
    const stats = db.collection("vehicle_stats");
    const data = await stats.find({}, { projection: { _id: 0, vehicle_type: 1, completion_rate: 1 } }).toArray();
    res.json(data.map(v => ({ vehicle_type: v.vehicle_type, completion_rate: v.completion_rate || 0 })));
  } catch (err) {
    console.error("❌ Error fetching vehicle completion rate:", err);
    res.status(500).json({ error: "Failed to fetch vehicle completion" });
  }
});

router.get("/mongo/vehicle-revenue", async (req, res) => {
  try {
    const stats = db.collection("vehicle_stats");
    const data = await stats.find({}, { projection: { _id: 0, vehicle_type: 1, total_revenue: 1 } }).toArray();
    res.json(data.map(v => ({ vehicle_type: v.vehicle_type, revenue: v.total_revenue || 0 })));
  } catch (err) {
    console.error("❌ Error fetching vehicle revenue:", err);
    res.status(500).json({ error: "Failed to fetch vehicle revenue" });
  }
});

router.get("/mongo/vehicle-ratings", async (req, res) => {
  try {
    const stats = db.collection("vehicle_stats");
    const data = await stats.find({}, { projection: { _id: 0, vehicle_type: 1, avg_rating: 1 } }).toArray();
    res.json(data.map(v => ({ vehicle_type: v.vehicle_type, rating: v.avg_rating || 0 })));
  } catch (err) {
    console.error("❌ Error fetching vehicle ratings:", err);
    res.status(500).json({ error: "Failed to fetch vehicle ratings" });
  }
});

router.get("/mongo/vehicle-reliability", async (req, res) => {
  try {
    const stats = db.collection("vehicle_stats");
    const data = await stats.find({}, { projection: { _id: 0, vehicle_type: 1, reliability_index: 1 } }).toArray();
    res.json(data.map(v => ({ vehicle_type: v.vehicle_type, reliability: v.reliability_index || 0 })));
  } catch (err) {
    console.error("❌ Error fetching vehicle reliability:", err);
    res.status(500).json({ error: "Failed to fetch vehicle reliability" });
  }
});

router.get("/mongo/vehicle-vtat", async (req, res) => {
  try {
    const stats = db.collection("vehicle_stats");
    const data = await stats.find({}, { projection: { _id: 0, vehicle_type: 1, avg_vtat: 1 } }).toArray();
    res.json(data.map(v => ({ vehicle_type: v.vehicle_type, vtat: v.avg_vtat || 0 })));
  } catch (err) {
    console.error("❌ Error fetching VTAT data:", err);
    res.status(500).json({ error: "Failed to fetch VTAT" });
  }
});

router.get("/mongo/vehicle-ctat", async (req, res) => {
  try {
    const stats = db.collection("vehicle_stats");
    const data = await stats.find({}, { projection: { _id: 0, vehicle_type: 1, avg_ctat: 1 } }).toArray();
    res.json(data.map(v => ({ vehicle_type: v.vehicle_type, ctat: v.avg_ctat || 0 })));
  } catch (err) {
    console.error("❌ Error fetching CTAT data:", err);
    res.status(500).json({ error: "Failed to fetch CTAT" });
  }
});


export default router;
