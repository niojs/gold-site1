import proj4 from 'proj4';

// Параметры по ГОСТ 51794-2008, эллипсоид Красовского.
// МСК-02 (Башкортостан): 2 трёхградусные зоны, ЦМ 55°02' и 58°02'.
// МСК-74 (Челябинская обл.): 3 трёхградусные зоны, ЦМ 58°02', 61°02', 64°02'.
// ВНИМАНИЕ: координаты X/Y в этих системах выглядят как "396000, 1341253"
// (X — сотни тысяч метров, Y — 1.3/2.3/3.3 млн). Старые значения,
// посчитанные до этого фикса, неверны и требуют перерасчёта из WGS-84.
const SK_TOWGS84 = '23.57,-140.95,-79.8,0,-0.35,-0.79,-0.22';

const PROJECTIONS = {
  'WGS-84': '+proj=longlat +datum=WGS84 +no_defs',
  'МСК-02 зона 1': `+proj=tmerc +lat_0=0 +lon_0=55.03333333333 +k=1 +x_0=1300000 +y_0=-5409414.70 +ellps=krass +towgs84=${SK_TOWGS84} +units=m +no_defs`,
  'МСК-02 зона 2': `+proj=tmerc +lat_0=0 +lon_0=58.03333333333 +k=1 +x_0=2300000 +y_0=-5409414.70 +ellps=krass +towgs84=${SK_TOWGS84} +units=m +no_defs`,
  'МСК-74 зона 1': `+proj=tmerc +lat_0=0 +lon_0=58.03333333333 +k=1 +x_0=1300000 +y_0=-5509414.70 +ellps=krass +towgs84=${SK_TOWGS84} +units=m +no_defs`,
  'МСК-74 зона 2': `+proj=tmerc +lat_0=0 +lon_0=61.03333333333 +k=1 +x_0=2300000 +y_0=-5509414.70 +ellps=krass +towgs84=${SK_TOWGS84} +units=m +no_defs`,
  'МСК-74 зона 3': `+proj=tmerc +lat_0=0 +lon_0=64.03333333333 +k=1 +x_0=3300000 +y_0=-5509414.70 +ellps=krass +towgs84=${SK_TOWGS84} +units=m +no_defs`,
  // ГСК-2011 — это датум, а не плоская система: географические координаты
  // (совпадают с WGS-84 с точностью до дециметров).
  'ГСК-2011': '+proj=longlat +ellps=GSK2011 +towgs84=0,0,0 +no_defs',
};

export const COORD_SYSTEMS = Object.keys(PROJECTIONS);

export function parseCoords(str) {
  if (!str || typeof str !== 'string') return null;
  const cleaned = str.trim();
  if (!cleaned) return null;

  let parts;
  if (cleaned.includes(';')) {
    parts = cleaned.split(';').map(s => s.trim());
  } else if (cleaned.includes(',') && cleaned.includes('.')) {
    const lastComma = cleaned.lastIndexOf(',');
    const before = cleaned.substring(0, lastComma).replace(/,/g, '');
    const after = cleaned.substring(lastComma + 1).trim();
    parts = [before.trim(), after];
  } else if (cleaned.includes(',')) {
    parts = cleaned.split(',').map(s => s.trim());
  } else {
    parts = cleaned.split(/\s+/);
  }

  if (parts.length < 2) return null;

  const a = parseFloat(parts[0].replace(',', '.'));
  const b = parseFloat(parts[1].replace(',', '.'));
  if (isNaN(a) || isNaN(b)) return null;

  return [a, b];
}

export function formatCoord(value, precision = 6) {
  if (value === null || value === undefined || isNaN(value)) return '';
  return Number(value).toFixed(precision);
}

export function coordsToString(a, b, precision = 6) {
  return `${formatCoord(a, precision)}, ${formatCoord(b, precision)}`;
}

export function convert(fromSystem, toSystem, appCoords) {
  if (!appCoords || appCoords.length < 2) return null;
  if (fromSystem === toSystem) return [...appCoords];

  const fromProj = PROJECTIONS[fromSystem];
  const toProj = PROJECTIONS[toSystem];
  if (!fromProj || !toProj) return null;

  try {
    const proj4Coords = [appCoords[1], appCoords[0]];
    const result = proj4(fromProj, toProj, proj4Coords);
    return [result[1], result[0]];
  } catch (e) {
    console.error(`Ошибка конвертации ${fromSystem} → ${toSystem}:`, e);
    return null;
  }
}

export function toWgs84(fromSystem, appCoords) {
  return convert(fromSystem, 'WGS-84', appCoords);
}

export function fromWgs84(toSystem, appCoords) {
  return convert('WGS-84', toSystem, appCoords);
}

export function toLatLon(fromSystem, rawCoords) {
  const parsed = parseCoords(rawCoords);
  if (!parsed) return null;

  if (fromSystem === 'WGS-84') {
    return { lat: parsed[0], lng: parsed[1] };
  }

  const wgs = toWgs84(fromSystem, parsed);
  if (!wgs) return null;

  return { lat: wgs[0], lng: wgs[1] };
}

export function formatForSystem(system, a, b) {
  if (isGeographic(system)) {
    return coordsToString(a, b, 6);
  }
  return coordsToString(a, b, 2);
}

// Географические системы (градусы) против плоских (метры, зоны МСК).
export function isGeographic(system) {
  return system === 'WGS-84' || system === 'ГСК-2011';
}

export function detectSystem(coords) {
  const parsed = parseCoords(coords);
  if (!parsed) return 'WGS-84';

  const [a, b] = parsed;

  if (Math.abs(a) <= 90 && Math.abs(b) <= 180) {
    return 'WGS-84';
  }

  // По одним числам зону МСК определить нельзя: у МСК-02 и МСК-74
  // одинаковые ложные востоки (1.3/2.3/3.3 млн). Возвращаем null —
  // вызывающий код должен попросить пользователя выбрать зону вручную.
  if (a > 50000 && a < 1500000 && b > 1000000 && b < 4000000) {
    return null;
  }

  return 'WGS-84';
}
