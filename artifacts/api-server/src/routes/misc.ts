import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import {
  compromissosTable, documentosTable, conciliacoesTable, excecoesTable, kpisTable, auditLogTable,
} from "@workspace/db";
import {
  CreateCompromissoBody, UpdateCompromissoBody, UpdateCompromissoParams, DeleteCompromissoParams,
  CreateDocumentoBody, UpdateDocumentoBody, UpdateDocumentoParams, DeleteDocumentoParams,
  CreateConciliacaoBody, UpdateConciliacaoBody, UpdateConciliacaoParams, DeleteConciliacaoParams,
  CreateExcecaoBody, UpdateExcecaoBody, UpdateExcecaoParams, DeleteExcecaoParams,
  CreateKpiBody, UpdateKpiBody, UpdateKpiParams, DeleteKpiParams,
} from "@workspace/api-zod";
import { eq, desc } from "drizzle-orm";
import { logger } from "../lib/logger";

const router = Router();

// ─── Compromissos ─────────────────────────────────────────────────────────────
function toCompromisso(c: typeof compromissosTable.$inferSelect) {
  return { id: c.id, obra_id: c.obraId, descricao: c.descricao, responsavel: c.responsavel ?? null, prazo: c.prazo ?? null, status: c.status, prioridade: c.prioridade ?? null, created_at: c.createdAt.toISOString() };
}

router.get("/compromissos", async (req: Request, res: Response): Promise<void> => {
  try {
    const q = req.query as Record<string, string>;
    let items = await db.select().from(compromissosTable).orderBy(desc(compromissosTable.createdAt));
    if (q.obra_id) items = items.filter((c) => c.obraId === Number(q.obra_id));
    if (q.status) items = items.filter((c) => c.status === q.status);
    res.json(items.map(toCompromisso));
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

router.post("/compromissos", async (req: Request, res: Response): Promise<void> => {
  try {
    const body = CreateCompromissoBody.parse(req.body);
    const [c] = await db.insert(compromissosTable).values({ obraId: body.obra_id, descricao: body.descricao, responsavel: body.responsavel ?? null, prazo: body.prazo ?? null, status: body.status, prioridade: body.prioridade ?? null }).returning();
    await db.insert(auditLogTable).values({ acao: "create", entidade: "compromisso", entidadeId: c.id, detalhes: `Compromisso criado` });
    res.status(201).json(toCompromisso(c));
  } catch (err) { res.status(400).json({ error: String(err) }); }
});

router.patch("/compromissos/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = UpdateCompromissoParams.parse({ id: Number(req.params.id) });
    const body = UpdateCompromissoBody.parse(req.body);
    const [c] = await db.update(compromissosTable).set({
      ...(body.descricao !== undefined && { descricao: body.descricao }),
      ...(body.responsavel !== undefined && { responsavel: body.responsavel }),
      ...(body.prazo !== undefined && { prazo: body.prazo }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.prioridade !== undefined && { prioridade: body.prioridade }),
    }).where(eq(compromissosTable.id, id)).returning();
    if (!c) { res.status(404).json({ error: "Not found" }); return; }
    res.json(toCompromisso(c));
  } catch (err) { res.status(400).json({ error: String(err) }); }
});

router.delete("/compromissos/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = DeleteCompromissoParams.parse({ id: Number(req.params.id) });
    await db.delete(compromissosTable).where(eq(compromissosTable.id, id));
    res.status(204).send();
  } catch (err) { res.status(400).json({ error: String(err) }); }
});

// ─── Documentos ───────────────────────────────────────────────────────────────
function toDocumento(d: typeof documentosTable.$inferSelect) {
  return { id: d.id, obra_id: d.obraId, nome: d.nome, tipo: d.tipo, url: d.url ?? null, versao: d.versao ?? null, status: d.status, created_at: d.createdAt.toISOString() };
}

router.get("/documentos", async (req: Request, res: Response): Promise<void> => {
  try {
    const q = req.query as Record<string, string>;
    let items = await db.select().from(documentosTable).orderBy(desc(documentosTable.createdAt));
    if (q.obra_id) items = items.filter((d) => d.obraId === Number(q.obra_id));
    if (q.tipo) items = items.filter((d) => d.tipo === q.tipo);
    res.json(items.map(toDocumento));
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

router.post("/documentos", async (req: Request, res: Response): Promise<void> => {
  try {
    const body = CreateDocumentoBody.parse(req.body);
    const [d] = await db.insert(documentosTable).values({ obraId: body.obra_id, nome: body.nome, tipo: body.tipo, url: body.url ?? null, versao: body.versao ?? null, status: body.status }).returning();
    res.status(201).json(toDocumento(d));
  } catch (err) { res.status(400).json({ error: String(err) }); }
});

router.patch("/documentos/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = UpdateDocumentoParams.parse({ id: Number(req.params.id) });
    const body = UpdateDocumentoBody.parse(req.body);
    const [d] = await db.update(documentosTable).set({
      ...(body.nome !== undefined && { nome: body.nome }),
      ...(body.tipo !== undefined && { tipo: body.tipo }),
      ...(body.url !== undefined && { url: body.url }),
      ...(body.versao !== undefined && { versao: body.versao }),
      ...(body.status !== undefined && { status: body.status }),
    }).where(eq(documentosTable.id, id)).returning();
    if (!d) { res.status(404).json({ error: "Not found" }); return; }
    res.json(toDocumento(d));
  } catch (err) { res.status(400).json({ error: String(err) }); }
});

router.delete("/documentos/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = DeleteDocumentoParams.parse({ id: Number(req.params.id) });
    await db.delete(documentosTable).where(eq(documentosTable.id, id));
    res.status(204).send();
  } catch (err) { res.status(400).json({ error: String(err) }); }
});

