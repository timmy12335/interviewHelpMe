"use client";

import { useEffect, useId, useState } from "react";

import { DifficultyBadge } from "@/components/DifficultyBadge";
import { MdViewer } from "@/components/MdViewer";
import { TagList } from "@/components/TagList";
import { usePersistentFlag } from "@/hooks/usePersistentFlag";
import { notifyProgressChanged } from "@/hooks/useProgress";
import { isTypingTarget } from "@/lib/keyboard";
import { DETAIL_OPEN_KEY, REF_COLLAPSED_KEY } from "@/lib/uiPrefs";
import { withBasePath } from "@/lib/paths";
import {
  REVIEW_AFTER_DAYS,
  answerAtKey,
  getBrowserStorage,
  isDueForReview,
  readDraft,
  saveDraft,
} from "@/lib/progress";
import type { FollowUp, Question } from "@/types/question";

import "./index.css";

/** 從 `[[002-foo.md]]` 或 `../ai-llm/022-bar.md` 推出站內題目連結。 */
function relatedHref(raw: string, categorySlug: string): string | null {
  const wiki = raw.match(/\[\[([^\]]+)\]\]/);
  const target = (wiki ? wiki[1] : raw).trim();
  if (!target) {
    return null;
  }

  const fileName = target.split("/").pop() ?? target;
  const slug = fileName.replace(/\.md$/i, "").replace(/^\d+-/, "");
  if (target.includes("../")) {
    const parts = target.replace(/\.md$/i, "").split("/");
    const otherCategory = parts.find((part) => part !== ".." && part !== ".");
    const otherSlug = (parts[parts.length - 1] ?? "").replace(/^\d+-/, "");
    if (otherCategory && otherSlug && otherCategory !== otherSlug) {
      return withBasePath(`/category/${otherCategory}/question/${otherSlug}/`);
    }
  }

  return withBasePath(`/category/${categorySlug}/question/${slug}/`);
}

function relatedLabel(raw: string): string {
  const stripped = raw.replace(/^\[\[|\]\]$/g, "").trim();
  return (stripped.split("/").pop() ?? stripped)
    .replace(/\.md$/i, "")
    .replace(/^\d+-/, "")
    .replace(/-/g, " ");
}

function AnswerSection({
  title,
  value,
  variant = "default",
}: {
  title: string;
  value?: string;
  variant?: "default" | "core" | "tip";
}) {
  if (!value) {
    return null;
  }

  return (
    <section className={`answer-block answer-block--${variant}`}>
      <h3 className="answer-block__title">{title}</h3>
      <MdViewer value={value} />
    </section>
  );
}

/**
 * 可收合的答案分區。詳細解析預設收起，避免一解鎖就是一整片文字。
 */
function CollapsibleAnswerSection({
  title,
  value,
  storageKey,
  hint,
}: {
  title: string;
  value?: string;
  storageKey: string;
  hint: string;
}) {
  const [open, setOpen] = usePersistentFlag(storageKey);
  const panelId = useId();

  if (!value) {
    return null;
  }

  return (
    <section className={`answer-fold${open ? " is-open" : ""}`}>
      <button
        type="button"
        className="answer-fold__trigger"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen()}
      >
        <span className="answer-fold__caret" aria-hidden>
          ▸
        </span>
        <span className="answer-fold__title">{title}</span>
        <span className="answer-fold__hint">{open ? "收起" : hint}</span>
      </button>
      {open ? (
        <div className="answer-fold__panel" id={panelId}>
          <MdViewer value={value} />
        </div>
      ) : null}
    </section>
  );
}

/** 面試回答方式獨立成總結卡，放在最後、樣式與前面的解析明顯區隔。 */
function AnswerSummary({ value }: { value?: string }) {
  if (!value) {
    return null;
  }

  return (
    <section className="answer-summary">
      <h3 className="answer-summary__title">
        <span className="answer-summary__badge">總結</span>
        面試這樣答
      </h3>
      <MdViewer value={value} />
    </section>
  );
}

function FollowUpItem({ followUp }: { followUp: FollowUp }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className={`followup${open ? " is-open" : ""}`}>
      <button
        type="button"
        className="followup__trigger"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="followup__caret" aria-hidden>
          ▸
        </span>
        <span className="followup__text">{followUp.title}</span>
      </button>
      {open ? (
        <div className="followup__panel" id={panelId}>
          <AnswerSection title="核心答案" value={followUp.coreAnswer} variant="core" />
          <AnswerSection title="詳細解析" value={followUp.detail} />
          <AnswerSummary value={followUp.interviewTip} />
        </div>
      ) : null}
    </div>
  );
}

/**
 * 題目練習卡：答案預設封存，先作答再解鎖核心答案與詳細解析。
 */
