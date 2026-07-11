import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import {
  obrasTable,
  visitasTable,
  rncsTable,
  compromissosTable,
  ativosTable,
  contratosTable,
  excecoesTable,
  auditLogTable,
} from "@workspace/db";
import { count, desc, eq, gte, lt, and } from "drizzle-orm";
import { logger } from "../lib/logger";

const router = Router();

// GET /dashboard/summary
router.get("/dashboard/summary", async (_req: Request, res: Response): Promise<void> => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sinceDate = since.toISOString().split("T")[0];

    const [
      totalObras,
      obrasAtivas,
      totalVisitas,
      rncsAbertos,
      compromissosVencidos,
      totalAtivos,
      totalContratos,
      totalExcecoesPendentes,
      visitasUltimos30Dias,
      rncsUltimos30Dias,
    ] = await Promise.all([
      db.select({ value: count() }).from(obrasTable),
      db.select({ value: count() }).from(obrasTable).where(eq(obrasTable.status, "ativo")),
      db.select({ value: count() }).from(visitasTable),
      db.select({ value: count() }).from(rncsTable).where(eq(rncsTable.status, "aberto")),
      db
        .select({ value: count() })
        .from(compromissosTable)
        .where(
          and(
            eq(compromissosTable.status, "pendente"),
            lt(compromissosTable.prazo, today),
          ),
        ),
      db.select({ value: count() }).from(ativosTable),
      db.select({ value: count() }).from(contratosTable),
      db
        .select({ value: count() })
        .from(excecoesTable)
        .where(eq(excecoesTable.status, "pendente")),
      db
        .select({ value: count() })
        .from(visitasTable)
        .where(gte(visitasTable.dataVisita, sinceDate)),
      db
        .select({ value: count() })
        .from(rncsTable)
        .where(gte(rncsTable.createdAt, since)),
    ]);

    res.json({
      totalObras: Number(totalObras[0]?.value ?? 0),
      obrasAtivas: Number(obrasAtivas[0]?.value ?? 0),
      totalVisitas: Number(totalVisitas[0]?.value ?? 0),
      rncsAbertos: Number(rncsAbertos[0]?.value ?? 0),
      compromissosVencidos: Number(compromissosVencidos[0]?.value ?? 0),
      totalAtivos: Number(totalAtivos[0]?.value ?? 0),
      totalContratos: Number(totalContratos[0]?.value ?? 0),
      totalExcecoesPendentes: Number(totalExcecoesPendentes[0]?.value ?? 0),
      visitasUltimos30Dias: Number(visitasUltimos30Dias[0]?.value ?? 0),
      rncsUltimos30Dias: Number(rncsUltimos30Dias[0]?.value ?? 0),
    });
  } catch (err) {
    logger.error({ err }, "Dashboard summary failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /dashboard/activity
router.get("/dashboard/activity", async (_req: Request, res: Response): Promise<void> => {
  try {
    const items = await db
      .select()
      .from(auditLogTable)
      .orderBy(desc(auditLogTable.createdAt))
      .limit(50);

    res.json(
      items.map((a) => ({
        id: a.id,
        tipo: a.acao,
        descricao: a.detalhes ?? a.acao,
        entidade: a.entidade,
        entidade_id: a.entidadeId ?? 0,
        usuario: a.usuarioNome ?? null,
        created_at: a.createdAt.toISOString(),
      })),
    );
  } catch (err) {
    logger.error({ err }, "Dashboard activity failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
