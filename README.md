# FeedFlow

Micro-SaaS para coleta de feedback em estabelecimentos fisicos via QR Code.

## Sobre o Projeto

FeedFlow e uma solucao simples para que estabelecimentos fisicos (restaurantes, cafes, academias, clinicas, etc.) possam coletar feedback dos seus clientes de forma:

- **Rapida**: Menos de 30 segundos para o cliente enviar feedback
- **Anonima**: Sem necessidade de cadastro ou identificacao
- **Privada**: Feedbacks visiveis apenas para o estabelecimento
- **Em tempo real**: Alertas instantaneos para feedbacks negativos

## Funcionalidades

- QR Code exclusivo para cada estabelecimento
- Pagina de feedback mobile-first (sem login)
- Painel simples para visualizar feedbacks
- Filtros por periodo e tipo de avaliacao
- Alertas por email para feedbacks negativos
- Metricas de satisfacao

## Tecnologias

- **Framework**: Next.js 15 com App Router
- **Linguagem**: TypeScript
- **Estilizacao**: Tailwind CSS
- **Banco de Dados**: Supabase (PostgreSQL)
- **Autenticacao**: JWT com cookies HTTP-only
- **QR Code**: qrcode library
- **Email**: Nodemailer
- **Deploy**: Vercel

## Deploy em Producao

### 1. Configurar Supabase (Banco de Dados)

1. Acesse [supabase.com](https://supabase.com) e crie uma conta gratuita
2. Crie um novo projeto
3. Va em **SQL Editor** e execute o conteudo do arquivo `supabase/schema.sql`
4. Va em **Settings > API** e copie:
   - `Project URL` -> `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Deploy no Vercel

1. Acesse [vercel.com](https://vercel.com) e conecte sua conta GitHub
2. Importe o repositorio
3. Configure as variaveis de ambiente:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
   JWT_SECRET=uma-chave-secreta-forte
   NEXT_PUBLIC_APP_URL=https://seu-app.vercel.app
   ```
4. Clique em **Deploy**

### 3. (Opcional) Configurar Alertas por Email

Para receber alertas de feedback negativo, adicione as variaveis SMTP no Vercel:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu@email.com
SMTP_PASS=sua-senha-de-app
```

## Desenvolvimento Local

1. Clone o repositorio
2. Copie o arquivo de ambiente:
   ```bash
   cp .env.example .env
   ```
3. Configure as variaveis do Supabase no `.env`
4. Instale as dependencias:
   ```bash
   npm install
   ```
5. Execute o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
6. Acesse [http://localhost:3000](http://localhost:3000)

## Estrutura do Projeto

```
src/
  app/
    (auth)/          # Paginas de autenticacao
    api/             # Rotas da API
    dashboard/       # Painel do estabelecimento
    f/[slug]/        # Pagina publica de feedback
  lib/
    auth.ts          # Funcoes de autenticacao
    supabase.ts      # Cliente e funcoes do Supabase
    email.ts         # Envio de emails
    utils.ts         # Funcoes utilitarias
supabase/
  schema.sql         # Schema do banco de dados
```

## Licenca

Este projeto e privado e de uso exclusivo.
