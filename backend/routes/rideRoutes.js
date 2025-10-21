import express from "express";
import Ride from "../models/ride.js";
import mongoose from "mongoose";

const router = express.Router();

// Add a new ride
router.post("/", async (req, res) => {
  try {
    const newRide = new Ride(req.body);
    await newRide.save();
    res.status(201).json({ message: "Ride added successfully", newRide });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all rides
router.get("/rides", async (req, res) => {
  try {
    const rides = await Ride.find();
    res.json(rides);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get summary (aggregates)
router.get("/summary", async (req, res) => {
  try {
    // Access raw MongoDB driver through mongoose
    const db = mongoose.connection.db;
    const bookings = db.collection("bookings_clean");

    // Compute basic summary metrics
    const totalBookings = await bookings.countDocuments();
    const revenueData = await bookings
      .aggregate([
        { $group: { _id: null, totalRevenue: { $sum: "$fare_amount" } } },
      ])
      .toArray();
    const avgDistanceData = await bookings
      .aggregate([
        { $group: { _id: null, avgDistance: { $avg: "$ride_distance" } } },
      ])
      .toArray();

    const summary = {
      totalBookings,
      totalRevenue: revenueData[0]?.totalRevenue || 0,
      avgDistance: avgDistanceData[0]?.avgDistance || 0,
    };

    res.json(summary);
  } catch (error) {
    console.error("❌ Mongo summary error:", error);
    res.status(500).json({ error: "Failed to fetch summary" });
  }
});

export default router;
