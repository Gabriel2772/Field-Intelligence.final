import { useListKpis, useGetKpiSummary } from "@workspace/api-client-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

export default function KpisList() {
  const { data: kpis, isLoading: loadingKpis } = useListKpis();
  const { data: summary, isLoading: loadingSummary } = useGetKpiSummary();

  // Mock data for charts since real time-series data requires complex processing
  const mockTimeSeriesData = [
    { name: 'Jan', compliance: 85, progresso: 40 },
    { name: 'Fev', compliance: 88, progresso: 52 },
    { name: 'Mar', compliance: 92, progresso: 65 },
    { name: 'Abr', compliance: 90, progresso: 78 },
    { name: 'Mai', compliance: 95, progresso: 85 },
    { name: 'Jun', compliance: 94, progresso: 92 },
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Key Performance Indicators" 
        description="Métricas de desempenho, avanço físico e compliance (KPIs)."
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle className="text-sm font-mono tracking-widest uppercase">Avanço Físico vs Meta (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockTimeSeriesData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Line type="monotone" dataKey="progresso" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: 'hsl(var(--primary))' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle className="text-sm font-mono tracking-widest uppercase">Índice de Compliance (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockTimeSeriesData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                    cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                  />
                  <Bar dataKey="compliance" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1 space-y-6">
          <Card className="bg-card/50 backdrop-blur border-border/50 h-full">
            <CardHeader>
              <CardTitle className="text-sm font-mono tracking-widest uppercase">Resumo Consolidado</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingSummary ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : summary?.items?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground font-mono text-sm uppercase tracking-widest">
                  Sem dados consolidados
                </div>
              ) : (
                <div className="space-y-4">
                  {summary?.items?.map((item, i) => (
                    <div key={i} className="flex flex-col gap-1 p-3 rounded-lg border border-border/50 bg-background/50">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{item.nome}</span>
                      <div className="flex items-end justify-between">
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-bold">{item.valorMedio.toFixed(1)}</span>
                          <span className="text-xs text-muted-foreground mb-1">{item.unidade}</span>
                        </div>
                        {item.metaMedia && (
                          <div className="text-xs">
                            Meta: {item.metaMedia.toFixed(1)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card className="bg-card/50 backdrop-blur border-border/50 h-full">
            <CardHeader>
              <CardTitle className="text-sm font-mono tracking-widest uppercase">Últimos Registros (Por Obra)</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingKpis ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : kpis?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground font-mono text-sm uppercase tracking-widest">
                  Nenhum registro encontrado
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {kpis?.map((kpi) => (
                    <div key={kpi.id} className="p-4 rounded-lg border border-border/50 bg-background/50 flex flex-col justify-between">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-mono uppercase tracking-widest text-primary font-medium">{kpi.nome}</span>
                        <span className="text-[10px] bg-muted/50 px-2 py-0.5 rounded uppercase font-mono tracking-widest text-muted-foreground">
                          Obra ID: {kpi.obra_id}
                        </span>
                      </div>
                      <div className="flex items-end gap-2 mb-2">
                        <span className="text-2xl font-bold tracking-tight">{kpi.valor}</span>
                        <span className="text-sm text-muted-foreground mb-1">{kpi.unidade}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-muted-foreground uppercase font-mono border-t border-border/50 pt-2 mt-2">
                        <span>Periodo: {kpi.periodo}</span>
                        {kpi.meta !== undefined && kpi.meta !== null && (
                          <span className={kpi.valor >= kpi.meta ? "text-emerald-500" : "text-amber-500"}>
                            Meta: {kpi.meta}
                          </span>
                        )}
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
