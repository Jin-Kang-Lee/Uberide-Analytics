import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import axios from "axios";

const COLORS = [
  "#2563eb", "#16a34a", "#f59e0b", "#dc2626",
  "#9333ea", "#14b8a6", "#EC4899", "#84cc16",
];

export default function MongoDonutChart({ title, endpoint, description }) {
  const [data, setData] = useState([]);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`http://localhost:5002/api/${endpoint}`);
        const formatted = res.data.map(item => ({
          label: item._id || item.label,
          value: item.count || item.value || 0,
        }));
        setData(formatted);
      } catch (err) {
        console.error(`❌ Error fetching Mongo donut data from ${endpoint}:`, err);
      }
    };
    fetchData();

    const html = document.documentElement;
    const observer = new MutationObserver(() => {
      setIsDark(html.classList.contains("dark"));
    });
    observer.observe(html, { attributes: true, attributeFilter: ["class"] });
    setIsDark(html.classList.contains("dark"));

    return () => observer.disconnect();
  }, [endpoint]);

  const tooltipBg = isDark ? "#181A20" : "#ffffff";
  const tooltipText = isDark ? "#EAECEF" : "#111827";

  return (
    <div className="bg-white dark:bg-[#181A20] shadow-sm p-4 rounded-2xl transition-colors duration-300">
      <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">{title}</h3>
      {description && (
        <p className="text-xs mb-4 text-gray-500 dark:text-gray-400">{description}</p>
      )}

      {data.length === 0 ? (
        <p className="text-center text-gray-400">No data available</p>
      ) : (
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius="55%"
              outerRadius="75%"
              paddingAngle={2}
              isAnimationActive={true}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>

            <Tooltip
              contentStyle={{
                backgroundColor: tooltipBg,
                color: tooltipText,
                borderRadius: "8px",
                border: isDark ? "1px solid #2A2D33" : "1px solid #E5E7EB",
              }}
              labelStyle={{ color: isDark ? "#F0B90B" : "#2563eb", fontWeight: 600 }}
              itemStyle={{ color: tooltipText }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => (
                <span style={{ color: isDark ? "#EAECEF" : "#374151" }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
