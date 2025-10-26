import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { fetchTopCustomers } from "../services/mongoAPI";

export default function CustomerAnalysis() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const d = await fetchTopCustomers();
        setRows(d || []);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="p-6">Loading…</div>;
  if (err) return <div className="p-6 text-red-600">Error: {err}</div>;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1">
        <Navbar title="Customer Value & Preferences" />
        <div className="p-6 bg-white rounded-2xl shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2 pr-4">Customer</th>
                  <th className="py-2 pr-4">Rides</th>
                  <th className="py-2 pr-4">Avg Booking Value</th>
                  <th className="py-2 pr-4">Avg Rating</th>
                  <th className="py-2 pr-4">Preferred Vehicle</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-t">
                    <td className="py-2 pr-4">{r.customer_id}</td>
                    <td className="py-2 pr-4">{r.rides?.toLocaleString?.() ?? r.rides}</td>
                    <td className="py-2 pr-4">{Number(r.avg_booking_value ?? 0).toFixed(2)}</td>
                    <td className="py-2 pr-4">{Number(r.avg_customer_rating ?? 0).toFixed(2)}</td>
                    <td className="py-2 pr-4">{r.preferred_vehicle_type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-xs text-gray-500">
            Use high-ride cohorts for loyalty and match promos to their preferred vehicle types.
          </div>
        </div>
      </div>
    </div>
  );
}
