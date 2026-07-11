import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export type StatusType = 
  | "active" | "inactive" | "pending" | "completed" | "cancelled" | "overdue"
  | "aprovado" | "reprovado" | "em_andamento" | "concluido" | "aberto" | "fechado"
  | "ok" | "warning" | "critical";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalized = status.toLowerCase().replace(" ", "_");
  
  let variantClass = "bg-muted/50 text-muted-foreground border-muted-foreground/20";
  
  if (["active", "completed", "aprovado", "concluido", "fechado", "ok", "ativo"].includes(normalized)) {
    variantClass = "bg-[#059669]/10 text-[#10b981] border-[#059669]/30"; // Emerald
  } else if (["pending", "em_andamento", "warning", "aberto", "pendente"].includes(normalized)) {
    variantClass = "bg-[#d97706]/10 text-[#f59e0b] border-[#d97706]/30"; // Amber
  } else if (["cancelled", "reprovado", "overdue", "critical", "vencido", "cancelado", "inativo"].includes(normalized)) {
    variantClass = "bg-[#dc2626]/10 text-[#ef4444] border-[#dc2626]/30"; // Red
  }

  return (
    <Badge 
      variant="outline" 
      className={cn("uppercase font-mono tracking-widest text-[10px] px-2 py-0.5 rounded-sm whitespace-nowrap", variantClass, className)}
    >
      {status}
    </Badge>
  );
}
