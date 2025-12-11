import React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

export const trafficData = [
  { name: "Organic Search", value: 4305, color: "#A78BFA" },
  { name: "Social Media", value: 859, color: "#C4B5FD" },
  { name: "Referrals", value: 482, color: "#F9A8D4" },
  { name: "Others", value: 138, color: "#FACC6B" },
];

const TrafficSourcesChart = () => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Tooltip
          cursor={{ fill: "rgba(148,163,184,0.12)" }}
          contentStyle={{
            borderRadius: 12,
            border: "none",
            boxShadow: "0 10px 30px rgba(15,23,42,0.18)",
            fontSize: 11,
            padding: "4px 10px",
          }}
          formatter={(value, _name, props) => [
            value.toLocaleString(),
            props.payload?.name || "",
          ]}
        />

        <Pie
          data={trafficData}
          dataKey="value"
          nameKey="name"
          innerRadius="60%"
          outerRadius="90%"
          startAngle={90}
          endAngle={-270}
          paddingAngle={2}
          stroke="#FFFFFF"
          strokeWidth={3}
          isAnimationActive={true}
        >
          {trafficData.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
};

export default TrafficSourcesChart;
