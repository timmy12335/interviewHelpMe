"use client";

import { PracticeQuestion } from "@/components/PracticeQuestion";
import { usePersistentFlag } from "@/hooks/usePersistentFlag";
import { CONTENT_EN_KEY } from "@/lib/uiPrefs";
import type { Question } from "@/types/question";

import "./index.css";

/** 把英文譯本的欄位蓋到主檔上；id、難度、標籤、相關題目仍沿用主檔。 */
export function localizeQuestion(question: Question, english: boolean): Question {
  if (!english || !question.en) {
    return question;
  }

  return { ...question, ...question.en, en: undefined };
}

/**
 * 有英文譯本的題目，在練習卡上方多一組「中文 / English」切換。
 * 選擇記在本機，換到下一題時維持同一種語言；沒有譯本的題目完全不顯示切換。
 */
export function BilingualQuestion({ question }: { question: Question }) {
  const [showEnglish, setEnglish] = usePersistentFlag(CONTENT_EN_KEY, false);

  if (!question.en) {
    return <PracticeQuestion question={question} />;
  }

  return (
    <div className="bilingual">
      <div className="bilingual__switch" role="group" aria-label="題目語言 / Content language">
        <button
          type="button"
          className="bilingual__option"
          aria-pressed={!showEnglish}
          onClick={() => setEnglish(false)}
        >
          中文
        </button>
        <button
          type="button"
          className="bilingual__option"
          aria-pressed={showEnglish}
          onClick={() => setEnglish(true)}
        >
          English
        </button>
      </div>
      <div lang={showEnglish ? "en" : "zh-Hant"}>
        <PracticeQuestion question={localizeQuestion(question, showEnglish)} />
      </div>
    </div>
  );
}
