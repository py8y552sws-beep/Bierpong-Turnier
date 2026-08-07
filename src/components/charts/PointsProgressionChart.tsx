import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PointsProgressionPoint } from "../../logic/playerStats";
import styles from "./PointsProgressionChart.module.css";

interface PointsProgressionChartProps {
  readonly data: readonly PointsProgressionPoint[];
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: readonly { value: number; payload: PointsProgressionPoint }[] }) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload;
  if (!point) return null;
  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipLabel}>{point.label}</div>
      <div className={styles.tooltipValue}>{point.cumulativePoints} Punkte</div>
    </div>
  );
}

export function PointsProgressionChart({ data }: PointsProgressionChartProps) {
  return (
    <div className={styles.wrap}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={[...data]} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="pointsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--line)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--text-faint)", fontSize: 11 }}
            axisLine={{ stroke: "var(--line-strong)" }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: "var(--text-faint)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={38}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--line-strong)" }} />
          <Area
            type="monotone"
            dataKey="cumulativePoints"
            stroke="var(--accent)"
            strokeWidth={2}
            fill="url(#pointsFill)"
            dot={{ r: 3, fill: "var(--bg-elevated)", stroke: "var(--accent)", strokeWidth: 2 }}
            activeDot={{ r: 5, fill: "var(--accent)", stroke: "var(--bg-elevated)", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
