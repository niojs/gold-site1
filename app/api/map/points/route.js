import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '../../../../lib/db';

// Кто может редактировать/удалять скважины
const CAN_EDIT = ['admin', 'driller', 'chief_geologist', 'field_geologist'];
// Кто вообще имеет доступ к карте
const CAN_VIEW_MAP = ['admin', 'driller', 'chief_geologist', 'field_geologist'];

// Получить пользователя по сессии
async function getCurrentUser(sessionId) {
  if (!sessionId) return null;
  const res = await query('SELECT id, username, role FROM users WHERE id = $1', [sessionId]);
  return res.rows[0] || null;
}

// ========== ПОЛУЧЕНИЕ ТОЧЕК ==========
export async function GET() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;

  const user = await getCurrentUser(sessionId);
  if (!user) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }
  if (!CAN_VIEW_MAP.includes(user.role)) {
    return NextResponse.json({ error: 'Нет доступа к карте' }, { status: 403 });
  }

  try {
    const drillingResult = await query(`
      SELECT 
        id, site as name, hole_number, coordinates,
        project_coordinates, true_coordinates, queue, is_drilled, date,
        'drilling' as type, 'Скважина' as layer
      FROM drilling_records
      WHERE coordinates IS NOT NULL AND coordinates != ''
         OR project_coordinates IS NOT NULL AND project_coordinates != ''
         OR true_coordinates IS NOT NULL AND true_coordinates != ''
    `);

    const fieldResult = await query(`
      SELECT 
        id, site as name, hole_number, coordinates, date,
        'field' as type, 'Участок' as layer
      FROM field_data
      WHERE coordinates IS NOT NULL AND coordinates != ''
    `);

    const allPoints = [...drillingResult.rows, ...fieldResult.rows];

    return NextResponse.json({
      points: allPoints,
      currentUser: { id: user.id, role: user.role, canEdit: CAN_EDIT.includes(user.role) },
    });
  } catch (error) {
    console.error('Ошибка загрузки точек карты:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// ========== ДОБАВЛЕНИЕ ==========
export async function POST(request) {
  const cookieStore = await cookies();
  const sessionId