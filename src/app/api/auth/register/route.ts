import { NextRequest, NextResponse } from 'next/server';
import { createUser, findUserByEmail } from '@/lib/supabase';
import { hashPassword, generateToken, setAuthCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      );
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email já está cadastrado' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const user = await createUser(email, hashedPassword);

    const token = generateToken(user.id);
    await setAuthCookie(token);

    return NextResponse.json({
      user: { id: user.id, email: user.email },
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
