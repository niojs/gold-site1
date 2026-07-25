import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import db from '../../../../lib/db';
import bcrypt from 'bcryptjs';

async function isAdmin() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;
  if (!sessionId) return false;
  const stmt = db.prepare('SELECT role FROM users WHERE id = ?');
  const user = stmt.get(sessionId);
  return user?.role === 'admin';
}

// ========== ПОЛУЧИТЬ ВСЕХ ПОЛЬЗОВАТЕЛЕЙ ==========
export async function GET() {
  if (!await isAdmin()) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  const stmt = db.prepare('SELECT id, username, role, created_at FROM users ORDER BY created_at DESC');
  const users = stmt.all();
  return NextResponse.json(users);
}

// ========== ДОБАВИТЬ НОВОГО ПОЛЬЗОВАТЕЛЯ ==========
export async function POST(request) {
  if (!await isAdmin()) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const { username, password, role } = await request.json();

    if (!username || !password || !role) {
      return NextResponse.json({ error: 'Все поля обязательны' }, { status: 400 });
    }

    const checkStmt = db.prepare('SELECT * FROM users WHERE username = ?');
    if (checkStmt.get(username)) {
      return NextResponse.json({ error: 'Логин уже существует' }, { status: 400 });
    }

    const id = Date.now().toString();
    const passwordHash = bcrypt.hashSync(password, 10);
    const created_at = new Date().toISOString();

    const stmt = db.prepare(
      'INSERT INTO users (id, username, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)'
    );
    stmt.run(id, username, passwordHash, role, created_at);

    return NextResponse.json({ id, username, role, created_at });
  } catch (error) {
    console.error('Ошибка создания пользователя:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// ========== ИЗМЕНИТЬ РОЛЬ ==========
export async function PUT(request) {
  if (!await isAdmin()) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const { id, role } = await request.json();

    if (!id || !role) {
      return NextResponse.json({ error: 'ID и роль обязательны' }, { status: 400 });
    }

    const stmt = db.prepare('UPDATE users SET role = ? WHERE id = ?');
    const result = stmt.run(role, id);

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка обновления:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// ========== УДАЛИТЬ ПОЛЬЗОВАТЕЛЯ ==========
export async function DELETE(request) {
  if (!await isAdmin()) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID обязателен' }, { status: 400 });
    }

    const checkStmt = db.prepare('SELECT username FROM users WHERE id = ?');
    const user = checkStmt.get(id);
    if (user?.username === 'admin') {
      return NextResponse.json({ error: 'Нельзя удалить администратора' }, { status: 403 });
    }

    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    const result = stmt.run(id);

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка удаления:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}