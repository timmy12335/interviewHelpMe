import Divider from "antd/es/divider";
import Flex from "antd/es/flex";
import Title from "antd/es/typography/Title";
import Link from "next/link";

import { CategoryBankList } from "@/components/CategoryBankList";
import { QuestionList } from "@/components/QuestionList";
import { getAllCategories, getAllQuestions } from "@/lib/content/loadContent";
import { toListItems } from "@/lib/content/toListItems";

const HOME_BANK_LIMIT = 8;
const HOME_QUESTION_LIMIT = 12;

/** 主頁：精選題庫與最新題目。 */
export default function HomePage() {
  const categories = getAllCategories().slice(0, HOME_BANK_LIMIT);
  const questions = toListItems(getAllQuestions()).slice(0, HOME_QUESTION_LIMIT);

  return (
    <div id="homePage" className="max-width-content">
      <Flex justify="space-between" align="center">
        <Title level={3}>精選題庫</Title>
        <Link href="/categories/">查看更多</Link>
      </Flex>
      <CategoryBankList categories={categories} />
      <Divider />
      <Flex justify="space-between" align="center">
        <Title level={3}>最新題目</Title>
        <Link href="/questions/">查看更多</Link>
      </Flex>
      <QuestionList questions={questions} title="題目列表" />
    </div>
  );
}
