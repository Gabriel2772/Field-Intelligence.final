import { useListRncs, useGetRncStats } from "@workspace/api-client-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Plus, Search, Info, ShieldAlert, Target } from "lucide-react";
import { Link } from "wouter";
import { useState, useMemo } from "react";
import { DataCard } from "@/components/ui/data-card";

export default function RncsList() {
  const [search, setSearch] = useState("");
  const { data: stats, isLoading: loadingStats } = useGetRncStats();
  const { data: rncs, isLoading: loadingRncs } = useListRncs();

  const filteredRncs = useMemo(() => {
    if (!rncs) return [];
    if (!search) return rncs;
    const lowerSearch = search.toLowerCase();
    return rncs.filter((rnc) => 
      rnc.numero.toLowerCase().includes(lowerSearch) || 
      rnc.descricao.toLowerCase().includes(lowerSearch)
    );
  }, [rncs, search]);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Relatórios de Não Conformidade" 
        description="Gestão de desvios, falhas e ocorrências críticas (RNCs)."
        actions={
          <Button className="font-mono uppercase tracking-widest text-xs" variant="destructive">
            <Plus className="mr-2 h-4 w-4" /> Registrar RNC
          </Button>
        }
      />

      {loadingStats ? (
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 bg-card/50" />)}
        </div>
      ) : stats ? (
        <div className="grid gap-4 md:grid-cols-4">
          <DataCard title="Total Registrado" value={stats.total} icon={<AlertTriangle className="h-4 w-4 text-primary" />} />
          <DataCard title="Críticos" value={stats.byGravidade.find(g => g.gravidade.toLowerCase() === 'crítica' || g.gravidade.toLowerCase() === 'alta')?.count || 0} icon={<ShieldAlert className="h-4 w-4 text-destructive" />} className="border-destructive/30" />
          <DataCard title="Em Aberto" value={stats.byStatus.find(s => s.status.toLowerCase() === 'aberto')?.count || 0} icon={<Target className="h-4 w-4 text-amber-500" />} />
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Por Tipo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.byTipo.slice(0, 3).map(tipo => (
                  <div key={tipo.tipo} className="flex justify-between items-center text-xs">
                    <span className="truncate mr-2 uppercase">{tipo.tipo}</span>
                    <span className="font-mono font-bold">{tipo.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className="flex items-center gap-4 bg-card/50 backdrop-blur p-4 rounded-xl border border-border/50">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por número ou descrição..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background/50 border-border/50"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loadingRncs ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl bg-card/50" />
          ))
        ) : filteredRncs.length === 0 ? (
          <div className="col-span-full py-12 text-center border border-dashed rounded-xl border-border/50 bg-card/10">
            <p className="text-muted-foreground font-mono text-sm uppercase tracking-widest">Nenhuma RNC encontrada</p>
          </div>
        ) : (
          filteredRncs.map((rnc) => (
            <Link key={rnc.id} href={`/rncs/${rnc.id}`}>
              <Card className="group h-full bg-card/50 backdrop-blur border-border/50 hover:border-primary/50 transition-all cursor-pointer flex flex-col">
                <CardContent className="p-5 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-4 gap-4">
                    <div>
                      <h3 className="text-lg font-bold font-mono tracking-tight group-hover:text-primary transition-colors">
                        {rnc.numero}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <StatusBadge status={rnc.gravidade || 'Normal'} className={rnc.gravidade?.toLowerCase() === 'alta' ? 'bg-destructive/10 text-destructive border-destructive/30' : ''} />
                      </div>
                    </div>
                    <StatusBadge status={rnc.status} />
                  </div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">
                    {rnc.descricao}
                  </p>
                  
                  <div className="mt-auto pt-3 border-t border-border/50 space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="uppercase font-mono text-[10px]">Tipo</span>
                      <span className="font-medium text-foreground">{rnc.tipo}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="uppercase font-mono text-[10px]">Identificação</span>
                      <span>{rnc.data_identificacao ? new Date(rnc.data_identificacao).toLocaleDateString('pt-BR') : 'N/A'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
