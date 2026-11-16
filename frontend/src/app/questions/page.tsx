import { Suspense } from "react";

import { QuestionSearchBoard } from "@/components/QuestionSearchBoard";
import { T } from "@/i18n/T";
import { getAllCategories, getAllQuestions } from "@/lib/content/loadContent";
import { toListItems } from "@/lib/content/toListItems";

/** 題目大全：全站題目搜尋與篩選（靜態匯出，篩選在瀏覽器端完成）。 */
export default function QuestionsPage() {
  const questions = toListItems(getAllQuestions());
  const categories = getAllCategories();

  return (
    <div id="questionsPage" className="max-width-content">
      <header>
        <p className="hud-eyebrow">
          <T k="questions.eyebrow" />
        </p>
        <h1 className="page-title">
          <T k="questions.title" />
          <span className="page-title__sub font-display">
            {questions.length} units indexed
          </span>
        </h1>
      </header>
      <Suspense fallback={null}>
        <QuestionSearchBoard questions={questions} categories={categories} />
      </Suspense>
    </div>
  );
}
