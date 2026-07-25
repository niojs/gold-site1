import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { query } from '../../../../lib/db';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session')?.value;

    if (!sessionId) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const result = await query('SELECT id, username, role FROM users WHERE id = $1', [sessionId]);
    const user = result.rows[0];

    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    return NextResponse.json({
      id: user.id,
      username: user.username,
      role: user.role,
    });
  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}