// ─── Conciliações ─────────────────────────────────────────────────────────────
function toConciliacao(c: typeof conciliacoesTable.$inferSelect) {
  return { id: c.id, obra_id: c.obraId, descricao: c.descricao, valor: c.valor ? Number(c.valor) : null, status: c.status, data_referencia: c.dataReferencia ?? null, observacoes: c.observacoes ?? null, created_at: c.createdAt.toISOString() };
}

router.get("/conciliacoes", async (req: Request, res: Response): Promise<void> => {
  try {
    const q = req.query as Record<string, string>;
    let items = await db.select().from(conciliacoesTable).orderBy(desc(conciliacoesTable.createdAt));
    if (q.obra_id) items = items.filter((c) => c.obraId === Number(q.obra_id));
    if (q.status) items = items.filter((c) => c.status === q.status);
    res.json(items.map(toConciliacao));
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

router.post("/conciliacoes", async (req: Request, res: Response): Promise<void> => {
  try {
    const body = CreateConciliacaoBody.parse(req.body);
    const [c] = await db.insert(conciliacoesTable).values({ obraId: body.obra_id, descricao: body.descricao, valor: body.valor?.toString() ?? null, status: body.status, dataReferencia: body.data_referencia ?? null, observacoes: body.observacoes ?? null }).returning();
    res.status(201).json(toConciliacao(c));
  } catch (err) { res.status(400).json({ error: String(err) }); }
});

router.patch("/conciliacoes/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = UpdateConciliacaoParams.parse({ id: Number(req.params.id) });
    const body = UpdateConciliacaoBody.parse(req.body);
    const [c] = await db.update(conciliacoesTable).set({
      ...(body.descricao !== undefined && { descricao: body.descricao }),
      ...(body.valor !== undefined && { valor: body.valor?.toString() }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.data_referencia !== undefined && { dataReferencia: body.data_referencia }),
      ...(body.observacoes !== undefined && { observacoes: body.observacoes }),
    }).where(eq(conciliacoesTable.id, id)).returning();
    if (!c) { res.status(404).json({ error: "Not found" }); return; }
    res.json(toConciliacao(c));
  } catch (err) { res.status(400).json({ error: String(err) }); }
});

router.delete("/conciliacoes/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = DeleteConciliacaoParams.parse({ id: Number(req.params.id) });
    await db.delete(conciliacoesTable).where(eq(conciliacoesTable.id, id));
    res.status(204).send();
  } catch (err) { res.status(400).json({ error: String(err) }); }
});

// ─── Exceções ─────────────────────────────────────────────────────────────────
function toExcecao(e: typeof excecoesTable.$inferSelect) {
  return {
    id: e.id, obra_id: e.obraId, conciliacao_id: e.conciliacaoId ?? null, conciliacao_item_id: e.conciliacaoItemId ?? null,
    descricao: e.descricao, motivo: e.motivo ?? null, tipo_divergencia: e.tipoDivergencia ?? null, fonte: e.fonte ?? null,
    confianca: e.confianca ?? null, acao_humana_necessaria: e.acaoHumanaNecessaria ?? null,
    status: e.status, aprovador: e.aprovador ?? null, data_aprovacao: e.dataAprovacao ?? null, created_at: e.createdAt.toISOString(),
  };
}

router.get("/excecoes", async (req: Request, res: Response): Promise<void> => {
  try {
    const q = req.query as Record<string, string>;
    let items = await db.select().from(excecoesTable).orderBy(desc(excecoesTable.createdAt));
    if (q.obra_id) items = items.filter((e) => e.obraId === Number(q.obra_id));
    if (q.status) items = items.filter((e) => e.status === q.status);
    res.json(items.map(toExcecao));
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

router.post("/excecoes", async (req: Request, res: Response): Promise<void> => {
  try {
    const body = CreateExcecaoBody.parse(req.body);
    const [e] = await db.insert(excecoesTable).values({ obraId: body.obra_id, descricao: body.descricao, motivo: body.motivo ?? null, status: body.status, aprovador: body.aprovador ?? null }).returning();
    await db.insert(auditLogTable).values({ acao: "create", entidade: "excecao", entidadeId: e.id, detalhes: `Exceção criada` });
    res.status(201).json(toExcecao(e));
  } catch (err) { res.status(400).json({ error: String(err) }); }
});

router.patch("/excecoes/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = UpdateExcecaoParams.parse({ id: Number(req.params.id) });
    const body = UpdateExcecaoBody.parse(req.body);
    const [e] = await db.update(excecoesTable).set({
      ...(body.descricao !== undefined && { descricao: body.descricao }),
      ...(body.motivo !== undefined && { motivo: body.motivo }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.aprovador !== undefined && { aprovador: body.aprovador }),
      ...(body.data_aprovacao !== undefined && { dataAprovacao: body.data_aprovacao }),
    }).where(eq(excecoesTable.id, id)).returning();
    if (!e) { res.status(404).json({ error: "Not found" }); return; }
    res.json(toExcecao(e));
  } catch (err) { res.status(400).json({ error: String(err) }); }
});

router.delete("/excecoes/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = DeleteExcecaoParams.parse({ id: Number(req.params.id) });
    await db.delete(excecoesTable).where(eq(excecoesTable.id, id));
    res.status(204).send();
  } catch (err) { res.status(400).json({ error: String(err) }); }
});

