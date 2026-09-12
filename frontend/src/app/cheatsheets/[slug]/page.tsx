import Link from "next/link";
import { notFound } from "next/navigation";

import { CheatSheetView } from "@/components/CheatSheet";
import { cheatSheets, getCheatSheet } from "@/data/cheatsheets";

type CheatSheetPageProps = {
  params: { slug: string };
};

export function generateStaticParams() {
  return cheatSheets.map((sheet) => ({ slug: sheet.slug }));
}

/** 速查表詳情頁。 */
export default function CheatSheetPage({ params }: CheatSheetPageProps) {
  const sheet = getCheatSheet(params.slug);

  if (!sheet) {
    notFound();
  }

  return (
    <div id="cheatSheetPage" className="max-width-content">
      <CheatSheetView sheet={sheet} />

      {sheet.relatedQuestions && sheet.relatedQuestions.length > 0 ? (
        <section className="cs-related">
          <p className="hud-eyebrow">Related // 延伸題目</p>
          <ul>
            {sheet.relatedQuestions.map((ref) => {
              const [category, questionSlug] = ref.split("/");
              return (
                <li key={ref}>
                  <Link href={`/category/${category}/question/${questionSlug}`}>{ref}</Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
