import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export interface WeeklyReportData {
  establishmentName: string;
  totalFeedbacks: number;
  badCount: number;
  okayCount: number;
  greatCount: number;
  negativeFeedbacks: Array<{
    comment: string;
    created_at: string;
  }>;
  positiveFeedbacks: Array<{
    comment: string;
    created_at: string;
  }>;
  previousWeekTotal?: number;
}

export async function sendNegativeFeedbackAlert(
  to: string,
  establishmentName: string,
  comment?: string
) {
  // Skip if email is not configured
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('Email not configured. Would send alert to:', to);
    console.log('Establishment:', establishmentName);
    console.log('Comment:', comment || 'Sem comentário');
    return;
  }

  const mailOptions = {
    from: `"Diz Aí" <${process.env.SMTP_USER}>`,
    to,
    subject: `Alerta: Feedback negativo em ${establishmentName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Diz Aí</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1f2937; margin-top: 0;">Feedback Negativo Recebido</h2>
          <p style="color: #6b7280;">Um cliente deixou um feedback negativo no seu estabelecimento.</p>

          <div style="background: white; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="color: #1f2937; margin: 0;"><strong>Estabelecimento:</strong> ${establishmentName}</p>
            <p style="color: #1f2937; margin: 10px 0 0 0;"><strong>Avaliação:</strong> Negativa</p>
            ${comment ? `<p style="color: #1f2937; margin: 10px 0 0 0;"><strong>Comentário:</strong> ${comment}</p>` : ''}
          </div>

          <p style="color: #6b7280;">Acesse seu painel para mais detalhes e para agir rapidamente.</p>

          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
             style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 10px;">
            Ver Painel
          </a>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Alert email sent to:', to);
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}

export async function sendWeeklyReport(
  to: string,
  data: WeeklyReportData
) {
  // Skip if email is not configured
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('Email not configured. Would send weekly report to:', to);
    console.log('Establishment:', data.establishmentName);
    console.log('Total feedbacks:', data.totalFeedbacks);
    return;
  }

  // Calculate percentages
  const badPercent = data.totalFeedbacks > 0 ? Math.round((data.badCount / data.totalFeedbacks) * 100) : 0;
  const okayPercent = data.totalFeedbacks > 0 ? Math.round((data.okayCount / data.totalFeedbacks) * 100) : 0;
  const greatPercent = data.totalFeedbacks > 0 ? Math.round((data.greatCount / data.totalFeedbacks) * 100) : 0;

  // Calculate trend
  let trendHtml = '';
  if (data.previousWeekTotal !== undefined && data.previousWeekTotal > 0) {
    const diff = data.totalFeedbacks - data.previousWeekTotal;
    const percentChange = Math.round((diff / data.previousWeekTotal) * 100);
    if (diff > 0) {
      trendHtml = `<p style="color: #10b981; margin: 5px 0 0 0; font-size: 14px;">↑ ${percentChange}% em relação à semana anterior</p>`;
    } else if (diff < 0) {
      trendHtml = `<p style="color: #ef4444; margin: 5px 0 0 0; font-size: 14px;">↓ ${Math.abs(percentChange)}% em relação à semana anterior</p>`;
    } else {
      trendHtml = `<p style="color: #6b7280; margin: 5px 0 0 0; font-size: 14px;">Mesmo volume da semana anterior</p>`;
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  // Generate negative feedbacks section
  const negativeFeedbacksHtml = data.negativeFeedbacks.length > 0
    ? data.negativeFeedbacks.map(fb => `
        <div style="background: #fef2f2; border-left: 3px solid #ef4444; padding: 12px; margin: 8px 0; border-radius: 4px;">
          <p style="color: #1f2937; margin: 0; font-size: 14px;">${fb.comment || 'Sem comentário'}</p>
          <p style="color: #9ca3af; margin: 5px 0 0 0; font-size: 12px;">${formatDate(fb.created_at)}</p>
        </div>
      `).join('')
    : '<p style="color: #6b7280; font-size: 14px;">Nenhum feedback negativo esta semana! 🎉</p>';

  // Generate positive feedbacks section
  const positiveFeedbacksHtml = data.positiveFeedbacks.length > 0
    ? data.positiveFeedbacks.slice(0, 3).map(fb => `
        <div style="background: #f0fdf4; border-left: 3px solid #10b981; padding: 12px; margin: 8px 0; border-radius: 4px;">
          <p style="color: #1f2937; margin: 0; font-size: 14px;">${fb.comment || 'Feedback positivo sem comentário'}</p>
          <p style="color: #9ca3af; margin: 5px 0 0 0; font-size: 12px;">${formatDate(fb.created_at)}</p>
        </div>
      `).join('')
    : '<p style="color: #6b7280; font-size: 14px;">Nenhum feedback positivo registrado.</p>';

  const mailOptions = {
    from: `"Diz Aí" <${process.env.SMTP_USER}>`,
    to,
    subject: `📊 Relatório Semanal - ${data.establishmentName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">📊 Relatório Semanal</h1>
          <p style="color: #e0e7ff; margin: 8px 0 0 0; font-size: 16px;">${data.establishmentName}</p>
        </div>

        <!-- Content -->
        <div style="background: #f9fafb; padding: 30px 20px;">

          <!-- Summary Stats -->
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h2 style="color: #1f2937; margin: 0 0 15px 0; font-size: 20px;">Resumo da Semana</h2>

            <div style="text-align: center; margin-bottom: 15px;">
              <p style="color: #6b7280; margin: 0; font-size: 14px;">Total de Feedbacks</p>
              <p style="color: #1f2937; margin: 5px 0 0 0; font-size: 36px; font-weight: bold;">${data.totalFeedbacks}</p>
              ${trendHtml}
            </div>

            <div style="display: table; width: 100%; margin-top: 20px;">
              <div style="display: table-row;">
                <div style="display: table-cell; text-align: center; padding: 10px; background: #fef2f2; border-radius: 6px; width: 33%;">
                  <p style="color: #991b1b; margin: 0; font-size: 24px; font-weight: bold;">${data.badCount}</p>
                  <p style="color: #ef4444; margin: 5px 0 0 0; font-size: 12px;">NEGATIVOS</p>
                  <p style="color: #9ca3af; margin: 3px 0 0 0; font-size: 11px;">${badPercent}%</p>
                </div>
                <div style="display: table-cell; width: 10px;"></div>
                <div style="display: table-cell; text-align: center; padding: 10px; background: #fef9e7; border-radius: 6px; width: 33%;">
                  <p style="color: #854d0e; margin: 0; font-size: 24px; font-weight: bold;">${data.okayCount}</p>
                  <p style="color: #eab308; margin: 5px 0 0 0; font-size: 12px;">NEUTROS</p>
                  <p style="color: #9ca3af; margin: 3px 0 0 0; font-size: 11px;">${okayPercent}%</p>
                </div>
                <div style="display: table-cell; width: 10px;"></div>
                <div style="display: table-cell; text-align: center; padding: 10px; background: #f0fdf4; border-radius: 6px; width: 33%;">
                  <p style="color: #065f46; margin: 0; font-size: 24px; font-weight: bold;">${data.greatCount}</p>
                  <p style="color: #10b981; margin: 5px 0 0 0; font-size: 12px;">POSITIVOS</p>
                  <p style="color: #9ca3af; margin: 3px 0 0 0; font-size: 11px;">${greatPercent}%</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Negative Feedbacks Section -->
          ${data.badCount > 0 ? `
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">⚠️ Feedbacks Negativos (Ação Necessária)</h3>
            ${negativeFeedbacksHtml}
          </div>
          ` : ''}

          <!-- Positive Feedbacks Section -->
          ${data.greatCount > 0 ? `
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">⭐ Destaques Positivos</h3>
            ${positiveFeedbacksHtml}
          </div>
          ` : ''}

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

  try {
    await transporter.sendMail(mailOptions);
    console.log('Weekly report sent to:', to);
  } catch (error) {
    console.error('Failed to send weekly report:', error);
  }
}
