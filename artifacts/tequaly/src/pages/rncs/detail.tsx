import { useGetRnc, useListCapas } from "@workspace/api-client-react";
import { useParams } from "wouter";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, Info, Calendar, User, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RncDetail() {
  const { id } = useParams<{ id: string }>();
  const rncId = Number(id);

  const { data: rnc, isLoading: loadingRnc } = useGetRnc(rncId, {
    query: { enabled: !!rncId, queryKey: ['getRnc', rncId] }
  });

  const { data: capas, isLoading: loadingCapas } = useListCapas({ rnc_id: rncId }, {
    query: { enabled: !!rncId, queryKey: ['listCapas', rncId] }
  });

  if (loadingRnc) {
    return <Skeleton className="h-[500px] w-full bg-card/50" />;
  }

  if (!rnc) {
    return (
      <div className="py-12 text-center border border-dashed rounded-xl border-border/50 bg-card/10">
        <p className="text-muted-foreground font-mono text-sm uppercase tracking-widest">RNC não encontrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title={`RNC ${rnc.numero}`}
        breadcrumbs={[
          { label: "RNCs", href: "/rncs" },
          { label: rnc.numero }
        ]}
        actions={
          <div className="flex gap-2">
            <StatusBadge status={rnc.gravidade || 'Normal'} className="text-sm px-3 py-1 bg-destructive/10 text-destructive border-destructive/30" />
            <StatusBadge status={rnc.status} className="text-sm px-3 py-1" />
          </div>
        }
      />

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 bg-card/50 backdrop-blur border-border/50 h-fit">
          <CardHeader>
            <CardTitle className="text-sm font-mono tracking-widest uppercase flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />
              Detalhes da Ocorrência
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground">Obra ID</p>
              <p className="font-medium text-sm">{rnc.obra_id}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground">Tipo de RNC</p>
              <p className="font-medium text-sm">{rnc.tipo}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground">Data de Identificação</p>
              <p className="font-medium text-sm flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                {rnc.data_identificacao ? new Date(rnc.data_identificacao).toLocaleDateString('pt-BR') : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground">Responsável</p>
              <p className="font-medium text-sm flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-primary" />
                {rnc.responsavel || 'Não atribuído'}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="text-sm font-mono tracking-widest uppercase flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-primary" />
                Descrição da Não Conformidade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/20 p-4 rounded-lg border border-border/50 text-sm whitespace-pre-wrap">
                {rnc.descricao}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-mono tracking-widest uppercase flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-primary" />
                Ações Preventivas/Corretivas (CAPA)
              </CardTitle>
              <Button size="sm" variant="outline" className="h-8 font-mono text-[10px] uppercase">Nova Ação</Button>
            </CardHeader>
            <CardContent>
              {loadingCapas ? (
                <div className="space-y-3">
                  {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
                </div>
              ) : capas?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground font-mono text-sm uppercase tracking-widest border border-dashed border-border/50 rounded-lg">
                  Nenhuma CAPA registrada
                </div>
              ) : (
                <div className="space-y-3">
                  {capas?.map(capa => (
                    <div key={capa.id} className="p-4 rounded-lg border border-border/50 bg-background/50 space-y-3">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm mb-1">{capa.acao}</h4>
                          <p className="text-xs text-muted-foreground">{capa.descricao}</p>
                        </div>
                        <StatusBadge status={capa.status} />
                      </div>
                      <div className="flex items-center gap-4 text-[10px] uppercase font-mono text-muted-foreground pt-2 border-t border-border/50">
                        <span className="flex items-center gap-1"><User className="h-3 w-3" /> {capa.responsavel || 'N/A'}</span>
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {capa.prazo ? new Date(capa.prazo).toLocaleDateString('pt-BR') : 'N/A'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
