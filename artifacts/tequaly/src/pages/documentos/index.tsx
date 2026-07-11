import { useListDocumentos } from "@workspace/api-client-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, FileText, Download, ExternalLink } from "lucide-react";
import { useState, useMemo } from "react";

export default function DocumentosList() {
  const [search, setSearch] = useState("");
  const { data: documentos, isLoading } = useListDocumentos();

  const filtered = useMemo(() => {
    if (!documentos) return [];
    if (!search) return documentos;
    const lowerSearch = search.toLowerCase();
    return documentos.filter((item) => 
      item.nome.toLowerCase().includes(lowerSearch) || 
      item.tipo.toLowerCase().includes(lowerSearch)
    );
  }, [documentos, search]);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Documentos" 
        description="Biblioteca de plantas, manuais e documentação técnica."
        actions={
          <Button className="font-mono uppercase tracking-widest text-xs">
            <Plus className="mr-2 h-4 w-4" /> Upload
          </Button>
        }
      />

      <div className="flex items-center gap-4 bg-card/50 backdrop-blur p-4 rounded-xl border border-border/50">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nome ou tipo..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background/50 border-border/50"
          />
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-border/50">
                <TableHead className="w-[400px] font-mono uppercase text-[10px] tracking-widest">Nome</TableHead>
                <TableHead className="font-mono uppercase text-[10px] tracking-widest">Tipo</TableHead>
                <TableHead className="font-mono uppercase text-[10px] tracking-widest">Versão</TableHead>
                <TableHead className="font-mono uppercase text-[10px] tracking-widest">Status</TableHead>
                <TableHead className="text-right font-mono uppercase text-[10px] tracking-widest">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground font-mono text-sm uppercase tracking-widest">
                    Nenhum documento encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((doc) => (
                  <TableRow key={doc.id} className="border-border/50 hover:bg-primary/5 transition-colors group">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary/70" />
                        {doc.nome}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="bg-muted/50 px-2 py-1 rounded text-xs text-muted-foreground uppercase font-mono">
                        {doc.tipo}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{doc.versao || '1.0'}</TableCell>
                    <TableCell><StatusBadge status={doc.status} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
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
