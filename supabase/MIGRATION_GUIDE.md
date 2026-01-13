# Guia de Migration do Supabase

Este guia explica como aplicar as migrations necessárias para o sistema de pagamento funcionar corretamente.

## ⚠️ IMPORTANTE: Migration Obrigatória

O sistema de pagamento com Stripe **NÃO funcionará** sem executar a migration abaixo. Ela adiciona os campos essenciais para:
- Armazenar IDs do Stripe (customer e subscription)
- Rastrear status da assinatura
- Controlar acesso baseado em pagamento

---

## 📋 Passo a Passo

### 1. Acessar o Supabase Dashboard

1. Acesse: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto: **feedback-claude-feedback-collection-saas**
3. No menu lateral, clique em **SQL Editor**

### 2. Executar a Migration

1. Clique em **New Query** (ou "Nova Consulta")
2. Copie e cole o SQL abaixo:

```sql
-- Migration: Add Stripe subscription fields
-- Date: 2026-01-13
-- Description: Adds fields necessary for Stripe payment integration

-- Add Stripe fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS stripe_customer_id text,
ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
ADD COLUMN IF NOT EXISTS subscription_status text default 'inactive',
ADD COLUMN IF NOT EXISTS subscription_end_date timestamp with time zone;

-- Add weekly reports field to establishments table
ALTER TABLE establishments
ADD COLUMN IF NOT EXISTS weekly_reports_enabled boolean default true;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);

-- Add comments for documentation
COMMENT ON COLUMN users.stripe_customer_id IS 'Stripe customer ID for billing';
COMMENT ON COLUMN users.stripe_subscription_id IS 'Active Stripe subscription ID';
COMMENT ON COLUMN users.subscription_status IS 'Subscription status: inactive, active, trialing, past_due, canceled';
COMMENT ON COLUMN users.subscription_end_date IS 'Next billing date or subscription end date';
COMMENT ON COLUMN establishments.weekly_reports_enabled IS 'Whether to send weekly summary reports via email';
```

3. Clique em **Run** (ou F5)
4. Aguarde a mensagem: "Success. No rows returned"

### 3. Verificar a Migration

Execute a seguinte query para confirmar que os campos foram adicionados:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN (
  'stripe_customer_id',
  'stripe_subscription_id',
  'subscription_status',
  'subscription_end_date'
);
```

**Resultado esperado:** Deve retornar 4 linhas com os campos acima.

---

## 📊 Campos Adicionados

### Tabela `users`

| Campo | Tipo | Default | Descrição |
|-------|------|---------|-----------|
| `stripe_customer_id` | text | NULL | ID do cliente no Stripe |
| `stripe_subscription_id` | text | NULL | ID da assinatura ativa |
| `subscription_status` | text | 'inactive' | Status: inactive, active, trialing, past_due, canceled |
| `subscription_end_date` | timestamp | NULL | Próxima data de cobrança |

### Tabela `establishments`

| Campo | Tipo | Default | Descrição |
|-------|------|---------|-----------|
| `weekly_reports_enabled` | boolean | true | Habilita relatórios semanais por email |

---

## 🔍 Testar os Campos

Após executar a migration, teste com estas queries:

### 1. Ver estrutura da tabela users
```sql
SELECT * FROM users LIMIT 1;
```

### 2. Verificar usuários existentes (todos devem ter status 'inactive')
```sql
SELECT id, email, subscription_status
FROM users;
```

### 3. Atualizar um usuário para teste (opcional)
```sql
UPDATE users
SET
  subscription_status = 'active',
  stripe_customer_id = 'cus_test123'
WHERE email = 'seu-email@exemplo.com';
```

---

## ⚙️ Usuários Existentes

**IMPORTANTE:** Todos os usuários existentes terão `subscription_status = 'inactive'` por padrão.

### Opções para usuários antigos:

#### Opção 1: Forçar todos a assinarem (Recomendado)
Deixe como está. Todos serão redirecionados para `/subscribe` no próximo login.

#### Opção 2: Dar acesso gratuito para usuários antigos
```sql
UPDATE users
SET subscription_status = 'active'
WHERE created_at < '2026-01-13';  -- Data da implementação do pagamento
```

#### Opção 3: Período de teste para usuários antigos
```sql
UPDATE users
SET
  subscription_status = 'trialing',
  subscription_end_date = NOW() + INTERVAL '30 days'
WHERE created_at < '2026-01-13';
```

---

## 🚨 Troubleshooting

### Erro: "permission denied for table users"
**Solução:** Você precisa executar como owner do banco. Verifique se está usando a conexão correta no SQL Editor.

### Erro: "column already exists"
**Solução:** Os campos já foram adicionados. Execute a query de verificação para confirmar.

### Campos aparecem mas estão vazios
**Solução:** Correto! Os campos serão preenchidos quando:
- Webhook do Stripe receber eventos de pagamento
- Usuários completarem o checkout

---

## ✅ Checklist Pós-Migration

Após executar a migration, verifique:

- [ ] Migration executada com sucesso no Supabase
- [ ] Campos aparecem ao executar `SELECT * FROM users LIMIT 1`
- [ ] Todos os usuários têm `subscription_status = 'inactive'` (ou conforme sua escolha)
- [ ] Webhooks do Stripe estão configurados
- [ ] Aplicação deployada com as mudanças de código
- [ ] Testado fluxo completo: cadastro → pagamento → acesso

---

## 📝 Arquivo de Migration

A migration também está disponível em:
`/supabase/migrations/001_add_stripe_fields.sql`

Você pode executar diretamente:
```bash
# Se estiver usando Supabase CLI
supabase db push
```

---

## 🔗 Próximos Passos

1. ✅ Executar esta migration
2. Configurar o Payment Link no Stripe (veja [PAYMENT_SETUP.md](../PAYMENT_SETUP.md))
3. Testar o fluxo de pagamento
4. Comunicar usuários sobre a mudança (se houver usuários existentes)

---

## 💡 Dica

Se você preferir usar a interface gráfica do Supabase:

1. Vá para **Database → Tables**
2. Selecione a tabela `users`
3. Clique em **Add column**
4. Adicione cada campo manualmente

Mas usar o SQL é mais rápido e garante que os índices sejam criados corretamente.
