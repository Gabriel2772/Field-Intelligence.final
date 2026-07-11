import { useListContratos } from "@workspace/api-client-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, FileSignature, Building2, Calendar } from "lucide-react";
import { useState, useMemo } from "react";

export default function ContratosList() {
  const [search, setSearch] = useState("");
  const { data: contratos, isLoading } = useListContratos();

  const filtered = useMemo(() => {
    if (!contratos) return [];
    if (!search) return contratos;
    const lowerSearch = search.toLowerCase();
    return contratos.filter((item) => 
      item.numero.toLowerCase().includes(lowerSearch) || 
      (item.descricao && item.descricao.toLowerCase().includes(lowerSearch)) ||
      (item.contratado && item.contratado.toLowerCase().includes(lowerSearch)) ||
      (item.contratante && item.contratante.toLowerCase().includes(lowerSearch))
    );
  }, [contratos, search]);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Contratos" 
        description="Gestão de fornecedores, prestadores e acordos comerciais."
        actions={
          <Button className="font-mono uppercase tracking-widest text-xs">
            <Plus className="mr-2 h-4 w-4" /> Novo Contrato
          </Button>
        }
      />

      <div className="flex items-center gap-4 bg-card/50 backdrop-blur p-4 rounded-xl border border-border/50">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por número, descrição ou partes..." 
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
                <TableHead className="font-mono uppercase text-[10px] tracking-widest">Número / Obra</TableHead>
                <TableHead className="font-mono uppercase text-[10px] tracking-widest">Partes (Contratante → Contratado)</TableHead>
                <TableHead className="font-mono uppercase text-[10px] tracking-widest">Prazo</TableHead>
                <TableHead className="font-mono uppercase text-[10px] tracking-widest">Valor</TableHead>
                <TableHead className="text-right font-mono uppercase text-[10px] tracking-widest">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground font-mono text-sm uppercase tracking-widest">
                    Nenhum contrato encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((contrato) => (
                  <TableRow key={contrato.id} className="border-border/50 hover:bg-primary/5 transition-colors">
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 font-mono font-medium">
                          <FileSignature className="h-4 w-4 text-primary/70" />
                          {contrato.numero}
                        </div>
                        <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-widest pl-6">
                          Obra ID: {contrato.obra_id}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-xs">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Building2 className="h-3 w-3" /> {contrato.contratante || '-'}
                        </div>
                        <div className="flex items-center gap-1.5 font-medium">
                          <Building2 className="h-3 w-3" /> {contrato.contratado || '-'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5 text-primary/70" />
                        <span>
                          {contrato.data_inicio ? new Date(contrato.data_inicio).toLocaleDateString('pt-BR') : '-'}
                          <br />
                          {contrato.data_fim ? new Date(contrato.data_fim).toLocaleDateString('pt-BR') : '-'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {contrato.valor ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contrato.valor) : '-'}
                    </TableCell>
                    <TableCell className="text-right"><StatusBadge status={contrato.status} /></TableCell>
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
