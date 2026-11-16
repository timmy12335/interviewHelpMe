/**
 * 介面文字字典。只翻譯站台外框（導覽、標籤、按鈕、說明）；題目內容仍是繁體中文。
 *
 * 值裡的 `{name}` 會由 t() 代入；新增鍵時兩個語系都要補，型別會檢查缺漏。
 */

const zh = {
  // 導覽與外框
  "nav.home": "指南",
  "nav.categories": "題庫",
  "nav.questions": "題目",
  "nav.cheatsheets": "速查表",
  "nav.aria": "主要導覽",
  "categoryNav.aria": "題目分類",
  "categoryNav.count": "{name}（{count}）",
  "search.placeholder": "搜尋題目",
  "footer.tagline": "面試題練習",
  "footer.source": "content/ 題庫驅動",
  "toggle.lang": "EN",
  "toggle.langLabel": "切換為英文介面",
  "toggle.themeToLight": "切換為淺色主題",
  "toggle.themeToDark": "切換為深色主題",
  "contentNote": "題目內容目前只有繁體中文；切換語言只會改變介面文字。",

  // 共用
  "difficulty.easy": "簡單",
  "difficulty.medium": "中等",
  "difficulty.hard": "困難",
  "status.todo": "未作答",
  "status.done": "已作答",
  "status.due": "待複習",
  "unit.questions": "題",
  "cta.start": "開始練習 →",
  "loading": "載入中…",

  // 首頁（使用指南）
  "home.eyebrow": "Start Here // 使用指南",
  "home.title": "先看這裡，再開始刷題",
  "home.lede":
    "這是一個軟體工程師面試的練習站：八股文概念題、系統設計、行為面試，加上可以直接默寫的 LeetCode 解題範式。下面三步告訴你怎麼用，再挑一條適合你的路線開始。",
  "home.stats": "{questions} 題 · {modules} 個題庫",
  "home.ctaPrimary": "瀏覽全部題庫 →",
  "home.ctaSecondary": "搜尋題目",
  "home.howEyebrow": "How it works // 怎麼用",
  "home.step1.title": "選一個題庫",
  "home.step1.body":
    "題庫依主題分組（Java、資料庫、系統設計、LeetCode 範式…）。進入題庫會看到路線圖和標籤，按「開始練習」就從第一題開始。",
  "home.step2.title": "先自己作答",
  "home.step2.body":
    "答案預設封存。先在作答區寫下你的版本，草稿會自動存在這台裝置上，下次回來還在。",
  "home.step3.title": "解鎖答案、比對落差",
  "home.step3.body":
    "按「顯示核心答案與詳細解析」或鍵盤 A 解鎖。依序看核心答案、詳細解析、面試這樣答、可照念的講稿，再展開常見追問。",
  "home.step4.title": "回來複習",
  "home.step4.body":
    "寫過的題目會在學習地圖上標成已作答；超過 {days} 天沒回來看，會標成待複習，提醒你重寫一次。",
  "home.pathsEyebrow": "Where to start // 從哪裡開始",
  "home.pathsLede": "不知道先刷哪一個？依你準備的方向挑一條路線，照順序走就好。",
  "home.path.algo.title": "演算法與刷題",
  "home.path.algo.who": "準備 coding 面試、LeetCode 線上測驗",
  "home.path.algo.body":
    "先讀「演算法與資料結構」理解每個工具的訊號與正確性，再到「LeetCode 範式（Java）」練可以默寫的模板與對應題目。",
  "home.path.backend.title": "Java 後端八股文",
  "home.path.backend.who": "後端、Java 工程師職缺",
  "home.path.backend.body":
    "從語言基礎到框架、儲存與中介軟體，按這個順序累積；最後用實戰題庫模擬真實公司的考法。",
  "home.path.design.title": "系統設計與資深職缺",
  "home.path.design.who": "中高階、需要設計面試",
  "home.path.design.body":
    "先補後端工程的模式與取捨，再進系統設計；速查表適合面試前一晚快速回顧。",
  "home.path.ai.title": "AI 應用工程",
  "home.path.ai.who": "LLM 應用、Agent 相關職缺",
  "home.path.ai.body": "先建立大模型的基本詞彙，再看 Agent 的架構模式與落地時會踩的坑。",
  "home.path.soft.title": "行為面試",
  "home.path.soft.who": "每一場面試都會遇到",
  "home.path.soft.body": "準備 STAR 架構的故事與常見追問，面試前至少過一輪。",
  "home.tipsEyebrow": "Good to know // 小提示",
  "home.tip.keys": "題目頁快捷鍵：J 下一題、K 上一題、A 解鎖或收合答案。",
  "home.tip.local": "進度和草稿只存在這台裝置的瀏覽器，不需要登入，也不會上傳。",
  "home.tip.cheatsheets": "「速查表」把常考重點濃縮成一頁，適合面試前快速複習。",
  "home.tip.prefs": "右上角可以切換中文 / 英文介面，以及深色 / 淺色主題。",
  "home.progressEyebrow": "Your progress // 你的進度",
  "home.progressMore": "全部題庫 →",

  // 題庫大全
  "categories.eyebrow": "Modules // 題庫大全",
  "categories.title": "全部題庫",
  "categories.cardsEyebrow": "Modules // 題庫卡",

  // 題目大全
  "questions.eyebrow": "Index // 題目大全",
  "questions.title": "全部題目",
  "questions.listTitle": "題目列表（{count}）",
  "questions.searchPlaceholder": "搜尋題目標題或標籤",
  "questions.allModules": "全部題庫",
  "questions.allDifficulty": "全部難度",
  "questions.empty": "沒有符合條件的題目",

  // 速查表
  "cheatsheets.eyebrow": "Cheat Sheets // 速查表",
  "cheatsheets.title": "面試速查表",
  "cheatsheets.sections": "{count} 個分區",
  "cheatsheets.related": "Related // 延伸題目",

  // 題庫詳情
  "bank.eyebrow": "Module {index} // 題庫簡報",
  "bank.lede": "共 {count} 題。答案預設封存，先自己作答再解鎖比對。",
  "bank.unitsEyebrow": "Units // 題目列表",
  "bank.filtering": "篩選中：{tags}",
  "bank.listTitle": "題目列表（{count}）",
  "bank.emptyFiltered": "沒有符合所選標籤的題目",
  "list.title": "題目列表",
  "list.empty": "尚無題目",

  // 路線圖
  "roadmap.aria": "題庫路線圖",
  "roadmap.eyebrow": "Roadmap // 練習路線",
  "roadmap.lede":
    "依題庫順序排列。點節點直接跳到該題；實心代表已作答，外環閃爍代表超過 {days} 天沒回來看，建議複習。",
  "roadmap.svgAria": "共 {count} 題的練習順序",
  "roadmap.suffixDue": "（建議複習）",
  "roadmap.suffixDone": "（已作答）",

  // 標籤星圖
  "tags.aria": "題庫標籤",
  "tags.eyebrow": "Tags // 知識面",
  "tags.clear": "清除篩選（{count}）",
  "tags.lede": "字級代表該標籤在本題庫出現的次數。點擊標籤即可篩選右側題目。",
  "tags.more": "+{count} 展開全部",
  "tags.less": "收合",

  // 學習地圖
  "map.aria": "全站學習地圖",
  "map.eyebrow": "Progress // 學習地圖",
  "map.summary": "已作答 {answered} / {total} 題。進度只存在這台裝置。",
  "map.summaryDue": "已作答 {answered} / {total} 題，{due} 題待複習。進度只存在這台裝置。",
  "map.loading": "讀取本機進度中…",
  "map.cellAria": "{module} 第 {index} 題：{title}",
  "ring.label": "已作答 {done} 題，共 {total} 題",
  "ring.moduleLabel": "{module} 已作答 {done} 題，共 {total} 題",

  // 題目側欄
  "sider.expand": "展開題單",
  "sider.collapse": "收合題單",
  "sider.aria": "題庫題目導覽",
  "sider.listAria": "本題庫題目",
  "sider.answered": "已作答 {answered} / {total}",
  "sider.due": "{count} 題待複習",
  "sider.prev": "← 上一題",
  "sider.next": "下一題 →",
  "sider.keyNext": "下一題",
  "sider.keyPrev": "上一題",
  "sider.keyReveal": "解鎖答案",
  "sider.reviewFlag": "建議複習",

  // 練習卡
  "practice.expandRef": "展開答案欄",
  "practice.collapseRef": "收合答案欄",
  "practice.unitEyebrow": "Unit // 題目",
  "practice.reviewNote": "這題超過 {days} 天沒回來看了。先別看舊草稿，重寫一次再比對。",
  "practice.inputLabel": "你的作答（先想再看答案）",
  "practice.inputPlaceholder": "在這裡寫下你的版本…",
  "practice.hide": "隱藏核心答案與詳細解析",
  "practice.show": "顯示核心答案與詳細解析",
  "practice.decrypted": "Decrypted // 推薦答案",
  "practice.sealed": "Sealed // 答案封存中",
  "practice.lockedBefore": "先在左邊寫下你的版本，再用左欄的",
  "practice.lockedButton": "「顯示核心答案與詳細解析」",
  "practice.lockedAfter": "解鎖對照。解鎖後答案會固定在這一欄，捲動題目時仍看得到，不必來回滑動。",
  "practice.lockedHintBefore": "也可以直接按",
  "practice.lockedHintAfter": "解鎖或收合。",
  "practice.followUps": "Follow-ups // 常見追問",
  "practice.linked": "Linked // 相關題目",
  "practice.core": "核心答案",
  "practice.detail": "詳細解析",
  "practice.script": "講稿",
  "practice.followUpsLabel": "常見追問",
  "practice.minutes": "{count} 分鐘",
  "practice.detailNote": "{blocks} 段 · {minutes} 分鐘",
  "practice.followUpsNote": "{count} 題",
  "practice.secondsAbout": "約 {count} 秒",
  "practice.minutesAbout": "約 {count} 分鐘",
  "practice.collapseAll": "全部收起",
  "practice.expandAll": "全部展開",
  "practice.scriptTitle": "照著這樣講",
  "practice.scriptMeta": "{time} · 每段換一口氣",
  "practice.summaryBadge": "總結",
  "practice.summaryTitle": "面試這樣答",
  "practice.questionAria": "題目內容",
  "practice.recommended": "推薦答案",
};

