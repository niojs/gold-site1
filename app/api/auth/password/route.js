import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { query } from '../../../../lib/db';
import { logAudit } from '../../../../lib/audit';

// PUT /api/auth/password — смена собственного пароля.
// body: { oldPassword, newPassword } (минимум 6 символов)
export async function PUT(request) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;
  if (!sessionId) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  try {
    const { oldPassword, newPassword } = await request.json();

    if (!oldPassword || !newPassword) {
      return NextResponse.json({ error: 'Введите старый и новый пароль' }, { status: 400 });
    }
    if (String(newPassword).length < 6) {
      return NextResponse.json({ error: 'Новый пароль — минимум 6 символов' }, { status: 400 });
    }

    const result = await query('SELECT * FROM users WHERE id = $1', [sessionId]);
    const user = result.rows[0];
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    if (!bcrypt.compareSync(oldPassword, user.password_hash)) {
      return NextResponse.json({ error: 'Старый пароль неверный' }, { status: 403 });
    }

    const hash = bcrypt.hashSync(newPassword, 10);
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, sessionId]);

    await logAudit({
      userId: user.id,
      username: user.username,
      action: 'password',
      entity: 'user',
      entityId: user.id,
      details: 'смена собственного пароля',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка смены пароля:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
