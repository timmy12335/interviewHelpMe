# 前端面試題

InterviewHelpMe 第 15 個內容類別，共 24 題，取材自 [tech-interview-handbook](https://github.com/yangshun/tech-interview-handbook) 的前端面試章節，涵蓋 JavaScript 語言核心、瀏覽器機制、網路與安全、CSS 版面，以及 React 的渲染模型。

## 這個類別的設計

前端面試題最容易變成**名詞解釋**——講得出 Event Loop 的定義、背得出 CSS 優先權的計算方式，但答不出「所以我什麼時候會用到這件事」。所以這裡每一題都盡量收在一個**可以拿來做決定的結論**上：虛擬 DOM 那題的重點是「它不一定比較快，它換的是可維護性」，SSR 那題的重點是「它改善的是內容可見時間，不是互動可用時間」。

有幾題刻意**先糾正前提**再回答。問「虛擬 DOM 為什麼比較快」，答案是它通常更慢；問「同源政策擋什麼」，答案是它擋的是讀取回應而不是送出請求。這些反直覺的更正是實際面試中最能拉開差距的地方，也是純背誦練不出來的。

編號依主題分組：001 到 009 是 JavaScript 語言核心（Event Loop、閉包、this、原型、型別轉換、非同步、拷貝），010 到 016 是瀏覽器與網路（渲染流程、載入流程、快取、CORS、儲存、安全、效能），017 到 020 是 CSS 與渲染模式，021 到 024 是 React 的渲染模型與狀態管理。

## 檔案格式

與其他類別相同：每題一個 `NNN-slug.md`，frontmatter 對應 [schema.sql](../../backend/sql/schema.sql) 的 `question` 表（`category: frontend`，`source: original`）。正文含：題目、核心答案、詳細解析、面試回答方式、講稿、常見追問（3 題）、相關。

新增題目請用 `node scripts/new-question.mjs frontend <slug> "<標題>"` 產生骨架。寫完跑 `npm test` 驗證結構與交叉連結，跑 `node scripts/check-scripts.mjs frontend` 驗證講稿品質。

## 題目清單

| # | 題目 | 難度 |
|---|------|------|
| 001 | Event Loop：微任務與巨任務的執行順序 | hard |
| 002 | 閉包與作用域鏈：它到底解決什麼問題 | medium |
| 003 | this 的綁定規則與箭頭函式的差異 | medium |
| 004 | 原型鏈與繼承：class 只是語法糖嗎 | medium |
| 005 | == 與 === 的差別，以及型別轉換的規則 | easy |
| 006 | var、let、const 的差異與暫時死區 | easy |
| 007 | Promise 與 async/await 的錯誤處理 | medium |
| 008 | 防抖與節流：差別、實作與選用場景 | medium |
| 009 | 深拷貝與淺拷貝：什麼時候真的需要深拷貝 | medium |
| 010 | 瀏覽器渲染流程：重排與重繪 | hard |
| 011 | 從輸入 URL 到頁面顯示發生了什麼 | hard |
| 012 | HTTP 快取：強快取、協商快取與版本控制 | medium |
| 013 | 跨域與 CORS：預檢請求與憑證的處理 | medium |
| 014 | Cookie、localStorage 與 sessionStorage 怎麼選 | medium |
| 015 | XSS 與 CSRF：攻擊原理與防禦 | hard |
| 016 | 前端效能優化與 Core Web Vitals | medium |
| 017 | CSS 盒模型與 BFC：邊距合併與浮動塌陷 | medium |
| 018 | Flexbox 與 Grid 的取捨 | medium |
| 019 | CSS 選擇器優先權與層疊規則 | easy |
| 020 | CSR、SSR、SSG 與 ISR 怎麼選 | medium |
| 021 | 虛擬 DOM 與 diff：它真的比較快嗎 | medium |
| 022 | React 的重新渲染時機與 reconciliation | medium |
| 023 | Hooks 的閉包陷阱與依賴陣列 | hard |
| 024 | 狀態管理的分層：伺服器狀態、客戶端狀態與 URL 狀態 | medium |

難度分布：easy 3、medium 16、hard 5。
