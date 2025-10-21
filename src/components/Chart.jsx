import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import axios from "axios";

export default function Chart({ title, endpoint }) {
  const [data, setData] = useState([]);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const baseURL = endpoint.startsWith("mongo/")
      ? "http://localhost:5001/api/"
      : "http://localhost:5000/api/";

    axios
      .get(`${baseURL}${endpoint}`)
      .then((res) => setData(res.data))
      .catch((err) => console.error("❌ Error fetching line chart data:", err));

    const html = document.documentElement;
    const observer = new MutationObserver(() => {
      setIsDark(html.classList.contains("dark"));
    });
    observer.observe(html, { attributes: true, attributeFilter: ["class"] });
    setIsDark(html.classList.contains("dark"));

    return () => observer.disconnect();
  }, [endpoint]);

  const lineColor = isDark ? "#F0B90B" : "#2563eb";
  const gridColor = isDark ? "#2A2D33" : "#E5E7EB";
  const axisColor = isDark ? "#EAECEF" : "#374151";

  return (
    <div className="bg-white dark:bg-[#181A20] shadow-sm p-4 rounded-2xl transition-colors duration-300">
      <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">
        {title}
      </h3>

      <div className="w-full h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="date" stroke={axisColor} tick={{ fill: axisColor }} />
            <YAxis stroke={axisColor} tick={{ fill: axisColor }} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="rides"
              stroke={lineColor}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
