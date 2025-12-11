import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

// Dummy data for ~30 days (you can replace with real data)
const activeStudentsData = [
  { day: 1, value: 120 },
  { day: 2, value: 135 },
  { day: 3, value: 128 },
  { day: 4, value: 110 },
  { day: 5, value: 105 },
  { day: 6, value: 130 },
  { day: 7, value: 142 },
  { day: 8, value: 118 },
  { day: 9, value: 126 },
  { day: 10, value: 115 },
  { day: 11, value: 108 },
  { day: 12, value: 123 },
  { day: 13, value: 140 },
  { day: 14, value: 136 },
  { day: 15, value: 112 },
  { day: 16, value: 119 },
  { day: 17, value: 132 },
  { day: 18, value: 145 },
  { day: 19, value: 138 },
  { day: 20, value: 120 },
  { day: 21, value: 125 },
  { day: 22, value: 134 },
  { day: 23, value: 142 },
  { day: 24, value: 139 },
  { day: 25, value: 128 },
  { day: 26, value: 115 },
  { day: 27, value: 122 },
  { day: 28, value: 137 },
  { day: 29, value: 129 },
  { day: 30, value: 118 },
];

const ActiveStudentsChart = () => {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart
        data={activeStudentsData}
        margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
        barCategoryGap="35%" // spacing between bars
      >
        {/* light horizontal grid lines like the template */}
        <CartesianGrid strokeDasharray="3 3" vertical={false} />

        {/* no visible X labels – clean style */}
        <XAxis
          dataKey="day"
          axisLine={false}
          tickLine={false}
          tick={false}
        />
        {/* no visible Y axis */}
        <YAxis hide />

        <Tooltip
          cursor={{ fill: "rgba(129,140,248,0.12)" }}
          contentStyle={{
            borderRadius: 12,
            border: "none",
            boxShadow: "0 10px 30px rgba(15,23,42,0.14)",
            fontSize: 11,
            padding: "4px 8px",
          }}
          labelFormatter={() => ""}
          formatter={(value) => [`${value} students`, "Active"]}
        />

        <Bar
          dataKey="value"
          fill="#9CA5FF"          // pastel purple like screenshot
          stroke="#7C89FF"
          strokeWidth={1}
          radius={[4, 4, 0, 0]}  // rounded tops
          maxBarSize={10}        // slim bars
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default ActiveStudentsChart;
