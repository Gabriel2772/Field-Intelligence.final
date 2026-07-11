import { useGetObraDashboard } from "@workspace/api-client-react";
import { useParams } from "wouter";
import { PageHeader } from "@/components/ui/page-header";
import { DataCard } from "@/components/ui/data-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Calendar, User, FileText, AlertTriangle, CheckSquare, Activity as ActivityIcon } from "lucide-react";

export default function ObraDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: dashboard, isLoading } = useGetObraDashboard(Number(id), {
    query: { enabled: !!id, queryKey: ['getObraDashboard', Number(id)] }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full bg-card/50" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 bg-card/50" />)}
        </div>
        <Skeleton className="h-96 w-full bg-card/50" />
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="py-12 text-center border border-dashed rounded-xl border-border/50 bg-card/10">
        <p className="text-muted-foreground font-mono text-sm uppercase tracking-widest">Obra não encontrada</p>
      </div>
    );
  }

  const { obra } = dashboard;

  return (
    <div className="space-y-6">
      <PageHeader 
        title={obra.nome} 
        description={obra.descricao || "Visualização detalhada da obra"}
        breadcrumbs={[
          { label: "Obras", href: "/obras" },
          { label: obra.codigo }
        ]}
        actions={
          <StatusBadge status={obra.status} className="text-sm px-3 py-1" />
        }
      />

      <div className="grid gap-4 grid-cols-1 md:grid-cols-3 lg:grid-cols-4 bg-card/50 backdrop-blur p-4 rounded-xl border border-border/50">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 p-2 bg-primary/10 rounded-md text-primary"><User className="h-4 w-4" /></div>
          <div>
            <p className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground">Gestor Responsável</p>
            <p className="font-medium text-sm">{obra.gestor_responsavel || 'Não atribuído'}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="mt-0.5 p-2 bg-primary/10 rounded-md text-primary"><MapPin className="h-4 w-4" /></div>
          <div>
            <p className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground">Localização</p>
            <p className="font-medium text-sm line-clamp-1">{obra.localizacao || 'Não informada'}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="mt-0.5 p-2 bg-primary/10 rounded-md text-primary"><Calendar className="h-4 w-4" /></div>
          <div>
            <p className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground">Início</p>
            <p className="font-medium text-sm">{obra.data_inicio ? new Date(obra.data_inicio).toLocaleDateString('pt-BR') : 'N/A'}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="mt-0.5 p-2 bg-primary/10 rounded-md text-primary"><Calendar className="h-4 w-4" /></div>
          <div>
            <p className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground">Previsão Fim</p>
            <p className="font-medium text-sm">{obra.data_fim_prevista ? new Date(obra.data_fim_prevista).toLocaleDateString('pt-BR') : 'N/A'}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DataCard title="Total Visitas" value={dashboard.totalVisitas} icon={<MapPin className="h-4 w-4 text-primary" />} />
        <DataCard title="RNCs Abertos" value={dashboard.rncsAbertos} icon={<AlertTriangle className="h-4 w-4 text-amber-500" />} />
        <DataCard title="Compromissos" value={dashboard.compromissosVencidos} description="vencidos" icon={<CheckSquare className="h-4 w-4 text-red-500" />} />
        <DataCard title="Contratos" value={dashboard.totalContratos} icon={<FileText className="h-4 w-4 text-emerald-500" />} />
      </div>

      <Tabs defaultValue="activity" className="w-full">
        <TabsList className="bg-card/50 backdrop-blur border border-border/50">
          <TabsTrigger value="activity" className="uppercase font-mono text-xs tracking-wider">Activity Feed</TabsTrigger>
          <TabsTrigger value="kpis" className="uppercase font-mono text-xs tracking-wider">KPIs</TabsTrigger>
          <TabsTrigger value="frentes" className="uppercase font-mono text-xs tracking-wider">Frentes ({dashboard.totalFrentes})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="activity" className="mt-4">
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="text-sm font-mono tracking-widest uppercase flex items-center gap-2">
                <ActivityIcon className="h-4 w-4 text-primary" />
                Histórico Recente
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboard.recentActivity && dashboard.recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {dashboard.recentActivity.map((item) => (
                    <div key={item.id} className="flex gap-4 relative">
                      <div className="absolute left-1 top-5 bottom-[-16px] w-[1px] bg-border last:hidden" />
                      <div className="mt-1.5 w-2 h-2 rounded-full bg-primary ring-4 ring-background z-10" />
                      <div className="flex-1 space-y-1 bg-muted/20 p-3 rounded-md border border-border/50">
                        <p className="text-sm">
                          <span className="font-semibold">{item.usuario || 'Sistema'}</span>
                          {" "}{item.descricao}
                        </p>
                        <div className="flex items-center text-[10px] uppercase font-mono text-muted-foreground gap-2">
                          <span>{new Date(item.created_at).toLocaleString('pt-BR')}</span>
                          <span>•</span>
                          <span className="text-primary">{item.entidade}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground font-mono text-sm uppercase tracking-widest">
                  Sem atividades recentes
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kpis" className="mt-4">
           <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardContent className="pt-6">
              {dashboard.kpis && dashboard.kpis.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                   {dashboard.kpis.map(kpi => (
                     <div key={kpi.id} className="p-4 border border-border/50 rounded-lg bg-background/50">
                       <div className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground mb-1">{kpi.nome}</div>
                       <div className="flex items-end gap-2">
                         <div className="text-2xl font-bold">{kpi.valor}</div>
                         <div className="text-xs text-muted-foreground mb-1">{kpi.unidade}</div>
                       </div>
                       {kpi.meta !== undefined && kpi.meta !== null && (
                         <div className="text-xs text-muted-foreground mt-2 flex justify-between">
                           <span>Meta: {kpi.meta} {kpi.unidade}</span>
                           <span className={kpi.valor >= kpi.meta ? "text-emerald-500" : "text-amber-500"}>
                             {Math.round((kpi.valor / kpi.meta) * 100)}%
                           </span>
                         </div>
                       )}
                     </div>
                   ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground font-mono text-sm uppercase tracking-widest">
                  Nenhum KPI registrado
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="frentes" className="mt-4">
          <Card className="bg-card/50 backdrop-blur border-border/50">
             <CardContent className="pt-6 text-center py-12 text-muted-foreground font-mono text-sm uppercase tracking-widest">
               Frentes listagem será implementada em breve.
             </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