export type MessageKey = keyof typeof zh;
export type Messages = Record<MessageKey, string>;

const en: Messages = {
  "nav.home": "Guide",
  "nav.categories": "Modules",
  "nav.questions": "Questions",
  "nav.cheatsheets": "Cheat Sheets",
  "nav.aria": "Main navigation",
  "categoryNav.aria": "Question modules",
  "categoryNav.count": "{name} ({count})",
  "search.placeholder": "Search questions",
  "footer.tagline": "Interview practice",
  "footer.source": "Powered by content/",
  "toggle.lang": "中文",
  "toggle.langLabel": "Switch to Chinese interface",
  "toggle.themeToLight": "Switch to light theme",
  "toggle.themeToDark": "Switch to dark theme",
  "contentNote":
    "Question content is currently in Traditional Chinese only; the language switch changes the interface text.",

  "difficulty.easy": "Easy",
  "difficulty.medium": "Medium",
  "difficulty.hard": "Hard",
  "status.todo": "Not started",
  "status.done": "Answered",
  "status.due": "Review due",
  "unit.questions": "Qs",
  "cta.start": "Start practicing →",
  "loading": "Loading…",

  "home.eyebrow": "Start Here // Guide",
  "home.title": "Read this first, then start practicing",
  "home.lede":
    "A practice site for software engineering interviews: core concept questions, system design, behavioral rounds, and LeetCode patterns you can write from memory. The steps below show how it works; then pick a path that fits you.",
  "home.stats": "{questions} questions · {modules} modules",
  "home.ctaPrimary": "Browse all modules →",
  "home.ctaSecondary": "Search questions",
  "home.howEyebrow": "How it works",
  "home.step1.title": "Pick a module",
  "home.step1.body":
    "Questions are grouped by topic (Java, databases, system design, LeetCode patterns…). A module page shows a roadmap and tags; press “Start practicing” to begin at question one.",
  "home.step2.title": "Answer it yourself first",
  "home.step2.body":
    "Answers are sealed by default. Write your version in the answer box; the draft is saved on this device automatically.",
  "home.step3.title": "Unlock and compare",
  "home.step3.body":
    "Press the reveal button or the A key. Read the core answer, the detailed walkthrough, how to say it in the interview, and a script you can read aloud, then open the follow-up questions.",
  "home.step4.title": "Come back to review",
  "home.step4.body":
    "Questions you answer are marked on the progress map. After {days} days without a visit they are flagged for review so you rewrite them once more.",
  "home.pathsEyebrow": "Where to start",
  "home.pathsLede": "Not sure what to study first? Pick the path that matches the role you are preparing for and follow it in order.",
  "home.path.algo.title": "Algorithms and coding",
  "home.path.algo.who": "Coding rounds and online assessments",
  "home.path.algo.body":
    "Read Algorithms & Data Structures to learn when each tool applies and why it is correct, then drill the memorizable templates and matching problems in LeetCode Patterns (Java).",
  "home.path.backend.title": "Java backend fundamentals",
  "home.path.backend.who": "Backend and Java engineering roles",
  "home.path.backend.body":
    "Build up from the language to frameworks, storage, and middleware in this order, then finish with the company-style real interview set.",
  "home.path.design.title": "System design and senior roles",
  "home.path.design.who": "Mid to senior levels with a design round",
  "home.path.design.body":
    "Cover backend engineering patterns and trade-offs first, then system design. The cheat sheets are good for the night before.",
  "home.path.ai.title": "AI application engineering",
  "home.path.ai.who": "LLM application and agent roles",
  "home.path.ai.body": "Learn the core vocabulary of large models first, then agent architecture patterns and the pitfalls of shipping them.",
  "home.path.soft.title": "Behavioral interviews",
  "home.path.soft.who": "Part of every interview loop",
  "home.path.soft.body": "Prepare STAR-style stories and the usual follow-ups; go through them at least once before any interview.",
  "home.tipsEyebrow": "Good to know",
  "home.tip.keys": "Shortcuts on question pages: J next, K previous, A reveal or hide the answer.",
  "home.tip.local": "Progress and drafts live only in this browser. No sign-in, nothing is uploaded.",
  "home.tip.cheatsheets": "Cheat Sheets condense the most-asked points into one page for a quick review.",
  "home.tip.prefs": "Use the top-right buttons to switch between Chinese and English, and between dark and light themes.",
  "home.progressEyebrow": "Your progress",
  "home.progressMore": "All modules →",

  "categories.eyebrow": "Modules // All",
  "categories.title": "All modules",
  "categories.cardsEyebrow": "Modules // Cards",

  "questions.eyebrow": "Index // All questions",
  "questions.title": "All questions",
  "questions.listTitle": "Questions ({count})",
  "questions.searchPlaceholder": "Search titles or tags",
  "questions.allModules": "All modules",
  "questions.allDifficulty": "All difficulties",
  "questions.empty": "No questions match these filters",

  "cheatsheets.eyebrow": "Cheat Sheets",
  "cheatsheets.title": "Interview cheat sheets",
  "cheatsheets.sections": "{count} sections",
  "cheatsheets.related": "Related // Questions",

  "bank.eyebrow": "Module {index} // Briefing",
  "bank.lede": "{count} questions. Answers are sealed: answer first, then unlock and compare.",
  "bank.unitsEyebrow": "Units // Questions",
  "bank.filtering": "Filtered by: {tags}",
  "bank.listTitle": "Questions ({count})",
  "bank.emptyFiltered": "No questions match the selected tags",
  "list.title": "Questions",
  "list.empty": "No questions yet",

  "roadmap.aria": "Module roadmap",
  "roadmap.eyebrow": "Roadmap",
  "roadmap.lede":
    "Ordered as in the module. Click a node to jump to that question; filled means answered, a pulsing ring means it has been over {days} days and is due for review.",
  "roadmap.svgAria": "Practice order of {count} questions",
  "roadmap.suffixDue": " (review due)",
  "roadmap.suffixDone": " (answered)",

  "tags.aria": "Module tags",
  "tags.eyebrow": "Tags // Topics",
  "tags.clear": "Clear filter ({count})",
  "tags.lede": "Font size shows how often a tag appears in this module. Click a tag to filter the list.",
  "tags.more": "+{count} show all",
  "tags.less": "Show less",

  "map.aria": "Site progress map",
  "map.eyebrow": "Progress map",
  "map.summary": "{answered} / {total} answered. Progress is stored on this device only.",
  "map.summaryDue": "{answered} / {total} answered, {due} due for review. Progress is stored on this device only.",
  "map.loading": "Loading local progress…",
  "map.cellAria": "{module} question {index}: {title}",
  "ring.label": "{done} of {total} answered",
  "ring.moduleLabel": "{module}: {done} of {total} answered",

  "sider.expand": "Expand question list",
  "sider.collapse": "Collapse question list",
  "sider.aria": "Module question navigation",
  "sider.listAria": "Questions in this module",
  "sider.answered": "Answered {answered} / {total}",
  "sider.due": "{count} due for review",
  "sider.prev": "← Previous",
  "sider.next": "Next →",
  "sider.keyNext": "next",
  "sider.keyPrev": "previous",
  "sider.keyReveal": "reveal answer",
  "sider.reviewFlag": "Review suggested",

  "practice.expandRef": "Expand answer column",
  "practice.collapseRef": "Collapse answer column",
  "practice.unitEyebrow": "Unit // Question",
  "practice.reviewNote":
    "It has been over {days} days since you visited this one. Skip the old draft, rewrite it, then compare.",
  "practice.inputLabel": "Your answer (think before you peek)",
  "practice.inputPlaceholder": "Write your version here…",
  "practice.hide": "Hide core answer and walkthrough",
  "practice.show": "Show core answer and walkthrough",
  "practice.decrypted": "Decrypted // Recommended answer",
  "practice.sealed": "Sealed // Answer locked",
  "practice.lockedBefore": "Write your version on the left first, then use",
  "practice.lockedButton": " “Show core answer and walkthrough” ",
  "practice.lockedAfter":
    "to unlock it. The answer stays pinned in this column while you scroll the question.",
  "practice.lockedHintBefore": "You can also press",
  "practice.lockedHintAfter": "to reveal or hide it.",
  "practice.followUps": "Follow-ups",
  "practice.linked": "Linked // Related questions",
  "practice.core": "Core answer",
  "practice.detail": "Walkthrough",
  "practice.script": "Script",
  "practice.followUpsLabel": "Follow-ups",
  "practice.minutes": "{count} min",
  "practice.detailNote": "{blocks} parts · {minutes} min",
  "practice.followUpsNote": "{count} questions",
  "practice.secondsAbout": "about {count} s",
  "practice.minutesAbout": "about {count} min",
  "practice.collapseAll": "Collapse all",
  "practice.expandAll": "Expand all",
  "practice.scriptTitle": "Say it like this",
  "practice.scriptMeta": "{time} · breathe between paragraphs",
  "practice.summaryBadge": "Summary",
  "practice.summaryTitle": "How to answer in the interview",
  "practice.questionAria": "Question content",
  "practice.recommended": "Recommended answer",
};

export type Locale = "zh" | "en";

export const LOCALES: Locale[] = ["zh", "en"];

export const messages: Record<Locale, Messages> = { zh, en };

export type MessageVars = Record<string, string | number>;

/** 依語系取字串並代入 `{name}` 變數；缺鍵時退回中文，避免畫面出現鍵名。 */
export function translate(
  locale: Locale,
  key: MessageKey,
  vars?: MessageVars,
): string {
  const template = messages[locale][key] ?? messages.zh[key] ?? key;
  if (!vars) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}
