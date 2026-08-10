"use client";

import { useCallback, useEffect, useState } from "react";

import { getBrowserStorage } from "@/lib/progress";
import { readFlag, writeFlag } from "@/lib/uiPrefs";

export type PersistentFlag = readonly [boolean, (next?: boolean) => void];

/**
 * 記住使用者的版面偏好。
 * SSR 與首次渲染一律用 fallback，掛載後才讀取本機值，避免 hydration 不一致。
 */
export function usePersistentFlag(
  key: string,
  fallback = false,
): PersistentFlag {
  const [value, setValue] = useState(fallback);

  useEffect(() => {
    setValue(readFlag(getBrowserStorage(), key, fallback));
  }, [key, fallback]);

  const toggle = useCallback(
    (next?: boolean) => {
      setValue((current) => {
        const resolved = next === undefined ? !current : next;
        writeFlag(getBrowserStorage(), key, resolved);
        return resolved;
      });
    },
    [key],
  );

  return [value, toggle] as const;
}
