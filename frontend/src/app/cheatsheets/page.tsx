import { CheatSheetList } from "@/components/CheatSheetList";
import { cheatSheets } from "@/data/cheatsheets";
import { T } from "@/i18n/T";

/** 速查表列表頁。 */
export default function CheatSheetsPage() {
  return (
    <div id="cheatSheetsPage" className="max-width-content">
      <header>
        <p className="hud-eyebrow">
          <T k="cheatsheets.eyebrow" />
        </p>
        <h1 className="page-title">
          <T k="cheatsheets.title" />
          <span className="page-title__sub font-display">{cheatSheets.length} sheets</span>
        </h1>
      </header>
      <CheatSheetList sheets={cheatSheets} />
    </div>
  );
}
