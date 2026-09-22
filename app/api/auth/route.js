import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '../../../lib/db';
import { signSession, sessionCookieOptions, SESSION_COOKIE } from '../../../lib/session';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Логин и пароль обязательны' },
        { status: 400 }
      );
    }

    const result = await query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    if (!user) {
      return NextResponse.json(
        { error: 'Неверный логин или пароль' },
        { status: 401 }
      );
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Неверный логин или пароль' },
        { status: 401 }
      );
    }

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, signSession(user.id), sessionCookieOptions());

    return NextResponse.json({
      id: user.id,
      username: user.username,
      role: user.role,
      redirect: '/select-site',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}