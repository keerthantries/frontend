import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip,
} from "recharts";

// demo data similar to the screenshot (small variations over time)
const salesData = [
    { value: 7213 },
    { value: 11487 },
    { value: 7091 },
    { value: 11622 },
    { value: 7735 },
    { value: 11370 },
    { value: 7318 },
    { value: 11524 },
    { value: 7679 },
    { value: 9440 },
    { value: 7888 },
    { value: 14511 },
];

const TotalSalesChart = () => {
  return (
    <ResponsiveContainer width="100%" height="80%">
      <AreaChart
        data={salesData}
        margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
      >
        {/* No grid/axis for clean look */}
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
    <stop offset="0%" stopColor="#8054F6" stopOpacity={0.45} />
    <stop offset="100%" stopColor="#8054F6" stopOpacity={0} />
  </linearGradient>
</defs>


        <Area
          type="monotone"
          dataKey="value"
          stroke="#8054F6" 
          strokeWidth={3}
          fillOpacity={1}
          fill="url(#salesGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default TotalSalesChart;
