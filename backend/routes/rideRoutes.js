import express from "express";
import Ride from "../models/ride.js";

const router = express.Router();

// Add a ride
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
router.get("/", async (req, res) => {
  try {
    const rides = await Ride.find();
    res.json(rides);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
