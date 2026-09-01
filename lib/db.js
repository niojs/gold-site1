import bcrypt from 'bcryptjs';

let dbModule;

async function getDb() {
  if (!dbModule) {
    if (process.env.POSTGRES_URL) {
      const pg = await import('pg');
      const pool = new pg.Pool({
        connectionString: process.env.POSTGRES_URL,
        ssl: { rejectUnauthorized: false },
      });

      dbModule = {
        query: (text, params) => pool.query(text, params),
        pool,
        type: 'pg',
      };
    } else {
      const sqliteMod = await import('./db-sqlite.js');
      dbModule = {
        query: sqliteMod.query,
        default: sqliteMod.default,
        type: 'sqlite',
      };
    }
  }
  return dbModule;
}

export const query = async (text, params) => {
  const db = await getDb();
  return db.query(text, params);
};

export async function initTables() {
  const db = await getDb();
  if (db.type === 'sqlite') {
    const sqliteMod = await import('./db-sqlite.js');
    return sqliteMod.initTables();
  }

  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE,
        password_hash TEXT,
        role TEXT,
        created_at TEXT
      );
    `);

    await db.query(`
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

    await db.query(`
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

    await db.query(`
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

    await db.query(`
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

    await db.query(`
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

    await db.query(`
      CREATE TABLE IF NOT EXISTS primary_survey_data (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        line_name TEXT,
        latitude REAL,
        longitude REAL,
        elevation REAL,
        work_area TEXT,
        created_at TEXT
      );
    `);

    await db.query(`ALTER TABLE drilling_records ADD COLUMN IF NOT EXISTS queue INTEGER;`);
    await db.query(`ALTER TABLE drilling_records ADD COLUMN IF NOT EXISTS is_drilled BOOLEAN DEFAULT FALSE;`);
    await db.query(`ALTER TABLE drilling_records ADD COLUMN IF NOT EXISTS project_coordinates TEXT;`);
    await db.query(`ALTER TABLE drilling_records ADD COLUMN IF NOT EXISTS true_coordinates TEXT;`);
    await db.query(`ALTER TABLE drilling_records ADD COLUMN IF NOT EXISTS created_by TEXT;`);
    await db.query(`ALTER TABLE drilling_records ADD COLUMN IF NOT EXISTS brigade TEXT;`);

    await db.query(`ALTER TABLE field_data ADD COLUMN IF NOT EXISTS created_by TEXT;`);
    await db.query(`ALTER TABLE field_data ADD COLUMN IF NOT EXISTS brigade TEXT;`);

    await db.query(`ALTER TABLE washing_data ADD COLUMN IF NOT EXISTS created_by TEXT;`);
    await db.query(`ALTER TABLE washing_data ADD COLUMN IF NOT EXISTS site TEXT;`);

    await db.query(`ALTER TABLE assay_data ADD COLUMN IF NOT EXISTS created_by TEXT;`);
    await db.query(`ALTER TABLE assay_data ADD COLUMN IF NOT EXISTS site TEXT;`);

    await db.query(`ALTER TABLE primary_survey_data ADD COLUMN IF NOT EXISTS hole_number TEXT;`);
    await db.query(`ALTER TABLE primary_survey_data ADD COLUMN IF NOT EXISTS diameter REAL;`);
    await db.query(`ALTER TABLE primary_survey_data ADD COLUMN IF NOT EXISTS intervals TEXT;`);

    await db.query(`ALTER TABLE primary_survey_data ADD COLUMN IF NOT EXISTS date TEXT;`);
    await db.query(`ALTER TABLE primary_survey_data ADD COLUMN IF NOT EXISTS time TEXT;`);
    await db.query(`ALTER TABLE primary_survey_data ADD COLUMN IF NOT EXISTS latitude_start REAL;`);
    await db.query(`ALTER TABLE primary_survey_data ADD COLUMN IF NOT EXISTS longitude_start REAL;`);

    console.log('✅ Таблицы PostgreSQL созданы');

    const users = [
      { id: '1', username: 'admin', password: 'admin123', role: 'admin' },
      { id: '2', username: 'driller', password: '123456', role: 'driller' },
      { id: '3', username: 'geologist', password: '123456', role: 'field_geologist' },
      { id: '4', username: 'washer', password: '123456', role: 'washer' },
      { id: '5', username: 'sampler', password: '123456', role: 'sampler' },
      { id: '6', username: 'chief', password: '123456', role: 'chief_geologist' },
    ];

    for (const user of users) {
      const existing = await db.query('SELECT * FROM users WHERE username = $1', [user.username]);
      if (existing.rows.length === 0) {
        const hashedPassword = bcrypt.hashSync(user.password, 10);
        await db.query(
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

export default {
  query: async (text, params) => {
    const db = await getDb();
    return db.query(text, params);
  },
  getDb,
};
