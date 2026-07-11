import { useGetDashboardSummary, useGetDashboardActivity, useListObras } from "@workspace/api-client-react";
import { PageHeader } from "@/components/ui/page-header";
import { DataCard } from "@/components/ui/data-card";
import { HardHat, AlertTriangle, CalendarCheck, Box, Activity as ActivityIcon, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary();
  const { data: activity, isLoading: isLoadingActivity } = useGetDashboardActivity();
  const { data: obras, isLoading: isLoadingObras } = useListObras({ status: "Ativo" });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Painel executivo"
        description="Visão consolidada das operações, pendências críticas e evidências recentes das frentes de campo."
      />

      <section aria-label="Indicadores principais" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {isLoadingSummary ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl bg-card" />)
        ) : (
          <>
            <DataCard
              title="Obras ativas"
              value={summary?.obrasAtivas || 0}
              description={`de ${summary?.totalObras || 0} cadastradas`}
              icon={<HardHat className="h-4 w-4" />}
            />
            <DataCard
              title="RNCs abertos"
              value={summary?.rncsAbertos || 0}
              trend={{ value: summary?.rncsUltimos30Dias || 0, label: "30 dias", positive: false }}
              icon={<AlertTriangle className="h-4 w-4" />}
            />
            <DataCard
              title="Compromissos vencidos"
              value={summary?.compromissosVencidos || 0}
              icon={<CalendarCheck className="h-4 w-4" />}
            />
            <DataCard
              title="Ativos monitorados"
              value={summary?.totalAtivos || 0}
              icon={<Box className="h-4 w-4" />}
            />
          </>
        )}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Operação</p>
              <CardTitle className="mt-2 text-lg">Obras ativas</CardTitle>
            </div>
            <HardHat className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-6">
            {isLoadingObras ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
              </div>
            ) : obras?.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-secondary/40 px-6 py-10 text-center text-sm text-muted-foreground">
                Nenhuma obra ativa encontrada.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {obras?.slice(0, 4).map((obra) => (
                  <Link key={obra.id} href={`/obras/${obra.id}`}>
                    <article className="group h-full cursor-pointer rounded-lg border border-border bg-secondary/35 p-4 transition-colors hover:border-primary/60 hover:bg-secondary/70">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate font-semibold tracking-tight group-hover:text-primary">{obra.nome}</h3>
                          <p className="mt-1 text-xs uppercase tracking-[0.12em] text-muted-foreground">{obra.codigo}</p>
                        </div>
                        <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                      </div>
                      <div className="mt-5 flex items-end justify-between gap-3 border-t border-border pt-3">
                        <span className="truncate text-xs text-muted-foreground">Gestor: {obra.gestor_responsavel || "Não informado"}</span>
                        <StatusBadge status={obra.status} />
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Auditoria</p>
              <CardTitle className="mt-2 text-lg">Atividades recentes</CardTitle>
            </div>
            <ActivityIcon className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-6">
            <ScrollArea className="h-[330px] pr-4">
              {isLoadingActivity ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : activity?.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-secondary/40 px-6 py-10 text-center text-sm text-muted-foreground">
                  Nenhuma atividade recente.
                </div>
              ) : (
                <div className="space-y-3">
                  {activity?.map((item) => (
                    <div key={item.id} className="relative border-l-2 border-primary/50 bg-secondary/35 px-4 py-3">
                      <p className="text-sm leading-6">
                        <span className="font-semibold">{item.usuario || "Sistema"}</span>{" "}{item.descricao}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                        <span>{new Date(item.created_at).toLocaleString("pt-BR")}</span>
                        <span aria-hidden="true">•</span>
                        <span className="text-primary">{item.entidade}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
