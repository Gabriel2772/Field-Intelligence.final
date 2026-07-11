import type { Pool } from "pg";

const migrationSql = `
  select pg_advisory_xact_lock(hashtext('tequaly-field-intelligence-runtime-v1'));

  alter table users
    add column if not exists role varchar not null default 'auditor';

  create table if not exists idempotency_keys (
    fingerprint varchar(64) primary key,
    user_id varchar not null,
    method varchar(10) not null,
    path varchar(500) not null,
    request_hash varchar(64) not null,
    status_code integer,
    response_body jsonb,
    created_at timestamptz not null default now(),
    expires_at timestamptz not null
  );

  create index if not exists "IDX_idempotency_expires"
    on idempotency_keys (expires_at);
  create index if not exists "IDX_idempotency_user"
    on idempotency_keys (user_id);

  create index if not exists "IDX_obras_status" on obras (status);
  create index if not exists "IDX_obras_updated" on obras (updated_at);
  create index if not exists "IDX_contratos_obra" on contratos (obra_id);
  create index if not exists "IDX_contratos_status" on contratos (status);
  create index if not exists "IDX_frentes_obra" on frentes (obra_id);
  create index if not exists "IDX_frentes_status" on frentes (status);
  create index if not exists "IDX_ativos_obra" on ativos (obra_id);
  create index if not exists "IDX_ativos_status" on ativos (status);
  create index if not exists "IDX_visitas_obra" on visitas (obra_id);
  create index if not exists "IDX_visitas_data" on visitas (data_visita);
  create index if not exists "IDX_visitas_status" on visitas (status);
  create index if not exists "IDX_visita_gps_visita" on visita_gps (visita_id);
  create index if not exists "IDX_visita_ativos_visita" on visita_ativos (visita_id);
  create index if not exists "IDX_visita_ativos_ativo" on visita_ativos (ativo_id);
  create index if not exists "IDX_checklist_visita" on checklist_items (visita_id);
  create index if not exists "IDX_checklist_status" on checklist_items (status);
  create index if not exists "IDX_rncs_obra" on rncs (obra_id);
  create index if not exists "IDX_rncs_status" on rncs (status);
  create index if not exists "IDX_rncs_created" on rncs (created_at);
  create index if not exists "IDX_capas_rnc" on capas (rnc_id);
  create index if not exists "IDX_capas_status" on capas (status);
  create index if not exists "IDX_compromissos_obra" on compromissos (obra_id);
  create index if not exists "IDX_compromissos_status_prazo"
    on compromissos (status, prazo);
  create index if not exists "IDX_documentos_obra" on documentos (obra_id);
  create index if not exists "IDX_conciliacoes_obra" on conciliacoes (obra_id);
  create index if not exists "IDX_conciliacoes_status" on conciliacoes (status);
  create index if not exists "IDX_conciliacao_itens_conciliacao"
    on conciliacao_itens (conciliacao_id);
  create index if not exists "IDX_excecoes_obra" on excecoes (obra_id);
  create index if not exists "IDX_excecoes_status" on excecoes (status);
  create index if not exists "IDX_kpis_obra_created" on kpis (obra_id, created_at);
  create index if not exists "IDX_audit_created" on audit_log (created_at);
  create index if not exists "IDX_audit_entidade"
    on audit_log (entidade, entidade_id);
`;

export async function ensureRuntimeSchema(pool: Pool): Promise<void> {
  if (process.env.RUN_STARTUP_MIGRATIONS === "false") return;

  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query(migrationSql);
    await client.query("commit");
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}
