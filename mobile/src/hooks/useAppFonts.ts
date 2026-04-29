import { useEffect, useState } from 'react';
import * as Font from 'expo-font';

/**
 * Loads custom fonts if available. If the .ttf files are not present in
 * assets/fonts (see assets/fonts/README.md), the app falls back to system
 * defaults instead of crashing — useful for first-run development.
 */
export function useAppFonts(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // @ts-expect-error optional require — file may not exist yet
        const anton = require('../../assets/fonts/Anton-Regular.ttf');
        // @ts-expect-error optional require
        const inter = require('../../assets/fonts/Inter-Regular.ttf');
        // @ts-expect-error optional require
        const interBold = require('../../assets/fonts/Inter-Bold.ttf');
        // @ts-expect-error optional require
        const mono = require('../../assets/fonts/SpaceMono-Regular.ttf');
        await Font.loadAsync({
          Anton: anton,
          Inter: inter,
          'Inter-Bold': interBold,
          SpaceMono: mono,
        });
      } catch {
        // fonts not present — fall back to system fonts
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return ready;
}
