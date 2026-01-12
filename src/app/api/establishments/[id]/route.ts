import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, hasActiveSubscription } from '@/lib/auth';
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

  // Check if user has active subscription
  const hasSubscription = await hasActiveSubscription(user.id);
  if (!hasSubscription) {
    return NextResponse.json(
      { error: 'Assinatura inativa. Assine para acessar o sistema.' },
      { status: 403 }
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

  // Check if user has active subscription
  const hasSubscription = await hasActiveSubscription(user.id);
  if (!hasSubscription) {
    return NextResponse.json(
      { error: 'Assinatura inativa. Assine para acessar o sistema.' },
      { status: 403 }
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
    const {
      name,
      alertEmail,
      googleReviewUrl,
      showGoogleReviewPrompt,
      weeklyReportsEnabled,
    } = await request.json();

    const updates: Record<string, string | boolean | null> = {
      ...(name && { name }),
      ...(alertEmail && { alert_email: alertEmail }),
    };

    if (googleReviewUrl !== undefined) {
      updates.google_review_url = googleReviewUrl || null;
    }

    if (showGoogleReviewPrompt !== undefined) {
      updates.show_google_review_prompt = Boolean(showGoogleReviewPrompt);
    }

    if (weeklyReportsEnabled !== undefined) {
      updates.weekly_reports_enabled = Boolean(weeklyReportsEnabled);
    }

    const updated = await updateEstablishment(id, updates);

    return NextResponse.json({ establishment: updated });
  } catch (error) {
    console.error('Update establishment error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
