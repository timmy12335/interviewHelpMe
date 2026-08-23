"use client";

import { useEffect, useId, useState } from "react";

import { DifficultyBadge } from "@/components/DifficultyBadge";
import { MdViewer } from "@/components/MdViewer";
import { TagList } from "@/components/TagList";
import { usePersistentFlag } from "@/hooks/usePersistentFlag";
import { notifyProgressChanged } from "@/hooks/useProgress";
import { questionHref } from "@/lib/content/resolveLinks";
import { fallbackLabel, parseWikiTarget } from "@/lib/content/wikiLinks";
import { readMinutes, speakSeconds } from "@/lib/content/readingTime";
import { isTypingTarget } from "@/lib/keyboard";
import { DETAIL_OPEN_KEY, REF_COLLAPSED_KEY } from "@/lib/uiPrefs";
import {
  REVIEW_AFTER_DAYS,
  answerAtKey,
  getBrowserStorage,
  isDueForReview,
  readDraft,
  saveDraft,
} from "@/lib/progress";
import type { DetailBlock, FollowUp, Question } from "@/types/question";

import "./index.css";

/**
 * 「相關」清單的連結。
 * 內文的 `[[...]]` 在建置時就已經換成 Markdown 連結，這裡只處理清單項目，
 * 且共用同一套解析規則，避免兩邊的路徑推導長期漂移。
 */
