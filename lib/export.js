import * as XLSX from 'xlsx';

// Человеческие названия колонок для каждого отдела
const COLUMNS = {
  drilling: {
    hole_number: 'Скважина',
    site: 'Участок',
    date: 'Дата',
    diameter: 'Диаметр (мм)',
    start_time: 'Начало',
    end_time: 'Конец',
  },
  field: {
    hole_number: 'Скважина',
    coordinates: 'Координаты',
    site: 'Участок',
    line_height: 'Линия/высота',
    intervals: 'Интервалы',
    geological_description: 'Геологическое описание',
    ugv: 'УГВ (м)',
    date: 'Дата',
    time: 'Время',
    diameter: 'Диаметр (мм)',
    core_recovery: 'Выход керна (%)',
  },
  washing: {
    hole_number: 'Скважина',
    interval: 'Интервал',
    mass: 'Масса',
    volume: 'Объём',
    visual_description: 'Визуальное описание',
  },
  assay: {
    hole_number: 'Скважина',
    interval: 'Интервал',
    reserves: 'Запасы (т)',
    marks: 'Отметки',
    sample_weight: 'Вес пробы (кг)',
  },
};

const SHEET_NAMES = {
  drilling: 'Буровые работы',
  field: 'Полевые данные',
  washing: 'Промывка',
  assay: 'Пробы',
};

// Превращаем сырые записи в строки с красивыми заголовками
function mapRows(type, records) {
  const cols = COLUMNS[type];
  return records.map((rec) => {
    const row = {};
    for (const key in cols) {
      let val = rec[key];
      if (key === 'date' && val) {
        val = new Date(val).toLocaleDateString();
      }
      row[cols[key]] = val ?? '';
    }
    return row;
  });
}

// ===== ЭКСПОРТ ОДНОГО ОТДЕЛА В EXCEL =====
export function exportSingleExcel(type, records) {
  const rows = mapRows(type, records);
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, SHEET_NAMES[type]);
  XLSX.writeFile(wb, `${SHEET_NAMES[type]}.xlsx`);
}

// ===== ЭКСПОРТ ОДНОГО ОТДЕЛА В CSV =====
export function exportSingleCSV(type, records) {
  const rows = mapRows(type, records);
  const ws = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(ws);
  downloadCSV(csv, `${SHEET_NAMES[type]}.csv`);
}

// ===== ЭКСПОРТ ВСЕХ ОТДЕЛОВ В EXCEL (разные листы) =====
export function exportAllExcel(data) {
  const wb = XLSX.utils.book_new();
  ['drilling', 'field', 'washing', 'assay'].forEach((type) => {
    const rows = mapRows(type, data[type] || []);
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, SHEET_NAMES[type]);
  });
  XLSX.writeFile(wb, 'Все данные.xlsx');
}

// ===== ЭКСПОРТ ВСЕХ ОТДЕЛОВ В CSV (один файл подряд) =====
export function exportAllCSV(data) {
  let csv = '';
  ['drilling', 'field', 'washing', 'assay'].forEach((type) => {
    const rows = mapRows(type, data[type] || []);
    if (rows.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(rows);
    csv += `${SHEET_NAMES[type]}\n`;
    csv += XLSX.utils.sheet_to_csv(ws);
    csv += '\n\n';
  });
  downloadCSV(csv, 'Все данные.csv');
}

// Вспомогательная: скачивание CSV с правильной кодировкой (для Excel)
function downloadCSV(csv, filename) {
  const BOM = '\uFEFF'; // чтобы кириллица не ломалась в Excel
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}