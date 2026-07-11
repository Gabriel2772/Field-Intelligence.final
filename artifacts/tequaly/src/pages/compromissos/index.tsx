import { useListCompromissos } from "@workspace/api-client-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, CalendarCheck, User, Clock } from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

export default function CompromissosList() {
  const [search, setSearch] = useState("");
  const { data: compromissos, isLoading } = useListCompromissos();

  const filtered = useMemo(() => {
    if (!compromissos) return [];
    if (!search) return compromissos;
    const lowerSearch = search.toLowerCase();
    return compromissos.filter((item) => 
      item.descricao.toLowerCase().includes(lowerSearch) || 
      (item.responsavel && item.responsavel.toLowerCase().includes(lowerSearch))
    );
  }, [compromissos, search]);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Compromissos" 
        description="Acompanhamento de prazos, licenças e pendências legais."
        actions={
          <Button className="font-mono uppercase tracking-widest text-xs">
            <Plus className="mr-2 h-4 w-4" /> Novo Compromisso
          </Button>
        }
      />

      <div className="flex items-center gap-4 bg-card/50 backdrop-blur p-4 rounded-xl border border-border/50">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar compromissos..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background/50 border-border/50"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl bg-card/50" />
          ))
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center border border-dashed rounded-xl border-border/50 bg-card/10">
            <p className="text-muted-foreground font-mono text-sm uppercase tracking-widest">Nenhum compromisso encontrado</p>
          </div>
        ) : (
          filtered.map((item) => {
            const isOverdue = item.prazo && new Date(item.prazo) < new Date() && item.status.toLowerCase() !== 'concluido';
            return (
              <Card key={item.id} className={cn("group h-full bg-card/50 backdrop-blur border-border/50 transition-all", isOverdue && "border-destructive/50 bg-destructive/5")}>
                <CardContent className="p-5 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-4 gap-4">
                    <StatusBadge status={item.prioridade || 'Normal'} className={item.prioridade?.toLowerCase() === 'alta' ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' : ''} />
                    <StatusBadge status={item.status} />
                  </div>
                  
                  <h3 className="text-sm font-medium tracking-tight mb-4 flex-1">
                    {item.descricao}
                  </h3>
                  
                  <div className="mt-auto pt-4 border-t border-border/50 space-y-2">
                    <div className="flex items-center text-xs text-muted-foreground">
                      <User className="h-3.5 w-3.5 mr-2 text-primary/70" />
                      <span className="truncate">{item.responsavel || 'Não atribuído'}</span>
                    </div>
                    <div className={cn("flex items-center text-xs text-muted-foreground", isOverdue && "text-destructive font-semibold")}>
                      <Clock className="h-3.5 w-3.5 mr-2" />
                      <span>{item.prazo ? new Date(item.prazo).toLocaleDateString('pt-BR') : 'Sem prazo'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
