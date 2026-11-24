# 場景設計面試題（中英對照）

InterviewHelpMe 第 20 個內容類別，共 12 題。也是第一個**每題都附英文譯本**的類別：題目頁上方有「中文 / English」切換，選擇會記在瀏覽器裡。

## 這個類別的定位

選題方向參考 [JAVA大神（javadashen.com）](https://javadashen.com/) 的「場景設計題」模組，挑出本站其他類別還沒有涵蓋的業務場景。內容是自行撰寫的，沒有複製原文。

[系統設計](../system-design/README.md) 類別處理的是「從零設計一個服務」；這個類別處理的是**一個具體的業務需求或線上事故，你會怎麼落地**：逾時取消、扣庫存、拆紅包、掃碼登入、簡訊被刷、加密欄位查詢、資料遷移。回答時面試官要看的不是架構圖，而是你知道哪裡會出錯、出錯了怎麼收斂。

已經在其他類別回答過的場景（秒殺、快取三兄弟、訊息積壓、冪等、分散式交易、Full GC 排查等）不重複收錄，各題的「相關」會連過去。

## 檔案格式

中文主檔與其他類別相同：每題一個 `NNN-slug.md`，frontmatter 對應 [schema.sql](../../backend/sql/schema.sql) 的 `question` 表（`category: scenario-design`）。

英文譯本是同目錄的 `NNN-slug.en.md`：

- frontmatter 只有 `title`。id、難度、標籤與「相關」都以中文主檔為準，避免兩邊漂移。
- 區塊標題依序是 `# Question`、`## Core Answer`、`## Detailed Explanation`、`## How to Answer`、`## Script`、`## Follow-up Questions`。
- 追問內的標籤是 `**Core answer**:`、`**Detailed explanation**:`、`**How to answer**:`。

`npm test` 會檢查每份譯本都有對應主檔、區塊齊全、追問數量與主檔一致。其他類別也可以照同樣的方式逐題補上譯本。

## 題目清單

| # | 題目 | 難度 |
|---|------|------|
| 001 | 訂單逾時未付款如何自動取消 | medium |
| 002 | 高並發下如何防止庫存超賣與少賣 | hard |
| 003 | 搶紅包的金額拆分演算法怎麼設計 | medium |
| 004 | 掃碼登入的實作原理 | medium |
| 005 | 如何統計億級使用者的在線狀態 | hard |
| 006 | 簡訊驗證碼介面被盜刷怎麼辦 | medium |
| 007 | 設計對外開放 API：簽章、防重放與權限 | hard |
| 008 | 加密儲存的手機號碼如何模糊查詢 | hard |
| 009 | 資料脫敏怎麼做：顯示、日誌與測試環境 | medium |
| 010 | 百億筆訂單號如何去重 | hard |
| 011 | 百萬筆資料的 Excel 匯入匯出怎麼做 | medium |
| 012 | 單表十億筆資料如何不停機遷移 | hard |
