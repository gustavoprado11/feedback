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
      { error: 'Estabelecimento não encontrado' },
      { status: 404 }
    );
  }

  // Return only public info
  return NextResponse.json({
    establishment: {
      id: establishment.id,
      name: establishment.name,
      slug: establishment.slug,
      google_review_url: establishment.google_review_url,
      show_google_review_prompt: establishment.show_google_review_prompt,
    },
  });
}
