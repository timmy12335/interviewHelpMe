/** 全站底部欄。 */
export function GlobalFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="global-footer">
      <div>© {currentYear} InterviewHelpMe 面試題練習</div>
      <div>題庫內容來自本專案 content/ 目錄</div>
    </div>
  );
}
