import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { MapContainer, TileLayer, Circle, Tooltip, useMap } from "react-leaflet";
import { fetchCityInsights } from "../services/api";
import { FaCar, FaRupeeSign, FaStar, FaRuler, FaChartLine, FaWallet } from "react-icons/fa";
import "leaflet/dist/leaflet.css";

export default function CityInsights() {
  const [cityData, setCityData] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchCityInsights();
        setCityData(data);
      } catch (err) {
        console.error("❌ Error fetching city insights:", err);
      }
    };
    loadData();
  }, []);

  //Color scale based on revenue
  const getColor = (revenue) => {
    if (revenue > 1000000) return "#dc2626"; // red = very high revenue
    if (revenue > 500000) return "#f59e0b";  // orange = high
    if (revenue > 200000) return "#16a34a";  // green = medium
    return "#2563eb";                        // blue = low
  };

  // 🗺️ Auto-fit the map to all city markers
  function FitBoundsOnData({ cityData }) {
    const map = useMap();
    React.useEffect(() => {
      if (!cityData || cityData.length === 0) return;
      const bounds = cityData.map((c) => [c.latitude, c.longitude]);
      map.fitBounds(bounds, { padding: [80, 80] });
    }, [cityData, map]);
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0B0E11] text-gray-800 dark:text-gray-200">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Navbar />

        <main className="p-6 space-y-8 overflow-y-auto">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-yellow-400">
            🌍 City & Region Analysis
          </h2>

          {/* 🗺️ Map Section */}
          <div className="bg-white dark:bg-[#181A20] rounded-2xl p-4 shadow-sm h-[60vh]">
            <MapContainer center={[20.5937, 78.9629]} zoom={5} className="h-full w-full rounded-xl">
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />

              <FitBoundsOnData cityData={cityData} />

              {cityData.map((city, i) => (
                <Circle
                  key={i}
                  center={[city.latitude, city.longitude]}
                  radius={Math.sqrt(city.total_rides) * 100} // ← meters, adjust scaling factor
                  pathOptions={{
                    color: getColor(city.total_revenue),
                    fillColor: getColor(city.total_revenue),
                    fillOpacity: 0.6,
                  }}
                  eventHandlers={{
                    click: () => setSelectedCity(city), // 👈 when clicked, store city
                  }}
                >
                  <Tooltip direction="top" offset={[0, -5]} opacity={1}>
                    <div className="text-sm">
                      <strong>{city.city}</strong>
                      <br />Rides: {city.total_rides.toLocaleString()}
                      <br />Revenue: ₹{city.total_revenue.toLocaleString()}
                    </div>
                  </Tooltip>
                </Circle>
              ))}

            </MapContainer>

            {/* Side Info Panel */}
            {selectedCity && (
              <div className="absolute right-0 top-0 h-full w-80 bg-white dark:bg-[#181A20] shadow-xl border-l border-gray-200 dark:border-gray-700 z-[1000] flex flex-col animate-slideIn">
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-yellow-400 tracking-wide">
                    {selectedCity.city}
                  </h3>
                  <button
                    onClick={() => setSelectedCity(null)}
                    className="text-gray-400 hover:text-gray-600 text-xl"
                  >
                    
                  </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5 text-sm flex-1 overflow-y-auto">
                  {/* Ride Completion Rate */}
                  <div className="pb-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-1">
                      <FaChartLine className="text-blue-500 dark:text-yellow-400" />
                      <p className="uppercase text-s font-semibold tracking-wide text-gray-500 dark:text-gray-400">
                        Ride Completion Rate
                      </p>
                    </div>
                    <p className="text-lg font-medium text-gray-800 dark:text-gray-200">
                      {selectedCity.completion_rate && !isNaN(selectedCity.completion_rate)
                        ? `${Number(selectedCity.completion_rate).toFixed(1)}%`
                        : "N/A"}
                    </p>
                  </div>

                  {/* Revenue per km */}
                  <div className="pb-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-1">
                      <FaRupeeSign className="text-green-500 dark:text-yellow-400" />
                      <p className="uppercase text-s font-semibold tracking-wide text-gray-500 dark:text-gray-400">
                        Revenue per km
                      </p>
                    </div>
                    <p className="text-lg font-medium text-gray-800 dark:text-gray-200">
                      {selectedCity.revenue_per_km && !isNaN(selectedCity.revenue_per_km)
                        ? `₹${Number(selectedCity.revenue_per_km).toFixed(2)}`
                        : "N/A"}
                    </p>
                  </div>

                  {/* Payment Preference */}
                  <div className="pb-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-2">
                      <FaWallet className="text-purple-500 dark:text-yellow-400" />
                      <p className="uppercase text-s font-semibold tracking-wide text-gray-500 dark:text-gray-400">
                        Payment Preference
                      </p>
                    </div>
                    <div className="space-y-1 text-gray-700 dark:text-gray-300">
                      {selectedCity.payment_preference
                        ? selectedCity.payment_preference
                            .split(",")
                            .filter(item => !item.toLowerCase().includes("null"))
                            .map((method, i) => (
                              <div
                                key={i}
                                className="flex justify-between text-sm font-medium"
                              >
                                <span>{method.split(":")[0].trim()}</span>
                                <span className="text-gray-500 dark:text-gray-400">
                                  {method.split(":")[1]?.trim()}
                                </span>
                              </div>
                            ))
                        : "N/A"}
                    </div>
                  </div>

                  {/* Average Rating */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <FaStar className="text-yellow-500 dark:text-yellow-400" />
                      <p className="uppercase text-s font-semibold tracking-wide text-gray-500 dark:text-gray-400">
                        Average Rating
                      </p>
                    </div>
                    <p className="text-lg font-medium text-gray-800 dark:text-gray-200 flex items-center gap-1">
                      <FaStar className="text-yellow-500 dark:text-yellow-400" />
                      {selectedCity.avg_rating && !isNaN(selectedCity.avg_rating)
                        ? Number(selectedCity.avg_rating).toFixed(2)
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            )}



          </div>

          {/* 📊 Data Table Section */}
          <div className="bg-white dark:bg-[#181A20] rounded-2xl p-6 shadow-sm">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-yellow-400">
              📋 Top 10 Locations by Performance
            </h3>

            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  <tr className="bg-gray-100 dark:bg-[#222531]">
                    <th className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 text-left w-10">#</th>
                    <th className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 text-left">Location</th>

                    <th className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 text-left">
                      <div className="flex items-center gap-2">
                        <FaCar className="text-blue-600 dark:text-yellow-400" />
                        <span>Rides</span>
                      </div>
                    </th>

                    <th className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 text-left">
                      <div className="flex items-center gap-2">
                        <FaRupeeSign className="text-green-600 dark:text-yellow-400" />
                        <span>Revenue (₹)</span>
                      </div>
                    </th>

                    <th className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 text-left">
                      <div className="flex items-center gap-2">
                        <FaStar className="text-yellow-500 dark:text-yellow-400" />
                        <span>Avg Rating</span>
                      </div>
                    </th>

                    <th className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 text-left">
                      <div className="flex items-center gap-2">
                        <FaRuler className="text-purple-600 dark:text-yellow-400" />
                        <span>Avg Distance (km)</span>
                      </div>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {cityData.map((city, index) => (
                    <tr
                      key={index}
                      className="hover:bg-gray-50 dark:hover:bg-[#222531] transition-colors text-sm"
                    >
                      <td className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                        {index + 1}
                      </td>
                      <td className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 font-medium">
                        {city.city}
                      </td>
                      <td className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                        {city.total_rides.toLocaleString()}
                      </td>
                      <td className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                        ₹{city.total_revenue.toLocaleString()}
                      </td>
                      <td className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                        {city.avg_rating ?? "N/A"}
                      </td>
                      <td className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                        {city.avg_distance ?? "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
