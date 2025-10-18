// backend/models/ride.js
import mongoose from "mongoose";

const rideSchema = new mongoose.Schema({
  rideId: String,
  pickupLocation: String,
  dropoffLocation: String,
  fare: Number,
  driverName: String,
  timestamp: { type: Date, default: Date.now },
});

const Ride = mongoose.model("Ride", rideSchema);

export default Ride;
