import { NextRequest, NextResponse } from 'next/server';
import { createFeedback, findEstablishmentBySlug } from '@/lib/supabase';
import { sendNegativeFeedbackAlert } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { rating, comment, establishmentSlug } = await request.json();

    if (!rating || !establishmentSlug) {
      return NextResponse.json(
        { error: 'Avaliacao e estabelecimento sao obrigatorios' },
        { status: 400 }
      );
    }

    if (!['bad', 'okay', 'great'].includes(rating)) {
      return NextResponse.json(
        { error: 'Avaliacao invalida' },
        { status: 400 }
      );
    }

    const establishment = await findEstablishmentBySlug(establishmentSlug);

    if (!establishment) {
      return NextResponse.json(
        { error: 'Estabelecimento nao encontrado' },
        { status: 404 }
      );
    }

    await createFeedback({
      rating,
      comment: comment || undefined,
      establishment_id: establishment.id,
    });

    // Send alert for negative feedback
    if (rating === 'bad') {
      await sendNegativeFeedbackAlert(
        establishment.alert_email,
        establishment.name,
        comment
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Feedback enviado com sucesso',
    });
  } catch (error) {
    console.error('Create feedback error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
