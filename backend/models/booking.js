import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  Date: Date,
  Time: String,
  "Booking ID": String,
  "Booking Status": String,
  "Customer ID": String,
  "Vehicle Type": String,
  "Pickup Location": String,
  "Drop Location": String,
  "Booking Value": Number,
  "Ride Distance": Number,
  "Customer Rating": Number,
});

export const Booking = mongoose.model("Booking", bookingSchema, "bookings_clean");
