"use client";

import { useCallback, useEffect, useState } from "react";

import {
  EMPTY_PROGRESS,
  getBrowserStorage,
  readProgress,
  type ProgressSnapshot,
} from "@/lib/progress";

/** 同分頁內草稿更新時廣播，讓路線圖與進度環立刻反應。 */
export const PROGRESS_EVENT = "ihm:progress";

export function notifyProgressChanged(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(PROGRESS_EVENT));
}

export type UseProgressResult = ProgressSnapshot & {
  answeredCount: number;
  dueCount: number;
  total: number;
  /** 掛載前為 false；用來避免 SSR 與首次渲染不一致。 */
  ready: boolean;
};

/**
 * 讀取一組題目的本機練習進度。
 * SSR 與首次渲染一律回傳空進度，掛載後才填入實際值。
 */
export function useProgress(questionIds: readonly string[]): UseProgressResult {
  const [snapshot, setSnapshot] = useState<ProgressSnapshot>(EMPTY_PROGRESS);
  const [ready, setReady] = useState(false);

  const key = questionIds.join(",");

  const refresh = useCallback(() => {
    const ids = key ? key.split(",") : [];
    setSnapshot(readProgress(getBrowserStorage(), ids, Date.now()));
    setReady(true);
  }, [key]);

  useEffect(() => {
    refresh();

    window.addEventListener("storage", refresh);
    window.addEventListener(PROGRESS_EVENT, refresh);

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(PROGRESS_EVENT, refresh);
    };
  }, [refresh]);

  return {
    ...snapshot,
    answeredCount: snapshot.answeredIds.size,
    dueCount: snapshot.dueIds.size,
    total: questionIds.length,
    ready,
  };
}
