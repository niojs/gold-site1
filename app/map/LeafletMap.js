'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { toWgs84, fromWgs84, parseCoords, coordsToString, COORD_SYSTEMS, detectSystem } from '../../lib/coordinates';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const QUEUE_COLORS = {
  1: '#2ecc71',
  2: '#3498db',
  3: '#f1c40f',
  drilled: '#e74c3c',
  field: '#4a90d9',
  default: '#d4af37',
};

function getPointColor(point) {
  if (point.type === 'primary') return '#e6a817';
  if (point.type !== 'drilling') return QUEUE_COLORS.field;
  if (point.is_drilled) return QUEUE_COLORS.drilled;
  if (point.queue === 1) return QUEUE_COLORS[1];
  if (point.queue === 2) return QUEUE_COLORS[2];
  if (point.queue === 3) return QUEUE_COLORS[3];
  return QUEUE_COLORS.default;
}

function getWgs84Coords(point) {
  const system = point.coord_system || 'WGS-84';

  const trueCoords = point.true_coordinates || '';
  const projCoords = point.project_coordinates || '';
  const legacyCoords = point.coordinates || '';

  const coordStr = trueCoords || projCoords || legacyCoords;
  if (!coordStr) return null;

  const parsed = parseCoords(coordStr);
  if (!parsed) return null;

  if (system === 'WGS-84') {
    return { lat: parsed[0], lng: parsed[1], displaySystem: system };
  }

  const wgs = toWgs84(system, parsed);
  if (wgs) {
    return { lat: wgs[1], lng: wgs[0], displaySystem: system };
  }

  return { lat: parsed[0], lng: parsed[1], displaySystem: 'WGS-84 (fallback)' };
}

function getAllCoordDisplays(point) {
  const displays = [];
  const system = point.coord_system || 'WGS-84';

  const trueCoords = point.true_coordinates || '';
  const projCoords = point.project_coordinates || '';
  const legacyCoords = point.coordinates || '';

  const mainStr = trueCoords || projCoords || legacyCoords;
  if (!mainStr) return displays;

  const parsed = parseCoords(mainStr);
  if (!parsed) return displays;

  if (system === 'WGS-84') {
    displays.push({ system: 'WGS-84', value: coordsToString(parsed[0], parsed[1], 6) });
    for (const sys of COORD_SYSTEMS) {
      if (sys === 'WGS-84') continue;
      const converted = fromWgs84(sys, [parsed[0], parsed[1]]);
      if (converted) {
        displays.push({ system: sys, value: coordsToString(converted[0], converted[1], 2) });
      }
    }
  } else {
    displays.push({ system, value: coordsToString(parsed[0], parsed[1], 2) });
    const wgs = toWgs84(system, parsed);
    if (wgs) {
      displays.push({ system: 'WGS-84', value: coordsToString(wgs[1], wgs[0], 6) });
      for (const sys of COORD_SYSTEMS) {
        if (sys === 'WGS-84' || sys === system) continue;
        const converted = fromWgs84(sys, wgs);
        if (converted) {
          displays.push({ system: sys, value: coordsToString(converted[0], converted[1], 2) });
        }
      }
    }
  }

  return displays;
}

