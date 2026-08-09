"use client";

import { useEffect, useId, useState } from "react";

import { DifficultyBadge } from "@/components/DifficultyBadge";
import { MdViewer } from "@/components/MdViewer";
import { TagList } from "@/components/TagList";
import { withBasePath } from "@/lib/paths";
import type { FollowUp, Question } from "@/types/question";

import "./index.css";

function answerStorageKey(questionId: string) {
  return `ihm:answer-${questionId}`;
}

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
          <AnswerSection
            title="面試回答方式"
            value={followUp.interviewTip}
            variant="tip"
          />
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
  const inputId = useId();
  const answerPanelId = useId();

  useEffect(() => {
    setShowAnswer(false);
    try {
      setDraft(localStorage.getItem(answerStorageKey(question.id)) ?? "");
    } catch {
      setDraft("");
    }
  }, [question.id]);

  const hasStructured =
    Boolean(question.coreAnswer) ||
    Boolean(question.detail) ||
    Boolean(question.interviewTip);

  return (
    <article className="practice">
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
              try {
                localStorage.setItem(answerStorageKey(question.id), value);
              } catch {
                // ignore quota / private mode
              }
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

      {showAnswer ? (
        <div className="practice__card hud-panel hud-brackets is-decrypted" id={answerPanelId}>
          <p className="hud-eyebrow">Decrypted // 推薦答案</p>
          {hasStructured ? (
            <>
              <AnswerSection title="核心答案" value={question.coreAnswer} variant="core" />
              <AnswerSection title="詳細解析" value={question.detail} />
              <AnswerSection
                title="面試回答方式"
                value={question.interviewTip}
                variant="tip"
              />
            </>
          ) : (
            <AnswerSection title="核心答案" value={question.answer} variant="core" />
          )}
        </div>
      ) : null}

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
    </article>
  );
}
