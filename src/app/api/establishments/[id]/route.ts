import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
  findEstablishmentById,
  updateEstablishment,
  findFeedbacksByEstablishmentId,
  getFeedbackStats,
} from '@/lib/db';

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
  const establishment = findEstablishmentById(id);

  if (!establishment) {
    return NextResponse.json(
      { error: 'Estabelecimento não encontrado' },
      { status: 404 }
    );
  }

  if (establishment.userId !== user.id) {
    return NextResponse.json(
      { error: 'Acesso negado' },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const days = searchParams.get('days');
  const rating = searchParams.get('rating');

  const feedbacks = findFeedbacksByEstablishmentId(id, {
    days: days ? parseInt(days) : undefined,
    rating: rating || undefined,
  });

  const stats = getFeedbackStats(id);

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
  const establishment = findEstablishmentById(id);

  if (!establishment) {
    return NextResponse.json(
      { error: 'Estabelecimento não encontrado' },
      { status: 404 }
    );
  }

  if (establishment.userId !== user.id) {
    return NextResponse.json(
      { error: 'Acesso negado' },
      { status: 403 }
    );
  }

  try {
    const { name, alertEmail } = await request.json();

    const updated = updateEstablishment(id, {
      ...(name && { name }),
      ...(alertEmail && { alertEmail }),
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
