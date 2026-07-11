import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { ativosTable, auditLogTable } from "@workspace/db";
import { CreateAtivoBody, UpdateAtivoBody, UpdateAtivoParams, DeleteAtivoParams } from "@workspace/api-zod";
import { eq, desc } from "drizzle-orm";
import { logger } from "../lib/logger";

const router = Router();

function toAtivo(a: typeof ativosTable.$inferSelect) {
  return { id: a.id, nome: a.nome, tipo: a.tipo, numero_serie: a.numeroSerie ?? null, obra_id: a.obraId ?? null, status: a.status, data_aquisicao: a.dataAquisicao ?? null, valor: a.valor ? Number(a.valor) : null, created_at: a.createdAt.toISOString() };
}

router.get("/ativos", async (req: Request, res: Response): Promise<void> => {
  try {
    const q = req.query as Record<string, string>;
    let items = await db.select().from(ativosTable).orderBy(desc(ativosTable.createdAt));
    if (q.obra_id) items = items.filter((a) => a.obraId === Number(q.obra_id));
    if (q.status) items = items.filter((a) => a.status === q.status);
    res.json(items.map(toAtivo));
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

router.post("/ativos", async (req: Request, res: Response): Promise<void> => {
  try {
    const body = CreateAtivoBody.parse(req.body);
    const [a] = await db.insert(ativosTable).values({ nome: body.nome, tipo: body.tipo, numeroSerie: body.numero_serie ?? null, obraId: body.obra_id ?? null, status: body.status, dataAquisicao: body.data_aquisicao ?? null, valor: body.valor?.toString() ?? null }).returning();
    await db.insert(auditLogTable).values({ acao: "create", entidade: "ativo", entidadeId: a.id, detalhes: `Ativo "${a.nome}" criado` });
    res.status(201).json(toAtivo(a));
  } catch (err) { res.status(400).json({ error: String(err) }); }
});

router.patch("/ativos/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = UpdateAtivoParams.parse({ id: Number(req.params.id) });
    const body = UpdateAtivoBody.parse(req.body);
    const [a] = await db.update(ativosTable).set({
      ...(body.nome !== undefined && { nome: body.nome }),
      ...(body.tipo !== undefined && { tipo: body.tipo }),
      ...(body.numero_serie !== undefined && { numeroSerie: body.numero_serie }),
      ...(body.obra_id !== undefined && { obraId: body.obra_id }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.data_aquisicao !== undefined && { dataAquisicao: body.data_aquisicao }),
      ...(body.valor !== undefined && { valor: body.valor?.toString() }),
    }).where(eq(ativosTable.id, id)).returning();
    if (!a) { res.status(404).json({ error: "Not found" }); return; }
    res.json(toAtivo(a));
  } catch (err) { res.status(400).json({ error: String(err) }); }
});

router.delete("/ativos/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = DeleteAtivoParams.parse({ id: Number(req.params.id) });
    await db.delete(ativosTable).where(eq(ativosTable.id, id));
    res.status(204).send();
  } catch (err) { res.status(400).json({ error: String(err) }); }
});

export default router;
