'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import proj4 from 'proj4';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const projections = {
  'WGS-84': '+proj=longlat +datum=WGS84 +no_defs',
  'МСК-02': '+proj=tmerc +lat_0=0 +lon_0=30 +k=1 +x_0=0 +y_0=0 +ellps=krass +towgs84=23.92,-141.27,-80.9,0,0,0,0 +units=m +no_defs',
  'МСК-74': '+proj=tmerc +lat_0=0 +lon_0=74 +k=1 +x_0=0 +y_0=0 +ellps=krass +towgs84=23.92,-141.27,-80.9,0,0,0,0 +units=m +no_defs',
  'ГСК-2011': '+proj=tmerc +lat_0=0 +lon_0=0 +k=1 +x_0=0 +y_0=0 +ellps=GSK2011 +units=m +no_defs',
};

const QUEUE_COLORS = {
  1: '#2ecc71',
  2: '#3498db',
  3: '#f1c40f',
  drilled: '#e74c3c',
  field: '#4a90d9',
  default: '#d4af37',
};

function getPointColor(point) {
  if (point.type !== 'drilling') return QUEUE_COLORS.field;
  if (point.is_drilled) return QUEUE_COLORS.drilled;
  if (point.queue === 1) return QUEUE_COLORS[1];
  if (point.queue === 2) return QUEUE_COLORS[2];
  if (point.queue === 3) return QUEUE_COLORS[3];
  return QUEUE_COLORS.default;
}

export default function LeafletMap({ points, canEdit, onEdit, onDelete }) {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const markersRef = useRef([]);
  const [selectedCoordSystem, setSelectedCoordSystem] = useState('WGS-84');
  const [activeLayer, setActiveLayer] = useState('all');

  // Инициализация карты + ПОЧИНКА серого экрана
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current).setView([55.75, 60.0], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    // 🔧 ГЛАВНЫЙ ФИКС: пересчёт размера (убирает серый экран)
    setTimeout(() => map.invalidateSize(), 100);
    setTimeout(() => map.invalidateSize(), 400);

    // Функции для кнопок в попапе (доступны глобально из HTML попапа)
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

  // Обновляем ссылки на функции при изменении points
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

  // Обновление маркеров
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
      const coordSource =
        point.true_coordinates || point.project_coordinates || point.coordinates;
      let coords = coordSource?.split(',').map(Number);

      if (coords && coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
        let lat = coords[0];
        let lng = coords[1];

        if (selectedCoordSystem !== 'WGS-84') {
          try {
            const proj = proj4(projections['WGS-84'], projections[selectedCoordSystem]);
            const result = proj.forward([lng, lat]);
            lng = result[0];
            lat = result[1];
          } catch (e) {
            console.error('Ошибка преобразования:', e);
          }
        }

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

        // Статус
        let statusText = '';
        if (point.type === 'drilling') {
          if (isDrilled) statusText = '🔴 Пробурена';
          else if (point.queue) statusText = `${point.queue}-я очередь`;
        } else {
          statusText = 'Полевая точка';
        }

        // Кнопки (только для тех, кто может редактировать)
        const buttonsHtml = canEdit
          ? `<div class="popup-actions">
               <button onclick="window._mapEditPoint('${point.id}')" class="popup-btn edit">✏️ Изменить</button>
               <button onclick="window._mapDeletePoint('${point.id}')" class="popup-btn delete">🗑️ Удалить</button>
             </div>`
          : '';

        marker.bindPopup(`
          <div class="gold-popup">
            <div class="popup-title">${point.name || 'Без названия'}</div>
            <div class="popup-row"><span>Скважина:</span> ${point.hole_number || '—'}</div>
            <div class="popup-row"><span>Статус:</span> ${statusText || '—'}</div>
            <div class="popup-row"><span>Дата:</span> ${point.date || '—'}</div>
            <div class="popup-row"><span>Координаты:</span></div>
            <div class="popup-coords">${lat.toFixed(6)}, ${lng.toFixed(6)}</div>
            <div class="popup-sys">(${selectedCoordSystem})</div>
            ${buttonsHtml}
          </div>
        `, { className: 'gold-popup-wrapper' });

        markersRef.current.push(marker);
      }
    });
  }, [points, selectedCoordSystem, activeLayer, canEdit]);

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      {/* Панель управления */}
      <div className="map-control">
        <div>
          <label>Система координат</label>
          <select
            value={selectedCoordSystem}
            onChange={(e) => setSelectedCoordSystem(e.target.value)}
          >
            <option value="WGS-84">WGS-84</option>
            <option value="МСК-02">МСК-02</option>
            <option value="МСК-74">МСК-74</option>
            <option value="ГСК-2011">ГСК-2011</option>
          </select>
        </div>
        <div>
          <label>Слой</label>
          <select value={activeLayer} onChange={(e) => setActiveLayer(e.target.value)}>
            <option value="all">Все</option>
            <option value="Скважина">Скважины</option>
            <option value="Участок">Участки</option>
            <option value="Проба">Пробы</option>
          </select>
        </div>
      </div>

      {/* Легенда */}
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
          background: rgba(20,20,20,0.92);
          padding: 0.9rem;
          border-radius: 12px;
          border: 1px solid #d4af37;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          min-width: 150px;
          backdrop-filter: blur(6px);
          box-shadow: 0 4px 20px rgba(0,0,0,0.4);
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
          background: rgba(20,20,20,0.92);
          padding: 0.8rem 1rem;
          border-radius: 12px;
          border: 1px solid #d4af37;
          font-size: 0.75rem;
          color: #fff;
          backdrop-filter: blur(6px);
          box-shadow: 0 4px 20px rgba(0,0,0,0.4);
        }
        .legend-title {
          color: #d4af37;
          margin-bottom: 0.5rem;
          font-weight: bold;
        }

        /* Попап */
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
          min-width: 200px;
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
        .popup-coords {
          color: #d4af37;
          font-family: monospace;
          font-size: 0.85rem;
          margin: 0.2rem 0;
        }
        .popup-sys {
          color: #777;
          font-size: 0.72rem;
          margin-bottom: 0.4rem;
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