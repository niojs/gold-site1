import { NextResponse } from 'next/server';
import { query } from '../../../../lib/db';
import { sendTelegram } from '../../../../lib/notify';

// GET /api/cron/weekly?key=CRON_KEY — недельная сводка.
// Без CRON_KEY в env — всегда 403. Вызывать по расписанию
// (Vercel Cron / внешний cron): шлёт итог в Telegram и возвращает JSON.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  if (!process.env.CRON_KEY || searchParams.get('key') !== process.env.CRON_KEY) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const tables = {
      primary: 'primary_survey_data',
      drilling: 'drilling_records',
      field: 'field_data',
      washing: 'washing_data',
      assay: 'assay_data',
    };
    const counts = {};
    for (const [key, name] of Object.entries(tables)) {
      const r = await query(`SELECT COUNT(*) as c FROM ${name}`);
      counts[key] = Number(r.rows[0]?.c) || 0;
    }
    const drilled = await query(`SELECT COUNT(*) as c FROM drilling_records WHERE is_drilled = 1 OR is_drilled = true`);
    const avgRes = await query(`SELECT AVG(reserves) as a FROM assay_data WHERE reserves IS NOT NULL`);

    const text =
      `📊 <b>Недельная сводка Gold Manager</b>\n` +
      `Первичка: ${counts.primary}\n` +
      `Бурение: ${drilled.rows[0]?.c || 0}/${counts.drilling} пробурено\n` +
      `Полевые: ${counts.field}\n` +
      `Промывки: ${counts.washing}\n` +
      `Пробы: ${counts.assay} (ср. запасы: ${(parseFloat(avgRes.rows[0]?.a) || 0).toFixed(2)})\n` +
      `${new Date().toISOString().slice(0, 10)}`;

    await sendTelegram(text);
    return NextResponse.json({ success: true, counts });
  } catch (error) {
    console.error('Weekly report error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
