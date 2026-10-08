import { useEffect, useState } from 'react';

/**
 * Telegram Mini App environment hook.
 * Falls back gracefully when running in a plain browser.
 */
export function useTelegram() {
  const [env, setEnv] = useState({
    isTelegram: false,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
    themeParams: null,
    user: null,
  });

  useEffect(() => {
    let tg = null;
    try {
      tg = window.Telegram?.WebApp || null;
    } catch {
      tg = null;
    }

    if (tg) {
      try {
        tg.ready();
        tg.expand();
      } catch {
        /* noop */
      }
      setEnv({
        isTelegram: true,
        height: tg.viewportHeight || window.innerHeight,
        themeParams: tg.themeParams || null,
        user: tg.initDataUnsafe?.user || null,
      });
      const onViewport = () =>
        setEnv((e) => ({ ...e, height: tg.viewportHeight || window.innerHeight }));
      tg.onEvent('viewportChanged', onViewport);
      return () => {
        try {
          tg.offEvent('viewportChanged', onViewport);
        } catch {
          /* noop */
        }
      };
    }

    const onResize = () => setEnv((e) => ({ ...e, height: window.innerHeight }));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return env;
}
