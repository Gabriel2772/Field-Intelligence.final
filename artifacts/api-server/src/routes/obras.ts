import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import {
  obrasTable,
  contratosTable,
  frentesTable,
  visitasTable,
  rncsTable,
  compromissosTable,
  ativosTable,
  kpisTable,
  auditLogTable,
} from "@workspace/db";
import {
  CreateObraBody,
  UpdateObraBody,
  UpdateObraParams,
  GetObraParams,
  GetObraDashboardParams,
  DeleteObraParams,
} from "@workspace/api-zod";
import { eq, desc, and, gte } from "drizzle-orm";
import { logger } from "../lib/logger";

const router = Router();

function toObra(o: typeof obrasTable.$inferSelect) {
  return {
    id: o.id,
    nome: o.nome,
    codigo: o.codigo,
    descricao: o.descricao ?? null,
    status: o.status,
    data_inicio: o.dataInicio ?? null,
    data_fim_prevista: o.dataFimPrevista ?? null,
    data_fim_real: o.dataFimReal ?? null,
    localizacao: o.localizacao ?? null,
    gestor_responsavel: o.gestorResponsavel ?? null,
    created_at: o.createdAt.toISOString(),
    updated_at: o.updatedAt.toISOString(),
  };
}

// GET /obras
router.get("/obras", async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.query as { status?: string };
    const where = status ? eq(obrasTable.status, status) : undefined;
    const obras = where
      ? await db.select().from(obrasTable).where(where).orderBy(desc(obrasTable.createdAt))
      : await db.select().from(obrasTable).orderBy(desc(obrasTable.createdAt));
    res.json(obras.map(toObra));
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /obras
router.post("/obras", async (req: Request, res: Response): Promise<void> => {
  try {
    const body = CreateObraBody.parse(req.body);
    const [obra] = await db
      .insert(obrasTable)
      .values({
        nome: body.nome,
        codigo: body.codigo,
        descricao: body.descricao ?? null,
        status: body.status,
        dataInicio: body.data_inicio ?? null,
        dataFimPrevista: body.data_fim_prevista ?? null,
        localizacao: body.localizacao ?? null,
        gestorResponsavel: body.gestor_responsavel ?? null,
      })
      .returning();
    await db.insert(auditLogTable).values({
      acao: "create",
      entidade: "obra",
      entidadeId: obra.id,
      detalhes: `Obra "${obra.nome}" criada`,
    });
    res.status(201).json(toObra(obra));
  } catch (err) {
    logger.error(err);
    res.status(400).json({ error: String(err) });
  }
});

// GET /obras/:id
router.get("/obras/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = GetObraParams.parse({ id: Number(req.params.id) });
    const [obra] = await db.select().from(obrasTable).where(eq(obrasTable.id, id));
    if (!obra) { res.status(404).json({ error: "Not found" }); return; }
    res.json(toObra(obra));
  } catch (err) {
    res.status(404).json({ error: "Not found" });
  }
});

// PATCH /obras/:id
router.patch("/obras/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = UpdateObraParams.parse({ id: Number(req.params.id) });
    const body = UpdateObraBody.parse(req.body);
    const [obra] = await db
      .update(obrasTable)
      .set({
        ...(body.nome !== undefined && { nome: body.nome }),
        ...(body.codigo !== undefined && { codigo: body.codigo }),
        ...(body.descricao !== undefined && { descricao: body.descricao }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.data_inicio !== undefined && { dataInicio: body.data_inicio }),
        ...(body.data_fim_prevista !== undefined && { dataFimPrevista: body.data_fim_prevista }),
        ...(body.data_fim_real !== undefined && { dataFimReal: body.data_fim_real }),
        ...(body.localizacao !== undefined && { localizacao: body.localizacao }),
        ...(body.gestor_responsavel !== undefined && { gestorResponsavel: body.gestor_responsavel }),
        updatedAt: new Date(),
      })
      .where(eq(obrasTable.id, id))
      .returning();
    if (!obra) { res.status(404).json({ error: "Not found" }); return; }
    await db.insert(auditLogTable).values({
      acao: "update",
      entidade: "obra",
      entidadeId: obra.id,
      detalhes: `Obra "${obra.nome}" atualizada`,
    });
    res.json(toObra(obra));
  } catch (err) {
    logger.error(err);
    res.status(400).json({ error: String(err) });
  }
});

// DELETE /obras/:id
router.delete("/obras/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = DeleteObraParams.parse({ id: Number(req.params.id) });
    await db.delete(obrasTable).where(eq(obrasTable.id, id));
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

// GET /obras/:id/dashboard
router.get("/obras/:id/dashboard", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = GetObraDashboardParams.parse({ id: Number(req.params.id) });
    const [obra] = await db.select().from(obrasTable).where(eq(obrasTable.id, id));
    if (!obra) { res.status(404).json({ error: "Not found" }); return; }

    const [visitas, rncs, compromissos, ativos, frentes, contratos, kpis, recentActivity] =
      await Promise.all([
        db.select().from(visitasTable).where(eq(visitasTable.obraId, id)),
        db.select().from(rncsTable).where(and(eq(rncsTable.obraId, id), eq(rncsTable.status, "aberto"))),
        db.select().from(compromissosTable).where(eq(compromissosTable.obraId, id)),
        db.select().from(ativosTable).where(eq(ativosTable.obraId, id)),
        db.select().from(frentesTable).where(eq(frentesTable.obraId, id)),
        db.select().from(contratosTable).where(eq(contratosTable.obraId, id)),
        db.select().from(kpisTable).where(eq(kpisTable.obraId, id)).orderBy(desc(kpisTable.createdAt)).limit(10),
        db.select().from(auditLogTable).where(eq(auditLogTable.entidadeId, id)).orderBy(desc(auditLogTable.createdAt)).limit(10),
      ]);

    const now = new Date().toISOString().split("T")[0];
    const vencidos = compromissos.filter((c) => c.prazo && c.prazo < now && c.status === "pendente");

    res.json({
      obra: toObra(obra),
      totalVisitas: visitas.length,
      rncsAbertos: rncs.length,
      compromissosVencidos: vencidos.length,
      totalAtivos: ativos.length,
      totalFrentes: frentes.length,
      totalContratos: contratos.length,
      kpis: kpis.map((k) => ({
        id: k.id, obra_id: k.obraId, nome: k.nome,
        valor: Number(k.valor), unidade: k.unidade,
        periodo: k.periodo, meta: k.meta ? Number(k.meta) : null,
        created_at: k.createdAt.toISOString(),
      })),
      recentActivity: recentActivity.map((a) => ({
        id: a.id, tipo: a.acao, descricao: a.detalhes ?? a.acao,
        entidade: a.entidade, entidade_id: a.entidadeId ?? 0,
        usuario: a.usuarioNome, created_at: a.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: String(err) });
  }
});

export default router;
