"use client";

import { Button, Space } from "antd";
import { useState } from "react";

import { QuestionCard } from "@/components/QuestionCard";
import type { Question } from "@/types/question";

export function PracticeQuestion({ question }: { question: Question }) {
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      <Button onClick={() => setShowAnswer((value) => !value)}>
        {showAnswer ? "隱藏推薦答案" : "顯示推薦答案"}
      </Button>
      <QuestionCard question={question} showAnswer={showAnswer} />
    </Space>
  );
}
