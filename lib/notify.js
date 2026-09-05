// Уведомления в Telegram. Без TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID —
// тихий no-op, основной код это не затрагивает.
export async function sendTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return { skipped: true };
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    });
    if (!res.ok) console.error('Telegram error:', await res.text());
    return { ok: res.ok };
  } catch (e) {
    console.error('Telegram error:', e.message);
    return { ok: false };
  }
}
