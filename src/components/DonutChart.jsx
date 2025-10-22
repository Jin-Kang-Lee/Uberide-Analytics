import React, { useEffect, useState } from "react";
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts";
import axios from "axios";

export default function DonutChart({ title, endpoint }) {
  const [data, setData] = useState([]);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    axios.get(`http://localhost:5001/api/${endpoint}`)
        .then((res) => {
        const cleanData = res.data.map(d => ({
            ...d,
            revenue: Number(d.revenue) || 0,  //Force the revenue to go from a string to numeric
        }));
        setData(cleanData);
        })
        .catch((err) => console.error("❌ Error fetching donut chart data:", err));
    }, [endpoint]);

  const COLORS = isDark
    ? ["#F0B90B", "#FFD84C", "#CBB26A", "#9A8B4F", "#7A6F38"]
    : ["#2563eb", "#60A5FA", "#93C5FD", "#3B82F6", "#1E40AF"];

  return (
    <div className="bg-white dark:bg-[#181A20] shadow-sm p-4 rounded-2xl transition-colors duration-300">
      <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">
        {title}
      </h3>

      <div className="w-full h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="revenue" // change based on your backend output
              nameKey="vehicle_type"
              innerRadius={70}
              outerRadius={110}
              paddingAngle={5}
            >
              {data.map((_, i) => (
                <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
