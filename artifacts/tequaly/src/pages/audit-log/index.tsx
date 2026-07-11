import { useListAuditLog } from "@workspace/api-client-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Search, History, Terminal, Database } from "lucide-react";
import { useState, useMemo } from "react";

export default function AuditLogList() {
  const [search, setSearch] = useState("");
  const { data: logs, isLoading } = useListAuditLog({ limit: 100 }); // Get more for client-side filtering

  const filtered = useMemo(() => {
    if (!logs) return [];
    if (!search) return logs;
    const lowerSearch = search.toLowerCase();
    return logs.filter((item) => 
      item.acao.toLowerCase().includes(lowerSearch) || 
      item.entidade.toLowerCase().includes(lowerSearch) ||
      (item.usuario_nome && item.usuario_nome.toLowerCase().includes(lowerSearch)) ||
      (item.detalhes && item.detalhes.toLowerCase().includes(lowerSearch))
    );
  }, [logs, search]);

  const getActionColor = (acao: string) => {
    const a = acao.toLowerCase();
    if (a.includes('create') || a.includes('criar') || a.includes('insert')) return 'text-emerald-500';
    if (a.includes('delete') || a.includes('remove') || a.includes('excluir')) return 'text-destructive';
    if (a.includes('update') || a.includes('edit') || a.includes('atualizar')) return 'text-amber-500';
    return 'text-primary';
  };

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-100px)]">
      <PageHeader 
        title="Audit Trail" 
        description="Registro imutável de todas as ações no sistema."
      />

      <div className="flex items-center gap-4 bg-card/50 backdrop-blur p-4 rounded-xl border border-border/50 shrink-0">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Filtrar logs..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background/50 border-border/50 font-mono text-sm"
          />
        </div>
        <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest hidden sm:block">
          Mostrando {filtered.length} eventos
        </div>
      </div>

      <Card className="bg-[#0a0a0f] border-border/50 flex-1 overflow-hidden flex flex-col shadow-2xl relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-primary/50 to-transparent opacity-50"></div>
        <div className="p-3 border-b border-border/50 flex items-center gap-2 text-xs font-mono text-muted-foreground shrink-0 bg-background/20">
          <Terminal className="h-4 w-4 text-primary" />
          <span>TEQUALY_SYS_AUDIT_LOG --TAIL --FOLLOW</span>
        </div>
        <CardContent className="p-0 flex-1 overflow-hidden relative">
          <ScrollArea className="h-full w-full">
            <div className="p-4 sm:p-6 space-y-1 font-mono text-sm w-full">
              {isLoading ? (
                Array.from({ length: 15 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full bg-muted/10" />
                ))
              ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground/50 uppercase tracking-widest">
                  [EOF] NENHUM EVENTO ENCONTRADO
                </div>
              ) : (
                filtered.map((log) => (
                  <div key={log.id} className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4 py-1.5 hover:bg-white/5 px-2 rounded -mx-2 transition-colors border-b border-border/10 sm:border-none">
                    <span className="text-muted-foreground shrink-0 text-[11px] sm:w-[150px]">
                      {new Date(log.created_at).toISOString().replace('T', ' ').substring(0, 19)}
                    </span>
                    <span className="shrink-0 w-auto sm:w-[120px] text-muted-foreground/80 text-[11px]">
                      {log.usuario_nome || 'SYSTEM_AUTO'}
                    </span>
                    <span className={`shrink-0 w-auto sm:w-[100px] font-bold text-[11px] ${getActionColor(log.acao)}`}>
                      [{log.acao.toUpperCase()}]
                    </span>
                    <div className="flex-1 flex flex-col sm:flex-row sm:items-baseline gap-2 min-w-0">
                      <span className="text-primary/90 shrink-0 text-[11px]">
                        {log.entidade.toUpperCase()}{log.entidade_id ? `:${log.entidade_id}` : ''}
                      </span>
                      {log.detalhes && (
                        <span className="text-muted-foreground/70 truncate text-[11px]">
                          {log.detalhes}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
