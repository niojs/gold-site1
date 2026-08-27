'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import proj4 from 'proj4';

// Исправляем иконки Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Определяем системы координат
const projections = {
  'WGS-84': '+proj=longlat +datum=WGS84 +no_defs',
  'МСК-02': '+proj=tmerc +lat_0=0 +lon_0=30 +k=1 +x_0=0 +y_0=0 +ellps=krass +towgs84=23.92,-141.27,-80.9,0,0,0,0 +units=m +no_defs',
  'МСК-74': '+proj=tmerc +lat_0=0 +lon_0=74 +k=1 +x_0=0 +y_0=0 +ellps=krass +towgs84=23.92,-141.27,-80.9,0,0,0,0 +units=m +no_defs',
  'ГСК-2011': '+proj=tmerc +lat_0=0 +lon_0=0 +k=1 +x_0=0 +y_0=0 +ellps=GSK2011 +units=m +no_defs',
};

// Цвета для скважин
const QUEUE_COLORS = {
  1: '#2ecc71', // 1-я очередь — зелёный
  2: '#3498db', // 2-я очередь — синий
  3: '#f1c40f', // 3-я очередь — жёлтый
  drilled: '#e74c3c', // пробурена — красный
  field: '#4a90d9', // полевые точки — голубой
  default: '#d4af37', // по умолчанию — золотой
};

// Функция выбора цвета точки
function getPointColor(point) {
  // Полевые точки
  if (point.type !== 'drilling') return QUEUE_COLORS.field;
  // Пробурена — приоритет (4-й цвет)
  if (point.is_drilled) return QUEUE_COLORS.drilled;
  // По очереди
  if (point.queue === 1) return QUEUE_COLORS[1];
  if (point.queue === 2) return QUEUE_COLORS[2];
  if (point.queue === 3) return QUEUE_COLORS[3];
  return QUEUE_COLORS.default;
}

export default function LeafletMap({ points }) {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const markersRef = useRef([]);
  const [selectedCoordSystem, setSelectedCoordSystem] = useState('WGS-84');
  const [activeLayer, setActiveLayer] = useState('all');

  // Инициализация карты
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current).setView([55.75, 60.0], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Обновление маркеров
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Удаляем старые маркеры
    markersRef.current.forEach((marker) => map.removeLayer(marker));
    markersRef.current = [];

    // Фильтруем точки по слою
    let filteredPoints = points;
    if (activeLayer !== 'all') {
      filteredPoints = points.filter((p) => p.layer === activeLayer);
    }

    // Добавляем новые маркеры
    filteredPoints.forEach((point) => {
      // Выбираем координаты: истинные → проектные → обычные
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
            console.error('Ошибка преобразования координат:', e);
          }
        }

        const marker = L.marker([lat, lng]).addTo(map);

        // Цвет маркера по очереди/статусу
        const color = getPointColor(point);
        marker.setIcon(
          L.divIcon({
            className: 'custom-marker',
            html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
            iconSize: [14, 14],
            iconAnchor: [7, 7],
          })
        );

        // Текст статуса для попапа
        let statusText = '';
        if (point.type === 'drilling') {
          if (point.is_drilled) {
            statusText = 'Пробурена ✅';
          } else if (point.queue) {
            statusText = `${point.queue}-я очередь`;
          }
        }

        marker.bindPopup(`
          <b>${point.name || 'Без названия'}</b><br>
          Скважина: ${point.hole_number || '—'}<br>
          Дата: ${point.date || '—'}<br>
          Тип: ${point.layer || '—'}<br>
          ${statusText ? `Статус: ${statusText}<br>` : ''}
          Координаты (${selectedCoordSystem}): ${lat.toFixed(6)}, ${lng.toFixed(6)}
        `);

        markersRef.current.push(marker);
      }
    });
  }, [points, selectedCoordSystem, activeLayer]);

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      {/* Панель управления */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        zIndex: 1000,
        background: 'rgba(26, 26, 26, 0.9)',
        padding: '1rem',
        borderRadius: '8px',
        border: '1px solid #d4af37',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        minWidth: '150px',
      }}>
        <div>
          <label style={{ color: '#d4af37', fontSize: '0.8rem' }}>Система координат</label>
          <select
            className="input-gold"
            value={selectedCoordSystem}
            onChange={(e) => setSelectedCoordSystem(e.target.value)}
            style={{ padding: '0.3rem', fontSize: '0.8rem' }}
          >
            <option value="WGS-84">WGS-84</option>
            <option value="МСК-02">МСК-02</option>
            <option value="МСК-74">МСК-74</option>
            <option value="ГСК-2011">ГСК-2011</option>
          </select>
        </div>

        <div>
          <label style={{ color: '#d4af37', fontSize: '0.8rem' }}>Слой</label>
          <select
            className="input-gold"
            value={activeLayer}
            onChange={(e) => setActiveLayer(e.target.value)}
            style={{ padding: '0.3rem', fontSize: '0.8rem' }}
          >
            <option value="all">Все</option>
            <option value="Скважина">Скважины</option>
            <option value="Участок">Участки</option>
            <option value="Проба">Пробы</option>
          </select>
        </div>
      </div>

      {/* Легенда цветов */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        right: '10px',
        zIndex: 1000,
        background: 'rgba(26, 26, 26, 0.9)',
        padding: '0.8rem',
        borderRadius: '8px',
        border: '1px solid #d4af37',
        fontSize: '0.75rem',
        color: '#fff',
      }}>
        <div style={{ color: '#d4af37', marginBottom: '0.4rem', fontWeight: 'bold' }}>Очередь бурения</div>
        <LegendItem color={QUEUE_COLORS[1]} label="1-я очередь" />
        <LegendItem color={QUEUE_COLORS[2]} label="2-я очередь" />
        <LegendItem color={QUEUE_COLORS[3]} label="3-я очередь" />
        <LegendItem color={QUEUE_COLORS.drilled} label="Пробурена" />
        <LegendItem color={QUEUE_COLORS.field} label="Полевые" />
      </div>

      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}

// Элемент легенды
function LegendItem({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
      <div style={{
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        backgroundColor: color,
        border: '2px solid white',
      }} />
      <span>{label}</span>
    </div>
  );
}