import Avatar from "antd/es/avatar";
import Button from "antd/es/button";
import Card from "antd/es/card";
import Meta from "antd/es/card/Meta";
import Paragraph from "antd/es/typography/Paragraph";
import Title from "antd/es/typography/Title";
import { notFound } from "next/navigation";

import { QuestionList } from "@/components/QuestionList";
import {
  getAllCategories,
  getQuestionsByCategory,
} from "@/lib/content/loadContent";
import { toListItems } from "@/lib/content/toListItems";
import { withBasePath } from "@/lib/paths";

type CategoryPageProps = {
  params: { slug: string };
};

export function generateStaticParams() {
  return getAllCategories().map((category) => ({ slug: category.slug }));
}

/** 題庫詳情頁：題庫資訊、開始刷題入口與題目列表。 */
export default function CategoryPage({ params }: CategoryPageProps) {
  const category = getAllCategories().find((item) => item.slug === params.slug);

  if (!category) {
    notFound();
  }

  const questions = toListItems(getQuestionsByCategory(params.slug));
  const firstQuestionSlug = questions[0]?.slug;

  return (
    <div id="bankPage" className="max-width-content">
      <Card>
        <Meta
          avatar={
            <Avatar size={72} style={{ backgroundColor: "#1677ff" }}>
              {category.nameZh.slice(0, 1)}
            </Avatar>
          }
          title={
            <Title level={3} style={{ marginBottom: 0 }}>
              {category.nameZh}
            </Title>
          }
          description={
            <>
              <Paragraph type="secondary">
                共 {questions.length} 題。答案預設隱藏，先自己作答再展開比對。
              </Paragraph>
              <Button
                type="primary"
                shape="round"
                disabled={!firstQuestionSlug}
                href={
                  firstQuestionSlug
                    ? withBasePath(
                        `/category/${params.slug}/question/${firstQuestionSlug}/`,
                      )
                    : undefined
                }
              >
                開始刷題
              </Button>
            </>
          }
        />
      </Card>
      <div style={{ marginBottom: 16 }} />
      <QuestionList
        questions={questions}
        title={`題目列表（${questions.length}）`}
      />
    </div>
  );
}