export default function LeafletMap({ points, canEdit, onEdit, onDelete }) {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const markersRef = useRef([]);
  const [displaySystem, setDisplaySystem] = useState('WGS-84');
  const [activeLayer, setActiveLayer] = useState('all');

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
    }).setView([55.75, 60.0], 10);

    L.control.zoom({ position: 'topright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    setTimeout(() => map.invalidateSize(), 100);
    setTimeout(() => map.invalidateSize(), 400);

    window._mapEditPoint = (id) => {
      const point = points.find((p) => String(p.id) === String(id));
      if (point && onEdit) onEdit(point);
    };
    window._mapDeletePoint = (id) => {
      const point = points.find((p) => String(p.id) === String(id));
      if (point && onDelete) onDelete(point);
    };

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    window._mapEditPoint = (id) => {
      const point = points.find((p) => String(p.id) === String(id));
      if (point && onEdit) onEdit(point);
    };
    window._mapDeletePoint = (id) => {
      const point = points.find((p) => String(p.id) === String(id));
      if (point && onDelete) onDelete(point);
    };
  }, [points, onEdit, onDelete]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((marker) => map.removeLayer(marker));
    markersRef.current = [];

    let filteredPoints = points;
    if (activeLayer !== 'all') {
      filteredPoints = points.filter((p) => p.layer === activeLayer);
    }

    filteredPoints.forEach((point) => {
      const wgs = getWgs84Coords(point);
      if (!wgs) return;

      const lat = wgs.lat;
      const lng = wgs.lng;

      const color = getPointColor(point);
      const isDrilled = point.is_drilled;

      const marker = L.marker([lat, lng]).addTo(map);
      marker.setIcon(
        L.divIcon({
          className: 'custom-marker',
          html: `<div class="marker-dot ${isDrilled ? 'marker-pulse' : ''}" style="background-color: ${color};"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        })
      );

      let statusText = '';
      if (point.type === 'primary') {
        statusText = 'Первичные данные';
      } else if (point.type === 'drilling') {
        if (isDrilled) statusText = 'Пробурена';
        else if (point.queue) statusText = `${point.queue}-я очередь`;
      } else {
        statusText = 'Полевая точка';
      }

      const allCoords = getAllCoordDisplays(point);
      const coordsHtml = allCoords.length > 0
        ? allCoords.map(c => `<div class="popup-coord-row"><span class="popup-sys-label">${c.system}:</span> <span class="popup-coord-value">${c.value}</span></div>`).join('')
        : '<div class="popup-coords">—</div>';

      const buttonsHtml = canEdit
        ? `<div class="popup-actions">
             <button onclick="window._mapEditPoint('${point.id}')" class="popup-btn edit">Изменить</button>
             <button onclick="window._mapDeletePoint('${point.id}')" class="popup-btn delete">Удалить</button>
           </div>`
        : '';

      marker.bindPopup(`
        <div class="gold-popup">
          <div class="popup-title">${point.name || 'Без названия'}</div>
          <div class="popup-row"><span>Скважина:</span> ${point.hole_number || '—'}</div>
          <div class="popup-row"><span>Статус:</span> ${statusText || '—'}</div>
          <div class="popup-row"><span>Дата:</span> ${point.date || '—'}</div>
          <div class="popup-row"><span>Координаты:</span></div>
          <div class="popup-coords-block">${coordsHtml}</div>
          ${buttonsHtml}
        </div>
      `, { className: 'gold-popup-wrapper', maxWidth: 320 });

      markersRef.current.push(marker);
    });
  }, [points, displaySystem, activeLayer, canEdit]);

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <div className="map-control">
        <div>
          <label>Слой</label>
          <select value={activeLayer} onChange={(e) => setActiveLayer(e.target.value)}>
            <option value="all">Все</option>
            <option value="Скважина">Скважины</option>
            <option value="Участок">Участки</option>
            <option value="Проба">Пробы</option>
            <option value="Первичные">Первичные данные</option>
          </select>
        </div>
      </div>

      <div className="map-legend">
        <div className="legend-title">Очередь бурения</div>
        <LegendItem color={QUEUE_COLORS[1]} label="1-я очередь" />
        <LegendItem color={QUEUE_COLORS[2]} label="2-я очередь" />
        <LegendItem color={QUEUE_COLORS[3]} label="3-я очередь" />
        <LegendItem color={QUEUE_COLORS.drilled} label="Пробурена" />
        <LegendItem color={QUEUE_COLORS.field} label="Полевые" />
      </div>

      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

      <style jsx global>{`
        .marker-dot {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
          transition: transform 0.2s;
        }
        .marker-dot:hover { transform: scale(1.4); }
        .marker-pulse {
          animation: markerPulse 1.8s infinite;
        }
        @keyframes markerPulse {
          0% { box-shadow: 0 0 0 0 rgba(231,76,60,0.6); }
          70% { box-shadow: 0 0 0 12px rgba(231,76,60,0); }
          100% { box-shadow: 0 0 0 0 rgba(231,76,60,0); }
        }

        .map-control {
          position: absolute;
          top: 12px;
          left: 12px;
          z-index: 1000;
          background: rgba(13,13,13,0.85);
          padding: 0.7rem;
          border-radius: 10px;
          border: 1px solid rgba(212,175,55,0.4);
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          min-width: 140px;
          backdrop-filter: blur(8px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.5);
        }
        .map-control label {
          color: #d4af37;
          font-size: 0.72rem;
          display: block;
          margin-bottom: 0.25rem;
        }
        .map-control select {
          width: 100%;
          background: #0d0d0d;
          color: #fff;
          border: 1px solid #444;
          border-radius: 6px;
          padding: 0.4rem;
          font-size: 0.82rem;
          cursor: pointer;
          transition: border 0.2s;
        }
        .map-control select:focus {
          border-color: #d4af37;
          outline: none;
        }

        .map-legend {
          position: absolute;
          bottom: 24px;
          right: 12px;
          z-index: 1000;
          background: rgba(13,13,13,0.85);
          padding: 0.7rem 0.9rem;
          border-radius: 10px;
          border: 1px solid rgba(212,175,55,0.4);
          font-size: 0.75rem;
          color: #fff;
          backdrop-filter: blur(8px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.5);
        }
        .legend-title {
          color: #d4af37;
          margin-bottom: 0.5rem;
          font-weight: bold;
        }

        .leaflet-control-zoom {
          border: 1px solid rgba(212,175,55,0.4) !important;
          border-radius: 10px !important;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(0,0,0,0.5) !important;
        }
        .leaflet-control-zoom a {
          background: rgba(13,13,13,0.85) !important;
          color: #d4af37 !important;
          border: none !important;
          backdrop-filter: blur(8px);
          font-size: 1.2rem !important;
          font-weight: bold;
        }
        .leaflet-control-zoom a:hover {
          background: #d4af37 !important;
          color: #0d0d0d !important;
        }

        .gold-popup-wrapper .leaflet-popup-content-wrapper {
          background: linear-gradient(160deg, #1a1a1a, #0d0d0d);
          border: 1px solid #d4af37;
          border-radius: 14px;
          box-shadow: 0 8px 30px rgba(0,0,0,0.6);
        }
        .gold-popup-wrapper .leaflet-popup-tip {
          background: #0d0d0d;
          border: 1px solid #d4af37;
        }
        .gold-popup-wrapper .leaflet-popup-content {
          margin: 0;
          min-width: 220px;
          max-width: 320px;
        }
        .gold-popup { padding: 0.4rem 0.2rem; }
        .popup-title {
          color: #d4af37;
          font-size: 1.05rem;
          font-weight: bold;
          margin-bottom: 0.6rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #333;
        }
        .popup-row {
          color: #ddd;
          font-size: 0.85rem;
          margin-bottom: 0.3rem;
        }
        .popup-row span { color: #999; }
        .popup-coords-block {
          margin: 0.3rem 0 0.5rem 0;
        }
        .popup-coord-row {
          display: flex;
          gap: 0.4rem;
          font-size: 0.78rem;
          margin-bottom: 0.15rem;
          align-items: baseline;
        }
        .popup-sys-label {
          color: #888;
          min-width: 60px;
          font-size: 0.7rem;
        }
        .popup-coord-value {
          color: #d4af37;
          font-family: monospace;
          font-size: 0.8rem;
        }
        .popup-actions {
          display: flex;
          gap: 0.5rem;
          margin-top: 0.8rem;
          padding-top: 0.6rem;
          border-top: 1px solid #333;
        }
        .popup-btn {
          flex: 1;
          border: none;
          border-radius: 8px;
          padding: 0.5rem;
          font-size: 0.8rem;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s;
        }
        .popup-btn.edit {
          background: linear-gradient(135deg, #d4af37, #f0d060);
          color: #0d0d0d;
        }
        .popup-btn.edit:hover { transform: translateY(-1px); }
        .popup-btn.delete {
          background: rgba(231,76,60,0.15);
          color: #e74c3c;
          border: 1px solid #e74c3c;
        }
        .popup-btn.delete:hover {
          background: #e74c3c;
          color: #fff;
        }
      `}</style>
    </div>
  );
}

function LegendItem({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
      <div style={{
        width: '12px', height: '12px', borderRadius: '50%',
        backgroundColor: color, border: '2px solid white',
      }} />
      <span>{label}</span>
    </div>
  );
}
