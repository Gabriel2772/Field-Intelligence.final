import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { visitasTable, checklistTable, checklistTemplatesTable, visitaGpsTable, visitaAtivosTable, ativosTable, auditLogTable } from "@workspace/db";
import {
  CreateVisitaBody, UpdateVisitaBody, UpdateVisitaParams, GetVisitaParams, DeleteVisitaParams,
  CreateChecklistItemBody, UpdateChecklistItemBody, UpdateChecklistItemParams, DeleteChecklistItemParams,
  ListChecklistTemplatesQueryParams, CreateChecklistTemplateBody,
  ApplyChecklistTemplateParams, ApplyChecklistTemplateBody,
  ListVisitaGpsParams, CreateVisitaGpsParams, CreateVisitaGpsBody,
  ListVisitaAtivosParams, LinkVisitaAtivoParams, LinkVisitaAtivoBody,
} from "@workspace/api-zod";
import { eq, desc } from "drizzle-orm";
import { logger } from "../lib/logger";

const router = Router();

function toVisita(v: typeof visitasTable.$inferSelect) {
  return { id: v.id, obra_id: v.obraId, visitante: v.visitante ?? null, data_visita: v.dataVisita, observacoes: v.observacoes ?? null, status: v.status, frente_id: v.frenteId ?? null, created_at: v.createdAt.toISOString() };
}

function toChecklist(c: typeof checklistTable.$inferSelect) {
  return { id: c.id, visita_id: c.visitaId, descricao: c.descricao, status: c.status, observacao: c.observacao ?? null, created_at: c.createdAt.toISOString() };
}

function toTemplate(t: typeof checklistTemplatesTable.$inferSelect) {
  return { id: t.id, nome: t.nome, categoria: t.categoria, descricao_aviso: t.descricaoAviso, itens: JSON.parse(t.itens) as string[], created_at: t.createdAt.toISOString() };
}

function toGps(g: typeof visitaGpsTable.$inferSelect) {
  return { id: g.id, visita_id: g.visitaId, latitude: g.latitude, longitude: g.longitude, precisao_metros: g.precisaoMetros ?? null, consentimento: g.consentimento, capturado_em: g.capturadoEm.toISOString() };
}

function toVisitaAtivo(a: typeof visitaAtivosTable.$inferSelect) {
  return { id: a.id, visita_id: a.visitaId, ativo_id: a.ativoId, origem: a.origem, created_at: a.createdAt.toISOString() };
}

router.get("/visitas", async (req: Request, res: Response): Promise<void> => {
  try {
    const q = req.query as Record<string, string>;
    let items = await db.select().from(visitasTable).orderBy(desc(visitasTable.createdAt));
    if (q.obra_id) items = items.filter((v) => v.obraId === Number(q.obra_id));
    if (q.status) items = items.filter((v) => v.status === q.status);
    res.json(items.map(toVisita));
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

router.post("/visitas", async (req: Request, res: Response): Promise<void> => {
  try {
    const body = CreateVisitaBody.parse(req.body);
    const [v] = await db.insert(visitasTable).values({ obraId: body.obra_id, visitante: body.visitante ?? null, dataVisita: body.data_visita, observacoes: body.observacoes ?? null, status: body.status, frenteId: body.frente_id ?? null }).returning();
    await db.insert(auditLogTable).values({ acao: "create", entidade: "visita", entidadeId: v.id, detalhes: `Visita em ${v.dataVisita} criada` });
    res.status(201).json(toVisita(v));
  } catch (err) { res.status(400).json({ error: String(err) }); }
});

router.get("/visitas/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = GetVisitaParams.parse({ id: Number(req.params.id) });
    const [v] = await db.select().from(visitasTable).where(eq(visitasTable.id, id));
    if (!v) { res.status(404).json({ error: "Not found" }); return; }
    res.json(toVisita(v));
  } catch (err) { res.status(404).json({ error: "Not found" }); }
});

router.patch("/visitas/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = UpdateVisitaParams.parse({ id: Number(req.params.id) });
    const body = UpdateVisitaBody.parse(req.body);
    const [v] = await db.update(visitasTable).set({
      ...(body.visitante !== undefined && { visitante: body.visitante }),
      ...(body.data_visita !== undefined && { dataVisita: body.data_visita }),
      ...(body.observacoes !== undefined && { observacoes: body.observacoes }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.frente_id !== undefined && { frenteId: body.frente_id }),
    }).where(eq(visitasTable.id, id)).returning();
    if (!v) { res.status(404).json({ error: "Not found" }); return; }
    res.json(toVisita(v));
  } catch (err) { res.status(400).json({ error: String(err) }); }
});

router.delete("/visitas/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = DeleteVisitaParams.parse({ id: Number(req.params.id) });
    await db.delete(visitasTable).where(eq(visitasTable.id, id));
    res.status(204).send();
  } catch (err) { res.status(400).json({ error: String(err) }); }
});

