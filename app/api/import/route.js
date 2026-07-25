import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import db from '../../../lib/db';

export async function POST(request) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;

  if (!sessionId) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  const userStmt = db.prepare('SELECT role FROM users WHERE id = ?');
  const user = userStmt.get(sessionId);
  const role = user?.role;

  if (!['admin', 'chief_geologist'].includes(role)) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'Файл не загружен' }, { status: 400 });
    }

    const text = await file.text();
    // Убираем BOM, если есть
    const cleanText = text.replace(/^\uFEFF/, '');
    const lines = cleanText.split('\n').filter(line => line.trim() !== '');

    if (lines.length < 2) {
      return NextResponse.json({ error: 'Файл пуст или не содержит данных' }, { status: 400 });
    }

    // Парсим заголовки
    const headers = lines[0].split(';').map(h => h.trim());

    // Определяем таблицу по наличию полей
    let tableName = '';
    if (headers.includes('hole_number') || headers.includes('site')) {
      if (headers.includes('diameter')) tableName = 'drilling_records';
      else if (headers.includes('ugv') || headers.includes('geological_description')) tableName = 'field_data';
      else if (headers.includes('mass') && headers.includes('volume')) tableName = 'washing_data';
      else if (headers.includes('reserves') || headers.includes('sample_weight')) tableName = 'assay_data';
    }

    if (!tableName) {
      return NextResponse.json({ error: 'Не удалось определить тип данных' }, { status: 400 });
    }

    // Получаем структуру таблицы
    const tableInfo = db.prepare(`PRAGMA table_info(${tableName})`).all();
    const columns = tableInfo.map(col => col.name);

    let insertedCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(';').map(v => v.trim());
      const row = {};

      headers.forEach((header, index) => {
        if (index < values.length && columns.includes(header)) {
          let value = values[index];
          // Если значение в кавычках, убираем их
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1).replace(/""/g, '"');
          }
          row[header] = value;
        }
      });

      // Проверяем, что есть хоть какие-то данные
      const hasData = Object.values(row).some(v => v !== undefined && v !== '');
      if (!hasData) continue;

      // Формируем запрос
      const insertColumns = Object.keys(row);
      const placeholders = insertColumns.map(() => '?').join(', ');
      const columnNames = insertColumns.join(', ');
      const insertValues = insertColumns.map(col => row[col] || null);

      try {
        db.prepare(`INSERT INTO ${tableName} (${columnNames}) VALUES (${placeholders})`).run(...insertValues);
        insertedCount++;
      } catch (e) {
        console.error('Ошибка вставки:', e.message);
      }
    }

    return NextResponse.json({
      message: `Импортировано ${insertedCount} записей в таблицу ${tableName}`,
      success: true,
    });
  } catch (error) {
    console.error('Ошибка импорта:', error);
    return NextResponse.json({ error: 'Ошибка импорта: ' + error.message }, { status: 500 });
  }
}