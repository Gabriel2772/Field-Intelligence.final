import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface DataCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
  className?: string;
}

export function DataCard({ title, value, description, icon, trend, className }: DataCardProps) {
  return (
    <Card className={cn("relative overflow-hidden border-border bg-card shadow-sm", className)}>
      <div className="absolute inset-y-0 left-0 w-1 bg-primary" aria-hidden="true" />
      <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3 pl-7">
        <CardTitle className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {title}
        </CardTitle>
        {icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-secondary text-primary">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent className="relative pl-7">
        <div className="text-3xl font-semibold tracking-[-0.04em] text-foreground">{value}</div>
        {(description || trend) && (
          <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {trend && (
              <span className={cn("font-semibold", trend.positive ? "text-emerald-400" : "text-red-400")}>
                {trend.positive ? "+" : "-"}{Math.abs(trend.value)}%
              </span>
            )}
            {description && <span>{description}</span>}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
