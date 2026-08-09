import Title from "antd/es/typography/Title";
import { Suspense } from "react";

import { QuestionSearchBoard } from "@/components/QuestionSearchBoard";
import { getAllCategories, getAllQuestions } from "@/lib/content/loadContent";
import { toListItems } from "@/lib/content/toListItems";

/** 題目大全：全站題目搜尋與篩選（靜態匯出，篩選在瀏覽器端完成）。 */
export default function QuestionsPage() {
  const questions = toListItems(getAllQuestions());
  const categories = getAllCategories();

  return (
    <div id="questionsPage" className="max-width-content">
      <Title level={3}>題目大全</Title>
      <Suspense fallback={null}>
        <QuestionSearchBoard questions={questions} categories={categories} />
      </Suspense>
    </div>
  );
}
