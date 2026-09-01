import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '../../../lib/db';

const CAN_MANAGE = ['admin', 'chief_geologist'];

async function getUser() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;
  if (!sessionId) return null;
  const result = await query('SELECT * FROM users WHERE id = $1', [sessionId]);
  return result.rows[0] || null;
}

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

  if (CAN_MANAGE.includes(user.role)) {
    const result = await query(
      `SELECT us.*, u.username, u.role as user_role
       FROM user_sites us
       LEFT JOIN users u ON us.user_id = u.id
       ORDER BY u.username`
    );
    return NextResponse.json({ assignments: result.rows });
  }

  const result = await query(
    `SELECT site_name FROM user_sites WHERE user_id = $1`,
    [user.id]
  );
  return NextResponse.json({ sites: result.rows.map(r => r.site_name) });
}

export async function POST(request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  if (!CAN_MANAGE.includes(user.role)) {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
  }

  const body = await request.json();
  const { userId, siteName } = body;

  if (!userId || !siteName) {
    return NextResponse.json({ error: 'Пользователь и участок обязательны' }, { status: 400 });
  }

  const existing = await query(
    'SELECT * FROM user_sites WHERE user_id = $1 AND site_name = $2',
    [userId, siteName]
  );
  if (existing.rows.length > 0) {
    return NextResponse.json({ error: 'Участок уже назначен' }, { status: 409 });
  }

  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  await query(
    'INSERT INTO user_sites (id, user_id, site_name, assigned_by, created_at) VALUES ($1, $2, $3, $4, $5)',
    [id, userId, siteName, user.id, new Date().toISOString()]
  );

  return NextResponse.json({ success: true });
}

export async function DELETE(request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  if (!CAN_MANAGE.includes(user.role)) {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID обязателен' }, { status: 400 });

  await query('DELETE FROM user_sites WHERE id = $1', [id]);
  return NextResponse.json({ success: true });
}
