# 設計模式面試題

InterviewHelpMe 第 18 個內容類別，共 24 題，取材自 [JavaGuide](https://github.com/Snailclimb/JavaGuide) 系統設計章節中的設計模式部分，涵蓋建立型、結構型、行為型三類，以及 SOLID 原則的落地判斷。

## 這個類別的設計

設計模式最容易被背成**類別圖與名詞**——講得出單例的五種寫法，卻答不出「什麼時候不該用」。所以這裡每一題都收在**取捨與判準**上，而不是實作步驟：策略那題的重點是「封閉的集合用 switch、開放的集合用策略」，訪問者那題的重點是「它選擇了表達式問題的哪一邊」。

首尾兩題刻意呼應。001 是「什麼時候不該用設計模式」，024 是「SOLID 怎麼落地」，兩題的共同主張是：**模式與原則都是針對特定變化方向的投資，變化沒發生就是純粹的成本**。中間 22 題的每個「不該用的情況」都在支撐這條主線。

另外有幾題刻意**指出模式在現代語言中已經簡化**——策略往往就是傳一個函式、迭代器已被語言吸收、模板方法可以用組合取代。這不是說模式過時了，而是**實作形式改變了、問題與取捨沒變**，這個區分在面試中很能拉開差距。

與其他類別重疊的部分用交叉連結處理：單例連到 [java-concurrency/022](../java-concurrency/022-double-checked-locking-singleton.md)（雙重檢查鎖）、代理連到 [java/014](../java/014-dynamic-proxy-jdk-vs-cglib.md)（JDK 與 CGLIB）、依賴反轉連到 [spring/001](../spring/001-ioc-di-concept.md)（IoC 與 DI），本類別只從設計判斷的角度切入，不重複那些題目的實作細節。

## 檔案格式

與其他類別相同：每題一個 `NNN-slug.md`，frontmatter 對應 [schema.sql](../../backend/sql/schema.sql) 的 `question` 表（`category: design-patterns`，`source: original`）。正文含：題目、核心答案、詳細解析、面試回答方式、講稿、常見追問（3 題）、相關。

新增題目請用 `node scripts/new-question.mjs design-patterns <slug> "<標題>"` 產生骨架。寫完跑 `npm test` 驗證結構與交叉連結，跑 `node scripts/check-scripts.mjs design-patterns` 驗證講稿品質。

## 題目清單

| # | 題目 | 難度 |
|---|------|------|
| 001 | 設計模式的價值與濫用：什麼時候不該用 | easy |
| 002 | 單例的實作方式與它真正的問題 | medium |
| 003 | 工廠方法與抽象工廠：差在哪、什麼時候用 | medium |
| 004 | 建造者模式：什麼時候值得 | medium |
| 005 | 原型模式與深淺拷貝 | easy |
| 006 | 轉接器模式：把不相容的介面接起來 | easy |
| 007 | 裝飾者模式：為什麼 Java IO 長那樣 | medium |
| 008 | 代理模式與 AOP 的關係 | medium |
| 009 | 外觀模式與服務層 | easy |
| 010 | 橋接模式與「組合優於繼承」 | medium |
| 011 | 組合模式：統一處理單一物件與樹狀結構 | medium |
| 012 | 享元模式與物件池：兩種不同的重用 | medium |
| 013 | 策略模式：取代 if-else 的正確方式 | medium |
| 014 | 模板方法與鉤子：固定流程、可變步驟 | medium |
| 015 | 觀察者模式與事件驅動 | medium |
| 016 | 責任鏈：過濾器、攔截器與中介軟體 | medium |
| 017 | 命令模式：把操作變成物件 | medium |
| 018 | 狀態模式與訂單狀態機 | medium |
| 019 | 迭代器模式：為什麼它幾乎消失在視野中 | easy |
| 020 | 備忘錄與快照：保存狀態而不破壞封裝 | medium |
| 021 | 訪問者模式：什麼時候真的需要它 | hard |
| 022 | 中介者模式：把多對多變成一對多 | medium |
| 023 | 依賴反轉、控制反轉與依賴注入的差別 | hard |
| 024 | SOLID 原則在真實程式碼裡怎麼落地 | hard |

難度分布：easy 5、medium 16、hard 3。
