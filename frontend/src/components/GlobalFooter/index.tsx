/** 全站底部欄。 */
export function GlobalFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="global-footer">
      <span>© {currentYear} InterviewHelpMe</span>
      <span className="global-footer__sep">{"//"}</span>
      <span>面試題練習</span>
      <span className="global-footer__sep">{"//"}</span>
      <span>content/ 題庫驅動</span>
    </footer>
  );
}
