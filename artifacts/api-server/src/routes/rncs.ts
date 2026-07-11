import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { rncsTable, capasTable, auditLogTable } from "@workspace/db";
import { CreateRncBody, UpdateRncBody, UpdateRncParams, GetRncParams, DeleteRncParams, CreateCapaBody, UpdateCapaBody, UpdateCapaParams, DeleteCapaParams } from "@workspace/api-zod";
import { eq, desc } from "drizzle-orm";
import { logger } from "../lib/logger";

const router = Router();

function toRnc(r: typeof rncsTable.$inferSelect) {
  return {
    id: r.id, obra_id: r.obraId, numero: r.numero, descricao: r.descricao, tipo: r.tipo, status: r.status,
    data_identificacao: r.dataIdentificacao ?? null, responsavel: r.responsavel ?? null, gravidade: r.gravidade ?? null,
    causa_imediata: r.causaImediata ?? null, causa_raiz: r.causaRaiz ?? null, evidencia_textual: r.evidenciaTextual ?? null,
    recorrente: r.recorrente, recorrencia_refs: r.recorrenciaRefs ?? null,
    verificado_por: r.verificadoPor ?? null, verificado_em: r.verificadoEm?.toISOString() ?? null, verificacao_obs: r.verificacaoObs ?? null,
    created_at: r.createdAt.toISOString(),
  };
}

function toCapa(c: typeof capasTable.$inferSelect) {
  return {
    id: c.id, rnc_id: c.rncId, tipo: c.tipo, descricao: c.descricao, acao: c.acao, responsavel: c.responsavel ?? null,
    prazo: c.prazo ?? null, status: c.status,
    executado_por: c.executadoPor ?? null, executado_em: c.executadoEm?.toISOString() ?? null, execucao_obs: c.execucaoObs ?? null,
    verificado_por: c.verificadoPor ?? null, verificado_em: c.verificadoEm?.toISOString() ?? null, verificacao_obs: c.verificacaoObs ?? null,
    eficaz: c.eficaz ?? null, eficacia_avaliado_por: c.eficaciaAvaliadoPor ?? null, eficacia_avaliado_em: c.eficaciaAvaliadoEm?.toISOString() ?? null, eficacia_obs: c.eficaciaObs ?? null,
    created_at: c.createdAt.toISOString(),
  };
}

// A CAPA can only be marked "verificada" or "eficaz" if a human verifier is
// on record. Never inferred or defaulted — this is a hard governance rule.
const CAPA_STATUSES_REQUIRING_VERIFICATION = new Set(["verificada", "eficaz"]);
// An RNC can only be closed once a human verifier is on record.
const RNC_STATUSES_REQUIRING_VERIFICATION = new Set(["fechado"]);

// RNCs stats (must be before /:id)
router.get("/rncs/stats", async (req: Request, res: Response): Promise<void> => {
  try {
    const all = await db.select().from(rncsTable);
    const byStatus = Object.entries(
      all.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {} as Record<string, number>)
    ).map(([status, count]) => ({ status, count }));
    const byTipo = Object.entries(
      all.reduce((acc, r) => { acc[r.tipo] = (acc[r.tipo] || 0) + 1; return acc; }, {} as Record<string, number>)
    ).map(([tipo, count]) => ({ tipo, count }));
    const byGravidade = Object.entries(
      all.reduce((acc, r) => { const g = r.gravidade ?? "media"; acc[g] = (acc[g] || 0) + 1; return acc; }, {} as Record<string, number>)
    ).map(([gravidade, count]) => ({ gravidade, count }));
    res.json({ total: all.length, byStatus, byTipo, byGravidade });
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

router.get("/rncs", async (req: Request, res: Response): Promise<void> => {
  try {
    const q = req.query as Record<string, string>;
    let items = await db.select().from(rncsTable).orderBy(desc(rncsTable.createdAt));
    if (q.obra_id) items = items.filter((r) => r.obraId === Number(q.obra_id));
    if (q.status) items = items.filter((r) => r.status === q.status);
    res.json(items.map(toRnc));
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

router.post("/rncs", async (req: Request, res: Response): Promise<void> => {
  try {
    const body = CreateRncBody.parse(req.body);
    if (body.status && RNC_STATUSES_REQUIRING_VERIFICATION.has(body.status)) {
      res.status(400).json({ error: "RNC não pode ser criada já fechada. Verificação humana é obrigatória antes do fechamento." });
      return;
    }
    const [r] = await db.insert(rncsTable).values({ obraId: body.obra_id, numero: body.numero, descricao: body.descricao, tipo: body.tipo, status: body.status, dataIdentificacao: body.data_identificacao ?? null, responsavel: body.responsavel ?? null, gravidade: body.gravidade ?? null }).returning();
    await db.insert(auditLogTable).values({ acao: "create", entidade: "rnc", entidadeId: r.id, detalhes: `RNC ${r.numero} criada` });
    res.status(201).json(toRnc(r));
  } catch (err) { res.status(400).json({ error: String(err) }); }
});

router.get("/rncs/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = GetRncParams.parse({ id: Number(req.params.id) });
    const [r] = await db.select().from(rncsTable).where(eq(rncsTable.id, id));
    if (!r) { res.status(404).json({ error: "Not found" }); return; }
    res.json(toRnc(r));
  } catch (err) { res.status(404).json({ error: "Not found" }); }
});

router.patch("/rncs/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = UpdateRncParams.parse({ id: Number(req.params.id) });
    const body = UpdateRncBody.parse(req.body);

    if (body.status && RNC_STATUSES_REQUIRING_VERIFICATION.has(body.status)) {
      const [existing] = await db.select().from(rncsTable).where(eq(rncsTable.id, id));
      if (!existing) { res.status(404).json({ error: "Not found" }); return; }
      const verificadoPor = body.verificado_por ?? existing.verificadoPor;
      const verificadoEm = body.verificado_por ? new Date() : existing.verificadoEm;
      if (!verificadoPor || !verificadoEm) {
        res.status(400).json({ error: "RNC não pode ser fechada sem verificação humana registrada (verificado_por é obrigatório)." });
        return;
      }
    }

    const [r] = await db.update(rncsTable).set({
      ...(body.descricao !== undefined && { descricao: body.descricao }),
      ...(body.tipo !== undefined && { tipo: body.tipo }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.data_identificacao !== undefined && { dataIdentificacao: body.data_identificacao }),
      ...(body.responsavel !== undefined && { responsavel: body.responsavel }),
      ...(body.gravidade !== undefined && { gravidade: body.gravidade }),
      ...(body.causa_imediata !== undefined && { causaImediata: body.causa_imediata }),
      ...(body.causa_raiz !== undefined && { causaRaiz: body.causa_raiz }),
      ...(body.evidencia_textual !== undefined && { evidenciaTextual: body.evidencia_textual }),
      ...(body.recorrente !== undefined && { recorrente: body.recorrente }),
      ...(body.recorrencia_refs !== undefined && { recorrenciaRefs: body.recorrencia_refs }),
      ...(body.verificado_por !== undefined && { verificadoPor: body.verificado_por, verificadoEm: new Date() }),
      ...(body.verificacao_obs !== undefined && { verificacaoObs: body.verificacao_obs }),
    }).where(eq(rncsTable.id, id)).returning();
    if (!r) { res.status(404).json({ error: "Not found" }); return; }
    await db.insert(auditLogTable).values({ acao: "update", entidade: "rnc", entidadeId: r.id, detalhes: body.status ? `Status alterado para ${body.status}` : "RNC atualizada" });
    res.json(toRnc(r));
  } catch (err) { res.status(400).json({ error: String(err) }); }
});

router.delete("/rncs/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = DeleteRncParams.parse({ id: Number(req.params.id) });
    await db.delete(rncsTable).where(eq(rncsTable.id, id));
    res.status(204).send();
  } catch (err) { res.status(400).json({ error: String(err) }); }
});

