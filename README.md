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
- **Banco de Dados**: JSON (arquivo local para MVP)
- **Autenticacao**: JWT com cookies HTTP-only
- **QR Code**: qrcode library
- **Email**: Nodemailer

## Como Executar

1. Clone o repositorio
2. Copie o arquivo de ambiente:
   ```bash
   cp .env.example .env
   ```
3. Instale as dependencias:
   ```bash
   npm install
   ```
4. Execute o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
5. Acesse [http://localhost:3000](http://localhost:3000)

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
    db.ts            # Camada de banco de dados
    email.ts         # Envio de emails
    utils.ts         # Funcoes utilitarias
```

## Configuracao de Email (Opcional)

Para receber alertas de feedback negativo, configure as variaveis de ambiente SMTP:

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="seu@email.com"
SMTP_PASS="sua-senha-de-app"
```

## Licenca

Este projeto e privado e de uso exclusivo.
