import { ReactNode } from "react";
import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";

interface ProgressGaugeProps {
  value: number;
  label?: string;
  size?: number;
  /** カーソルを合わせたときにゲージの下に表示する補足情報（内訳の数値など） */
  hoverDetails?: ReactNode;
}

export default function ProgressGauge({ value, label, size = 180, hoverDetails }: ProgressGaugeProps) {
  // リングの塗りは100%（1周）で頭打ちにするが、中央に表示する数値は実際の値（100%超も）をそのまま出す
  const ringValue = Math.max(0, Math.min(100, value));
  const displayValue = Math.max(0, value);
  const color = displayValue >= 100 ? "#16a34a" : displayValue >= 70 ? "#2563eb" : "#d97706";

  return (
    <div className="group relative">
      <div className="relative" style={{ width: "100%", height: size }}>
        <ResponsiveContainer width="100%" height={size}>
          <RadialBarChart
            innerRadius="70%"
            outerRadius="100%"
            data={[{ name: "progress", value: ringValue }]}
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar dataKey="value" fill={color} background cornerRadius={8} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="text-2xl font-bold text-slate-800">{displayValue.toFixed(0)}%</div>
        </div>
      </div>
      {label && <div className="mt-1 text-center text-sm text-slate-500">{label}</div>}
      {hoverDetails && (
        <div className="pointer-events-none absolute left-1/2 top-full z-10 hidden w-max -translate-x-1/2 rounded border border-slate-200 bg-white p-2 text-xs shadow-lg group-hover:block">
          {hoverDetails}
        </div>
      )}
    </div>
  );
}
