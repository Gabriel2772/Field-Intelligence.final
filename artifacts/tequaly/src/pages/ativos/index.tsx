import { useListAtivos } from "@workspace/api-client-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, Box, QrCode } from "lucide-react";
import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function AtivosList() {
  const [search, setSearch] = useState("");
  const { data: ativos, isLoading } = useListAtivos();

  const filtered = useMemo(() => {
    if (!ativos) return [];
    if (!search) return ativos;
    const lowerSearch = search.toLowerCase();
    return ativos.filter(
      (item) =>
        item.nome.toLowerCase().includes(lowerSearch) ||
        item.tipo.toLowerCase().includes(lowerSearch) ||
        (item.numero_serie &&
          item.numero_serie.toLowerCase().includes(lowerSearch)),
    );
  }, [ativos, search]);

  const formatValue = (value: number | null | undefined) =>
    value
      ? new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(value)
      : "-";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ativos"
        description="Inventário de equipamentos, máquinas e recursos de alto valor."
        actions={
          <Button className="w-full font-mono text-xs uppercase tracking-widest sm:w-auto">
            <Plus className="mr-2 h-4 w-4" /> Novo Ativo
          </Button>
        }
      />

      <div className="rounded-xl border border-border/50 bg-card/50 p-3 backdrop-blur sm:p-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, tipo ou serial..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-h-12 bg-background/50 pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/50 py-12 text-center font-mono text-sm uppercase tracking-widest text-muted-foreground">
          Nenhum ativo encontrado
        </div>
      ) : (
        <>
          <div className="grid gap-3 md:hidden">
            {filtered.map((ativo) => (
              <Card key={ativo.id} className="border-border/50 bg-card/60">
                <CardContent className="space-y-4 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <Box className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <div className="min-w-0">
                        <p className="break-words font-semibold">{ativo.nome}</p>
                        <p className="font-mono text-xs uppercase text-muted-foreground">
                          {ativo.tipo}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={ativo.status} />
                  </div>
                  <dl className="grid grid-cols-2 gap-3 border-t border-border/50 pt-3 text-sm">
                    <div>
                      <dt className="font-mono text-[10px] uppercase text-muted-foreground">
                        Número de série
                      </dt>
                      <dd className="mt-1 flex items-center gap-1 break-all font-mono text-xs">
                        <QrCode className="h-3 w-3 shrink-0" />
                        {ativo.numero_serie || "-"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[10px] uppercase text-muted-foreground">
                        Obra
                      </dt>
                      <dd className="mt-1">{ativo.obra_id || "Estoque"}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="font-mono text-[10px] uppercase text-muted-foreground">
                        Valor
                      </dt>
                      <dd className="mt-1 font-medium">
                        {formatValue(ativo.valor)}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-xl border border-border/50 bg-card/50 backdrop-blur md:block">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead>Identificação</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>S/N</TableHead>
                  <TableHead>Obra</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((ativo) => (
                  <TableRow key={ativo.id}>
                    <TableCell className="font-medium">{ativo.nome}</TableCell>
                    <TableCell>{ativo.tipo}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {ativo.numero_serie || "-"}
                    </TableCell>
                    <TableCell>{ativo.obra_id || "Estoque"}</TableCell>
                    <TableCell>{formatValue(ativo.valor)}</TableCell>
                    <TableCell className="text-right">
                      <StatusBadge status={ativo.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
