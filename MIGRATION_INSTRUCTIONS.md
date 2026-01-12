# 🔧 Instruções de Migration - Campo weekly_reports_enabled

## ⚠️ IMPORTANTE: Execute esta migration no Supabase

Para que o sistema de relatórios semanais funcione corretamente com o toggle, você precisa adicionar o campo `weekly_reports_enabled` na tabela `establishments`.

## 📝 Passo a Passo

### 1. Acesse o Supabase Dashboard

1. Vá para https://supabase.com/dashboard
2. Selecione seu projeto
3. No menu lateral, clique em **SQL Editor**

### 2. Execute o SQL

Copie e cole o seguinte SQL no editor e clique em **Run**:

```sql
-- Adicionar campo weekly_reports_enabled na tabela establishments
ALTER TABLE establishments
ADD COLUMN IF NOT EXISTS weekly_reports_enabled BOOLEAN DEFAULT true;

-- Atualizar registros existentes para habilitar relatórios por padrão
UPDATE establishments
SET weekly_reports_enabled = true
WHERE weekly_reports_enabled IS NULL;
```

### 3. Verificar se funcionou

Execute este comando para verificar:

```sql
SELECT id, name, weekly_reports_enabled
FROM establishments
LIMIT 5;
```

Você deve ver a coluna `weekly_reports_enabled` com valor `true` para todos os estabelecimentos.

## ✅ Pronto!

Após executar a migration:

- O toggle de "Relatórios Semanais" no dashboard funcionará corretamente
- Por padrão, todos os estabelecimentos receberão relatórios semanais
- Os usuários poderão desabilitar os relatórios a qualquer momento

## 🔍 O que foi implementado

### 1. **Dashboard - Novo Card "Relatórios Semanais"**
- Toggle para habilitar/desabilitar relatórios
- Salvamento automático ao mudar o toggle
- Mensagem indicando o e-mail que receberá os relatórios

### 2. **Salvamento Automático nos Toggles**
- Toggle do Google Reviews agora salva automaticamente
- Botão "Salvar link" apenas para o URL do Google
- Feedback visual ao salvar

### 3. **Link Discreto nas Páginas de Feedback**
- Footer com "Powered by Diz Aí"
- Link adicional "Implementar no meu negócio"
- Ajuda a atrair novos clientes

### 4. **Cron Job Atualizado**
- Verifica se o relatório está habilitado antes de enviar
- Economiza recursos e respeita a preferência do usuário

## 🚀 Testando

Após a migration:

1. Acesse o dashboard
2. Vá em "Relatórios Semanais"
3. Desligue o toggle
4. Recarregue a página
5. O toggle deve estar desligado (configuração foi salva)

## 🆘 Problemas?

Se encontrar erros:

1. Verifique se você está no projeto correto no Supabase
2. Verifique se a tabela `establishments` existe
3. Tente executar os comandos um por vez
4. Se o campo já existir, não há problema - o `IF NOT EXISTS` previne erros

---

**Data da Migration**: 12/01/2026
**Branch**: main
**Commit**: 8de8a2b
