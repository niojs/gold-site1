import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '../../../lib/db';

export async function GET() {
  try {
    const password = 'admin123';
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Удаляем старого admin, если есть
    await query('DELETE FROM users WHERE username = $1', ['admin']);

    // Создаём нового admin с правильным хешем
    await query(
      'INSERT INTO users (id, username, password_hash, role, created_at) VALUES ($1, $2, $3, $4, $5)',
      ['1', 'admin', hashedPassword, 'admin', new Date().toISOString()]
    );

    return NextResponse.json({
      success: true,
      message: 'Пользователь admin создан',
      password: 'admin123',
      hash: hashedPassword,
    });
  } catch (error) {
    console.error('Ошибка:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}