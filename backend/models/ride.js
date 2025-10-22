import mongoose from "mongoose";

const rideSchema = new mongoose.Schema({
  ride_id: String,
  status: String,
  fare: Number,
  distance: Number,
  rating: Number,
  date: Date,
});

export const Ride = mongoose.model("Ride", rideSchema);
