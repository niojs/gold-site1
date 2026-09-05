import { query } from './db.js';

// Журнал действий. Никогда не роняет основной запрос — все ошибки гасятся внутрь.
// action: 'create' | 'update' | 'delete' | 'login' | 'password'
// entity: 'drilling' | 'field' | 'washing' | 'assay' | 'primary' | 'site' | 'user' | ...
export async function logAudit({ userId, username, action, entity, entityId, details }) {
  try {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    await query(
      `INSERT INTO audit_log (id, user_id, username, action, entity, entity_id, details, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        id,
        userId || null,
        username || null,
        action || '',
        entity || '',
        entityId || null,
        details ? String(details).slice(0, 2000) : null,
        new Date().toISOString(),
      ]
    );
  } catch (e) {
    console.error('Audit error:', e.message);
  }
}
