import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { contratosTable, auditLogTable } from "@workspace/db";
import {
  CreateContratoBody,
  UpdateContratoBody,
  UpdateContratoParams,
  GetContratoParams,
  DeleteContratoParams,
  ListContratosQueryParams,
} from "@workspace/api-zod";
import { eq, and, desc } from "drizzle-orm";
import { logger } from "../lib/logger";

const router = Router();

function toContrato(c: typeof contratosTable.$inferSelect) {
  return {
    id: c.id,
    numero: c.numero,
    descricao: c.descricao ?? null,
    obra_id: c.obraId,
    valor: c.valor ? Number(c.valor) : null,
    status: c.status,
    data_inicio: c.dataInicio ?? null,
    data_fim: c.dataFim ?? null,
    contratante: c.contratante ?? null,
    contratado: c.contratado ?? null,
    created_at: c.createdAt.toISOString(),
  };
}

router.get("/contratos", async (req: Request, res: Response): Promise<void> => {
  try {
    const q = req.query as Record<string, string>;
    let contratos = await db.select().from(contratosTable).orderBy(desc(contratosTable.createdAt));
    if (q.obra_id) contratos = contratos.filter((c) => c.obraId === Number(q.obra_id));
    if (q.status) contratos = contratos.filter((c) => c.status === q.status);
    res.json(contratos.map(toContrato));
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: String(err) });
  }
});

router.post("/contratos", async (req: Request, res: Response): Promise<void> => {
  try {
    const body = CreateContratoBody.parse(req.body);
    const [contrato] = await db.insert(contratosTable).values({
      numero: body.numero,
      descricao: body.descricao ?? null,
      obraId: body.obra_id,
      valor: body.valor?.toString() ?? null,
      status: body.status,
      dataInicio: body.data_inicio ?? null,
      dataFim: body.data_fim ?? null,
      contratante: body.contratante ?? null,
      contratado: body.contratado ?? null,
    }).returning();
    await db.insert(auditLogTable).values({ acao: "create", entidade: "contrato", entidadeId: contrato.id, detalhes: `Contrato ${contrato.numero} criado` });
    res.status(201).json(toContrato(contrato));
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

router.get("/contratos/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = GetContratoParams.parse({ id: Number(req.params.id) });
    const [c] = await db.select().from(contratosTable).where(eq(contratosTable.id, id));
    if (!c) { res.status(404).json({ error: "Not found" }); return; }
    res.json(toContrato(c));
  } catch (err) {
    res.status(404).json({ error: "Not found" });
  }
});

router.patch("/contratos/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = UpdateContratoParams.parse({ id: Number(req.params.id) });
    const body = UpdateContratoBody.parse(req.body);
    const [contrato] = await db.update(contratosTable).set({
      ...(body.numero !== undefined && { numero: body.numero }),
      ...(body.descricao !== undefined && { descricao: body.descricao }),
      ...(body.valor !== undefined && { valor: body.valor?.toString() }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.data_inicio !== undefined && { dataInicio: body.data_inicio }),
      ...(body.data_fim !== undefined && { dataFim: body.data_fim }),
      ...(body.contratante !== undefined && { contratante: body.contratante }),
      ...(body.contratado !== undefined && { contratado: body.contratado }),
    }).where(eq(contratosTable.id, id)).returning();
    if (!contrato) { res.status(404).json({ error: "Not found" }); return; }
    res.json(toContrato(contrato));
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

router.delete("/contratos/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = DeleteContratoParams.parse({ id: Number(req.params.id) });
    await db.delete(contratosTable).where(eq(contratosTable.id, id));
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

export default router;
