import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { frentesTable, auditLogTable } from "@workspace/db";
import {
  CreateFrenteBody, UpdateFrenteBody, UpdateFrenteParams, DeleteFrenteParams,
} from "@workspace/api-zod";
import { eq, desc } from "drizzle-orm";
import { logger } from "../lib/logger";

const router = Router();

function toFrente(f: typeof frentesTable.$inferSelect) {
  return { id: f.id, nome: f.nome, descricao: f.descricao ?? null, obra_id: f.obraId, responsavel: f.responsavel ?? null, status: f.status, created_at: f.createdAt.toISOString() };
}

router.get("/frentes", async (req: Request, res: Response): Promise<void> => {
  try {
    const q = req.query as Record<string, string>;
    let items = await db.select().from(frentesTable).orderBy(desc(frentesTable.createdAt));
    if (q.obra_id) items = items.filter((f) => f.obraId === Number(q.obra_id));
    res.json(items.map(toFrente));
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

router.post("/frentes", async (req: Request, res: Response): Promise<void> => {
  try {
    const body = CreateFrenteBody.parse(req.body);
    const [f] = await db.insert(frentesTable).values({ nome: body.nome, descricao: body.descricao ?? null, obraId: body.obra_id, responsavel: body.responsavel ?? null, status: body.status }).returning();
    await db.insert(auditLogTable).values({ acao: "create", entidade: "frente", entidadeId: f.id, detalhes: `Frente "${f.nome}" criada` });
    res.status(201).json(toFrente(f));
  } catch (err) { res.status(400).json({ error: String(err) }); }
});

router.patch("/frentes/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = UpdateFrenteParams.parse({ id: Number(req.params.id) });
    const body = UpdateFrenteBody.parse(req.body);
    const [f] = await db.update(frentesTable).set({
      ...(body.nome !== undefined && { nome: body.nome }),
      ...(body.descricao !== undefined && { descricao: body.descricao }),
      ...(body.responsavel !== undefined && { responsavel: body.responsavel }),
      ...(body.status !== undefined && { status: body.status }),
    }).where(eq(frentesTable.id, id)).returning();
    if (!f) { res.status(404).json({ error: "Not found" }); return; }
    res.json(toFrente(f));
  } catch (err) { res.status(400).json({ error: String(err) }); }
});

router.delete("/frentes/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = DeleteFrenteParams.parse({ id: Number(req.params.id) });
    await db.delete(frentesTable).where(eq(frentesTable.id, id));
    res.status(204).send();
  } catch (err) { res.status(400).json({ error: String(err) }); }
});

export default router;
