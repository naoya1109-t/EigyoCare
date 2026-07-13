import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";

interface ProgressGaugeProps {
  value: number;
  label?: string;
  size?: number;
}

export default function ProgressGauge({ value, label, size = 180 }: ProgressGaugeProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const color = clamped >= 100 ? "#16a34a" : clamped >= 70 ? "#2563eb" : "#d97706";

  return (
    <div>
      <div className="relative" style={{ width: "100%", height: size }}>
        <ResponsiveContainer width="100%" height={size}>
          <RadialBarChart
            innerRadius="70%"
            outerRadius="100%"
            data={[{ name: "progress", value: clamped }]}
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar dataKey="value" fill={color} background cornerRadius={8} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="text-2xl font-bold text-slate-800">{clamped.toFixed(0)}%</div>
        </div>
      </div>
      {label && <div className="mt-1 text-center text-sm text-slate-500">{label}</div>}
    </div>
  );
}
