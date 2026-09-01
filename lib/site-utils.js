export function getSelectedSite() {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/selected_site=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}
