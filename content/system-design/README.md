# 系統設計面試題（樣板類別）

InterviewHelpMe 第八個內容類別，共 24 題，涵蓋系統設計方法論與基礎（面試流程、擴展性、容量估算）、基礎設施建構模組（負載平衡、正反向代理、CDN、快取策略與一致性問題）、經典系統設計案例（短網址、通知系統、即時聊天、社群動態消息、搜尋自動完成、分散式檔案儲存、影音串流、網路爬蟲、即時排行榜、叫車派單）、以及維運與資料處理主題（部署策略、異地容災、批次/流式處理、監控告警、資料分區）。

## 檔案格式

與其他類別相同：每題一個 `NNN-slug.md`，frontmatter 對應 [schema.sql](../../backend/sql/schema.sql) 的 `question` 表（`category: system-design`）。正文含：題目、核心答案、詳細解析、面試回答方式、常見追問（3 題，各含核心答案／詳細解析／面試回答方式）、相關。大量題目透過 `[[../category/file.md]]` 交叉連結到後端工程類別（CAP 定理、艙壁隔離、分散式事務、事件驅動架構）、資料庫類別（分片、讀寫分離、樂觀鎖）與 Redis 類別（有序集合、資料類型），因為系統設計案例本質上是把前幾個類別的知識點整合應用到具體場景。

## 題目清單

| # | 題目 | 難度 |
|---|------|------|
| 001 | 系統設計面試方法論與流程 | easy |
| 002 | 垂直擴展與水平擴展 | easy |
| 003 | 負載平衡演算法與策略 | medium |
| 004 | 正向代理與反向代理 | medium |
| 005 | CDN 內容分發網路設計 | medium |
| 006 | 快取策略（Cache-Aside / Write-Through / Write-Behind） | medium |
| 007 | 快取失效與快取一致性問題 | medium |
| 008 | 設計短網址服務（URL Shortener） | hard |
| 009 | 設計通知系統（Notification System） | medium |
| 010 | 設計即時聊天系統（Chat System） | hard |
| 011 | 設計社群動態消息（News Feed） | hard |
| 012 | 設計搜尋自動完成（Search Autocomplete） | medium |
| 013 | 設計分散式檔案儲存系統 | medium |
| 014 | 設計影音串流服務（Video Streaming） | hard |
| 015 | 倒排索引與搜尋引擎原理 | medium |
| 016 | 容量估算（Back-of-envelope Estimation） | easy |
| 017 | 設計網路爬蟲系統（Web Crawler） | medium |
| 018 | 藍綠部署與金絲雀發布 | medium |
| 019 | 多活架構與異地容災 | medium |
| 020 | 批次處理 vs 流式處理 | medium |
| 021 | 系統監控與告警設計 | easy |
| 022 | 設計即時排行榜系統（Leaderboard） | hard |
| 023 | 資料分區策略（系統設計視角） | medium |
| 024 | 設計叫車派單系統（Ride-Hailing Dispatch） | hard |

難度分布：easy 4、medium 14、hard 6（鐘型分布，中等題最多）。

## 進度

9 大類第 8 類。已完成：Java 核心、Java 併發、JVM、Spring、Redis、資料庫、後端工程、系統設計。待做：AI 大模型、AI Agent。
