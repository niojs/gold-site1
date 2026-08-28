import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '../../../lib/db';
import * as XLSX from 'xlsx';

// Столбцы каждой таблицы (защита от лишних полей)
const TABLE_COLUMNS = {
  drilling_records: ['id', 'user_id', 'site', 'date', 'hole_number', 'diameter', 'start_time', 'end_time', 'coordinates', 'created_at', 'queue', 'is_drilled', 'project_coordinates', 'true_coordinates'],
  field_data: ['id', 'user_id', 'hole_number', 'coordinates', 'line_height', 'intervals', 'geological_description', 'ugv', 'date', 'time', 'site', 'diameter', 'core_recovery', 'created_at'],
  washing_data: ['id', 'user_id', 'hole_number', 'interval', 'mass', 'volume', 'visual_description', 'created_at'],
  assay_data: ['id', 'user_id', 'hole_number', 'interval', 'reserves', 'marks', 'sample_weight', 'created_at'],
};

// ===== ОБРАТНЫЙ ПЕРЕВОД: русский заголовок -> английский столбец =====
const RU_TO_EN = {
  'Скважина': 'hole_number',
  'Участок': 'site',
  'Дата': 'date',
  'Диаметр (мм)': 'diameter',
  'Начало': 'start_time',
  'Конец': 'end_time',
  'Очередь': 'queue',
  'Пробурена': 'is_drilled',
  'Проектные координаты': 'project_coordinates',
  'Фактические координаты': 'true_coordinates',
  'Координаты': 'coordinates',
  'Линия/высота': 'line_height',
  'Интервалы': 'intervals',
  'Геологическое описание': 'geological_description',
  'УГВ (м)': 'ugv',
  'Время': 'time',
  'Выход керна (%)': 'core_recovery',
  'Интервал': 'interval',
  'Масса': 'mass',
  'Объём': 'volume',
  'Визуальное описание': 'visual_description',
  'Запасы (т)': 'reserves',
  'Отметки': 'marks',
  'Вес пробы (кг)': 'sample_weight',
};

// Переводит заголовок (русский ИЛИ английский) в английский столбец
function normalizeHeader(header) {
  const h = header.trim();
  if (RU_TO_EN[h]) return RU_TO_EN[h];
  return h; // уже английский
}

// Определяем таблицу по (уже английским) заголовкам
function detectTable(headers) {
  if (headers.includes('diameter') && (headers.includes('start_time') || headers.includes('queue'))) return 'drilling_records';
  if (headers.includes('ugv') || headers.includes('geological_description') || headers.includes('core_recovery')) return 'field_data';
  if (headers.includes('mass') && headers.includes('volume')) return 'washing_data';
  if (headers.includes('reserves') || headers.includes('sample_weight')) return 'assay_data';
  if (headers.includes('diameter')) return 'drilling_records';
  return null;
}

// Преобразует дату ДД.ММ.ГГГГ -> ISO (или оставляет как есть)
function normalizeDate(val) {
  if (!val) return val;
  const s = String(val).trim();
  const m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (m) {
    const [, d, mo, y] = m;
    return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return s;
}

export async function POST(request) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;
  if (!sessionId) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

  const userResult = await query('SELECT role FROM users WHERE id = $1', [sessionId]);
  const role = userResult.rows[0]?.role;
  if (!['admin', 'chief_geologist'].includes(role)) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file) return NextResponse.json({ error: 'Файл не загружен' }, { status: 400 });

    const fileName = file.name.toLowerCase();
    let rawRows = [];

    // ===== ЧТЕНИЕ ФАЙЛА =====
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    } else {
      const text = (await file.text()).replace(/^\uFEFF/, '');
      const lines = text.split('\n').filter((l) => l.trim() !== '');
      if (lines.length < 2) {
        return NextResponse.json({ error: 'Файл пуст' }, { status: 400 });
      }
      const headers = lines[0].split(';').map((h) => h.trim());
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(';').map((v) => {
          let val = v.trim();
          if (val.startsWith('"') && val.endsWith('"')) {
            val = val.slice(1, -1).replace(/""/g, '"');
          }
          return val;
        });
        const row = {};
        headers.forEach((h, idx) => { row[h] = values[idx] ?? ''; });
        rawRows.push(row);
      }
    }

    if (rawRows.length === 0) {
      return NextResponse.json({ error: 'Нет данных в файле' }, { status: 400 });
    }

    // ===== ПЕРЕВОДИМ ЗАГОЛОВКИ В АНГЛИЙСКИЕ =====
    const rows = rawRows.map((rawRow) => {
      const row = {};
      for (const key of Object.keys(rawRow)) {
        const enKey = normalizeHeader(key);
        row[enKey] = rawRow[key];
      }
      return row;
    });

    // ===== ОПРЕДЕЛЯЕМ ТАБЛИЦУ =====
    const fileHeaders = Object.keys(rows[0]);
    const tableName = detectTable(fileHeaders);
    if (!tableName) {
      return NextResponse.json({
        error: 'Не удалось определить тип данных. Проверьте заголовки столбцов.',
      }, { status: 400 });
    }

    const validColumns = TABLE_COLUMNS[tableName];
    let insertedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // ===== ВСТАВКА =====
    for (const rawRow of rows) {
      const row = {};
      for (const key of Object.keys(rawRow)) {
        const col = key.trim();
        if (validColumns.includes(col)) {
          let value = rawRow[key];

          // конвертация спец-полей
          if (col === 'is_drilled') {
            const v = String(value).trim().toLowerCase();
            value = (v === 'да' || v === 'true' || v === '1') ? true : false;
          } else if (col === 'date') {
            value = normalizeDate(value);
          }

          if (value !== '' && value !== null && value !== undefined) {
            row[col] = value;
          }
        }
      }

      // Пропускаем строки без номера скважины (мусор/пустые строки)
      if (!row.hole_number) {
        skippedCount++;
        continue;
      }

      // авто-поля
      if (!row.id) row.id = Date.now().toString() + Math.floor(Math.random() * 1000);
      if (!row.user_id) row.user_id = sessionId;
      if (!row.created_at) row.created_at = new Date().toISOString();

      const cols = Object.keys(row);
      if (cols.length === 0) continue;

      const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
      const values = cols.map((c) => row[c]);

      try {
        await query(
          `INSERT INTO ${tableName} (${cols.join(', ')}) VALUES (${placeholders})`,
          values
        );
        insertedCount++;
      } catch (e) {
        errorCount++;
        console.error('Ошибка вставки строки:', e.message);
      }
    }

    const tableLabels = {
      drilling_records: 'Буровые работы',
      field_data: 'Полевые данные',
      washing_data: 'Промывка',
      assay_data: 'Пробы',
    };

    let msg = `Импортировано ${insertedCount} записей в «${tableLabels[tableName]}»`;
    if (skippedCount) msg += `. Пропущено пустых: ${skippedCount}`;
    if (errorCount) msg += `. С ошибками: ${errorCount}`;

    return NextResponse.json({ success: true, message: msg });
  } catch (error) {
    console.error('Ошибка импорта:', error);
    return NextResponse.json({ error: 'Ошибка импорта: ' + error.message }, { status: 500 });
  }
}