// CAPAs
router.get("/capas", async (req: Request, res: Response): Promise<void> => {
  try {
    const q = req.query as Record<string, string>;
    let items = await db.select().from(capasTable).orderBy(desc(capasTable.createdAt));
    if (q.rnc_id) items = items.filter((c) => c.rncId === Number(q.rnc_id));
    if (q.status) items = items.filter((c) => c.status === q.status);
    res.json(items.map(toCapa));
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

router.post("/capas", async (req: Request, res: Response): Promise<void> => {
  try {
    const body = CreateCapaBody.parse(req.body);
    if (body.status && CAPA_STATUSES_REQUIRING_VERIFICATION.has(body.status)) {
      res.status(400).json({ error: "CAPA não pode ser criada já verificada/eficaz. Verificação humana é obrigatória." });
      return;
    }
    const [c] = await db.insert(capasTable).values({ rncId: body.rnc_id, tipo: body.tipo ?? "corretiva", descricao: body.descricao, acao: body.acao, responsavel: body.responsavel ?? null, prazo: body.prazo ?? null, status: body.status }).returning();
    res.status(201).json(toCapa(c));
  } catch (err) { res.status(400).json({ error: String(err) }); }
});

router.patch("/capas/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = UpdateCapaParams.parse({ id: Number(req.params.id) });
    const body = UpdateCapaBody.parse(req.body);

    if (body.status && CAPA_STATUSES_REQUIRING_VERIFICATION.has(body.status)) {
      const [existing] = await db.select().from(capasTable).where(eq(capasTable.id, id));
      if (!existing) { res.status(404).json({ error: "Not found" }); return; }
      const verificadoPor = body.verificado_por ?? existing.verificadoPor;
      if (!verificadoPor) {
        res.status(400).json({ error: "CAPA não pode ser marcada como verificada/eficaz sem verificação humana registrada (verificado_por é obrigatório)." });
        return;
      }
    }

    const [c] = await db.update(capasTable).set({
      ...(body.tipo !== undefined && { tipo: body.tipo }),
      ...(body.descricao !== undefined && { descricao: body.descricao }),
      ...(body.acao !== undefined && { acao: body.acao }),
      ...(body.responsavel !== undefined && { responsavel: body.responsavel }),
      ...(body.prazo !== undefined && { prazo: body.prazo }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.executado_por !== undefined && { executadoPor: body.executado_por, executadoEm: new Date() }),
      ...(body.execucao_obs !== undefined && { execucaoObs: body.execucao_obs }),
      ...(body.verificado_por !== undefined && { verificadoPor: body.verificado_por, verificadoEm: new Date() }),
      ...(body.verificacao_obs !== undefined && { verificacaoObs: body.verificacao_obs }),
      ...(body.eficaz !== undefined && { eficaz: body.eficaz, eficaciaAvaliadoPor: body.eficacia_avaliado_por ?? null, eficaciaAvaliadoEm: new Date() }),
      ...(body.eficacia_obs !== undefined && { eficaciaObs: body.eficacia_obs }),
    }).where(eq(capasTable.id, id)).returning();
    if (!c) { res.status(404).json({ error: "Not found" }); return; }
    res.json(toCapa(c));
  } catch (err) { res.status(400).json({ error: String(err) }); }
});

router.delete("/capas/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = DeleteCapaParams.parse({ id: Number(req.params.id) });
    await db.delete(capasTable).where(eq(capasTable.id, id));
    res.status(204).send();
  } catch (err) { res.status(400).json({ error: String(err) }); }
});

export default router;
