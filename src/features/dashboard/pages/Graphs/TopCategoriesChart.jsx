// src/features/dashboard/TopCoursesChart.jsx
import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  Legend,
} from "recharts";

const topCoursesData = [
  {
    name: "Full-Stack Development",
    achieved: 65,
    remaining: 35,
    color: "#f98c45", // Web Dev color
    lightColor: "#FFE5D0",
  },
  {
    name: "Android Development",
    achieved: 55,
    remaining: 45,
    color: "#9cabff", // Mobile App color
    lightColor: "#D8E4FF",
  },
  {
    name: "iOS Development",
    achieved: 60,
    remaining: 40,
    color: "#8feac5", // Graphics color
    lightColor: "#D7FFF2",
  },
  {
    name: "Test Automation",
    achieved: 50,
    remaining: 50,
    color: "#79f1dc", // Marketing color
    lightColor: "#CFFAF7",
  },
  {
    name: "Machine Learning / AI",
    achieved: 70,
    remaining: 30,
    color: "#FF65B6", // ML color
    lightColor: "#FFD6EC",
  },
  {
    name: "Cyber Security",
    achieved: 60,
    remaining: 40,
    color: "#6A29FF", // Data Science color
    lightColor: "#D9CFFF",
  },
];

// Custom legend that shows each course with its bar color
const TopCoursesLegend = () => {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        marginTop: 8,
        fontSize: 12,
      }}
    >
      {topCoursesData.map((course) => (
        <div
          key={course.name}
          style={{ display: "flex", alignItems: "center", marginRight: 12 }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              marginRight: 6,
              backgroundColor: course.color,
              display: "inline-block",
            }}
          ></span>
          <span>{course.name}</span>
        </div>
      ))}
    </div>
  );
};

const TopCoursesChart = () => {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart
        data={topCoursesData}
        layout="vertical"
        margin={{ top: 10, right: 10, left: 0, bottom: 30 }}
        barCategoryGap={18}
      >
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="name" hide />

        <Bar
          dataKey="achieved"
          stackId="course"
          radius={[10, 0, 0, 10]}
          barSize={8}
        >
          {topCoursesData.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Bar>

        <Bar
          dataKey="remaining"
          stackId="course"
          radius={[0, 10, 10, 0]}
          barSize={8}
        >
          {topCoursesData.map((entry) => (
            <Cell key={entry.name} fill={entry.lightColor} />
          ))}
        </Bar>

        {/* Custom legend rendered below the chart */}
        <Legend
          verticalAlign="bottom"
          align="left"
          wrapperStyle={{ paddingTop: 8 }}
          content={<TopCoursesLegend />}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default TopCoursesChart;
