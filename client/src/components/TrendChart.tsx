import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

export interface Series {
  key: string;
  label: string;
  color?: string;
}

interface TrendChartProps<T> {
  data: T[];
  xKey: string;
  series: Series[];
  type?: "line" | "bar";
  height?: number;
  /** "horizontal": カテゴリを縦軸に並べる横棒グラフ。項目数が多いカテゴリ比較に向く */
  orientation?: "vertical" | "horizontal";
}

const DEFAULT_COLORS = ["#2563eb", "#16a34a", "#d97706", "#dc2626", "#7c3aed"];

export default function TrendChart<T extends object>({
  data,
  xKey,
  series,
  type = "line",
  height = 300,
  orientation = "vertical",
}: TrendChartProps<T>) {
  const Chart = type === "bar" ? BarChart : LineChart;
  const isHorizontalBars = type === "bar" && orientation === "horizontal";

  return (
    <ResponsiveContainer width="100%" height={height}>
      <Chart data={data} layout={isHorizontalBars ? "vertical" : "horizontal"}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          type={isHorizontalBars ? "number" : "category"}
          dataKey={isHorizontalBars ? undefined : xKey}
          domain={isHorizontalBars ? [0, "dataMax"] : undefined}
          tick={{ fontSize: 12 }}
        />
        <YAxis
          type={isHorizontalBars ? "category" : "number"}
          dataKey={isHorizontalBars ? xKey : undefined}
          domain={isHorizontalBars ? undefined : [0, "dataMax"]}
          tick={{ fontSize: 12 }}
          width={isHorizontalBars ? 100 : 60}
          interval={0}
        />
        <Tooltip />
        <Legend />
        {series.map((s, i) =>
          type === "bar" ? (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label}
              fill={s.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
            />
          ) : (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
              strokeWidth={2}
              dot={false}
            />
          ),
        )}
      </Chart>
    </ResponsiveContainer>
  );
}
