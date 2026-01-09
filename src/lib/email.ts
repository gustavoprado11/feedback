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
    from: `"FeedFlow" <${process.env.SMTP_USER}>`,
    to,
    subject: `Alerta: Feedback negativo em ${establishmentName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">FeedFlow</h1>
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
