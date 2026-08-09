"use client";

import { Button, Card, Collapse, Input, Space, Tag, Typography } from "antd";
import { useEffect, useId, useState } from "react";

import { DifficultyBadge } from "@/components/DifficultyBadge";
import { MdViewer } from "@/components/MdViewer";
import { TagList } from "@/components/TagList";
import { withBasePath } from "@/lib/paths";
import type { FollowUp, Question } from "@/types/question";

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

function AnswerSection({ title, value }: { title: string; value?: string }) {
  if (!value) {
    return null;
  }

  return (
    <section>
      <Typography.Title level={5} style={{ marginTop: 0 }}>
        {title}
      </Typography.Title>
      <MdViewer value={value} />
    </section>
  );
}

function followUpChildren(followUp: FollowUp) {
  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      <AnswerSection title="核心答案" value={followUp.coreAnswer} />
      <AnswerSection title="詳細解析" value={followUp.detail} />
      <AnswerSection title="面試回答方式" value={followUp.interviewTip} />
    </Space>
  );
}

/**
 * 題目練習卡：預設隱藏答案，先作答再展開核心答案與詳細解析。
 */
export function PracticeQuestion({ question }: { question: Question }) {
  const [draft, setDraft] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);
  const inputId = useId();

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
    <div className="question-card">
      <Card>
        <Typography.Title level={1} style={{ fontSize: 24, marginTop: 0 }}>
          {question.title}
        </Typography.Title>
        <Space size="small" wrap>
          <DifficultyBadge difficulty={question.difficulty} />
          <TagList tags={question.tags} />
        </Space>
        <div style={{ marginBottom: 16 }} />
        <MdViewer value={question.content} />
        <div style={{ marginBottom: 24 }} />
        <Typography.Text type="secondary">
          <label htmlFor={inputId}>你的作答（先想再看答案）</label>
        </Typography.Text>
        <Input.TextArea
          id={inputId}
          rows={4}
          placeholder="打字輸入你的回答…"
          style={{ marginTop: 8 }}
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
        <div style={{ marginBottom: 16 }} />
        <Button type="primary" onClick={() => setShowAnswer((value) => !value)}>
          {showAnswer ? "隱藏核心答案與詳細解析" : "顯示核心答案與詳細解析"}
        </Button>
      </Card>

      {showAnswer ? (
        <>
          <div style={{ marginBottom: 16 }} />
          <Card title="推薦答案">
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              {hasStructured ? (
                <>
                  <AnswerSection title="核心答案" value={question.coreAnswer} />
                  <AnswerSection title="詳細解析" value={question.detail} />
                  <AnswerSection
                    title="面試回答方式"
                    value={question.interviewTip}
                  />
                </>
              ) : (
                <AnswerSection title="核心答案" value={question.answer} />
              )}
            </Space>
          </Card>
        </>
      ) : null}

      {question.followUps && question.followUps.length > 0 ? (
        <>
          <div style={{ marginBottom: 16 }} />
          <Card title="常見追問">
            <Collapse
              items={question.followUps.map((followUp, index) => ({
                key: String(index),
                label: followUp.title,
                children: followUpChildren(followUp),
              }))}
            />
          </Card>
        </>
      ) : null}

      {question.related && question.related.length > 0 ? (
        <>
          <div style={{ marginBottom: 16 }} />
          <Card title="相關題目">
            <Space size="small" wrap>
              {question.related.map((item) => {
                const href = relatedHref(item, question.categorySlug);
                const label = relatedLabel(item);

                return href ? (
                  <a href={href} key={item}>
                    <Tag color="blue">{label}</Tag>
                  </a>
                ) : (
                  <Tag key={item}>{label}</Tag>
                );
              })}
            </Space>
          </Card>
        </>
      ) : null}
    </div>
  );
}
