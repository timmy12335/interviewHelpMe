import { CheatSheetList } from "@/components/CheatSheetList";
import { cheatSheets } from "@/data/cheatsheets";

/** 速查表列表頁。 */
export default function CheatSheetsPage() {
  return (
    <div id="cheatSheetsPage" className="max-width-content">
      <header>
        <p className="hud-eyebrow">Cheat Sheets // 速查表</p>
        <h1 className="page-title">
          面試速查表
          <span className="page-title__sub font-display">{cheatSheets.length} sheets</span>
        </h1>
      </header>
      <CheatSheetList sheets={cheatSheets} />
    </div>
  );
}