function relatedLink(
  raw: string,
  categorySlug: string,
): { href: string; label: string } | null {
  const target = parseWikiTarget(raw, categorySlug);
  if (!target) {
    return null;
  }

  return {
    href: questionHref(target),
    label: fallbackLabel(target),
  };
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

/** 把秒數說成人話：90 秒以內講秒，之後講分鐘。 */
function formatSpoken(seconds: number): string {
  if (seconds <= 90) {
    return `約 ${seconds} 秒`;
  }

  return `約 ${Math.round(seconds / 60)} 分鐘`;
}

/**
 * 解鎖後先給一列「這裡面有什麼、各要花多久」。
 * 知道成本才決定要不要點開，比直接被一整片文字淹沒好。
 */
function AnswerGuide({ question }: { question: Question }) {
  const blocks = question.detailBlocks?.filter((block) => block.heading) ?? [];
  const detailMinutes = readMinutes(question.detail);
  const scriptSeconds = speakSeconds(question.script);

  const chips = [
    question.coreAnswer
      ? { key: "core", label: "核心答案", note: `${readMinutes(question.coreAnswer)} 分鐘` }
      : null,
    blocks.length > 0
      ? { key: "detail", label: "詳細解析", note: `${blocks.length} 段 · ${detailMinutes} 分鐘` }
      : null,
    question.script
      ? { key: "script", label: "講稿", note: formatSpoken(scriptSeconds) }
      : null,
    question.followUps?.length
      ? { key: "followups", label: "常見追問", note: `${question.followUps.length} 題` }
      : null,
  ].filter((chip): chip is { key: string; label: string; note: string } => Boolean(chip));

  if (chips.length === 0) {
    return null;
  }

  return (
    <ul className="answer-guide">
      {chips.map((chip) => (
        <li className="answer-guide__chip" key={chip.key}>
          <span className="answer-guide__label">{chip.label}</span>
          <span className="answer-guide__note">{chip.note}</span>
        </li>
      ))}
    </ul>
  );
}

/** 沒有小標的段落是開場白，直接攤開；收起來只會讓人少讀一段脈絡。 */
function DetailIntro({ body }: { body: string }) {
  return (
    <div className="detail-blocks__intro">
      <MdViewer value={body} />
    </div>
  );
}

function DetailBlockItem({
  block,
  open,
  onToggle,
}: {
  block: DetailBlock;
  open: boolean;
  onToggle: () => void;
}) {
  const panelId = useId();

  return (
    <div className={`detail-block${open ? " is-open" : ""}`}>
      <button
        type="button"
        className="detail-block__trigger"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <span className="detail-block__caret" aria-hidden>
          ▸
        </span>
        <span className="detail-block__heading">{block.heading}</span>
      </button>
      {open ? (
        <div className="detail-block__panel" id={panelId}>
          <MdViewer value={block.body} />
        </div>
      ) : null}
    </div>
  );
}

/**
 * 詳細解析改成「小標全部看得到、內文預設收起」。
 * 內容裡四分之三的段落本來就寫成 `**小標**：內文`，把這個結構攤出來，
 * 小標列本身就是一份目錄，能先掃再決定讀哪一段。
 */
function DetailBlockList({
  blocks,
  detail,
}: {
  blocks?: DetailBlock[];
  detail?: string;
}) {
  const [expandAll, setExpandAll] = usePersistentFlag(DETAIL_OPEN_KEY);
  const [open, setOpen] = useState<ReadonlySet<number>>(() => new Set<number>());
  const headingCount = blocks?.filter((block) => block.heading).length ?? 0;

  // 「全部展開／收起」是唯一會被記住的偏好；個別小塊的開合只活在這次瀏覽。
  useEffect(() => {
    setOpen(
      expandAll ? new Set((blocks ?? []).map((_, index) => index)) : new Set<number>(),
    );
  }, [expandAll, blocks]);

  if (!blocks || blocks.length === 0) {
    return null;
  }

  // 整段都沒有小標時退回單一收合區，維持舊行為。
  if (headingCount === 0) {
    return (
      <section className="detail-blocks">
        <div className="detail-blocks__head">
          <h3 className="detail-blocks__title">詳細解析</h3>
          <span className="detail-blocks__meta">{readMinutes(detail)} 分鐘</span>
        </div>
        <DetailIntro body={blocks[0].body} />
      </section>
    );
  }

  const toggle = (index: number) => {
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <section className="detail-blocks">
      <div className="detail-blocks__head">
        {/* 段數與時間由上方的 AnswerGuide 統一交代，這裡不重複 */}
        <h3 className="detail-blocks__title">詳細解析</h3>
        <button
          type="button"
          className="detail-blocks__toggle-all"
          onClick={() => setExpandAll(!expandAll)}
        >
          {expandAll ? "全部收起" : "全部展開"}
        </button>
      </div>

      <div className="detail-blocks__list">
        {blocks.map((block, index) =>
          block.heading ? (
            <DetailBlockItem
              key={block.heading}
              block={block}
              open={open.has(index)}
              onToggle={() => toggle(index)}
            />
          ) : (
            <DetailIntro body={block.body} key={`intro-${index}`} />
          ),
        )}
      </div>
    </section>
  );
}

/**
 * 講稿：可以照著念的逐字稿。
 * 排版刻意和解析區分開——字大、行距寬、每段標號，
 * 目的是「眼睛跟得上嘴巴」，而不是拿來讀懂內容。
 */
function AnswerScript({ value }: { value?: string }) {
  if (!value) {
    return null;
  }

  const seconds = speakSeconds(value);

  return (
    <section className="answer-script">
      <h3 className="answer-script__title">
        <span className="answer-script__badge">講稿</span>
        照著這樣講
      </h3>
      <p className="answer-script__meta">
        {formatSpoken(seconds)} · 每段換一口氣
      </p>
      <div className="answer-script__body">
        <MdViewer value={value} />
      </div>
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
    Boolean(question.interviewTip) ||
    Boolean(question.script);

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
          <AnswerGuide question={question} />
          {hasStructured ? (
            <>
              <AnswerSection
                title="核心答案"
                value={question.coreAnswer}
                variant="core"
              />
              <DetailBlockList
                blocks={question.detailBlocks}
                detail={question.detail}
              />
              <AnswerSummary value={question.interviewTip} />
              <AnswerScript value={question.script} />
            </>
          ) : (
            <AnswerSection title="核心答案" value={question.answer} variant="core" />
          )}
        </div>
      ) : (
        <div className="practice__card hud-panel hud-brackets practice__locked">
          <p className="hud-eyebrow">Sealed // 答案封存中</p>
          {/*
            這裡刻意不放第二顆解鎖按鈕：兩顆按鈕做同一件事，但只有左邊那顆
            能再次收合，容易讓人以為解鎖後就收不回去了。
          */}
          <p className="practice__locked-text">
            先在左邊寫下你的版本，再用左欄的
            <b>「顯示核心答案與詳細解析」</b>
            解鎖對照。解鎖後答案會固定在這一欄，捲動題目時仍看得到，不必來回滑動。
          </p>
          <p className="practice__locked-hint">
            也可以直接按 <kbd>A</kbd> 解鎖或收合。
          </p>
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
              const link = relatedLink(item, question.categorySlug);

              return link ? (
                <a className="related-pill" href={link.href} key={item}>
                  {link.label}
                </a>
              ) : (
                <span className="related-pill is-plain" key={item}>
                  {item}
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
