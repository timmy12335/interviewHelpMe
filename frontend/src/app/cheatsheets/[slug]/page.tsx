import { notFound } from "next/navigation";

import { CheatSheetView } from "@/components/CheatSheet";
import { CheatSheetRelated } from "@/components/CheatSheetRelated";
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
      <CheatSheetRelated relatedQuestions={sheet.relatedQuestions} />
    </div>
  );
}
