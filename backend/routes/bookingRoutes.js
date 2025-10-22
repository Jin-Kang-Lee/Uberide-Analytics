import express from "express";
import mongoose from "mongoose";
import { Booking } from "../models/booking.js";

const router = express.Router();

// Create dynamic collection accessors using mongoose.connection.db
const getCollection = (name) => mongoose.connection.db.collection(name);

router.get("/summary", async (req, res) => {
  try {
    // =========================================================
    // 1️⃣ BOOKING COLLECTION SUMMARY
    // =========================================================
    const bookingPromise = Booking.aggregate([
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          totalRevenue: {
            $sum: {
              $cond: [
                { $isNumber: "$Booking Value" },
                "$Booking Value",
                { $toDouble: "$Booking Value" },
              ],
            },
          },
          avgDistance: {
            $avg: {
              $cond: [
                { $isNumber: "$Ride Distance" },
                "$Ride Distance",
                { $toDouble: "$Ride Distance" },
              ],
            },
          },
          avgRating: {
            $avg: {
              $cond: [
                { $isNumber: "$Customer Rating" },
                "$Customer Rating",
                { $toDouble: "$Customer Rating" },
              ],
            },
          },
        },
      },
    ]);

    // =========================================================
    // 2️⃣ OTHER COLLECTIONS — DIRECT MONGO QUERIES
    // =========================================================
    const db = mongoose.connection.db;

    const vehiclePromise = db
      .collection("vehicle_stats")
      .aggregate([
        {
          $group: {
            _id: null,
            avgCompletionRate: { $avg: { $toDouble: "$reliability.completion_rate" } },
            avgVehicleRating: { $avg: { $toDouble: "$experience.avg_customer_rating" } },
          },
        },
      ])
      .toArray();

    const timePromise = db
      .collection("time_buckets")
      .aggregate([
        {
          $group: {
            _id: null,
            avgVTAT: { $avg: { $toDouble: "$speed.avg_vtat" } },
            avgCTAT: { $avg: { $toDouble: "$speed.avg_ctat" } },
          },
        },
      ])
      .toArray();

    const locationPromise = db
      .collection("location_stats")
      .aggregate([
        {
          $group: {
            _id: null,
            avgZoneCompletion: { $avg: { $toDouble: "$rates.completion_rate" } },
          },
        },
      ])
      .toArray();

    // =========================================================
    // 3️⃣ RUN ALL IN PARALLEL
    // =========================================================
    const [bookingAgg, vehicleAgg, timeAgg, locationAgg] = await Promise.allSettled([
      bookingPromise,
      vehiclePromise,
      timePromise,
      locationPromise,
    ]);

    // =========================================================
    // 4️⃣ MERGE RESULTS (Safely even if some fail)
    // =========================================================
    const booking = bookingAgg.value?.[0] || {};
    const vehicle = vehicleAgg.value?.[0] || {};
    const time = timeAgg.value?.[0] || {};
    const location = locationAgg.value?.[0] || {};

    const summary = {
      totalBookings: booking.totalBookings || 0,
      totalRevenue: booking.totalRevenue || 0,
      avgDistance: booking.avgDistance || 0,
      avgRating: booking.avgRating || 0,
      avgVTAT: time.avgVTAT || 0,
      avgCTAT: time.avgCTAT || 0,
      completionRate: vehicle.avgCompletionRate || location.avgZoneCompletion || 0,
      vehicleRating: vehicle.avgVehicleRating || 0,
    };

    console.log("✅ Aggregated Summary:", summary);
    res.json(summary);
  } catch (err) {
    console.error("❌ Error aggregating MongoDB summary:", err);
    res.status(500).json({ error: "Failed to compute operational summary" });
  }
});

export default router;
