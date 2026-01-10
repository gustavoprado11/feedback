import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Endpoint para testar configuração de email
// Acesse: /api/test-email?to=seuemail@gmail.com

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const to = searchParams.get('to');

  if (!to) {
    return NextResponse.json(
      { error: 'Parâmetro "to" é obrigatório. Use: /api/test-email?to=seuemail@gmail.com' },
      { status: 400 }
    );
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return NextResponse.json(
      { error: 'SMTP_USER ou SMTP_PASS não configurados' },
      { status: 500 }
    );
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: `"Diz Aí" <${process.env.SMTP_USER}>`,
      to,
      subject: '✅ Teste de Email - Diz Aí',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; border-radius: 12px; text-align: center;">
            <h1 style="color: white; margin: 0;">✅ Email Funcionando!</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
            <p style="color: #1f2937; font-size: 16px;">
              Se você está lendo isso, a configuração de email do <strong>Diz Aí</strong> está funcionando corretamente!
            </p>
            <p style="color: #6b7280; font-size: 14px;">
              Os relatórios semanais serão enviados toda segunda-feira às 9h.
            </p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: `Email de teste enviado para ${to}`,
    });
  } catch (error) {
    console.error('Erro ao enviar email de teste:', error);
    return NextResponse.json(
      {
        error: 'Falha ao enviar email',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
