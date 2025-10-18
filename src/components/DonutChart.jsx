import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import axios from "axios";

const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#9333ea"];

export default function DonutChart({ title, endpoint }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    axios.get(`http://localhost:5000/api/${endpoint}`)
        .then((res) => {
        const cleanData = res.data.map(d => ({
            ...d,
            revenue: Number(d.revenue) || 0,  //Force the revenue to go from a string to numeric
        }));
        setData(cleanData);
        })
        .catch((err) => console.error("❌ Error fetching donut chart data:", err));
    }, [endpoint]);


  return (
    <div className="bg-white dark:bg-[#181A20] shadow-sm p-4 rounded-2xl transition-colors duration-300">

      <h3 className="text-lg font-semibold mb-3">{title}</h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            dataKey="revenue"
            nameKey="vehicle_type"
            innerRadius="55%"
            outerRadius="70%"              
            paddingAngle={2}
            isAnimationActive={true}
            labelLine={false}            
            label={({ name, percent }) => 
                `${name}: ${(percent * 100).toFixed(1)}%`
            }
            >
            {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
            </Pie>

          <Tooltip />
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
