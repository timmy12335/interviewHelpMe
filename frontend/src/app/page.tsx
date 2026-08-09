import Link from "next/link";

import { CategoryBankList } from "@/components/CategoryBankList";
import { QuestionList } from "@/components/QuestionList";
import { getAllCategories, getAllQuestions } from "@/lib/content/loadContent";
import { toListItems } from "@/lib/content/toListItems";

const HOME_BANK_LIMIT = 8;
const HOME_QUESTION_LIMIT = 12;

/** 主頁：精選題庫與最新題目。 */
export default function HomePage() {
  const allCategories = getAllCategories();
  const allQuestions = toListItems(getAllQuestions());

  return (
    <div id="homePage" className="max-width-content">
      <header>
        <p className="hud-eyebrow">Interview Training Deck</p>
        <h1 className="page-title">
          面試題庫
          <span className="page-title__sub font-display">
            {allQuestions.length} units / {allCategories.length} modules
          </span>
        </h1>
        <p className="page-lede">
          答案預設封存。先在作答區寫下你的版本，再解鎖核心答案與詳細解析比對落差。
        </p>
      </header>

      <div className="section-head">
        <p className="hud-eyebrow">Modules // 精選題庫</p>
        <Link className="section-more" href="/categories/">
          全部題庫 →
        </Link>
      </div>
      <CategoryBankList categories={allCategories.slice(0, HOME_BANK_LIMIT)} />

      <div className="section-head">
        <p className="hud-eyebrow">Latest // 最新題目</p>
        <Link className="section-more" href="/questions/">
          全部題目 →
        </Link>
      </div>
      <QuestionList
        questions={allQuestions.slice(0, HOME_QUESTION_LIMIT)}
        title="題目列表"
      />
    </div>
  );
}
