import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Chart({ title, endpoint }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Fetch chart data
    axios
      .get(`http://localhost:5001/api/${endpoint}`)
      .then((res) => {
        setData(res.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ Error fetching chart data:", err);
        setError("Failed to load chart data");
        setLoading(false);
      });

    // Detect dark mode via MutationObserver
    const html = document.documentElement;
    const observer = new MutationObserver(() => {
      setIsDark(html.classList.contains("dark"));
    });
    observer.observe(html, { attributes: true, attributeFilter: ["class"] });
    setIsDark(html.classList.contains("dark"));

    return () => observer.disconnect();
  }, [endpoint]);

  if (loading) return <p className="text-gray-500 dark:text-gray-400">Loading chart...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!data || data.length === 0) return <p className="text-gray-500 dark:text-gray-400">No data available</p>;

  // --- Binance theme colors ---
  const lineColor = isDark ? "#F0B90B" : "#2563eb";
  const activeDotColor = isDark ? "#F8D04C" : "#1e3a8a";
  const gridColor = isDark ? "#2A2D33" : "#E5E7EB";
  const axisColor = isDark ? "#EAECEF" : "#374151";
  const tooltipBg = isDark ? "#181A20" : "#ffffff";
  const tooltipText = isDark ? "#EAECEF" : "#111827";

  return (
    <div className="bg-white dark:bg-[#181A20] shadow-sm p-4 rounded-2xl">
      <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-yellow-400">{title}</h3>

      <div className="w-full h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey={endpoint === "rides-per-city" ? "city" : "month"}
              stroke={axisColor}
              tick={{ fill: axisColor }}
            />
            <YAxis
              domain={["dataMin - 10", "dataMax + 10"]}
              stroke={axisColor}
              tick={{ fill: axisColor }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: tooltipBg,
                color: tooltipText,
                border: isDark ? "1px solid #2A2D33" : "1px solid #E5E7EB",
                borderRadius: "8px",
              }}
              labelStyle={{
                color: isDark ? "#F0B90B" : "#2563eb",
              }}
            />
            <Line
              type="monotone"
              dataKey={endpoint === "rides-per-city" ? "rides" : "total_rides"}
              stroke={lineColor}
              strokeWidth={3}
              dot={{
                r: 5,
                fill: lineColor,
                stroke: isDark ? "#000" : "#fff",
                strokeWidth: 1.5,
              }}
              activeDot={{
                r: 8,
                stroke: activeDotColor,
                strokeWidth: 3,
                fill: "#000",
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
