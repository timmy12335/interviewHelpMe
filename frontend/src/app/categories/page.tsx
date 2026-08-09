import { CategoryBankList } from "@/components/CategoryBankList";
import { SiteProgressMap } from "@/components/SiteProgressMap";
import { getModuleSummaries } from "@/lib/content/modules";

/** 題庫大全：列出全部分類、題數與練習進度。 */
export default function CategoriesPage() {
  const modules = getModuleSummaries();
  const total = modules.reduce((sum, module) => sum + module.units.length, 0);

  return (
    <div id="categoriesPage" className="max-width-content">
      <header>
        <p className="hud-eyebrow">Modules // 題庫大全</p>
        <h1 className="page-title">
          全部題庫
          <span className="page-title__sub font-display">
            {modules.length} modules / {total} units
          </span>
        </h1>
      </header>
      <SiteProgressMap modules={modules} />
      <div className="section-head">
        <p className="hud-eyebrow">Modules // 題庫卡</p>
      </div>
      <CategoryBankList modules={modules} />
    </div>
  );
}
