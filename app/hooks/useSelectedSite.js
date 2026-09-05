'use client';
import { useState, useCallback } from 'react';

function readCookie(name) {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(name + '=([^;]+)'));
  const val = match ? decodeURIComponent(match[1]) : null;
  return val === '__none__' ? null : val;
}

function writeCookie(name, value, maxAge) {
  document.cookie = name + '=' + encodeURIComponent(value) + '; path=/; max-age=' + maxAge;
}

function deleteCookie(name) {
  document.cookie = name + '=; path=/; max-age=0';
}

export default function useSelectedSite() {
  const [site, setSite] = useState(() => readCookie('selected_site'));

  const selectSite = useCallback((name) => {
    writeCookie('selected_site', name, 60 * 60 * 24);
    setSite(name);
  }, []);

  const clearSite = useCallback(() => {
    deleteCookie('selected_site');
    setSite(null);
  }, []);

  return { site, selectSite, clearSite };
}
