import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export const query = (text, params) => pool.query(text, params);

export async function initTables() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE,
        password_hash TEXT,
        role TEXT,
        created_at TEXT
      );
    `);
    await query(`
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
        FOREIGN KEY (user_id) REFERENCES users (id)
      );
    `);
    await query(`
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
        created_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );
    `);
    await query(`
      CREATE TABLE IF NOT EXISTS washing_data (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        hole_number TEXT,
        interval TEXT,
        mass REAL,
        volume REAL,
        visual_description TEXT,
        created_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );
    `);
    await query(`
      CREATE TABLE IF NOT EXISTS assay_data (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        hole_number TEXT,
        interval TEXT,
        reserves REAL,
        marks TEXT,
        sample_weight REAL,
        created_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );
    `);
    await query(`
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

    console.log('✅ Таблицы созданы');

    const users = [
      { id: '1', username: 'admin', password: 'admin123', role: 'admin' },
      { id: '2', username: 'driller', password: '123456', role: 'driller' },
      { id: '3', username: 'geologist', password: '123456', role: 'field_geologist' },
      { id: '4', username: 'washer', password: '123456', role: 'washer' },
      { id: '5', username: 'sampler', password: '123456', role: 'sampler' },
      { id: '6', username: 'chief', password: '123456', role: 'chief_geologist' },
    ];

    for (const user of users) {
      const existing = await query('SELECT * FROM users WHERE username = $1', [user.username]);
      if (existing.rows.length === 0) {
        const hashedPassword = bcrypt.hashSync(user.password, 10);
        await query(
          'INSERT INTO users (id, username, password_hash, role, created_at) VALUES ($1, $2, $3, $4, $5)',
          [user.id, user.username, hashedPassword, user.role, new Date().toISOString()]
        );
        console.log(`✅ Пользователь ${user.username} (${user.role}) создан`);
      }
    }
  } catch (error) {
    console.error('❌ Ошибка инициализации:', error);
  }
}

initTables();

export default pool;