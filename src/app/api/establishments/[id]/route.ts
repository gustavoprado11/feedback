import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
  findEstablishmentById,
  updateEstablishment,
  findFeedbacksByEstablishmentId,
  getFeedbackStats,
} from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: 'Não autenticado' },
      { status: 401 }
    );
  }

  const { id } = await params;
  const establishment = await findEstablishmentById(id);

  if (!establishment) {
    return NextResponse.json(
      { error: 'Estabelecimento não encontrado' },
      { status: 404 }
    );
  }

  if (establishment.user_id !== user.id) {
    return NextResponse.json(
      { error: 'Acesso negado' },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const days = searchParams.get('days');
  const rating = searchParams.get('rating');

  const feedbacks = await findFeedbacksByEstablishmentId(id, {
    days: days ? parseInt(days) : undefined,
    rating: rating || undefined,
  });

  const stats = await getFeedbackStats(id);

  return NextResponse.json({
    establishment,
    feedbacks,
    stats,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: 'Não autenticado' },
      { status: 401 }
    );
  }

  const { id } = await params;
  const establishment = await findEstablishmentById(id);

  if (!establishment) {
    return NextResponse.json(
      { error: 'Estabelecimento não encontrado' },
      { status: 404 }
    );
  }

  if (establishment.user_id !== user.id) {
    return NextResponse.json(
      { error: 'Acesso negado' },
      { status: 403 }
    );
  }

  try {
    const { name, alertEmail, googleReviewEnabled, googleReviewUrl } = await request.json();

    if (googleReviewEnabled === true && !googleReviewUrl) {
      return NextResponse.json(
        { error: 'O link do Google é obrigatório quando o convite está habilitado' },
        { status: 400 }
      );
    }

    if (googleReviewUrl) {
      try {
        const parsedUrl = new URL(googleReviewUrl);
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
          return NextResponse.json(
            { error: 'Informe um link do Google válido' },
            { status: 400 }
          );
        }
      } catch {
        return NextResponse.json(
          { error: 'Informe um link do Google válido' },
          { status: 400 }
        );
      }
    }

    const updated = await updateEstablishment(id, {
      ...(name && { name }),
      ...(alertEmail && { alert_email: alertEmail }),
      ...(googleReviewEnabled !== undefined && { google_review_enabled: googleReviewEnabled }),
      ...(googleReviewUrl !== undefined && { google_review_url: googleReviewUrl || null }),
    });

    return NextResponse.json({ establishment: updated });
  } catch (error) {
    console.error('Update establishment error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
