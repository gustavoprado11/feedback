# Configuração do Stripe

Este guia detalha como configurar o Stripe para pagamentos por assinatura na plataforma.

## 1. Criar Produto no Stripe

1. Acesse o [Dashboard do Stripe](https://dashboard.stripe.com)
2. Vá em **Produtos** > **Adicionar produto**
3. Configure o produto:
   - **Nome**: Diz Aí - Plano Profissional
   - **Descrição**: Acesso completo à plataforma de feedback
   - **Preço**: R$ 19,90 / mês (recorrente)
   - **Moeda**: BRL
4. Após criar, copie o **Price ID** (começa com `price_...`)

## 2. Configurar Variáveis de Ambiente

Adicione as seguintes variáveis no arquivo `.env`:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY="sk_test_..." # Chave secreta do Stripe (Dashboard > Developers > API keys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..." # Chave pública do Stripe
STRIPE_WEBHOOK_SECRET="whsec_..." # Será gerado na etapa 3
STRIPE_PRICE_ID="price_..." # Price ID do produto criado na etapa 1
```

## 3. Configurar Webhooks

Os webhooks são essenciais para sincronizar o status das assinaturas.

### Desenvolvimento Local (usando Stripe CLI)

1. Instale o [Stripe CLI](https://stripe.com/docs/stripe-cli)
2. Execute o login:
   ```bash
   stripe login
   ```
3. Inicie o redirecionamento de webhooks:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
4. Copie o webhook secret que aparece (começa com `whsec_...`)
5. Adicione ao `.env` como `STRIPE_WEBHOOK_SECRET`

### Produção

1. No Dashboard do Stripe, vá em **Developers** > **Webhooks**
2. Clique em **Add endpoint**
3. Configure:
   - **URL**: `https://seu-dominio.com/api/stripe/webhook`
   - **Eventos a escutar**:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
     - `invoice.payment_succeeded`
4. Copie o **Signing secret** e adicione ao `.env` de produção

## 4. Aplicar Migração do Banco de Dados

Execute a migração SQL no Supabase:

```bash
# Acesse o SQL Editor no Supabase Dashboard e execute:
# supabase/migrations/20260112_add_subscription_fields.sql
```

Ou use a CLI do Supabase:

```bash
supabase db push
```

## 5. Testar a Integração

### Cartões de Teste

Use estes cartões para testar pagamentos:

- **Pagamento aprovado**: `4242 4242 4242 4242`
- **Pagamento recusado**: `4000 0000 0000 0002`
- **Requer autenticação**: `4000 0025 0000 3155`

- **CVV**: Qualquer 3 dígitos
- **Data**: Qualquer data futura
- **CEP**: Qualquer CEP

### Fluxo de Teste

1. Crie uma conta na plataforma
2. Acesse `/pricing`
3. Clique em "Assinar Agora"
4. Use um cartão de teste
5. Complete o pagamento
6. Verifique se foi redirecionado para o dashboard
7. Verifique se a assinatura aparece como ativa

### Testar Webhooks

```bash
# Com Stripe CLI rodando, simule eventos:
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
```

## 6. Portal de Gerenciamento

O Stripe Customer Portal permite que usuários:
- Atualizem método de pagamento
- Visualizem histórico de faturas
- Cancelem assinatura

O portal é acessado via botão "Gerenciar Assinatura" no dashboard.

## 7. Variáveis Obrigatórias

Certifique-se de que todas as variáveis estão configuradas:

```bash
✅ STRIPE_SECRET_KEY
✅ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
✅ STRIPE_WEBHOOK_SECRET
✅ STRIPE_PRICE_ID
```

## 8. Modo Produção

Quando estiver pronto para produção:

1. Altere as chaves de teste (`sk_test_...`, `pk_test_...`) para chaves de produção (`sk_live_...`, `pk_live_...`)
2. Configure webhooks de produção (passo 3)
3. Ative o Stripe no modo de produção no dashboard

## Eventos Importantes

A aplicação monitora estes eventos do Stripe:

| Evento | Ação |
|--------|------|
| `checkout.session.completed` | Ativa assinatura após pagamento |
| `customer.subscription.updated` | Atualiza status da assinatura |
| `customer.subscription.deleted` | Marca assinatura como cancelada |
| `invoice.payment_failed` | Marca assinatura como `past_due` |
| `invoice.payment_succeeded` | Reativa assinatura se estava `past_due` |

## Troubleshooting

### Webhook não está funcionando

- Verifique se o `STRIPE_WEBHOOK_SECRET` está correto
- No desenvolvimento, certifique-se de que `stripe listen` está rodando
- Verifique os logs do webhook no Dashboard do Stripe

### Pagamento não ativa assinatura

- Verifique se o webhook `checkout.session.completed` foi recebido
- Verifique se o `STRIPE_PRICE_ID` está correto
- Verifique os logs da aplicação

### Assinatura não aparece no dashboard

- Verifique se a migração do banco foi executada
- Verifique se os campos `stripe_customer_id` e `stripe_subscription_id` foram salvos
- Execute a query no Supabase:
  ```sql
  SELECT * FROM users WHERE email = 'seu@email.com';
  ```

## Recursos

- [Documentação do Stripe](https://stripe.com/docs)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
- [Customer Portal](https://stripe.com/docs/billing/subscriptions/integrating-customer-portal)
- [Webhooks](https://stripe.com/docs/webhooks)
