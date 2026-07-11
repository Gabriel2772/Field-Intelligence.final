import { useListVisitas } from "@workspace/api-client-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Calendar, FileText, User } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function VisitasList() {
  const { data: visitas, isLoading } = useListVisitas();

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Visitas em Campo" 
        description="Registro de inspeções e vistorias nas frentes de obra."
        actions={
          <Button className="font-mono uppercase tracking-widest text-xs">Registrar Visita</Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl bg-card/50" />
          ))
        ) : visitas?.length === 0 ? (
          <div className="col-span-full py-12 text-center border border-dashed rounded-xl border-border/50 bg-card/10">
            <p className="text-muted-foreground font-mono text-sm uppercase tracking-widest">Nenhuma visita encontrada</p>
          </div>
        ) : (
          visitas?.map((visita) => (
            <Link key={visita.id} href={`/visitas/${visita.id}`}>
              <Card className="group h-full bg-card/50 backdrop-blur border-border/50 hover:border-primary/50 transition-all cursor-pointer">
                <CardContent className="p-5 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-4 gap-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="uppercase tracking-tight group-hover:text-primary transition-colors">Obra ID: {visita.obra_id}</span>
                    </div>
                    <StatusBadge status={visita.status} />
                  </div>
                  
                  <div className="space-y-3 mt-auto">
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 mr-2 text-primary/70" />
                      <span>{new Date(visita.data_visita).toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <User className="h-3.5 w-3.5 mr-2 text-primary/70" />
                      <span>{visita.visitante || 'Visitante não identificado'}</span>
                    </div>
                    {visita.observacoes && (
                      <div className="flex items-start text-xs text-muted-foreground pt-2 border-t border-border/50 mt-2">
                        <FileText className="h-3.5 w-3.5 mr-2 text-primary/70 mt-0.5 shrink-0" />
                        <span className="line-clamp-2 italic">"{visita.observacoes}"</span>
                      </div>
                    )}
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
