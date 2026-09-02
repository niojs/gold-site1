import proj4 from 'proj4';

const PROJECTIONS = {
  'WGS-84': '+proj=longlat +datum=WGS84 +no_defs',
  'МСК-02': '+proj=tmerc +lat_0=0 +lon_0=30 +k=1 +x_0=0 +y_0=0 +ellps=krass +towgs84=23.92,-141.27,-80.9,0,0,0,0 +units=m +no_defs',
  'МСК-74': '+proj=tmerc +lat_0=0 +lon_0=74 +k=1 +x_0=0 +y_0=0 +ellps=krass +towgs84=23.92,-141.27,-80.9,0,0,0,0 +units=m +no_defs',
  'ГСК-2011': '+proj=tmerc +lat_0=0 +lon_0=0 +k=1 +x_0=0 +y_0=0 +ellps=GSK2011 +units=m +no_defs',
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
  if (system === 'WGS-84') {
    return coordsToString(a, b, 6);
  }
  return coordsToString(a, b, 2);
}

export function detectSystem(coords) {
  const parsed = parseCoords(coords);
  if (!parsed) return 'WGS-84';

  const [a, b] = parsed;

  if (Math.abs(a) <= 90 && Math.abs(b) <= 180) {
    return 'WGS-84';
  }

  if (a > 1000000 || b > 1000000) {
    return 'МСК-02';
  }

  return 'WGS-84';
}
