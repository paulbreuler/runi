import type React from 'react';

export type AnimateNumberComponent = React.ComponentType<{
  children: number | bigint | string;
  transition?: object;
  suffix?: string;
  style?: React.CSSProperties;
}>;

/**
 * Loads Motion+ AnimateNumber lazily.
 *
 * Uses a non-static dynamic import so builds succeed when `motion-plus` is not installed.
 */
export const loadMotionPlusAnimateNumber = async (): Promise<AnimateNumberComponent | null> => {
  const modulePath = 'motion-plus/react';

  try {
    const mod = (await import(/* @vite-ignore */ modulePath)) as {
      AnimateNumber?: AnimateNumberComponent;
    };

    return mod.AnimateNumber ?? null;
  } catch {
    return null;
  }
};
