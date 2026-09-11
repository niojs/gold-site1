export const ROLES = {
  admin: 'admin',
  chief_geologist: 'chief_geologist',
  field_geologist: 'field_geologist',
  washer: 'washer',
  sampler: 'sampler',
};

export const ROLE_LABELS = {
  admin: 'Администратор',
  chief_geologist: 'Главный геолог',
  field_geologist: 'Полевой геолог',
  washer: 'Промывка',
  sampler: 'Пробы',
};

export const ROLE_ICONS = {
  admin: '👑',
  chief_geologist: '🔬',
  field_geologist: '📝',
  washer: '🧪',
  sampler: '⚗️',
};

export const ROLE_REDIRECTS = {
  admin: '/dashboard',
  chief_geologist: '/dashboard',
  field_geologist: '/field-data',
  washer: '/washing',
  sampler: '/assay',
};

export const DATA_TYPES = {
  drilling: { label: 'Буровые работы', color: '#5b9bd5', icon: '⛏️' },
  field: { label: 'Полевые данные', color: '#70ad47', icon: '📝' },
  washing: { label: 'Промывка', color: '#4dd0c4', icon: '🧪' },
  assay: { label: 'Пробы', color: '#d67ab1', icon: '⚗️' },
  primary: { label: 'Проектные координаты', color: '#e6a817', icon: '📐' },
};

export const SITE_COOKIE = 'selected_site';
export const SITE_COOKIE_MAX_AGE = 60 * 60 * 24;