export function PracticeQuestion({ question }: { question: Question }) {
  const [draft, setDraft] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);
  const [dueForReview, setDueForReview] = useState(false);
  const [refCollapsed, setRefCollapsed] = usePersistentFlag(REF_COLLAPSED_KEY);
  const inputId = useId();
  const answerPanelId = useId();

  useEffect(() => {
    setShowAnswer(false);

    const storage = getBrowserStorage();
    setDraft(readDraft(storage, question.id));

    const rawAt = storage?.getItem(answerAtKey(question.id));
    setDueForReview(
      isDueForReview(rawAt ? Number(rawAt) : undefined, Date.now()),
    );
  }, [question.id]);

  // A 鍵解鎖／收合答案。刻意不綁空白鍵：那會奪走鍵盤捲動頁面的能力。
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      if (isTypingTarget(event.target) || event.key.toLowerCase() !== "a") {
        return;
      }

      event.preventDefault();
      setShowAnswer((value) => !value);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const hasStructured =
    Boolean(question.coreAnswer) ||
    Boolean(question.detail) ||
    Boolean(question.interviewTip);

  return (
    <article className={`practice${refCollapsed ? " is-ref-collapsed" : ""}`}>
      <button
        type="button"
        className="practice__ref-toggle"
        onClick={() => setRefCollapsed()}
        aria-expanded={!refCollapsed}
        title={refCollapsed ? "展開答案欄" : "收合答案欄"}
      >
        <span aria-hidden>{refCollapsed ? "«" : "»"}</span>
        <span className="sr-only">
          {refCollapsed ? "展開答案欄" : "收合答案欄"}
        </span>
      </button>

      <div className="practice__col">
      <div className="practice__card hud-panel hud-brackets">
        <p className="hud-eyebrow">Unit // 題目</p>
        <h1 className="practice__title">{question.title}</h1>
        <div className="practice__meta">
          <DifficultyBadge difficulty={question.difficulty} />
          <TagList tags={question.tags} />
        </div>

        <div className="practice__question">
          <MdViewer value={question.content} />
        </div>

        <div className="practice__compose">
          {dueForReview ? (
            <p className="practice__review-note" role="status">
              這題超過 {REVIEW_AFTER_DAYS} 天沒回來看了。先別看舊草稿，重寫一次再比對。
            </p>
          ) : null}
          <label className="practice__label" htmlFor={inputId}>
            你的作答（先想再看答案）
          </label>
          <textarea
            id={inputId}
            className="practice__input"
            rows={5}
            placeholder="在這裡寫下你的版本…"
            value={draft}
            onChange={(event) => {
              const value = event.target.value;
              setDraft(value);
              saveDraft(getBrowserStorage(), question.id, value, Date.now());
              setDueForReview(false);
              notifyProgressChanged();
            }}
          />
          <button
            type="button"
            className="practice__reveal"
            aria-expanded={showAnswer}
            aria-controls={answerPanelId}
            onClick={() => setShowAnswer((value) => !value)}
          >
            <span className="practice__reveal-icon" aria-hidden>
              {showAnswer ? "◈" : "◇"}
            </span>
            {showAnswer ? "隱藏核心答案與詳細解析" : "顯示核心答案與詳細解析"}
          </button>
        </div>
      </div>
      </div>

      <div className="practice__col practice__col--ref">
      {showAnswer ? (
        <div className="practice__card hud-panel hud-brackets is-decrypted" id={answerPanelId}>
          <p className="hud-eyebrow">Decrypted // 推薦答案</p>
          {hasStructured ? (
            <>
              <AnswerSection
                title="核心答案"
                value={question.coreAnswer}
                variant="core"
              />
              <CollapsibleAnswerSection
                title="詳細解析"
                value={question.detail}
                storageKey={DETAIL_OPEN_KEY}
                hint="展開細節"
              />
              <AnswerSummary value={question.interviewTip} />
            </>
          ) : (
            <AnswerSection title="核心答案" value={question.answer} variant="core" />
          )}
        </div>
      ) : (
        <div className="practice__card hud-panel hud-brackets practice__locked">
          <p className="hud-eyebrow">Sealed // 答案封存中</p>
          <p className="practice__locked-text">
            先在左邊寫下你的版本，再解鎖對照。解鎖後答案會固定在這一欄，
            捲動題目時仍看得到，不必來回滑動比對。
          </p>
          <button
            type="button"
            className="practice__reveal"
            onClick={() => setShowAnswer(true)}
          >
            <span className="practice__reveal-icon" aria-hidden>
              ◇
            </span>
            解鎖對照
          </button>
        </div>
      )}

      {question.followUps && question.followUps.length > 0 ? (
        <div className="practice__card hud-panel hud-brackets">
          <p className="hud-eyebrow">Follow-ups // 常見追問</p>
          <div className="followup-list">
            {question.followUps.map((followUp) => (
              <FollowUpItem key={followUp.title} followUp={followUp} />
            ))}
          </div>
        </div>
      ) : null}

      {question.related && question.related.length > 0 ? (
        <div className="practice__card hud-panel hud-brackets">
          <p className="hud-eyebrow">Linked // 相關題目</p>
          <div className="related-row">
            {question.related.map((item) => {
              const href = relatedHref(item, question.categorySlug);
              const label = relatedLabel(item);

              return href ? (
                <a className="related-pill" href={href} key={item}>
                  {label}
                </a>
              ) : (
                <span className="related-pill is-plain" key={item}>
                  {label}
                </span>
              );
            })}
          </div>
        </div>
      ) : null}
      </div>
    </article>
  );
}
