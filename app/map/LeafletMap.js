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

export default function LeafletMap({ points }) {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const [selectedCoordSystem, setSelectedCoordSystem] = useState('WGS-84');
  const [activeLayer, setActiveLayer] = useState('all');
  const [markers, setMarkers] = useState([]);

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

  // Обновление маркеров при изменении точек, системы координат или слоя
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Удаляем старые маркеры
    markers.forEach(marker => map.removeLayer(marker));
    setMarkers([]);

    // Фильтруем точки по слою
    let filteredPoints = points;
    if (activeLayer !== 'all') {
      filteredPoints = points.filter(p => p.layer === activeLayer);
    }

    // Добавляем новые маркеры
    const newMarkers = [];
    filteredPoints.forEach((point) => {
      // Парсим координаты
      let coords = point.coordinates?.split(',').map(Number);
      if (coords && coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
        // Если координаты в WGS-84, преобразуем в выбранную систему
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

        // Цвет маркера в зависимости от типа
        const color = point.type === 'drilling' ? '#d4af37' : '#4a90d9';
        marker.setIcon(
          L.divIcon({
            className: 'custom-marker',
            html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
            iconSize: [12, 12],
            iconAnchor: [6, 6],
          })
        );

        marker.bindPopup(`
          <b>${point.name || 'Без названия'}</b><br>
          Скважина: ${point.hole_number || '—'}<br>
          Дата: ${point.date || '—'}<br>
          Тип: ${point.layer || '—'}<br>
          Координаты (${selectedCoordSystem}): ${lat.toFixed(6)}, ${lng.toFixed(6)}
        `);

        newMarkers.push(marker);
      }
    });

    setMarkers(newMarkers);
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

      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}