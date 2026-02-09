"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { ChartDataPoint } from "./types";
import { CHART_COLORS } from "./types";

interface ReportChartProps {
  chartType: string;
  data: ChartDataPoint[];
  stacked?: boolean;
  showLegend?: boolean;
  showGrid?: boolean;
  colors?: string[];
}

export default function ReportChart({
  chartType,
  data,
  stacked = false,
  showLegend = true,
  showGrid = true,
  colors = CHART_COLORS,
}: ReportChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        No data available
      </div>
    );
  }

  // Get data keys (exclude the first key which is usually the label/dimension)
  const keys = Object.keys(data[0]).filter(
    (k) => k !== "name" && typeof data[0][k] === "number"
  );
  const labelKey = Object.keys(data[0]).find(
    (k) => typeof data[0][k] === "string"
  ) || "name";

  // KPI Number
  if (chartType === "number") {
    const value = keys.length > 0 ? data[0][keys[0]] : data[0][Object.keys(data[0])[0]];
    const label = keys.length > 0 ? keys[0] : Object.keys(data[0])[0];
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-5xl font-bold text-gray-900">
          {typeof value === "number" ? value.toLocaleString() : String(value)}
        </p>
        <p className="text-sm text-gray-500 mt-2 capitalize">{label}</p>
      </div>
    );
  }

  // Data Table
  if (chartType === "table") {
    const allKeys = Object.keys(data[0]);
    return (
      <div className="overflow-x-auto max-h-80">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              {allKeys.map((key) => (
                <th
                  key={key}
                  className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                {allKeys.map((key) => (
                  <td key={key} className="px-3 py-2 text-gray-700">
                    {typeof row[key] === "number"
                      ? (row[key] as number).toLocaleString()
                      : String(row[key] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Pie Chart
  if (chartType === "pie") {
    const valueKey = keys[0] || Object.keys(data[0]).find((k) => typeof data[0][k] === "number") || "";
    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey={valueKey}
            nameKey={labelKey}
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={({ name, percent }: any) =>
              `${name ?? ""} (${((percent ?? 0) * 100).toFixed(0)}%)`
            }
            labelLine={false}
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={colors[index % colors.length]}
              />
            ))}
          </Pie>
          <Tooltip />
          {showLegend && <Legend />}
        </PieChart>
      </ResponsiveContainer>
    );
  }

  // Bar Chart
  if (chartType === "bar") {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
          <XAxis dataKey={labelKey} tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          {showLegend && keys.length > 1 && <Legend />}
          {keys.map((key, i) => (
            <Bar
              key={key}
              dataKey={key}
              fill={colors[i % colors.length]}
              radius={[4, 4, 0, 0]}
              stackId={stacked ? "stack" : undefined}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  // Line Chart
  if (chartType === "line") {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
          <XAxis dataKey={labelKey} tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          {showLegend && keys.length > 1 && <Legend />}
          {keys.map((key, i) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={colors[i % colors.length]}
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  // Area Chart (default)
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
        <XAxis dataKey={labelKey} tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        {showLegend && keys.length > 1 && <Legend />}
        {keys.map((key, i) => (
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            stroke={colors[i % colors.length]}
            fill={colors[i % colors.length]}
            fillOpacity={0.2}
            strokeWidth={2}
            stackId={stacked ? "stack" : undefined}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
