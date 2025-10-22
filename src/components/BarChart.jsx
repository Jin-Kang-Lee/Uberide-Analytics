import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import axios from "axios";

export default function CustomBarChart({ title, endpoint }) {
  const [data, setData] = useState([]);
  const [isDark, setIsDark] = useState(false);
  const [activeIndex, setActiveIndex] = useState(null);

  useEffect(() => {
    // ✅ Auto-switch between MySQL (5000) and MongoDB (5001)
    const baseURL = endpoint.startsWith("mongo/")
      ? "http://localhost:5002/api/"
      : "http://localhost:5001/api/";

    axios
      .get(`${baseURL}${endpoint}`)
      .then((res) => setData(res.data))
      .catch((err) => console.error("❌ Error fetching bar chart data:", err));

    const html = document.documentElement;
    const observer = new MutationObserver(() => {
      setIsDark(html.classList.contains("dark"));
    });
    observer.observe(html, { attributes: true, attributeFilter: ["class"] });
    setIsDark(html.classList.contains("dark"));

    return () => observer.disconnect();
  }, [endpoint]);

  const barColor = isDark ? "#F0B90B" : "#2563eb";
  const hoverColor = isDark ? "#FFD84C" : "#60A5FA";
  const gridColor = isDark ? "#2A2D33" : "#E5E7EB";
  const axisColor = isDark ? "#EAECEF" : "#374151";
  const tooltipBg = isDark ? "#181A20" : "#ffffff";
  const tooltipText = isDark ? "#EAECEF" : "#111827";

  return (
    <div className="bg-white dark:bg-[#181A20] shadow-sm p-4 rounded-2xl transition-colors duration-300">
      <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">
        {title}
      </h3>

      <div className="w-full h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 40, bottom: 10 }}
            onMouseMove={(state) => {
              if (state.isTooltipActive) {
                setActiveIndex(state.activeTooltipIndex);
              } else {
                setActiveIndex(null);
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis type="number" stroke={axisColor} tick={{ fill: axisColor }} />
            <YAxis
              dataKey="location_name"
              type="category"
              stroke={axisColor}
              tick={{ fill: axisColor }}
              width={100}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: tooltipBg,
                color: tooltipText,
                borderRadius: "8px",
                border: isDark ? "1px solid #2A2D33" : "1px solid #E5E7EB",
                boxShadow: isDark
                  ? "0 0 12px rgba(240,185,11,0.25)"
                  : "0 0 8px rgba(37,99,235,0.25)",
              }}
              labelStyle={{
                color: isDark ? "#F0B90B" : "#2563eb",
                fontWeight: 600,
              }}
              itemStyle={{ color: tooltipText }}
              cursor={{
                fill: isDark ? "rgba(240,185,11,0.05)" : "rgba(37,99,235,0.08)",
              }}
            />
            <Legend
              content={() => (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: "8px",
                  }}
                >
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      backgroundColor: barColor,
                      borderRadius: 3,
                      marginRight: 6,
                    }}
                  ></div>
                  <span style={{ color: axisColor, fontSize: "0.9rem" }}>
                    rides
                  </span>
                </div>
              )}
            />
            <Bar dataKey="rides" barSize={25} radius={[6, 6, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={index === activeIndex ? hoverColor : barColor}
                  stroke={index === activeIndex ? hoverColor : "none"}
                  strokeWidth={index === activeIndex ? 2 : 0}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
