/**
 * 練習進度：草稿與作答時間都只存在瀏覽器本機，沒有帳號也沒有後端。
 * 這裡的函式都接受注入的 storage，方便單元測試與 SSR 安全呼叫。
 */

export const ANSWER_PREFIX = "ihm:answer-";
export const ANSWER_AT_PREFIX = "ihm:answer-at-";

/** 超過這個天數沒回來看，就標記為待複習。 */
export const REVIEW_AFTER_DAYS = 7;

const DAY_MS = 86_400_000;

export type StorageLike = Pick<Storage, "getItem" | "setItem">;

export type ProgressSnapshot = {
  /** 有留下非空白草稿的題目 id。 */
  answeredIds: ReadonlySet<string>;
  /** 已作答但超過複習週期的題目 id。 */
  dueIds: ReadonlySet<string>;
};

export const EMPTY_PROGRESS: ProgressSnapshot = {
  answeredIds: new Set(),
  dueIds: new Set(),
};

export function answerKey(questionId: string): string {
  return `${ANSWER_PREFIX}${questionId}`;
}

export function answerAtKey(questionId: string): string {
  return `${ANSWER_AT_PREFIX}${questionId}`;
}

/** 缺少時間戳的舊草稿一律不催複習，避免第一次升級就整片變紅。 */
export function isDueForReview(
  answeredAt: number | undefined,
  now: number,
  days: number = REVIEW_AFTER_DAYS,
): boolean {
  if (answeredAt === undefined || !Number.isFinite(answeredAt)) {
    return false;
  }

  return now - answeredAt >= days * DAY_MS;
}

function safeGet(storage: StorageLike, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

export function readDraft(
  storage: StorageLike | undefined,
  questionId: string,
): string {
  if (!storage) {
    return "";
  }

  return safeGet(storage, answerKey(questionId)) ?? "";
}

/** 寫入草稿並更新作答時間；清空草稿時一併移除時間戳語意（寫 0）。 */
export function saveDraft(
  storage: StorageLike | undefined,
  questionId: string,
  value: string,
  now: number,
): void {
  if (!storage) {
    return;
  }

  try {
    storage.setItem(answerKey(questionId), value);
    storage.setItem(
      answerAtKey(questionId),
      value.trim() ? String(now) : "",
    );
  } catch {
    // 無痕模式或配額不足：靜默略過，功能降級但不影響練習。
  }
}

export function readProgress(
  storage: StorageLike | undefined,
  questionIds: readonly string[],
  now: number,
): ProgressSnapshot {
  if (!storage) {
    return EMPTY_PROGRESS;
  }

  const answeredIds = new Set<string>();
  const dueIds = new Set<string>();

  for (const id of questionIds) {
    const draft = safeGet(storage, answerKey(id));
    if (!draft || !draft.trim()) {
      continue;
    }

    answeredIds.add(id);

    const rawAt = safeGet(storage, answerAtKey(id));
    const answeredAt = rawAt ? Number(rawAt) : undefined;
    if (isDueForReview(answeredAt, now)) {
      dueIds.add(id);
    }
  }

  return { answeredIds, dueIds };
}

/** 取得瀏覽器的 localStorage；SSR 或被封鎖時回傳 undefined。 */
export function getBrowserStorage(): StorageLike | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}
