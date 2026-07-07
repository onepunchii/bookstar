import { cn } from "@/lib/utils";

interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
  fillOpacity?: number;
  className?: string;
  showEndDot?: boolean;
}

export function Sparkline({
  values,
  width = 120,
  height = 32,
  color = "var(--color-brand-500)",
  fillOpacity = 0.15,
  className,
  showEndDot = true,
}: SparklineProps) {
  if (values.length === 0) {
    return <div className={cn("h-8 w-32", className)} />;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = values.length > 1 ? width / (values.length - 1) : 0;

  const points = values.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / range) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const line = `M ${points.join(" L ")}`;
  const area = `M 0,${height} L ${points.join(" L ")} L ${width},${height} Z`;

  const [endX, endY] = points[points.length - 1].split(",").map(Number);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={cn("overflow-visible", className)}
      preserveAspectRatio="none"
    >
      <path d={area} fill={color} fillOpacity={fillOpacity} />
      <path d={line} fill="none" stroke={color} strokeWidth={1.5} />
      {showEndDot && (
        <circle
          cx={endX}
          cy={endY}
          r={2.5}
          fill={color}
          stroke="#fff"
          strokeWidth={1}
        />
      )}
    </svg>
  );
}
