import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'gold.db');
const sqlite = new Database(dbPath);

sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

function toSnakeCase(obj) {
  if (Array.isArray(obj)) return obj.map(toSnakeCase);
  if (obj && typeof obj === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      result[snakeKey] = value;
    }
    return result;
  }
  return obj;
}

function convertParams(text, params) {
  let converted = text;
  if (params && params.length > 0) {
    let idx = 0;
    converted = converted.replace(/\$\d+/g, () => {
      const val = params[idx] === undefined ? null : params[idx];
      idx++;
      if (val === null) return 'NULL';
      if (typeof val === 'number') return String(val);
      if (typeof val === 'boolean') return val ? '1' : '0';
      if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
      return `'${String(val)}'`;
    });
  }
  return converted;
}

function convertParamsToPositional(text, params) {
  let converted = text;
  const newParams = [];
  let idx = 0;
  converted = converted.replace(/\$\d+/g, () => {
    const val = params[idx] === undefined ? null : params[idx];
    newParams.push(val);
    idx++;
    return '?';
  });
  return { text: converted, params: newParams };
}

export function query(text, params = []) {
  const trimmed = text.trim().toUpperCase();

  if (trimmed.startsWith('CREATE') || trimmed.startsWith('ALTER')) {
    const converted = convertParams(text, params);
    sqlite.exec(converted);
    return { rowCount: 0 };
  }

  const { text: converted, params: convertedParams } = convertParamsToPositional(text, params);
  const stmt = sqlite.prepare(converted);

  if (trimmed.startsWith('SELECT') || trimmed.startsWith('WITH')) {
    const rows = stmt.all(...convertedParams);
    return { rows: toSnakeCase(rows), rowCount: rows.length };
  }

  if (trimmed.startsWith('INSERT') && trimmed.includes('RETURNING')) {
    const rows = stmt.all(...convertedParams);
    return { rows: toSnakeCase(rows), rowCount: rows.length };
  }

  if (trimmed.startsWith('INSERT')) {
    const result = stmt.run(...convertedParams);
    return { rowCount: result.changes, lastInsertRowid: result.lastInsertRowid };
  }

  if (trimmed.startsWith('UPDATE')) {
    const result = stmt.run(...convertedParams);
    return { rowCount: result.changes };
  }

  if (trimmed.startsWith('DELETE')) {
    const result = stmt.run(...convertedParams);
    return { rowCount: result.changes };
  }

  stmt.run(...convertedParams);
  return { rowCount: 0 };
}

export async function initTables() {
  try {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE,
        password_hash TEXT,
        role TEXT,
        created_at TEXT
      );
    `);

    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS drilling_records (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        site TEXT,
        date TEXT,
        hole_number TEXT,
        diameter REAL,
        start_time TEXT,
        end_time TEXT,
        coordinates TEXT,
        created_at TEXT,
        queue INTEGER,
        is_drilled BOOLEAN DEFAULT 0,
        project_coordinates TEXT,
        true_coordinates TEXT
      );
    `);

    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS field_data (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        hole_number TEXT,
        coordinates TEXT,
        line_height REAL,
        intervals TEXT,
        geological_description TEXT,
        ugv REAL,
        date TEXT,
        time TEXT,
        site TEXT,
        diameter REAL,
        core_recovery REAL,
        created_at TEXT
      );
    `);

    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS washing_data (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        hole_number TEXT,
        interval TEXT,
        mass REAL,
        volume REAL,
        visual_description TEXT,
        created_at TEXT
      );
    `);

    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS assay_data (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        hole_number TEXT,
        interval TEXT,
        reserves REAL,
        marks TEXT,
        sample_weight REAL,
        created_at TEXT
      );
    `);

    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS sites (
        id TEXT PRIMARY KEY,
        name TEXT,
        coordinates_wgs84 TEXT,
        coordinates_msk02 TEXT,
        coordinates_msk74 TEXT,
        coordinates_gsk2011 TEXT,
        description TEXT,
        created_at TEXT
      );
    `);

    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS primary_survey_data (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        line_name TEXT,
        latitude REAL,
        longitude REAL,
        elevation REAL,
        work_area TEXT,
        hole_number TEXT,
        diameter REAL,
        intervals TEXT,
        created_at TEXT
      );
    `);

    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS user_sites (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        site_name TEXT,
        assigned_by TEXT,
        created_at TEXT
      );
    `);

    const migrations = [
      `ALTER TABLE drilling_records ADD COLUMN created_by TEXT`,
      `ALTER TABLE drilling_records ADD COLUMN brigade TEXT`,
      `ALTER TABLE drilling_records ADD COLUMN coord_system TEXT DEFAULT 'WGS-84'`,
      `ALTER TABLE drilling_records ADD COLUMN coord_system_project TEXT DEFAULT 'WGS-84'`,
      `ALTER TABLE drilling_records ADD COLUMN coord_system_true TEXT DEFAULT 'WGS-84'`,
      `ALTER TABLE field_data ADD COLUMN created_by TEXT`,
      `ALTER TABLE field_data ADD COLUMN brigade TEXT`,
      `ALTER TABLE field_data ADD COLUMN coord_system TEXT DEFAULT 'WGS-84'`,
      `ALTER TABLE washing_data ADD COLUMN created_by TEXT`,
      `ALTER TABLE washing_data ADD COLUMN site TEXT`,
      `ALTER TABLE assay_data ADD COLUMN created_by TEXT`,
      `ALTER TABLE assay_data ADD COLUMN site TEXT`,
      `ALTER TABLE primary_survey_data ADD COLUMN coord_system TEXT DEFAULT 'WGS-84'`,
    ];

    for (const sql of migrations) {
      try { sqlite.exec(sql); } catch (e) { /* column already exists */ }
    }

    console.log('✅ Таблицы SQLite созданы + миграции выполнены');

    const users = [
      { id: '1', username: 'admin', password: 'admin123', role: 'admin' },
      { id: '2', username: 'driller', password: '123456', role: 'driller' },
      { id: '3', username: 'geologist', password: '123456', role: 'field_geologist' },
      { id: '4', username: 'washer', password: '123456', role: 'washer' },
      { id: '5', username: 'sampler', password: '123456', role: 'sampler' },
      { id: '6', username: 'chief', password: '123456', role: 'chief_geologist' },
    ];

    const insertUser = sqlite.prepare(
      'INSERT OR IGNORE INTO users (id, username, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)'
    );

    for (const user of users) {
      const existing = sqlite.prepare('SELECT * FROM users WHERE username = ?').get(user.username);
      if (!existing) {
        const hashedPassword = bcrypt.hashSync(user.password, 10);
        insertUser.run(user.id, user.username, hashedPassword, user.role, new Date().toISOString());
        console.log(`✅ Пользователь ${user.username} (${user.role}) создан`);
      }
    }
  } catch (error) {
    console.error('❌ Ошибка инициализации SQLite:', error);
  }
}

initTables();

export default sqlite;
