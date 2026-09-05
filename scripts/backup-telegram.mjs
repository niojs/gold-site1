// Ночной бэкап gold.db в Telegram.
// Запуск вручную или по расписанию (cron / Task Scheduler):
//   TELEGRAM_BOT_TOKEN=... TELEGRAM_CHAT_ID=... node scripts/backup-telegram.mjs
// Без env — сразу выход с ошибкой, ничего не делает.
import fs from 'fs';
import path from 'path';

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;
if (!token || !chatId) {
  console.error('Need TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID env vars');
  process.exit(1);
}

const dbPath = path.join(process.cwd(), 'gold.db');
if (!fs.existsSync(dbPath)) {
  console.error('gold.db not found in', process.cwd());
  process.exit(1);
}

const buf = fs.readFileSync(dbPath);
const form = new FormData();
form.append('chat_id', chatId);
form.append('caption', `gold.db backup ${new Date().toISOString()} (${buf.length} bytes)`);
form.append('document', new Blob([buf], { type: 'application/octet-stream' }), 'gold.db');

const res = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
  method: 'POST',
  body: form,
});
const data = await res.json();
if (!data.ok) {
  console.error('Telegram error:', JSON.stringify(data));
  process.exit(1);
}
console.log('Backup sent, message_id:', data.result.message_id);
