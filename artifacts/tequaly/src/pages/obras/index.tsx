import { useListObras } from "@workspace/api-client-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, MapPin, Calendar, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { useState, useMemo } from "react";

export default function ObrasList() {
  const [search, setSearch] = useState("");
  const { data: obras, isLoading } = useListObras();

  const filteredObras = useMemo(() => {
    if (!obras) return [];
    if (!search) return obras;
    const lowerSearch = search.toLowerCase();
    return obras.filter((obra) => 
      obra.nome.toLowerCase().includes(lowerSearch) || 
      obra.codigo.toLowerCase().includes(lowerSearch) ||
      (obra.gestor_responsavel && obra.gestor_responsavel.toLowerCase().includes(lowerSearch))
    );
  }, [obras, search]);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Obras" 
        description="Gerenciamento e visão geral dos projetos em andamento."
        actions={
          <Button className="font-mono uppercase tracking-widest text-xs">
            <Plus className="mr-2 h-4 w-4" /> Nova Obra
          </Button>
        }
      />

      <div className="flex items-center gap-4 bg-card/50 backdrop-blur p-4 rounded-xl border border-border/50">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nome, código ou gestor..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background/50 border-border/50"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl bg-card/50" />
          ))
        ) : filteredObras.length === 0 ? (
          <div className="col-span-full py-12 text-center border border-dashed rounded-xl border-border/50 bg-card/10">
            <p className="text-muted-foreground font-mono text-sm uppercase tracking-widest">Nenhuma obra encontrada</p>
          </div>
        ) : (
          filteredObras.map((obra) => (
            <Link key={obra.id} href={`/obras/${obra.id}`}>
              <Card className="group h-full bg-card/50 backdrop-blur border-border/50 hover:border-primary/50 transition-all cursor-pointer overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-primary/10 transition-colors" />
                <CardContent className="p-6 flex flex-col h-full z-10 relative">
                  <div className="flex justify-between items-start mb-4 gap-4">
                    <div>
                      <h3 className="text-lg font-bold uppercase tracking-tight group-hover:text-primary transition-colors line-clamp-2">
                        {obra.nome}
                      </h3>
                      <p className="text-sm font-mono text-muted-foreground mt-1">{obra.codigo}</p>
                    </div>
                    <StatusBadge status={obra.status} />
                  </div>
                  
                  {obra.descricao && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                      {obra.descricao}
                    </p>
                  )}
                  
                  <div className="mt-auto pt-4 border-t border-border/50 space-y-2">
                    <div className="flex items-center text-xs text-muted-foreground">
                      <User className="h-3.5 w-3.5 mr-2 text-primary/70" />
                      <span className="truncate">{obra.gestor_responsavel || 'Não atribuído'}</span>
                    </div>
                    {obra.localizacao && (
                      <div className="flex items-center text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 mr-2 text-primary/70" />
                        <span className="truncate">{obra.localizacao}</span>
                      </div>
                    )}
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 mr-2 text-primary/70" />
                      <span>
                        {obra.data_inicio ? new Date(obra.data_inicio).toLocaleDateString('pt-BR') : 'N/A'} 
                        {' → '} 
                        {obra.data_fim_prevista ? new Date(obra.data_fim_prevista).toLocaleDateString('pt-BR') : 'N/A'}
                      </span>
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
