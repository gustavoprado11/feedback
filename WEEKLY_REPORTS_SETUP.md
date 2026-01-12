# 📊 Relatórios Semanais - Guia de Configuração

## Visão Geral

O sistema de relatórios semanais envia automaticamente um e-mail resumido para cada estabelecimento toda segunda-feira às 9h (horário UTC). O relatório inclui:

- **Estatísticas da semana**: Total de feedbacks, distribuição por tipo (negativos, neutros, positivos)
- **Comparação com semana anterior**: Mostra tendência de crescimento/queda
- **Feedbacks negativos**: Lista até 5 feedbacks negativos mais recentes (para ação imediata)
- **Destaques positivos**: Mostra até 3 feedbacks positivos para motivação
- **Design profissional**: E-mail HTML responsivo e bem formatado

## 🚀 Como Funciona

### 1. Arquivos Criados

- **`src/lib/email.ts`**: Função `sendWeeklyReport()` com template HTML
- **`src/app/api/cron/weekly-reports/route.ts`**: Endpoint executado pelo cron job
- **`src/app/api/cron/test-weekly-report/route.ts`**: Endpoint para testes manuais
- **`vercel.json`**: Configuração do cron job no Vercel

### 2. Agendamento

O cron job está configurado para executar:
- **Frequência**: Toda segunda-feira às 9h UTC
- **Expressão cron**: `0 9 * * 1`
- **Plataforma**: Vercel Cron Jobs (gratuito no plano Pro)

### 3. Lógica de Envio

O sistema:
1. Busca todos os estabelecimentos com assinatura ativa
2. Para cada estabelecimento:
   - Coleta feedbacks dos últimos 7 dias
   - Coleta feedbacks da semana anterior (para comparação)
   - Calcula estatísticas
   - Envia e-mail para o `alert_email` do estabelecimento
3. **Importante**: Só envia e-mail se houver pelo menos 1 feedback na semana

## 🔧 Configuração no Vercel

### Passo 1: Adicionar Variável de Ambiente

No dashboard da Vercel:

1. Vá em **Settings** > **Environment Variables**
2. Adicione a variável:
   ```
   CRON_SECRET=dizai_cron_secret_2026_secure_token_xyz789
   ```
3. Selecione todos os ambientes (Production, Preview, Development)

### Passo 2: Deploy

O arquivo `vercel.json` já está configurado. Ao fazer o deploy:

```bash
git add .
git commit -m "Add weekly reports functionality"
git push origin main
```

O Vercel automaticamente detectará a configuração do cron job.

### Passo 3: Verificar Configuração

No dashboard da Vercel:

1. Vá em **Settings** > **Cron Jobs**
2. Você deve ver: `/api/cron/weekly-reports` agendado para `0 9 * * 1`
3. Status deve estar **Active**

## 🧪 Testando os Relatórios

### Opção 1: Teste Manual via API

Use o endpoint de teste para enviar um relatório imediatamente:

```bash
curl -X POST https://dizaibrasil.vercel.app/api/cron/test-weekly-report \
  -H "Content-Type: application/json" \
  -d '{"establishmentId": "SEU_ESTABLISHMENT_ID_AQUI"}'
```

**Resposta esperada:**
```json
{
  "success": true,
  "message": "Test report sent successfully",
  "data": {
    "establishmentName": "Nome do Estabelecimento",
    "alertEmail": "email@exemplo.com",
    "stats": {
      "totalFeedbacks": 10,
      "badCount": 2,
      "okayCount": 3,
      "greatCount": 5,
      "previousWeekTotal": 8
    }
  }
}
```

### Opção 2: Executar Cron Manualmente no Vercel

1. Vá em **Deployments** > selecione o deployment mais recente
2. Clique em **Functions**
3. Encontre `/api/cron/weekly-reports`
4. Clique em **Invoke** (precisa adicionar header de autorização)

### Opção 3: Testar Localmente

```bash
# No terminal, execute:
curl -X GET http://localhost:3000/api/cron/weekly-reports \
  -H "Authorization: Bearer dizai_cron_secret_2026_secure_token_xyz789"
```

## 📧 Exemplo de E-mail

O e-mail enviado inclui:

```
┌─────────────────────────────────────┐
│   📊 Relatório Semanal              │
│   Nome do Estabelecimento           │
└─────────────────────────────────────┘

Resumo da Semana
────────────────
Total de Feedbacks: 15
↑ 25% em relação à semana anterior

[2 Negativos] [5 Neutros] [8 Positivos]
   13%           33%          54%

⚠️ Feedbacks Negativos (Ação Necessária)
─────────────────────────────────────────
• "Atendimento demorado..." - 10/01 14:30
• "Produto veio errado..." - 09/01 16:45

⭐ Destaques Positivos
─────────────────────
• "Excelente atendimento!" - 12/01 11:20
• "Muito satisfeito com a compra" - 11/01 15:10

[Ver Painel Completo]
```

## 🔐 Segurança

- **Autenticação**: O endpoint verifica o header `Authorization: Bearer <CRON_SECRET>`
- **Restrição**: Apenas o Vercel Cron pode chamar o endpoint
- **Validação**: Verifica se há assinatura ativa antes de enviar

## 📊 Monitoramento

### Logs no Vercel

1. Vá em **Deployments** > **Functions**
2. Clique em `/api/cron/weekly-reports`
3. Veja os logs de execução

### Console Logs

O sistema registra:
- ✅ E-mails enviados com sucesso
- ⚠️ Estabelecimentos sem feedbacks (pulados)
- ❌ Erros durante o processamento

Exemplo de log:
```
Weekly report sent to email@exemplo.com for Estabelecimento XYZ
No feedbacks for Estabelecimento ABC, skipping email
```

## 🛠️ Troubleshooting

### Problema: E-mails não estão sendo enviados

**Solução:**
1. Verifique se `SMTP_USER` e `SMTP_PASS` estão configurados no Vercel
2. Verifique os logs no Vercel Functions
3. Teste manualmente com o endpoint de teste

### Problema: Cron job não está executando

**Solução:**
1. Verifique se `CRON_SECRET` está configurado
2. Confirme que `vercel.json` está no root do projeto
3. Faça um novo deploy após adicionar as variáveis

### Problema: Relatório está vazio

**Motivo:** Não há feedbacks nos últimos 7 dias
**Comportamento esperado:** O sistema não envia e-mail neste caso (intencional)

## 📝 Notas Importantes

1. **Plano Vercel**: Cron jobs estão disponíveis no plano Pro (pago)
2. **Fuso horário**: O horário é UTC. 9h UTC = 6h BRT (Brasília)
3. **Limite de envio**: Gmail SMTP tem limite de ~500 e-mails/dia
4. **Assinatura ativa**: Só envia para usuários com `subscription_status='active'`

## 🔄 Alterando a Frequência

Para alterar o horário/frequência, edite `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/weekly-reports",
      "schedule": "0 9 * * 1"  // Altere aqui
    }
  ]
}
```

Exemplos de expressões cron:
- `0 9 * * 1` - Segundas às 9h UTC
- `0 10 * * 5` - Sextas às 10h UTC
- `0 12 * * *` - Todos os dias ao meio-dia UTC
- `0 18 * * 0` - Domingos às 18h UTC

## 📬 Suporte

Se precisar de ajuda ou encontrar problemas:
1. Verifique os logs no Vercel
2. Teste com o endpoint manual
3. Verifique as variáveis de ambiente
4. Confirme que o SMTP está funcionando

---

**Desenvolvido para o sistema Diz Aí** 🎯
