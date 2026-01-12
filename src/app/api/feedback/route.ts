import { NextRequest, NextResponse } from 'next/server';
import { createFeedback, findEstablishmentBySlug } from '@/lib/supabase';
import { sendNegativeFeedbackAlert } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { rating, comment, establishmentSlug } = await request.json();

    if (!rating || !establishmentSlug) {
      return NextResponse.json(
        { error: 'Avaliação e estabelecimento são obrigatórios' },
        { status: 400 }
      );
    }

    if (!['bad', 'okay', 'great'].includes(rating)) {
      return NextResponse.json(
        { error: 'Avaliação inválida' },
        { status: 400 }
      );
    }

    const establishment = await findEstablishmentBySlug(establishmentSlug);

    if (!establishment) {
      return NextResponse.json(
        { error: 'Estabelecimento não encontrado' },
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
