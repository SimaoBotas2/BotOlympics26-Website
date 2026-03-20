import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AppRoutes from './AppRoutes';

export default function App() {
  const { i18n } = useTranslation();

  // ensure PT is the default on first visit (do not override an existing preference)
  useEffect(() => {
    try {
      const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('i18nextLng') : null;
      if (!stored) {
        i18n.changeLanguage('pt');
      }
    } catch (e) {
      // ignore (e.g. localStorage not available)
    }
  }, [i18n]);

  // set the favicon to /assets/logo.svg (create or update link[rel~="icon"])
  useEffect(() => {
    if (typeof document === 'undefined') return;
    try {
      const href = '/assets/logo.svg';
      let icon = document.querySelector('link[rel~="icon"]');
      if (icon) {
        icon.setAttribute('href', href);
        icon.setAttribute('type', 'image/svg+xml');
      } else {
        icon = document.createElement('link');
        icon.setAttribute('rel', 'icon');
        icon.setAttribute('href', href);
        icon.setAttribute('type', 'image/svg+xml');
        document.head.appendChild(icon);
      }
    } catch (e) {
      // ignore any DOM errors
    }
  }, []);

  return <AppRoutes />;
}
