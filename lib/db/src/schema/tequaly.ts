import {
  pgTable,
  serial,
  text,
  integer,
  numeric,
  date,
  timestamp,
  varchar,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// ─── Obras ───────────────────────────────────────────────────────────────────

export const obrasTable = pgTable("obras", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  codigo: text("codigo").notNull().unique(),
  descricao: text("descricao"),
  status: text("status").notNull().default("ativo"),
  dataInicio: date("data_inicio", { mode: "string" }),
  dataFimPrevista: date("data_fim_prevista", { mode: "string" }),
  dataFimReal: date("data_fim_real", { mode: "string" }),
  localizacao: text("localizacao"),
  gestorResponsavel: text("gestor_responsavel"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index("IDX_obras_status").on(table.status),
  index("IDX_obras_updated").on(table.updatedAt),
]);

export const insertObraSchema = createInsertSchema(obrasTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertObra = z.infer<typeof insertObraSchema>;
export type Obra = typeof obrasTable.$inferSelect;

// ─── Contratos ───────────────────────────────────────────────────────────────

export const contratosTable = pgTable("contratos", {
  id: serial("id").primaryKey(),
  numero: text("numero").notNull(),
  descricao: text("descricao"),
  obraId: integer("obra_id").notNull(),
  valor: numeric("valor", { precision: 15, scale: 2 }),
  status: text("status").notNull().default("ativo"),
  dataInicio: date("data_inicio", { mode: "string" }),
  dataFim: date("data_fim", { mode: "string" }),
  contratante: text("contratante"),
  contratado: text("contratado"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("IDX_contratos_obra").on(table.obraId),
  index("IDX_contratos_status").on(table.status),
]);

export const insertContratoSchema = createInsertSchema(contratosTable).omit({ id: true, createdAt: true });
export type InsertContrato = z.infer<typeof insertContratoSchema>;
export type Contrato = typeof contratosTable.$inferSelect;

// ─── Frentes ─────────────────────────────────────────────────────────────────

export const frentesTable = pgTable("frentes", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  descricao: text("descricao"),
  obraId: integer("obra_id").notNull(),
  responsavel: text("responsavel"),
  status: text("status").notNull().default("ativo"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("IDX_frentes_obra").on(table.obraId),
  index("IDX_frentes_status").on(table.status),
]);

export const insertFrenteSchema = createInsertSchema(frentesTable).omit({ id: true, createdAt: true });
export type InsertFrente = z.infer<typeof insertFrenteSchema>;
export type Frente = typeof frentesTable.$inferSelect;

// ─── Ativos ──────────────────────────────────────────────────────────────────

export const ativosTable = pgTable("ativos", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  tipo: text("tipo").notNull(),
  numeroSerie: text("numero_serie"),
  obraId: integer("obra_id"),
  status: text("status").notNull().default("disponivel"),
  dataAquisicao: date("data_aquisicao", { mode: "string" }),
  valor: numeric("valor", { precision: 15, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("IDX_ativos_obra").on(table.obraId),
  index("IDX_ativos_status").on(table.status),
]);

export const insertAtivoSchema = createInsertSchema(ativosTable).omit({ id: true, createdAt: true });
export type InsertAtivo = z.infer<typeof insertAtivoSchema>;
export type Ativo = typeof ativosTable.$inferSelect;

// ─── Visitas ─────────────────────────────────────────────────────────────────

export const visitasTable = pgTable("visitas", {
  id: serial("id").primaryKey(),
  obraId: integer("obra_id").notNull(),
  visitante: text("visitante"),
  dataVisita: date("data_visita", { mode: "string" }).notNull(),
  observacoes: text("observacoes"),
  status: text("status").notNull().default("pendente"),
  frenteId: integer("frente_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("IDX_visitas_obra").on(table.obraId),
  index("IDX_visitas_data").on(table.dataVisita),
  index("IDX_visitas_status").on(table.status),
]);

export const insertVisitaSchema = createInsertSchema(visitasTable).omit({ id: true, createdAt: true });
export type InsertVisita = z.infer<typeof insertVisitaSchema>;
export type Visita = typeof visitasTable.$inferSelect;

// ─── Visita GPS captures ───────────────────────────────────────────────────────
// One row per GPS reading taken during a visit. Requires explicit in-app
// consent before capture (enforced client-side + `consentimento` flag stored
// for audit). Never silently captured.

export const visitaGpsTable = pgTable("visita_gps", {
  id: serial("id").primaryKey(),
  visitaId: integer("visita_id").notNull(),
  latitude: numeric("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: numeric("longitude", { precision: 10, scale: 7 }).notNull(),
  precisaoMetros: numeric("precisao_metros", { precision: 10, scale: 2 }),
  consentimento: text("consentimento").notNull(), // 'concedido' — recorded only after explicit user consent
  capturadoEm: timestamp("capturado_em", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("IDX_visita_gps_visita").on(table.visitaId),
]);

export const insertVisitaGpsSchema = createInsertSchema(visitaGpsTable).omit({ id: true, capturadoEm: true });
export type InsertVisitaGps = z.infer<typeof insertVisitaGpsSchema>;
export type VisitaGps = typeof visitaGpsTable.$inferSelect;

// ─── Visita ↔ Ativos (QR link) ─────────────────────────────────────────────────
// Links an asset to a visit after a QR scan. The scanned camera frame itself
// is never stored — only the decoded asset identifier and how it was linked.

export const visitaAtivosTable = pgTable("visita_ativos", {
  id: serial("id").primaryKey(),
  visitaId: integer("visita_id").notNull(),
  ativoId: integer("ativo_id").notNull(),
  origem: text("origem").notNull().default("manual"), // 'qr' | 'manual'
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("IDX_visita_ativos_visita").on(table.visitaId),
  index("IDX_visita_ativos_ativo").on(table.ativoId),
]);

export const insertVisitaAtivoSchema = createInsertSchema(visitaAtivosTable).omit({ id: true, createdAt: true });
export type InsertVisitaAtivo = z.infer<typeof insertVisitaAtivoSchema>;
export type VisitaAtivo = typeof visitaAtivosTable.$inferSelect;

// ─── Checklist templates ───────────────────────────────────────────────────────
// Templates are verification-record checklists (e.g. NR-18 scaffolding,
// inventory, demobilization). Completing one records that items were
// checked — it is NOT a safety approval or sign-off.

export const checklistTemplatesTable = pgTable("checklist_templates", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  categoria: text("categoria").notNull(), // nr18_andaime | inventario | devolucao | demobilizacao | documentos | gestao_ativos
  descricaoAviso: text("descricao_aviso").notNull().default(
    "Este checklist registra verificações realizadas em campo. Não constitui aprovação de segurança nem substitui laudo técnico.",
  ),
  itens: text("itens").notNull(), // JSON-encoded string[] of item descriptions, in order
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertChecklistTemplateSchema = createInsertSchema(checklistTemplatesTable).omit({ id: true, createdAt: true });
export type InsertChecklistTemplate = z.infer<typeof insertChecklistTemplateSchema>;
export type ChecklistTemplate = typeof checklistTemplatesTable.$inferSelect;

// ─── Checklist ───────────────────────────────────────────────────────────────

export const checklistTable = pgTable("checklist_items", {
  id: serial("id").primaryKey(),
  visitaId: integer("visita_id").notNull(),
  templateId: integer("template_id"),
  descricao: text("descricao").notNull(),
  status: text("status").notNull().default("pendente"),
  observacao: text("observacao"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("IDX_checklist_visita").on(table.visitaId),
  index("IDX_checklist_status").on(table.status),
]);

export const insertChecklistItemSchema = createInsertSchema(checklistTable).omit({ id: true, createdAt: true });
export type InsertChecklistItem = z.infer<typeof insertChecklistItemSchema>;
export type ChecklistItem = typeof checklistTable.$inferSelect;

// ─── RNCs ────────────────────────────────────────────────────────────────────

export const rncsTable = pgTable("rncs", {
  id: serial("id").primaryKey(),
  obraId: integer("obra_id").notNull(),
  numero: text("numero").notNull(),
  descricao: text("descricao").notNull(),
  tipo: text("tipo").notNull(),
  status: text("status").notNull().default("aberto"), // aberto | em_tratativa | aguardando_verificacao | fechado
  dataIdentificacao: date("data_identificacao", { mode: "string" }),
  responsavel: text("responsavel"),
  gravidade: text("gravidade").default("media"),
  // Root-cause analysis — filled in during tratativa, before closure.
  causaImediata: text("causa_imediata"),
  causaRaiz: text("causa_raiz"),
  evidenciaTextual: text("evidencia_textual"),
  recorrente: text("recorrente").notNull().default("nao"), // 'sim' | 'nao' — human-flagged, never auto-inferred
  recorrenciaRefs: text("recorrencia_refs"), // free text pointing to related RNC numbers
  // Mandatory human verification gate — an RNC cannot be closed without these.
  verificadoPor: text("verificado_por"),
  verificadoEm: timestamp("verificado_em", { withTimezone: true }),
  verificacaoObs: text("verificacao_obs"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("IDX_rncs_obra").on(table.obraId),
  index("IDX_rncs_status").on(table.status),
  index("IDX_rncs_created").on(table.createdAt),
]);

export const insertRncSchema = createInsertSchema(rncsTable).omit({ id: true, createdAt: true });
export type InsertRnc = z.infer<typeof insertRncSchema>;
export type Rnc = typeof rncsTable.$inferSelect;

// ─── CAPAs ───────────────────────────────────────────────────────────────────

export const capasTable = pgTable("capas", {
  id: serial("id").primaryKey(),
  rncId: integer("rnc_id").notNull(),
  tipo: text("tipo").notNull().default("corretiva"), // corretiva | preventiva
  descricao: text("descricao").notNull(),
  acao: text("acao").notNull(),
  responsavel: text("responsavel"),
  prazo: date("prazo", { mode: "string" }),
  status: text("status").notNull().default("pendente"), // pendente | em_execucao | executada | verificada | eficaz | ineficaz
  // Execution record
  executadoPor: text("executado_por"),
  executadoEm: timestamp("executado_em", { withTimezone: true }),
  execucaoObs: text("execucao_obs"),
  // Mandatory human verification — a CAPA cannot move to 'verificada'/'eficaz' without this.
  verificadoPor: text("verificado_por"),
  verificadoEm: timestamp("verificado_em", { withTimezone: true }),
  verificacaoObs: text("verificacao_obs"),
  // Effectiveness assessment (separate, later check that the action actually worked)
  eficaz: text("eficaz"), // 'sim' | 'nao' | null (not yet assessed)
  eficaciaAvaliadoPor: text("eficacia_avaliado_por"),
  eficaciaAvaliadoEm: timestamp("eficacia_avaliado_em", { withTimezone: true }),
  eficaciaObs: text("eficacia_obs"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("IDX_capas_rnc").on(table.rncId),
  index("IDX_capas_status").on(table.status),
]);

export const insertCapaSchema = createInsertSchema(capasTable).omit({ id: true, createdAt: true });
export type InsertCapa = z.infer<typeof insertCapaSchema>;
export type Capa = typeof capasTable.$inferSelect;

// ─── Compromissos ─────────────────────────────────────────────────────────────

export const compromissosTable = pgTable("compromissos", {
  id: serial("id").primaryKey(),
  obraId: integer("obra_id").notNull(),
  descricao: text("descricao").notNull(),
  responsavel: text("responsavel"),
  prazo: date("prazo", { mode: "string" }),
  status: text("status").notNull().default("pendente"),
  prioridade: text("prioridade").default("media"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("IDX_compromissos_obra").on(table.obraId),
  index("IDX_compromissos_status_prazo").on(table.status, table.prazo),
]);

export const insertCompromissoSchema = createInsertSchema(compromissosTable).omit({ id: true, createdAt: true });
export type InsertCompromisso = z.infer<typeof insertCompromissoSchema>;
export type Compromisso = typeof compromissosTable.$inferSelect;

// ─── Documentos ───────────────────────────────────────────────────────────────

export const documentosTable = pgTable("documentos", {
  id: serial("id").primaryKey(),
  obraId: integer("obra_id").notNull(),
  nome: text("nome").notNull(),
  tipo: text("tipo").notNull(),
  url: text("url"),
  versao: text("versao"),
  status: text("status").notNull().default("vigente"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("IDX_documentos_obra").on(table.obraId),
]);

export const insertDocumentoSchema = createInsertSchema(documentosTable).omit({ id: true, createdAt: true });
export type InsertDocumento = z.infer<typeof insertDocumentoSchema>;
export type Documento = typeof documentosTable.$inferSelect;

// ─── Conciliações ─────────────────────────────────────────────────────────────

export const conciliacoesTable = pgTable("conciliacoes", {
  id: serial("id").primaryKey(),
  obraId: integer("obra_id").notNull(),
  descricao: text("descricao").notNull(),
  valor: numeric("valor", { precision: 15, scale: 2 }),
  status: text("status").notNull().default("pendente"),
  dataReferencia: date("data_referencia", { mode: "string" }),
  observacoes: text("observacoes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("IDX_conciliacoes_obra").on(table.obraId),
  index("IDX_conciliacoes_status").on(table.status),
]);

export const insertConciliacaoSchema = createInsertSchema(conciliacoesTable).omit({ id: true, createdAt: true });
export type InsertConciliacao = z.infer<typeof insertConciliacaoSchema>;
export type Conciliacao = typeof conciliacoesTable.$inferSelect;

// ─── Conciliação — itens importados ─────────────────────────────────────────────
// One row per line item extracted from an imported document (XLSX/CSV: exact
// tabular parse; PDF/DOCX: best-effort text extraction flagged for manual
// review). No automatic fraud/loss/blame classification is ever produced —
// only structured facts plus a confidence/provenance note.

export const conciliacaoItensTable = pgTable("conciliacao_itens", {
  id: serial("id").primaryKey(),
  conciliacaoId: integer("conciliacao_id").notNull(),
  codigo: text("codigo"),
  descricao: text("descricao"),
  unidade: text("unidade"),
  qtdEnviado: numeric("qtd_enviado", { precision: 15, scale: 3 }),
  qtdFaturado: numeric("qtd_faturado", { precision: 15, scale: 3 }),
  qtdDevolvido: numeric("qtd_devolvido", { precision: 15, scale: 3 }),
  qtdEmCampo: numeric("qtd_em_campo", { precision: 15, scale: 3 }),
  qtdIndenizado: numeric("qtd_indenizado", { precision: 15, scale: 3 }),
  valorUnitario: numeric("valor_unitario", { precision: 15, scale: 2 }),
  origemArquivo: text("origem_arquivo").notNull(),
  formatoOrigem: text("formato_origem").notNull(), // xlsx | csv | pdf | docx
  extracaoConfianca: text("extracao_confianca").notNull().default("alta"), // alta (tabular) | baixa (texto livre, requer revisão)
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("IDX_conciliacao_itens_conciliacao").on(table.conciliacaoId),
]);

export const insertConciliacaoItemSchema = createInsertSchema(conciliacaoItensTable).omit({ id: true, createdAt: true });
export type InsertConciliacaoItem = z.infer<typeof insertConciliacaoItemSchema>;
export type ConciliacaoItem = typeof conciliacaoItensTable.$inferSelect;

// ─── Exceções ─────────────────────────────────────────────────────────────────

export const excecoesTable = pgTable("excecoes", {
  id: serial("id").primaryKey(),
  obraId: integer("obra_id").notNull(),
  conciliacaoId: integer("conciliacao_id"),
  conciliacaoItemId: integer("conciliacao_item_id"),
  descricao: text("descricao").notNull(),
  motivo: text("motivo"),
  tipoDivergencia: text("tipo_divergencia"), // quantidade | extracao_baixa_confianca | dado_ausente | outro
  fonte: text("fonte"), // which document/import produced this exception
  confianca: text("confianca").default("media"), // alta | media | baixa
  acaoHumanaNecessaria: text("acao_humana_necessaria"), // what a human must do to resolve it — never auto-resolved
  status: text("status").notNull().default("pendente"),
  aprovador: text("aprovador"),
  dataAprovacao: date("data_aprovacao", { mode: "string" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("IDX_excecoes_obra").on(table.obraId),
  index("IDX_excecoes_status").on(table.status),
]);

export const insertExcecaoSchema = createInsertSchema(excecoesTable).omit({ id: true, createdAt: true });
export type InsertExcecao = z.infer<typeof insertExcecaoSchema>;
export type Excecao = typeof excecoesTable.$inferSelect;

// ─── KPIs ─────────────────────────────────────────────────────────────────────

export const kpisTable = pgTable("kpis", {
  id: serial("id").primaryKey(),
  obraId: integer("obra_id").notNull(),
  nome: text("nome").notNull(),
  valor: numeric("valor", { precision: 15, scale: 4 }).notNull(),
  unidade: text("unidade").notNull(),
  periodo: text("periodo").notNull(),
  meta: numeric("meta", { precision: 15, scale: 4 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("IDX_kpis_obra_created").on(table.obraId, table.createdAt),
]);

export const insertKpiSchema = createInsertSchema(kpisTable).omit({ id: true, createdAt: true });
export type InsertKpi = z.infer<typeof insertKpiSchema>;
export type Kpi = typeof kpisTable.$inferSelect;

// ─── Audit Log ────────────────────────────────────────────────────────────────

export const auditLogTable = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  usuarioId: varchar("usuario_id"),
  usuarioNome: text("usuario_nome"),
  acao: text("acao").notNull(),
  entidade: text("entidade").notNull(),
  entidadeId: integer("entidade_id"),
  detalhes: text("detalhes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("IDX_audit_created").on(table.createdAt),
  index("IDX_audit_entidade").on(table.entidade, table.entidadeId),
]);

export type AuditLog = typeof auditLogTable.$inferSelect;
