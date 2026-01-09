import { NextRequest, NextResponse } from 'next/server';
import { findEstablishmentBySlug } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const establishment = await findEstablishmentBySlug(slug);

  if (!establishment) {
    return NextResponse.json(
      { error: 'Estabelecimento nao encontrado' },
      { status: 404 }
    );
  }

  // Return only public info
  return NextResponse.json({
    establishment: {
      id: establishment.id,
      name: establishment.name,
      slug: establishment.slug,
    },
  });
}
