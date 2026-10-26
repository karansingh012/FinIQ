import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import { Empty } from "./ui";
export function ActivityChart({ data }) {
  if (!data?.some((d) => Number(d.activities) > 0))
    return (
      <Empty
        title="No activity yet"
        message="Your progress will appear as you learn."
      />
    );
  return (
    <div
      className="chart"
      role="img"
      aria-label="Learning activities over time"
    >
      <ResponsiveContainer width="100%" height={230}>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
        >
          <defs>
            <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6264df" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#6264df" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            strokeDasharray="3 4"
            stroke="#e9ecf3"
          />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            minTickGap={30}
            tick={{ fontSize: 11, fill: "#788197" }}
          />
          <YAxis
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#788197" }}
          />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="activities"
            stroke="#6264df"
            strokeWidth={2.5}
            fill="url(#activityFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
export function TopicChart({ data, value = "score" }) {
  return data?.length ? (
    <div className="chart" role="img" aria-label="Topic performance">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ left: 10, right: 25 }}
        >
          <CartesianGrid
            horizontal={false}
            strokeDasharray="3 4"
            stroke="#e9ecf3"
          />
          <XAxis
            type="number"
            domain={value === "score" ? [0, 100] : [0, "auto"]}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={100}
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip />
          <Bar
            dataKey={value}
            fill="#7a7ce4"
            radius={[0, 5, 5, 0]}
            barSize={17}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  ) : (
    <Empty
      title="No activity yet"
      message="Your progress will appear as you learn."
    />
  );
}