// Checklist templates — verification records, not safety approval.
router.get("/checklist-templates", async (req: Request, res: Response): Promise<void> => {
  try {
    const q = ListChecklistTemplatesQueryParams.parse(req.query);
    let items = await db.select().from(checklistTemplatesTable).orderBy(desc(checklistTemplatesTable.createdAt));
    if (q.categoria) items = items.filter((t) => t.categoria === q.categoria);
    res.json(items.map(toTemplate));
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

router.post("/checklist-templates", async (req: Request, res: Response): Promise<void> => {
  try {
    const body = CreateChecklistTemplateBody.parse(req.body);
    const [t] = await db.insert(checklistTemplatesTable).values({ nome: body.nome, categoria: body.categoria, itens: JSON.stringify(body.itens) }).returning();
    res.status(201).json(toTemplate(t));
  } catch (err) { res.status(400).json({ error: String(err) }); }
});

router.post("/visitas/:visitaId/checklist/apply-template", async (req: Request, res: Response): Promise<void> => {
  try {
    const { visitaId } = ApplyChecklistTemplateParams.parse({ visitaId: Number(req.params.visitaId) });
    const body = ApplyChecklistTemplateBody.parse(req.body);
    const [template] = await db.select().from(checklistTemplatesTable).where(eq(checklistTemplatesTable.id, body.template_id));
    if (!template) { res.status(404).json({ error: "Template not found" }); return; }
    const itens = JSON.parse(template.itens) as string[];
    const created = await db.insert(checklistTable).values(
      itens.map((descricao) => ({ visitaId, templateId: template.id, descricao, status: "pendente" })),
    ).returning();
    res.status(201).json(created.map(toChecklist));
  } catch (err) { res.status(400).json({ error: String(err) }); }
});

// GPS captures — only ever recorded after explicit in-app consent.
router.get("/visitas/:visitaId/gps", async (req: Request, res: Response): Promise<void> => {
  try {
    const { visitaId } = ListVisitaGpsParams.parse({ visitaId: Number(req.params.visitaId) });
    const items = await db.select().from(visitaGpsTable).where(eq(visitaGpsTable.visitaId, visitaId)).orderBy(desc(visitaGpsTable.capturadoEm));
    res.json(items.map(toGps));
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

router.post("/visitas/:visitaId/gps", async (req: Request, res: Response): Promise<void> => {
  try {
    const { visitaId } = CreateVisitaGpsParams.parse({ visitaId: Number(req.params.visitaId) });
    const body = CreateVisitaGpsBody.parse(req.body);
    if (body.consentimento !== "concedido") {
      res.status(400).json({ error: "Captura de GPS requer consentimento explícito ('concedido')." });
      return;
    }
    const [g] = await db.insert(visitaGpsTable).values({
      visitaId, latitude: String(body.latitude), longitude: String(body.longitude),
      precisaoMetros: body.precisao_metros !== undefined ? String(body.precisao_metros) : null,
      consentimento: body.consentimento,
    }).returning();
    res.status(201).json(toGps(g));
  } catch (err) { res.status(400).json({ error: String(err) }); }
});

// Asset links — decoded from a QR scan or picked manually. The scanned
// camera frame is never persisted, only the decoded asset id.
router.get("/visitas/:visitaId/ativos", async (req: Request, res: Response): Promise<void> => {
  try {
    const { visitaId } = ListVisitaAtivosParams.parse({ visitaId: Number(req.params.visitaId) });
    const items = await db.select().from(visitaAtivosTable).where(eq(visitaAtivosTable.visitaId, visitaId)).orderBy(desc(visitaAtivosTable.createdAt));
    res.json(items.map(toVisitaAtivo));
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

router.post("/visitas/:visitaId/ativos", async (req: Request, res: Response): Promise<void> => {
  try {
    const { visitaId } = LinkVisitaAtivoParams.parse({ visitaId: Number(req.params.visitaId) });
    const body = LinkVisitaAtivoBody.parse(req.body);
    const [ativo] = await db.select().from(ativosTable).where(eq(ativosTable.id, body.ativo_id));
    if (!ativo) { res.status(404).json({ error: "Ativo não encontrado" }); return; }
    const [a] = await db.insert(visitaAtivosTable).values({ visitaId, ativoId: body.ativo_id, origem: body.origem }).returning();
    res.status(201).json(toVisitaAtivo(a));
  } catch (err) { res.status(400).json({ error: String(err) }); }
});

// Checklist
router.get("/checklist", async (req: Request, res: Response): Promise<void> => {
  try {
    const q = req.query as Record<string, string>;
    let items = await db.select().from(checklistTable).orderBy(desc(checklistTable.createdAt));
    if (q.visita_id) items = items.filter((c) => c.visitaId === Number(q.visita_id));
    res.json(items.map(toChecklist));
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

router.post("/checklist", async (req: Request, res: Response): Promise<void> => {
  try {
    const body = CreateChecklistItemBody.parse(req.body);
    const [c] = await db.insert(checklistTable).values({ visitaId: body.visita_id, descricao: body.descricao, status: body.status, observacao: body.observacao ?? null }).returning();
    res.status(201).json(toChecklist(c));
  } catch (err) { res.status(400).json({ error: String(err) }); }
});

router.patch("/checklist/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = UpdateChecklistItemParams.parse({ id: Number(req.params.id) });
    const body = UpdateChecklistItemBody.parse(req.body);
    const [c] = await db.update(checklistTable).set({
      ...(body.descricao !== undefined && { descricao: body.descricao }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.observacao !== undefined && { observacao: body.observacao }),
    }).where(eq(checklistTable.id, id)).returning();
    if (!c) { res.status(404).json({ error: "Not found" }); return; }
    res.json(toChecklist(c));
  } catch (err) { res.status(400).json({ error: String(err) }); }
});

router.delete("/checklist/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = DeleteChecklistItemParams.parse({ id: Number(req.params.id) });
    await db.delete(checklistTable).where(eq(checklistTable.id, id));
    res.status(204).send();
  } catch (err) { res.status(400).json({ error: String(err) }); }
});

export default router;
