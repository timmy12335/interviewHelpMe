# 資料庫面試題（樣板類別）

InterviewHelpMe 第六個內容類別，共 25 題，涵蓋 MySQL/InnoDB 索引原理（B+ 樹、聚簇索引、聯合索引、索引失效、覆蓋索引、EXPLAIN）、交易與併發控制（ACID、隔離級別、MVCC、鎖類型、間隙鎖、樂觀鎖與悲觀鎖）、崩潰恢復與複製（redo log、binlog 與兩階段提交、讀寫分離與主從延遲）、效能優化（深分頁、慢查詢排查）、分散式資料庫工程（分庫分表、分散式 ID、正規化與反正規化、儲存引擎比較、連線池、SQL 注入防範），以及 LSM Tree 儲存引擎（與 B+ 樹形成寫入／讀取成本分配的對照）。

## 檔案格式

與其他類別相同：每題一個 `NNN-slug.md`，frontmatter 對應 [schema.sql](../../backend/sql/schema.sql) 的 `question` 表（`category: database`）。正文含：題目、核心答案、詳細解析、面試回答方式、常見追問（3 題，各含核心答案／詳細解析／面試回答方式）、相關。部分題目透過 `[[../category/file.md]]` 交叉連結到 Java（HashMap 內部結構）、Java 併發（死鎖排查）、Spring（交易原理）、Redis（分散式鎖、主從複製、AOF 持久化、事務）等類別。

## 題目清單

| # | 題目 | 難度 |
|---|------|------|
| 001 | 索引的原理與 B+ 樹結構 | medium |
| 002 | 為什麼用 B+ 樹而不是二元樹、紅黑樹、雜湊索引 | hard |
| 003 | 聚簇索引與非聚簇索引（回表） | hard |
| 004 | 聯合索引與最左前綴原則 | medium |
| 005 | 索引失效的常見場景 | medium |
| 006 | EXPLAIN 執行計劃解讀 | medium |
| 007 | 交易的 ACID 特性 | easy |
| 008 | 交易隔離級別 | medium |
| 009 | MVCC 多版本並發控制原理 | hard |
| 010 | 資料庫的鎖類型（共享鎖/排他鎖/意向鎖） | medium |
| 011 | 間隙鎖與 Next-Key Lock | hard |
| 012 | redo log 的工作原理 | hard |
| 013 | binlog 與兩階段提交 | hard |
| 014 | 覆蓋索引與索引排序優化 | medium |
| 015 | 深分頁問題與優化 | medium |
| 016 | 慢查詢排查與優化流程 | medium |
| 017 | 分庫分表策略與挑戰 | hard |
| 018 | 分散式 ID 生成方案深入 | medium |
| 019 | 讀寫分離與主從延遲一致性 | medium |
| 020 | 資料庫範式與反範式設計 | easy |
| 021 | InnoDB 與 MyISAM 儲存引擎比較 | easy |
| 022 | 資料庫連線池原理與調校 | medium |
| 023 | SQL 注入原理與防範 | easy |
| 024 | 樂觀鎖與悲觀鎖 | medium |
| 025 | LSM Tree 與 SSTable：鍵值儲存的寫入與讀取路徑 | hard |

難度分布：easy 4、medium 13、hard 8（鐘型分布，中等題最多）。

## 進度

9 大類第 6 類。已完成：Java 核心、Java 併發、JVM、Spring、Redis、資料庫。待做：後端工程、系統設計、AI 大模型、AI Agent。
