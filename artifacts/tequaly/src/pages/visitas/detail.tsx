import { useGetVisita, useListChecklistItems } from "@workspace/api-client-react";
import { useParams } from "wouter";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, FileText } from "lucide-react";

export default function VisitaDetail() {
  const { id } = useParams<{ id: string }>();
  const visitaId = Number(id);

  const { data: visita, isLoading: loadingVisita } = useGetVisita(visitaId, {
    query: { enabled: !!visitaId, queryKey: ['getVisita', visitaId] }
  });

  const { data: checklist, isLoading: loadingChecklist } = useListChecklistItems({ visita_id: visitaId }, {
    query: { enabled: !!visitaId, queryKey: ['listChecklistItems', visitaId] }
  });

  if (loadingVisita) {
    return <Skeleton className="h-[500px] w-full bg-card/50" />;
  }

  if (!visita) {
    return (
      <div className="py-12 text-center border border-dashed rounded-xl border-border/50 bg-card/10">
        <p className="text-muted-foreground font-mono text-sm uppercase tracking-widest">Visita não encontrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title={`Visita #${visita.id}`}
        breadcrumbs={[
          { label: "Visitas", href: "/visitas" },
          { label: `V-${visita.id}` }
        ]}
        actions={
          <StatusBadge status={visita.status} className="text-sm px-3 py-1" />
        }
      />

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 bg-card/50 backdrop-blur border-border/50 h-fit">
          <CardHeader>
            <CardTitle className="text-sm font-mono tracking-widest uppercase">Detalhes da Inspeção</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground">Data</p>
              <p className="font-medium text-sm">{new Date(visita.data_visita).toLocaleString('pt-BR')}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground">Visitante</p>
              <p className="font-medium text-sm">{visita.visitante || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground">Obra Relacionada</p>
              <p className="font-medium text-sm">Obra ID: {visita.obra_id}</p>
            </div>
            {visita.frente_id && (
              <div>
                <p className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground">Frente de Serviço</p>
                <p className="font-medium text-sm">Frente ID: {visita.frente_id}</p>
              </div>
            )}
            {visita.observacoes && (
              <div className="pt-4 border-t border-border/50">
                <p className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground mb-2">Observações Gerais</p>
                <div className="bg-muted/20 p-3 rounded-md border border-border/50 text-sm italic text-muted-foreground">
                  {visita.observacoes}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2 bg-card/50 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle className="text-sm font-mono tracking-widest uppercase flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Itens Verificados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingChecklist ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : checklist?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground font-mono text-sm uppercase tracking-widest border border-dashed border-border/50 rounded-lg">
                Nenhum item de checklist registrado
              </div>
            ) : (
              <div className="space-y-3">
                {checklist?.map(item => {
                  const isOk = item.status.toLowerCase() === 'conforme' || item.status.toLowerCase() === 'ok';
                  return (
                    <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-border/50 bg-background/50 gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        {isOk ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className="text-sm font-medium">{item.descricao}</p>
                          {item.observacao && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1">
                              <FileText className="h-3 w-3 mt-0.5 shrink-0" />
                              {item.observacao}
                            </p>
                          )}
                        </div>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
