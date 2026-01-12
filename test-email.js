// Script de teste para envio de e-mail de relatório semanal
// Execute com: node test-email.js

// Carregar variáveis de ambiente do arquivo .env manualmente
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      if (key && !process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

// Simular a função sendWeeklyReport
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function testWeeklyReport() {
  console.log('🔍 Testando configuração de e-mail...\n');

  // Verificar variáveis de ambiente
  console.log('SMTP_HOST:', process.env.SMTP_HOST);
  console.log('SMTP_PORT:', process.env.SMTP_PORT);
  console.log('SMTP_USER:', process.env.SMTP_USER);
  console.log('SMTP_PASS:', process.env.SMTP_PASS ? '***configurado***' : '❌ NÃO CONFIGURADO');
  console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL);
  console.log('\n');

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('❌ Erro: SMTP_USER ou SMTP_PASS não configurados');
    process.exit(1);
  }

  // Dados de teste
  const testData = {
    establishmentName: 'Teste Estabelecimento',
    totalFeedbacks: 15,
    badCount: 2,
    okayCount: 5,
    greatCount: 8,
    negativeFeedbacks: [
      {
        comment: 'Atendimento demorado, esperei mais de 30 minutos',
        created_at: new Date().toISOString(),
      },
      {
        comment: 'Produto veio com defeito',
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ],
    positiveFeedbacks: [
      {
        comment: 'Excelente atendimento! Muito satisfeito',
        created_at: new Date().toISOString(),
      },
      {
        comment: 'Produto de qualidade e entrega rápida',
        created_at: new Date(Date.now() - 43200000).toISOString(),
      },
      {
        comment: 'Recomendo! Superou minhas expectativas',
        created_at: new Date(Date.now() - 129600000).toISOString(),
      },
    ],
    previousWeekTotal: 12,
  };

  // Calcular percentagens
  const badPercent = Math.round((testData.badCount / testData.totalFeedbacks) * 100);
  const okayPercent = Math.round((testData.okayCount / testData.totalFeedbacks) * 100);
  const greatPercent = Math.round((testData.greatCount / testData.totalFeedbacks) * 100);

  // Calcular tendência
  const diff = testData.totalFeedbacks - testData.previousWeekTotal;
  const percentChange = Math.round((diff / testData.previousWeekTotal) * 100);
  let trendHtml = '';
  if (diff > 0) {
    trendHtml = `<p style="color: #10b981; margin: 5px 0 0 0; font-size: 14px;">↑ ${percentChange}% em relação à semana anterior</p>`;
  } else if (diff < 0) {
    trendHtml = `<p style="color: #ef4444; margin: 5px 0 0 0; font-size: 14px;">↓ ${Math.abs(percentChange)}% em relação à semana anterior</p>`;
  }

  // Formatar data
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  // Gerar HTML dos feedbacks negativos
  const negativeFeedbacksHtml = testData.negativeFeedbacks
    .map(fb => `
      <div style="background: #fef2f2; border-left: 3px solid #ef4444; padding: 12px; margin: 8px 0; border-radius: 4px;">
        <p style="color: #1f2937; margin: 0; font-size: 14px;">${fb.comment}</p>
        <p style="color: #9ca3af; margin: 5px 0 0 0; font-size: 12px;">${formatDate(fb.created_at)}</p>
      </div>
    `).join('');

  // Gerar HTML dos feedbacks positivos
  const positiveFeedbacksHtml = testData.positiveFeedbacks
    .slice(0, 3)
    .map(fb => `
      <div style="background: #f0fdf4; border-left: 3px solid #10b981; padding: 12px; margin: 8px 0; border-radius: 4px;">
        <p style="color: #1f2937; margin: 0; font-size: 14px;">${fb.comment}</p>
        <p style="color: #9ca3af; margin: 5px 0 0 0; font-size: 12px;">${formatDate(fb.created_at)}</p>
      </div>
    `).join('');

  const mailOptions = {
    from: `"Diz Aí" <${process.env.SMTP_USER}>`,
    to: process.env.SMTP_USER, // Enviar para si mesmo como teste
    subject: `📊 [TESTE] Relatório Semanal - ${testData.establishmentName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">📊 Relatório Semanal</h1>
          <p style="color: #e0e7ff; margin: 8px 0 0 0; font-size: 16px;">${testData.establishmentName}</p>
        </div>

        <!-- Content -->
        <div style="background: #f9fafb; padding: 30px 20px;">
          <!-- Summary Stats -->
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h2 style="color: #1f2937; margin: 0 0 15px 0; font-size: 20px;">Resumo da Semana</h2>

            <div style="text-align: center; margin-bottom: 15px;">
              <p style="color: #6b7280; margin: 0; font-size: 14px;">Total de Feedbacks</p>
              <p style="color: #1f2937; margin: 5px 0 0 0; font-size: 36px; font-weight: bold;">${testData.totalFeedbacks}</p>
              ${trendHtml}
            </div>

            <div style="display: table; width: 100%; margin-top: 20px;">
              <div style="display: table-row;">
                <div style="display: table-cell; text-align: center; padding: 10px; background: #fef2f2; border-radius: 6px; width: 33%;">
                  <p style="color: #991b1b; margin: 0; font-size: 24px; font-weight: bold;">${testData.badCount}</p>
                  <p style="color: #ef4444; margin: 5px 0 0 0; font-size: 12px;">NEGATIVOS</p>
                  <p style="color: #9ca3af; margin: 3px 0 0 0; font-size: 11px;">${badPercent}%</p>
                </div>
                <div style="display: table-cell; width: 10px;"></div>
                <div style="display: table-cell; text-align: center; padding: 10px; background: #fef9e7; border-radius: 6px; width: 33%;">
                  <p style="color: #854d0e; margin: 0; font-size: 24px; font-weight: bold;">${testData.okayCount}</p>
                  <p style="color: #eab308; margin: 5px 0 0 0; font-size: 12px;">NEUTROS</p>
                  <p style="color: #9ca3af; margin: 3px 0 0 0; font-size: 11px;">${okayPercent}%</p>
                </div>
                <div style="display: table-cell; width: 10px;"></div>
                <div style="display: table-cell; text-align: center; padding: 10px; background: #f0fdf4; border-radius: 6px; width: 33%;">
                  <p style="color: #065f46; margin: 0; font-size: 24px; font-weight: bold;">${testData.greatCount}</p>
                  <p style="color: #10b981; margin: 5px 0 0 0; font-size: 12px;">POSITIVOS</p>
                  <p style="color: #9ca3af; margin: 3px 0 0 0; font-size: 11px;">${greatPercent}%</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Negative Feedbacks Section -->
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">⚠️ Feedbacks Negativos (Ação Necessária)</h3>
            ${negativeFeedbacksHtml}
          </div>

          <!-- Positive Feedbacks Section -->
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">⭐ Destaques Positivos</h3>
            ${positiveFeedbacksHtml}
          </div>

          <!-- CTA Button -->
          <div style="text-align: center; margin-top: 25px;">
            <p style="color: #6b7280; margin: 0 0 15px 0;">Acesse seu painel para ver todos os detalhes</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
               style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
              Ver Painel Completo
            </a>
          </div>

          <!-- Footer -->
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; margin: 0; font-size: 12px;">Este é um relatório automático enviado semanalmente</p>
            <p style="color: #9ca3af; margin: 5px 0 0 0; font-size: 12px;">Diz Aí - Sistema de Coleta de Feedbacks</p>
          </div>
        </div>
      </div>
    `,
  };

  console.log('📧 Enviando e-mail de teste...');
  console.log(`Para: ${mailOptions.to}`);
  console.log(`Assunto: ${mailOptions.subject}\n`);

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ E-mail enviado com sucesso!');
    console.log('Message ID:', info.messageId);
    console.log('\n📬 Verifique sua caixa de entrada:', mailOptions.to);
    console.log('\n⚠️ Se não chegou, verifique a pasta de SPAM/Lixo Eletrônico');
  } catch (error) {
    console.error('❌ Erro ao enviar e-mail:');
    console.error(error.message);
    if (error.code) {
      console.error('Código do erro:', error.code);
    }
    process.exit(1);
  }
}

// Executar teste
testWeeklyReport();
