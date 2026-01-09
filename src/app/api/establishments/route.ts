import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
  createEstablishment,
  findEstablishmentsByUserId,
  findEstablishmentBySlug,
} from '@/lib/db';
import { generateSlug } from '@/lib/utils';

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: 'Não autenticado' },
      { status: 401 }
    );
  }

  const establishments = findEstablishmentsByUserId(user.id);
  return NextResponse.json({ establishments });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: 'Não autenticado' },
      { status: 401 }
    );
  }

  try {
    const { name, alertEmail } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      );
    }

    let slug = generateSlug(name);

    // Ensure slug is unique
    while (findEstablishmentBySlug(slug)) {
      slug = generateSlug(name);
    }

    const establishment = createEstablishment({
      name,
      slug,
      alertEmail: alertEmail || user.email,
      userId: user.id,
    });

    return NextResponse.json({ establishment });
  } catch (error) {
    console.error('Create establishment error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
