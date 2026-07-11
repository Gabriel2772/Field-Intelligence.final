import { Router, type Request, type Response } from "express";
import multer from "multer";
import * as XLSX from "xlsx";
import { db } from "@workspace/db";
import { conciliacaoItensTable, conciliacoesTable, excecoesTable, auditLogTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

const TOLERANCIA = 0.01; // absolute quantity tolerance before flagging a divergence

type ParsedRow = {
  codigo?: string;
  descricao?: string;
  unidade?: string;
  qtdEnviado?: number;
  qtdFaturado?: number;
  qtdDevolvido?: number;
  qtdEmCampo?: number;
  qtdIndenizado?: number;
  valorUnitario?: number;
};

function num(v: unknown): number | undefined {
  if (v === null || v === undefined || v === "") return undefined;
  const n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}

function normalizeKey(k: string): string {
  return k
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

const COLUMN_ALIASES: Record<string, keyof ParsedRow> = {
  codigo: "codigo",
  cod: "codigo",
  descricao: "descricao",
  descrição: "descricao",
  item: "descricao",
  unidade: "unidade",
  un: "unidade",
  enviado: "qtdEnviado",
  qtdenviado: "qtdEnviado",
  faturado: "qtdFaturado",
  qtdfaturado: "qtdFaturado",
  devolvido: "qtdDevolvido",
  qtddevolvido: "qtdDevolvido",
  emcampo: "qtdEmCampo",
  qtdemcampo: "qtdEmCampo",
  indenizado: "qtdIndenizado",
  qtdindenizado: "qtdIndenizado",
  valorunitario: "valorUnitario",
  valor: "valorUnitario",
};

function rowsFromTabular(sheet: Record<string, unknown>[]): ParsedRow[] {
  return sheet.map((raw) => {
    const row: ParsedRow = {};
    for (const [rawKey, value] of Object.entries(raw)) {
      const key = COLUMN_ALIASES[normalizeKey(rawKey)];
      if (!key) continue;
      if (key === "codigo" || key === "descricao" || key === "unidade") {
        (row[key] as string | undefined) = value != null ? String(value) : undefined;
      } else {
        (row[key] as number | undefined) = num(value);
      }
    }
    return row;
  }).filter((r) => r.codigo || r.descricao);
}

/**
 * Parses an uploaded document into structured line items. XLSX/CSV are
 * parsed as exact tabular data (high confidence). PDF/DOCX only yield raw
 * text — we do not attempt to auto-structure free text into line items,
 * since that would require guessing. Instead a single low-confidence row
 * carrying the raw text is created, and an exception is raised requiring a
 * human to transcribe/verify it.
 */
async function parseFile(
  buffer: Buffer,
  originalName: string,
  mimetype: string,
): Promise<{ rows: ParsedRow[]; formato: "xlsx" | "csv" | "pdf" | "docx"; confianca: "alta" | "baixa"; rawTextForReview?: string }> {
  const ext = originalName.split(".").pop()?.toLowerCase();

  if (ext === "xlsx" || ext === "xls" || mimetype.includes("spreadsheet")) {
    const wb = XLSX.read(buffer, { type: "buffer" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet, { defval: null }) as Record<string, unknown>[];
    return { rows: rowsFromTabular(json), formato: "xlsx", confianca: "alta" };
  }

  if (ext === "csv" || mimetype.includes("csv")) {
    const wb = XLSX.read(buffer, { type: "buffer", raw: true });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet, { defval: null }) as Record<string, unknown>[];
    return { rows: rowsFromTabular(json), formato: "csv", confianca: "alta" };
  }

  if (ext === "pdf" || mimetype.includes("pdf")) {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const result = await parser.getText();
    return { rows: [], formato: "pdf", confianca: "baixa", rawTextForReview: result.text };
  }

  if (ext === "docx" || mimetype.includes("wordprocessingml")) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return { rows: [], formato: "docx", confianca: "baixa", rawTextForReview: result.value };
  }

  throw new Error(`Formato não suportado: ${ext ?? mimetype}. Use XLSX, CSV, PDF ou DOCX.`);
}

function toItem(i: typeof conciliacaoItensTable.$inferSelect) {
  return {
    id: i.id, conciliacao_id: i.conciliacaoId, codigo: i.codigo ?? null, descricao: i.descricao ?? null, unidade: i.unidade ?? null,
    qtd_enviado: i.qtdEnviado ?? null, qtd_faturado: i.qtdFaturado ?? null, qtd_devolvido: i.qtdDevolvido ?? null,
    qtd_em_campo: i.qtdEmCampo ?? null, qtd_indenizado: i.qtdIndenizado ?? null, valor_unitario: i.valorUnitario ?? null,
    origem_arquivo: i.origemArquivo, formato_origem: i.formatoOrigem, extracao_confianca: i.extracaoConfianca,
    created_at: i.createdAt.toISOString(),
  };
}

router.get("/conciliacoes/:id/itens", async (req: Request, res: Response): Promise<void> => {
  try {
    const conciliacaoId = Number(req.params.id);
    const items = await db.select().from(conciliacaoItensTable).where(eq(conciliacaoItensTable.conciliacaoId, conciliacaoId));
    res.json(items.map(toItem));
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Multipart file import. Not modeled in the OpenAPI JSON contract (binary
// upload doesn't fit the JSON codegen flow) — this is a deliberate, narrow
// exception to the "spec-first" convention used elsewhere in this API.
router.post("/conciliacoes/:id/import", upload.single("file"), async (req: Request, res: Response): Promise<void> => {
  try {
    const conciliacaoId = Number(req.params.id);
    const [conciliacao] = await db.select().from(conciliacoesTable).where(eq(conciliacoesTable.id, conciliacaoId));
    if (!conciliacao) { res.status(404).json({ error: "Conciliação não encontrada" }); return; }
    if (!req.file) { res.status(400).json({ error: "Nenhum arquivo enviado (campo 'file')" }); return; }

    const parsed = await parseFile(req.file.buffer, req.file.originalname, req.file.mimetype);

    const excecoesCriadas: (typeof excecoesTable.$inferInsert)[] = [];
    const itensCriados: (typeof conciliacaoItensTable.$inferInsert)[] = [];

    if (parsed.confianca === "baixa") {
      // PDF/DOCX: no structured rows — record one low-confidence item holding
      // the raw text, and require a human to transcribe it into line items.
      itensCriados.push({
        conciliacaoId, descricao: "Texto extraído automaticamente — requer transcrição manual",
        origemArquivo: req.file.originalname, formatoOrigem: parsed.formato, extracaoConfianca: "baixa",
      });
      excecoesCriadas.push({
        obraId: conciliacao.obraId, conciliacaoId, descricao: `Documento ${req.file.originalname} não pôde ser estruturado automaticamente`,
        tipoDivergencia: "extracao_baixa_confianca", fonte: req.file.originalname, confianca: "baixa",
        acaoHumanaNecessaria: "Revisar o texto extraído e transcrever os itens manualmente na conciliação",
        status: "pendente",
      });
    } else {
      for (const row of parsed.rows) {
        itensCriados.push({
          conciliacaoId, codigo: row.codigo ?? null, descricao: row.descricao ?? null, unidade: row.unidade ?? null,
          qtdEnviado: row.qtdEnviado?.toString() ?? null, qtdFaturado: row.qtdFaturado?.toString() ?? null,
          qtdDevolvido: row.qtdDevolvido?.toString() ?? null, qtdEmCampo: row.qtdEmCampo?.toString() ?? null,
          qtdIndenizado: row.qtdIndenizado?.toString() ?? null, valorUnitario: row.valorUnitario?.toString() ?? null,
          origemArquivo: req.file!.originalname, formatoOrigem: parsed.formato, extracaoConfianca: "alta",
        });

        // Structural cross-checks only — quantities that don't add up. This
        // NEVER classifies cause (fraud/loss/error): it only flags the
        // numeric discrepancy and states what a human must go verify.
        if (row.qtdEnviado !== undefined && row.qtdDevolvido !== undefined && row.qtdEmCampo !== undefined) {
          const esperado = row.qtdEnviado - row.qtdDevolvido;
          if (Math.abs(esperado - row.qtdEmCampo) > TOLERANCIA) {
            excecoesCriadas.push({
              obraId: conciliacao.obraId, conciliacaoId,
              descricao: `Item ${row.codigo ?? row.descricao ?? "sem código"}: enviado (${row.qtdEnviado}) - devolvido (${row.qtdDevolvido}) = ${esperado}, mas em campo consta ${row.qtdEmCampo}`,
              tipoDivergencia: "quantidade", fonte: req.file!.originalname, confianca: "media",
              acaoHumanaNecessaria: "Conferir fisicamente a quantidade em campo e confirmar ou corrigir o registro",
              status: "pendente",
            });
          }
        }
        if (row.qtdEnviado !== undefined && row.qtdFaturado !== undefined && Math.abs(row.qtdEnviado - row.qtdFaturado) > TOLERANCIA) {
          excecoesCriadas.push({
            obraId: conciliacao.obraId, conciliacaoId,
            descricao: `Item ${row.codigo ?? row.descricao ?? "sem código"}: enviado (${row.qtdEnviado}) diverge de faturado (${row.qtdFaturado})`,
            tipoDivergencia: "quantidade", fonte: req.file!.originalname, confianca: "media",
            acaoHumanaNecessaria: "Confirmar com o contrato/nota fiscal qual valor está correto",
            status: "pendente",
          });
        }
      }
    }

    const insertedItems = itensCriados.length
      ? await db.insert(conciliacaoItensTable).values(itensCriados).returning()
      : [];
    if (excecoesCriadas.length) await db.insert(excecoesTable).values(excecoesCriadas);
    await db.insert(auditLogTable).values({
      acao: "import", entidade: "conciliacao", entidadeId: conciliacaoId,
      detalhes: `Importado ${req.file.originalname}: ${insertedItems.length} itens, ${excecoesCriadas.length} exceções geradas`,
    });

    res.status(201).json({
      itens: insertedItems.map(toItem),
      excecoes_geradas: excecoesCriadas.length,
      confianca: parsed.confianca,
      raw_text_preview: parsed.rawTextForReview?.slice(0, 2000) ?? null,
    });
  } catch (err) {
    logger.error({ err: String(err) }, "Conciliação import failed");
    res.status(400).json({ error: String(err) });
  }
});

export default router;
