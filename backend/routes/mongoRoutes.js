import express from "express";
import mongoose from "mongoose";
const router = express.Router();

const VehicleStats = mongoose.model("vehicle_stats", new mongoose.Schema({}, { strict: false }));
const Bookings = mongoose.model("bookings_clean", new mongoose.Schema({}, { strict: false }));

// ===================== SUMMARY =====================
router.get("/vehicle-stats/summary", async (req, res) => {
  try {
    const all = await VehicleStats.find();
    const totalVehicleTypes = all.length;
    const avgCompletionRate = all.reduce((a, b) => a + (b.completion_rate || 0), 0) / totalVehicleTypes;
    const avgRating = all.reduce((a, b) => a + (b.avg_rating || 0), 0) / totalVehicleTypes;
    const totalRevenue = all.reduce((a, b) => a + (b.revenue || 0), 0);

    res.json({
      totalVehicleTypes,
      avgCompletionRate,
      avgRating,
      totalRevenue,
    });
  } catch (err) {
    console.error("❌ Error in summary:", err);
    res.status(500).json({ error: "Failed to fetch summary" });
  }
});

// ===================== BOOKINGS BY VEHICLE TYPE =====================
router.get("/vehicle-stats/bookings", async (req, res) => {
  try {
    const data = await VehicleStats.find({}, { _id: 0, vehicle_type: 1, total_bookings: 1 });
    const formatted = data.map(d => ({
      label: d.vehicle_type,
      value: d.total_bookings || 0,
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

// ===================== COMPLETION RATE =====================
router.get("/vehicle-stats/completion", async (req, res) => {
  try {
    const data = await VehicleStats.find({}, { _id: 0, vehicle_type: 1, completion_rate: 1 });
    const formatted = data.map(d => ({
      label: d.vehicle_type,
      value: d.completion_rate || 0,
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch completion rates" });
  }
});

// ===================== REVENUE DISTRIBUTION =====================
router.get("/vehicle-stats/revenue", async (req, res) => {
  try {
    const data = await VehicleStats.find({}, { _id: 0, vehicle_type: 1, revenue: 1 });
    const formatted = data.map(d => ({
      label: d.vehicle_type,
      value: d.revenue || 0,
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch revenue" });
  }
});

// ===================== RATINGS =====================
router.get("/vehicle-stats/ratings", async (req, res) => {
  try {
    const data = await VehicleStats.find({}, { _id: 0, vehicle_type: 1, avg_rating: 1 });
    const formatted = data.map(d => ({
      label: d.vehicle_type,
      value: d.avg_rating || 0,
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch ratings" });
  }
});

// ===================== BOOKING STATUS DISTRIBUTION =====================
router.get("/vehicle-stats/status", async (req, res) => {
  try {
    const result = await Bookings.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $project: { label: "$_id", value: "$count", _id: 0 } },
    ]);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch status distribution" });
  }
});

export default router;
