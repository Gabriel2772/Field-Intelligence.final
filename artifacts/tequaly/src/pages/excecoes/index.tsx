import { useListExcecoes } from "@workspace/api-client-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, AlertOctagon, User, Calendar, ShieldAlert } from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

export default function ExcecoesList() {
  const [search, setSearch] = useState("");
  const { data: excecoes, isLoading } = useListExcecoes();

  const filtered = useMemo(() => {
    if (!excecoes) return [];
    if (!search) return excecoes;
    const lowerSearch = search.toLowerCase();
    return excecoes.filter((item) => 
      item.descricao.toLowerCase().includes(lowerSearch) || 
      (item.motivo && item.motivo.toLowerCase().includes(lowerSearch)) ||
      (item.aprovador && item.aprovador.toLowerCase().includes(lowerSearch))
    );
  }, [excecoes, search]);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Exceções" 
        description="Aprovações emergenciais, desvios de processo e aditivos críticos."
        actions={
          <Button className="font-mono uppercase tracking-widest text-xs" variant="destructive">
            <Plus className="mr-2 h-4 w-4" /> Solicitar Exceção
          </Button>
        }
      />

      <div className="flex items-center gap-4 bg-card/50 backdrop-blur p-4 rounded-xl border border-border/50">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar exceções ou justificativas..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background/50 border-border/50"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-xl bg-card/50" />
          ))
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center border border-dashed rounded-xl border-border/50 bg-card/10">
            <p className="text-muted-foreground font-mono text-sm uppercase tracking-widest">Nenhuma exceção registrada</p>
          </div>
        ) : (
          filtered.map((item) => {
            const isPending = item.status.toLowerCase() === 'pendente' || item.status.toLowerCase() === 'em análise';
            return (
              <Card key={item.id} className={cn("group h-full bg-card/50 backdrop-blur border-border/50 transition-all flex flex-col", isPending && "border-amber-500/50 bg-amber-500/5")}>
                <CardContent className="p-5 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-4 gap-4">
                    <div className="flex items-center gap-2">
                      <AlertOctagon className={cn("h-5 w-5", isPending ? "text-amber-500" : "text-primary")} />
                      <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">Obra: {item.obra_id}</span>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                  
                  <h3 className="text-sm font-bold tracking-tight mb-2">
                    {item.descricao}
                  </h3>
                  
                  {item.motivo && (
                    <div className="bg-muted/30 p-3 rounded text-xs text-muted-foreground mb-4 flex-1 italic border border-border/50">
                      <ShieldAlert className="h-3 w-3 inline mr-1 -mt-0.5" />
                      {item.motivo}
                    </div>
                  )}
                  
                  <div className="mt-auto pt-3 border-t border-border/50 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground uppercase font-mono text-[10px]">Aprovação</span>
                      <span className="font-medium flex items-center gap-1">
                        <User className="h-3 w-3 text-primary/70" /> {item.aprovador || 'Pendente'}
                      </span>
                    </div>
                    {item.data_aprovacao && (
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="uppercase font-mono text-[10px]">Data</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {new Date(item.data_aprovacao).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    )}
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
