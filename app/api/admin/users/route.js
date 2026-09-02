import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '../../../../lib/db';
import bcrypt from 'bcryptjs';

async function isAdmin() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;
  if (!sessionId) return false;
  const result = await query('SELECT role FROM users WHERE id = $1', [sessionId]);
  const user = result.rows[0];
  return user?.role === 'admin';
}

export async function GET() {
  if (!await isAdmin()) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  const result = await query('SELECT id, username, role, created_at FROM users ORDER BY created_at DESC');
  return NextResponse.json(result.rows);
}

export async function POST(request) {
  if (!await isAdmin()) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const { username, password, role } = await request.json();

    if (!username || !password || !role) {
      return NextResponse.json({ error: 'Все поля обязательны' }, { status: 400 });
    }

    const existing = await query('SELECT * FROM users WHERE username = $1', [username]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Логин уже существует' }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const passwordHash = bcrypt.hashSync(password, 10);
    const created_at = new Date().toISOString();

    await query(
      'INSERT INTO users (id, username, password_hash, role, created_at) VALUES ($1, $2, $3, $4, $5)',
      [id, username, passwordHash, role, created_at]
    );

    return NextResponse.json({ id, username, role, created_at });
  } catch (error) {
    console.error('Ошибка создания пользователя:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function PUT(request) {
  if (!await isAdmin()) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const { id, role } = await request.json();

    if (!id || !role) {
      return NextResponse.json({ error: 'ID и роль обязательны' }, { status: 400 });
    }

    const result = await query('UPDATE users SET role = $1 WHERE id = $2 RETURNING id', [role, id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка обновления:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function DELETE(request) {
  if (!await isAdmin()) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID обязателен' }, { status: 400 });
    }

    const userCheck = await query('SELECT username FROM users WHERE id = $1', [id]);
    if (userCheck.rows.length > 0 && userCheck.rows[0].username === 'admin') {
      return NextResponse.json({ error: 'Нельзя удалить администратора' }, { status: 403 });
    }

    const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка удаления:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}