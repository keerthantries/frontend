import {
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell, Tooltip,
} from "recharts";

const enrollmentData = [
    { label: "1", value: 32 },
    { label: "2", value: 28 },
    { label: "3", value: 36 },
    { label: "4", value: 22 },
    { label: "5", value: 31 },
    { label: "6", value: 37 },
    { label: "7", value: 26 },
    { label: "8", value: 34 },
    { label: "9", value: 29 },
    { label: "10", value: 33 },
    { label: "11", value: 25 },
    { label: "12", value: 41 },
];

const StudentEnrollmentChart = () => {
    return (
        <ResponsiveContainer width="100%" height={160}>
            <BarChart
                data={enrollmentData}
                margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                barCategoryGap="145%" // spacing between bars
            >
                <Tooltip
                    cursor={{ fill: "rgba(199, 195, 200, 0.12)" }}
                    contentStyle={{
                        borderRadius: 16,
                        border: "none",
                        boxShadow: "1 12px 30px rgba(0, 76, 255, 0.16)",
                        fontSize: 11,
                        padding: "4px 10px",
                    }}
                    labelFormatter={() => ""}
                    formatter={(value) => [`${value} Students`, ""]}
                />

                <Bar
                    dataKey="value"
                    radius={[8, 8, 0, 0]} // rounded tops
                    barSize={22}          // width of each bar
                >
                    {enrollmentData.map((entry, index) => (
                        <Cell
                            key={entry.label}
                            fill={
                                index === enrollmentData.length - 1
                                    ? "#4F46E5"  // last bar – strong
                                    : "#E4E7FF"  // others – light
                            }
                        />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
};



export default StudentEnrollmentChart;
