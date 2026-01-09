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

interface WeeklyReportData {
  establishmentName: string;
  totalFeedbacks: number;
  positiveFeedbacks: number;
  neutralFeedbacks: number;
  negativeFeedbacks: number;
  happinessRate: number;
  previousHappinessRate?: number;
  topComments: { rating: string; comment: string; date: string }[];
  periodStart: string;
  periodEnd: string;
}

export async function sendWeeklyReport(to: string, data: WeeklyReportData) {
  // Skip if email is not configured
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('Email not configured. Would send weekly report to:', to);
    console.log('Data:', data);
    return;
  }

  const happinessTrend = data.previousHappinessRate !== undefined
    ? data.happinessRate > data.previousHappinessRate
      ? `<span style="color: #10b981;">↑ ${(data.happinessRate - data.previousHappinessRate).toFixed(1)}%</span>`
      : data.happinessRate < data.previousHappinessRate
        ? `<span style="color: #ef4444;">↓ ${(data.previousHappinessRate - data.happinessRate).toFixed(1)}%</span>`
        : `<span style="color: #6b7280;">→ estável</span>`
    : '';

  const getRatingEmoji = (rating: string) => {
    switch (rating) {
      case 'great': return '😊';
      case 'okay': return '😐';
      case 'bad': return '😞';
      default: return '•';
    }
  };

  const getRatingLabel = (rating: string) => {
    switch (rating) {
      case 'great': return 'Ótimo';
      case 'okay': return 'Ok';
      case 'bad': return 'Ruim';
      default: return rating;
    }
  };

  const commentsHtml = data.topComments.length > 0
    ? data.topComments.map(c => `
        <div style="background: white; padding: 12px; margin: 8px 0; border-radius: 6px; border-left: 3px solid ${c.rating === 'great' ? '#10b981' : c.rating === 'okay' ? '#f59e0b' : '#ef4444'};">
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">${getRatingEmoji(c.rating)} ${getRatingLabel(c.rating)} • ${c.date}</div>
          <div style="color: #1f2937;">"${c.comment}"</div>
        </div>
      `).join('')
    : '<p style="color: #6b7280; font-style: italic;">Nenhum comentário neste período.</p>';

  const mailOptions = {
    from: `"Diz Aí" <${process.env.SMTP_USER}>`,
    to,
    subject: `📊 Relatório Semanal - ${data.establishmentName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">📊 Relatório Semanal</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">${data.establishmentName}</p>
            <p style="color: rgba(255,255,255,0.7); margin: 5px 0 0 0; font-size: 14px;">${data.periodStart} - ${data.periodEnd}</p>
          </div>

          <!-- Main Content -->
          <div style="background: #ffffff; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">

            <!-- Summary Stats -->
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px 40px; border-radius: 12px;">
                <div style="font-size: 42px; font-weight: bold;">${data.happinessRate}%</div>
                <div style="font-size: 14px; opacity: 0.9;">Taxa de Satisfação ${happinessTrend}</div>
              </div>
            </div>

            <!-- Stats Grid -->
            <div style="margin-bottom: 30px;">
              <h2 style="color: #1f2937; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">📈 Resumo da Semana</h2>

              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                <tr>
                  <td style="padding: 12px; background: #f9fafb; border-radius: 8px 0 0 0;">
                    <div style="color: #6b7280; font-size: 12px;">Total de Feedbacks</div>
                    <div style="color: #1f2937; font-size: 24px; font-weight: bold;">${data.totalFeedbacks}</div>
                  </td>
                  <td style="padding: 12px; background: #f0fdf4; border-radius: 0 8px 0 0;">
                    <div style="color: #6b7280; font-size: 12px;">😊 Positivos</div>
                    <div style="color: #10b981; font-size: 24px; font-weight: bold;">${data.positiveFeedbacks}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px; background: #fffbeb; border-radius: 0 0 0 8px;">
                    <div style="color: #6b7280; font-size: 12px;">😐 Neutros</div>
                    <div style="color: #f59e0b; font-size: 24px; font-weight: bold;">${data.neutralFeedbacks}</div>
                  </td>
                  <td style="padding: 12px; background: #fef2f2; border-radius: 0 0 8px 0;">
                    <div style="color: #6b7280; font-size: 12px;">😞 Negativos</div>
                    <div style="color: #ef4444; font-size: 24px; font-weight: bold;">${data.negativeFeedbacks}</div>
                  </td>
                </tr>
              </table>
            </div>

            <!-- Comments Section -->
            <div style="margin-bottom: 30px;">
              <h2 style="color: #1f2937; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">💬 Comentários Recentes</h2>
              <div style="background: #f9fafb; padding: 15px; border-radius: 8px;">
                ${commentsHtml}
              </div>
            </div>

            <!-- CTA -->
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
                 style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                Ver Painel Completo →
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
            <p style="margin: 0;">Você recebeu este email porque ativou os relatórios semanais no <strong>Diz Aí</strong>.</p>
            <p style="margin: 5px 0 0 0;">Para desativar, acesse as configurações do seu estabelecimento.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Weekly report sent to:', to);
  } catch (error) {
    console.error('Failed to send weekly report:', error);
    throw error;
  }
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
