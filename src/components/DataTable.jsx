import React, { useEffect, useState } from "react";
import { fetchBookings } from "../services/api";

export default function DataTable() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadBookings = async () => {
      try {
        const data = await fetchBookings();
        setBookings(data);
      } catch (err) {
        console.error("Error fetching bookings:", err);
        setError("Failed to load bookings");
      } finally {
        setLoading(false);
      }
    };
    loadBookings();
  }, []);

  if (loading) {
    return <p className="text-center text-gray-500">Loading bookings...</p>;
  }

  if (error) {
    return <p className="text-center text-red-500">{error}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm text-left border-t">
        <thead className="bg-gray-100 text-gray-700">
          <tr>
            <th className="p-2">Booking ID</th>
            <th className="p-2">Customer</th>
            <th className="p-2">Pickup City</th>
            <th className="p-2">Drop City</th>
            <th className="p-2">Distance (km)</th>
            <th className="p-2">Fare ($)</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.booking_id} className="border-b hover:bg-gray-50">
              <td className="p-2">{b.booking_id}</td>
              <td className="p-2">{b.customer_name}</td>
              <td className="p-2">{b.pickup_city}</td>
              <td className="p-2">{b.drop_city}</td>
              <td className="p-2">{b.distance_km}</td>
              <td className="p-2">{b.fare_amount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
