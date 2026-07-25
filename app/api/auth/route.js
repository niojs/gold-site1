import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '../../../lib/db';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Логин и пароль обязательны' },
        { status: 400 }
      );
    }

    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    const user = stmt.get(username);

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
    cookieStore.set('session', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24,
      path: '/',
    });

    let redirectUrl = '/';
    switch (user.role) {
      case 'admin':
      case 'chief_geologist':
        redirectUrl = '/dashboard';
        break;
      case 'field_geologist':
        redirectUrl = '/field-data';
        break;
      case 'driller':
        redirectUrl = '/drilling';
        break;
      case 'washer':
        redirectUrl = '/washing';
        break;
      case 'sampler':
        redirectUrl = '/assay';
        break;
      default:
        redirectUrl = '/';
    }

    return NextResponse.json({
      id: user.id,
      username: user.username,
      role: user.role,
      redirect: redirectUrl,
    });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}