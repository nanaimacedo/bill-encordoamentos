import { type LucideIcon } from "lucide-react";

interface CardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label?: string;
  };
  className?: string;
}

export default function Card({
  title,
  value,
  icon: Icon,
  trend,
  className = "",
}: CardProps) {
  const trendPositive = trend && trend.value >= 0;

  return (
    <div className={`card p-5 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground-muted truncate">
            {title}
          </p>
          <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
          {trend && (
            <p
              className={`mt-1.5 text-xs font-medium flex items-center gap-1 ${
                trendPositive ? "text-primary-600" : "text-red-600"
              }`}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={trendPositive ? "" : "rotate-180"}
              >
                <polyline points="18 15 12 9 6 15" />
              </svg>
              {trendPositive ? "+" : ""}
              {trend.value}%{trend.label ? ` ${trend.label}` : ""}
            </p>
          )}
        </div>
        {Icon && (
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-50 text-primary-600 shrink-0">
            <Icon size={20} />
          </div>
        )}
      </div>
    </div>
  );
}
