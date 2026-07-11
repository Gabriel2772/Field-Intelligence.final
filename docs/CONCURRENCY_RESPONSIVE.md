# Concorrência e adaptação por dispositivo

## Meta operacional

O sistema foi dimensionado para 2–20 usuários ativos simultaneamente e deve ser validado com baseline de 20 usuários por 15 minutos e pico de 40 por 2 minutos. Isso não significa apenas 20 contas cadastradas: inclui leituras, mutações, reconexões e geração de trabalho no mesmo período.

## Backend

- API Express stateless;
- PostgreSQL como fonte de verdade;
- pool padrão de 8 conexões por instância, configurável por `DATABASE_POOL_MAX`;
- timeouts de conexão, consulta e statement;
- encerramento gracioso em SIGTERM/SIGINT;
- mutações opcionais com `Idempotency-Key`, persistidas em PostgreSQL;
- sessões persistidas no banco;
- escrita restrita aos papéis `admin`, `auditor`, `coordenador` e `gestor`;
- `viewer` permanece somente leitura;
- índices para consultas críticas de status, obra, data e relacionamentos;
- dashboard calculado por agregações no banco, sem carregar tabelas inteiras;
- IDs de requisição e contexto não sensível do cliente nos logs;
- CORS por allowlist e limites de payload.

Antes da implantação, execute `pnpm --filter @workspace/db push` para aplicar as novas colunas/tabelas/índices. Em produção, configure `ALLOWED_ORIGINS` explicitamente. Só habilite `ALLOW_REPLIT_APP_ORIGINS=true` quando origens Replit adicionais forem necessárias.

## Idempotência

Clientes offline devem enviar uma chave estável de 8–128 caracteres em `Idempotency-Key` para cada mutação. Repetir a mesma operação com a mesma chave devolve o resultado original. Reusar a chave com corpo diferente retorna conflito.

A chave identifica a intenção do usuário, não uma tentativa de rede. Portanto, retries da mesma mutação reutilizam a chave; uma nova ação recebe outra chave.

## Dispositivos

O frontend não usa user-agent como fonte de verdade. Ele mede viewport, orientação, ponteiro e modo de exibição e classifica o contexto como `compact`, `mobile`, `tablet`, `desktop` ou `wide`.

- celular: bottom navigation, menu “Mais”, cards e ações de 48 px;
- tablet: composição intermediária;
- computador: sidebar e maior densidade;
- safe areas por `env(safe-area-inset-*)`;
- altura por `100dvh`;
- zoom do navegador permitido;
- suporte a redução de movimento;
- tabela de ativos convertida em cards no celular;
- PWA com app shell offline, sem cache de respostas autenticadas da API.

Os headers `X-Viewport-Class`, `X-Pointer-Type` e `X-Display-Mode` servem somente à observabilidade. Nunca participam de autenticação ou autorização.

## Teste de carga

Use banco e implantação descartáveis. O teste de escrita cria visitas e não deve ser executado contra dados reais.

```bash
k6 run tests/load/field-intelligence.js \
  -e BASE_URL=https://ambiente-de-teste.example \
  -e SESSION_COOKIE='valor-da-sessao' \
  -e WRITE_TEST_ENABLED=true \
  -e TEST_OBRA_ID=1
```

Não salve cookie ou token no repositório. Critérios: erro inesperado abaixo de 1%, p95 de leitura abaixo de 500 ms, p95 de escrita abaixo de 900 ms, nenhuma duplicação no replay idempotente e nenhum vazamento entre papéis.

## Limites ainda não resolvidos

- o produto continua sendo de uma única organização Tequaly; multiempresa exige `organization_id` em todas as entidades;
- o app shell funciona offline, mas os dados operacionais ainda não possuem outbox/merge completo nesta versão;
- a autorização é por função global, ainda não por obra/contrato;
- o teste de carga depende de ambiente com autenticação e banco descartável.
