import { useListConciliacoes } from "@workspace/api-client-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, CheckSquare, Calendar, FileText } from "lucide-react";
import { useState, useMemo } from "react";

export default function ConciliacoesList() {
  const [search, setSearch] = useState("");
  const { data: conciliacoes, isLoading } = useListConciliacoes();

  const filtered = useMemo(() => {
    if (!conciliacoes) return [];
    if (!search) return conciliacoes;
    const lowerSearch = search.toLowerCase();
    return conciliacoes.filter((item) => 
      item.descricao.toLowerCase().includes(lowerSearch) ||
      (item.observacoes && item.observacoes.toLowerCase().includes(lowerSearch))
    );
  }, [conciliacoes, search]);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Conciliações Físico-Financeiras" 
        description="Aferição do executado versus orçado e faturado."
        actions={
          <Button className="font-mono uppercase tracking-widest text-xs">
            <Plus className="mr-2 h-4 w-4" /> Nova Medição
          </Button>
        }
      />

      <div className="flex items-center gap-4 bg-card/50 backdrop-blur p-4 rounded-xl border border-border/50">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar conciliações..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background/50 border-border/50"
          />
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-border/50">
                <TableHead className="font-mono uppercase text-[10px] tracking-widest">Descrição / Observações</TableHead>
                <TableHead className="font-mono uppercase text-[10px] tracking-widest">Obra (ID)</TableHead>
                <TableHead className="font-mono uppercase text-[10px] tracking-widest">Referência</TableHead>
                <TableHead className="text-right font-mono uppercase text-[10px] tracking-widest">Valor Medido</TableHead>
                <TableHead className="text-right font-mono uppercase text-[10px] tracking-widest">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground font-mono text-sm uppercase tracking-widest">
                    Nenhuma conciliação encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item) => (
                  <TableRow key={item.id} className="border-border/50 hover:bg-primary/5 transition-colors">
                    <TableCell className="max-w-[400px]">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 font-medium">
                          <CheckSquare className="h-4 w-4 text-primary/70 shrink-0" />
                          <span className="truncate">{item.descricao}</span>
                        </div>
                        {item.observacoes && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground pl-6 truncate">
                            <FileText className="h-3 w-3 shrink-0" />
                            <span className="truncate">{item.observacoes}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {item.obra_id}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5 text-primary/70" />
                        {item.data_referencia ? new Date(item.data_referencia).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).toUpperCase() : '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {item.valor ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor) : '-'}
                    </TableCell>
                    <TableCell className="text-right"><StatusBadge status={item.status} /></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