// ─── KPIs ─────────────────────────────────────────────────────────────────────
function toKpi(k: typeof kpisTable.$inferSelect) {
  return { id: k.id, obra_id: k.obraId, nome: k.nome, valor: Number(k.valor), unidade: k.unidade, periodo: k.periodo, meta: k.meta ? Number(k.meta) : null, created_at: k.createdAt.toISOString() };
}

router.get("/kpis/summary", async (req: Request, res: Response): Promise<void> => {
  try {
    const all = await db.select().from(kpisTable);
    const grouped: Record<string, { values: number[]; metas: number[]; unidade: string }> = {};
    for (const k of all) {
      if (!grouped[k.nome]) grouped[k.nome] = { values: [], metas: [], unidade: k.unidade };
      grouped[k.nome].values.push(Number(k.valor));
      if (k.meta) grouped[k.nome].metas.push(Number(k.meta));
    }
    const items = Object.entries(grouped).map(([nome, g]) => ({
      nome,
      valorMedio: g.values.reduce((a, b) => a + b, 0) / g.values.length,
      metaMedia: g.metas.length ? g.metas.reduce((a, b) => a + b, 0) / g.metas.length : null,
      unidade: g.unidade,
      count: g.values.length,
    }));
    res.json({ items });
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

router.get("/kpis", async (req: Request, res: Response): Promise<void> => {
  try {
    const q = req.query as Record<string, string>;
    let items = await db.select().from(kpisTable).orderBy(desc(kpisTable.createdAt));
    if (q.obra_id) items = items.filter((k) => k.obraId === Number(q.obra_id));
    if (q.periodo) items = items.filter((k) => k.periodo === q.periodo);
    res.json(items.map(toKpi));
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

router.post("/kpis", async (req: Request, res: Response): Promise<void> => {
  try {
    const body = CreateKpiBody.parse(req.body);
    const [k] = await db.insert(kpisTable).values({ obraId: body.obra_id, nome: body.nome, valor: body.valor.toString(), unidade: body.unidade, periodo: body.periodo, meta: body.meta?.toString() ?? null }).returning();
    res.status(201).json(toKpi(k));
  } catch (err) { res.status(400).json({ error: String(err) }); }
});

router.patch("/kpis/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = UpdateKpiParams.parse({ id: Number(req.params.id) });
    const body = UpdateKpiBody.parse(req.body);
    const [k] = await db.update(kpisTable).set({
      ...(body.nome !== undefined && { nome: body.nome }),
      ...(body.valor !== undefined && { valor: body.valor.toString() }),
      ...(body.unidade !== undefined && { unidade: body.unidade }),
      ...(body.periodo !== undefined && { periodo: body.periodo }),
      ...(body.meta !== undefined && { meta: body.meta?.toString() }),
    }).where(eq(kpisTable.id, id)).returning();
    if (!k) { res.status(404).json({ error: "Not found" }); return; }
    res.json(toKpi(k));
  } catch (err) { res.status(400).json({ error: String(err) }); }
});

router.delete("/kpis/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = DeleteKpiParams.parse({ id: Number(req.params.id) });
    await db.delete(kpisTable).where(eq(kpisTable.id, id));
    res.status(204).send();
  } catch (err) { res.status(400).json({ error: String(err) }); }
});

// ─── Audit Log ────────────────────────────────────────────────────────────────
router.get("/audit-log", async (req: Request, res: Response): Promise<void> => {
  try {
    const q = req.query as Record<string, string>;
    const limit = q.limit ? Number(q.limit) : 100;
    let items = await db.select().from(auditLogTable).orderBy(desc(auditLogTable.createdAt)).limit(limit);
    if (q.entidade) items = items.filter((a) => a.entidade === q.entidade);
    res.json(items.map((a) => ({
      id: a.id, usuario_id: a.usuarioId ?? null, usuario_nome: a.usuarioNome ?? null,
      acao: a.acao, entidade: a.entidade, entidade_id: a.entidadeId ?? null,
      detalhes: a.detalhes ?? null, created_at: a.createdAt.toISOString(),
    })));
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

export default router;
