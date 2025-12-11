import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip,
} from "recharts";

// demo data similar to the screenshot (small variations over time)
const salesData = [
    { value: 10000 },
    { value: 9200 },
    { value: 9800 },
    { value: 9100 },
    { value: 9700 },
    { value: 9300 },
    { value: 9900 },
    { value: 9400 },
    { value: 10100 },
    { value: 9500 },
    { value: 10200 },
    { value: 10500 },
];

const ThisWeekChart = () => {
  return (
    <ResponsiveContainer width="100%" height="80%">
      <AreaChart
        data={salesData}
        margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
      >
        <Tooltip
          cursor={{ stroke: "transparent", fill: "transparent" }}
          contentStyle={{
            borderRadius: 16,
            border: "none",
            boxShadow: "0 12px 30px rgba(15,23,42,0.12)",
            fontSize: 11,
            padding: "4px 10px",
          }}
          labelFormatter={() => ""}
          formatter={(value) => [`₹${value}`, "Sales"]}
        />

<defs>
  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.45} />  
    <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />  
  </linearGradient>
</defs>



        <Area
          type="monotone"
          dataKey="value"
          stroke="#215fdbff" 
          strokeWidth={3}
          fillOpacity={1}
          fill="url(#salesGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default ThisWeekChart;
