import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';

export default function NativeAppBridge() {
  const navigate = useNavigate();
  const location = useLocation();
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let disposed = false;
    let subscription;
    const pending = App.addListener('backButton', () => {
      const dialog = document.querySelector('[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]');
      if (dialog) {
        dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        return;
      }
      if (window.history.state?.idx > 0) navigate(-1);
      else if (location.pathname !== '/') navigate('/', { replace: true });
      else void App.minimizeApp();
    });
    pending.then(handle => { if (disposed) void handle.remove(); else subscription = handle; });
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    const openExternal = event => {
      const anchor = event.target.closest?.('a[href]');
      if (!anchor || event.defaultPrevented || event.button !== 0) return;
      const url = new URL(anchor.href, window.location.href);
      if (!['https:', 'http:'].includes(url.protocol) || url.origin === window.location.origin) return;
      event.preventDefault();
      void Browser.open({ url: url.href });
    };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    document.addEventListener('click', openExternal);
    return () => {
      disposed = true;
      void subscription?.remove();
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      document.removeEventListener('click', openExternal);
    };
  }, [navigate, location.pathname]);
  if (!Capacitor.isNativePlatform() || online) return null;
  return <div role="status" className="fixed inset-x-0 top-0 z-[100] bg-amber-100 px-4 py-3 text-center text-sm text-amber-950">
    You're offline. Reconnect to refresh live stats and news.
  </div>;
}
