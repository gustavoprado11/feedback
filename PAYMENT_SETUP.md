# Configuração do Sistema de Pagamento Obrigatório

Este documento descreve todas as mudanças implementadas para garantir que novos usuários precisem pagar antes de acessar o sistema.

## ⚠️ PASSO OBRIGATÓRIO: Migration do Banco de Dados

**ANTES DE TUDO:** Você precisa executar a migration SQL no Supabase para adicionar os campos necessários.

### 🚀 Execução Rápida

1. Acesse: [Supabase Dashboard](https://supabase.com/dashboard) → Seu Projeto → **SQL Editor**
2. Clique em **New Query**
3. Cole o conteúdo do arquivo: [supabase/migrations/001_add_stripe_fields.sql](supabase/migrations/001_add_stripe_fields.sql)
4. Clique em **Run**

📖 **Guia completo:** [supabase/MIGRATION_GUIDE.md](supabase/MIGRATION_GUIDE.md)

**Sem executar esta migration, o sistema NÃO funcionará!** Os campos `stripe_customer_id`, `stripe_subscription_id`, `subscription_status` e `subscription_end_date` são essenciais.

---

## 📋 Mudanças Implementadas

### 1. Nova Página de Assinatura (`/subscribe`)
- Página intermediária que mostra informações do plano
- Redireciona automaticamente para o Payment Link do Stripe após cadastro
- Realiza polling para detectar quando o pagamento é confirmado
- Suporta renovação de assinaturas canceladas

**Arquivo:** [src/app/subscribe/page.tsx](src/app/subscribe/page.tsx)

### 2. Fluxo de Registro Atualizado
- Após cadastro, usuário é redirecionado para `/subscribe?auto=true`
- Contagem regressiva de 3 segundos antes de redirecionar ao Stripe
- Não há mais autenticação automática sem pagamento

**Arquivos modificados:**
- [src/app/(auth)/register/page.tsx](src/app/(auth)/register/page.tsx#L45-L47)

### 3. Webhook do Stripe Aprimorado
- Agora suporta Payment Links (identifica usuário pelo email)
- Fallback para identificação por Customer ID
- Atualiza automaticamente o status da assinatura

**Arquivo modificado:**
- [src/app/api/stripe/webhook/route.ts](src/app/api/stripe/webhook/route.ts#L53-L84)

**Eventos tratados:**
- ✅ `checkout.session.completed` - Ativa assinatura após pagamento
- ✅ `customer.subscription.created/updated` - Atualiza dados da assinatura
- ✅ `customer.subscription.deleted` - Marca como cancelada
- ✅ `invoice.payment_failed` - Marca como past_due
- ✅ `invoice.payment_succeeded` - Reativa se estava pendente

### 4. Proteção do Dashboard
- Verifica assinatura no carregamento inicial
- Redireciona para `/subscribe` se assinatura inativa
- Permite acesso com status `past_due` (com aviso)

**Arquivo modificado:**
- [src/app/dashboard/page.tsx](src/app/dashboard/page.tsx#L64-L99)

### 5. Banner de Aviso para Pagamentos Pendentes
- Exibido no topo do dashboard para usuários com `past_due`
- Botão direto para atualizar método de pagamento

**Arquivo modificado:**
- [src/app/dashboard/page.tsx](src/app/dashboard/page.tsx#L536-L561)

### 6. Função de Verificação Atualizada
- `hasActiveSubscription()` agora permite `past_due`
- Statuses aceitos: `active`, `trialing`, `past_due`

**Arquivo modificado:**
- [src/lib/auth.ts](src/lib/auth.ts#L49-L69)

---

## 🔧 Configuração do Payment Link no Stripe

Para o sistema funcionar corretamente, o Payment Link precisa estar configurado assim:

### 1. Acessar o Dashboard do Stripe
1. Vá para [dashboard.stripe.com](https://dashboard.stripe.com)
2. Navegue para **Payment Links** no menu lateral
3. Encontre o link: `https://buy.stripe.com/9B628qgT21XT2KYfcIfw400`

### 2. Configurações Necessárias

#### ✅ Coleta de Email
- **CRÍTICO:** Marque "Coletar email do cliente"
- Isso permite que o webhook identifique o usuário

#### ✅ Tipo de Produto
- Deve ser uma **Assinatura Recorrente**
- Valor: R$ 19,90/mês

#### ✅ URL de Sucesso (Opcional mas Recomendado)
Configure a URL de retorno após pagamento:
```
https://seu-dominio.com/dashboard?payment=success
```

#### ✅ URL de Cancelamento (Opcional)
Configure a URL se o usuário cancelar:
```
https://seu-dominio.com/subscribe?canceled=true
```

---

## 🧪 Como Testar o Fluxo Completo

### Teste 1: Novo Usuário (Fluxo Completo)

1. **Cadastro**
   ```
   1. Acesse /register
   2. Preencha email e senha
   3. Clique em "Criar Conta"

   Esperado: Redireciona para /subscribe com countdown de 3 segundos
   ```

2. **Página de Assinatura**
   ```
   Esperado:
   - Mostra informações do plano (R$ 19,90/mês)
   - Countdown de 3 segundos
   - Redireciona automaticamente para o Payment Link do Stripe
   ```

3. **Pagamento no Stripe**
   ```
   Use cartão de teste: 4242 4242 4242 4242
   Qualquer data futura e CVC

   Esperado: Após confirmar, retorna para /subscribe
   ```

4. **Confirmação de Pagamento**
   ```
   Esperado:
   - Sistema detecta pagamento via polling (até 5 minutos)
   - Redireciona automaticamente para /dashboard?payment=success
   - Acesso liberado
   ```

### Teste 2: Usuário Sem Pagamento Tenta Acessar Dashboard

1. **Criar usuário sem pagar**
   ```
   1. Cadastre-se mas não complete o pagamento
   2. Tente acessar /dashboard diretamente

   Esperado: Redireciona para /subscribe
   ```

2. **Verificar rotas protegidas**
   ```
   Tente acessar: GET /api/establishments

   Esperado: 403 Forbidden com mensagem:
   "Assinatura inativa. Assine para acessar o sistema."
   ```

### Teste 3: Cancelamento de Assinatura

1. **Cancelar no Stripe**
   ```
   1. Acesse o portal de gerenciamento
   2. Cancele a assinatura

   Esperado: Webhook atualiza status para "canceled"
   ```

2. **Tentar acessar o sistema**
   ```
   1. Faça logout e login novamente
   2. Tente acessar /dashboard

   Esperado: Redireciona para /subscribe com mensagem de renovação
   ```

### Teste 4: Falha de Pagamento (past_due)

1. **Simular falha**
   ```
   No Stripe Dashboard, marque a assinatura como "past_due"
   ou aguarde uma tentativa de cobrança falhar
   ```

2. **Acessar o dashboard**
   ```
   Esperado:
   - Acesso permitido
   - Banner amarelo no topo com aviso de pagamento pendente
   - Botão "Atualizar Pagamento"
   ```

### Teste 5: Webhook Events

**Teste localmente com Stripe CLI:**
```bash
# 1. Instalar Stripe CLI
brew install stripe/stripe-cli/stripe

# 2. Fazer login
stripe login

# 3. Escutar webhooks localmente
stripe listen --forward-to localhost:3000/api/stripe/webhook

# 4. Em outro terminal, disparar evento de teste
stripe trigger checkout.session.completed
```

**Eventos para testar:**
- ✅ `checkout.session.completed` - Pagamento aprovado
- ✅ `customer.subscription.deleted` - Assinatura cancelada
- ✅ `invoice.payment_failed` - Falha no pagamento
- ✅ `invoice.payment_succeeded` - Pagamento bem-sucedido

---

## 🔐 Status de Assinatura

| Status | Acesso | Comportamento |
|--------|--------|---------------|
| `inactive` | ❌ Negado | Redireciona para `/subscribe` |
| `active` | ✅ Permitido | Acesso total |
| `trialing` | ✅ Permitido | Acesso total (período de teste) |
| `past_due` | ⚠️ Permitido com aviso | Banner de alerta no dashboard |
| `canceled` | ❌ Negado | Redireciona para `/subscribe` (renovação) |

---

## 📊 Fluxograma do Sistema

```
┌─────────────────┐
│  Novo Usuário   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  /register      │
│  (Criar conta)  │
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│  /subscribe?auto    │
│  (Countdown 3s)     │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Payment Link       │
│  (Stripe Checkout)  │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Webhook Stripe     │
│  subscription=active│
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  /dashboard         │
│  ✅ Acesso Liberado │
└─────────────────────┘

Se tentar acessar sem pagar:

┌─────────────────┐
│  Tenta acessar  │
│  /dashboard     │
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│  Verifica assinatura│
│  Status: inactive   │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Redirect           │
│  /subscribe         │
└─────────────────────┘
```

---

## 🚨 Possíveis Problemas e Soluções

### Problema: Webhook não está ativando a assinatura

**Causas:**
1. Email do usuário não corresponde ao email no Stripe
2. Webhook não está configurado no Stripe
3. STRIPE_WEBHOOK_SECRET incorreto

**Solução:**
```bash
# 1. Verificar logs do webhook
# Procurar por: "Could not find user for checkout session"

# 2. Verificar se o email corresponde
# No banco: SELECT email FROM users WHERE email = 'usuario@email.com';

# 3. Testar webhook manualmente
stripe trigger checkout.session.completed
```

### Problema: Usuário fica em loop entre /subscribe e /dashboard

**Causa:** Status da assinatura não está sendo atualizado

**Solução:**
```sql
-- Verificar status atual
SELECT id, email, subscription_status FROM users WHERE email = 'usuario@email.com';

-- Se necessário, atualizar manualmente
UPDATE users
SET subscription_status = 'active', stripe_subscription_id = 'sub_xxxxx'
WHERE email = 'usuario@email.com';
```

### Problema: Auto-redirect não funciona

**Causa:** useSearchParams sem Suspense

**Solução:** Já implementado - componente está envolvido com Suspense

---

## 📝 Notas Importantes

1. **Email é Crítico:** O Payment Link DEVE coletar o email do cliente, caso contrário o webhook não conseguirá identificar o usuário.

2. **Polling:** A página `/subscribe` faz polling a cada 3 segundos por até 5 minutos para detectar o pagamento.

3. **Past Due:** Usuários com pagamento pendente mantêm acesso temporário, mas veem um aviso.

4. **Cancelamento:** Assinaturas canceladas bloqueiam o acesso imediatamente.

5. **Teste em Produção:** Use o modo de teste do Stripe antes de ativar em produção.

---

## 🎯 Próximos Passos

Após testar e validar:

1. ✅ Configurar o Payment Link no Stripe corretamente
2. ✅ Testar todos os fluxos em ambiente de desenvolvimento
3. ✅ Verificar que o webhook está recebendo eventos
4. ✅ Configurar URLs de retorno no Payment Link
5. ✅ Testar com cartão de teste do Stripe
6. 🚀 Fazer deploy para produção
7. 📧 Comunicar usuários existentes sobre a mudança

---

## 📞 Suporte

Em caso de dúvidas ou problemas:
- Verifique os logs do webhook em [src/app/api/stripe/webhook/route.ts](src/app/api/stripe/webhook/route.ts)
- Consulte a [documentação do Stripe](https://stripe.com/docs/payments/payment-links)
- Teste com [Stripe CLI](https://stripe.com/docs/stripe-cli)
