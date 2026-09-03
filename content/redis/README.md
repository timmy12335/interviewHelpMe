# Redis 面試題（樣板類別）

InterviewHelpMe 第五個內容類別，共 50 題，涵蓋資料類型與底層編碼、單執行緒模型與 IO 多路復用、持久化（RDB/AOF/混合）、過期與淘汰策略、快取三大問題（穿透/擊穿/雪崩）與一致性、分散式鎖與 Redlock、主從/哨兵/叢集、熱key大key、事務、Pipeline、跳躍表、與 Memcached 比較、布隆過濾器。

## 這個類別的設計

001 到 024 是最初的樣板，覆蓋 Redis 面試最高頻的機制題。025 到 050 是後續補充的第二批，往四個方向延伸：**較少被問但實務常用的資料類型**（Stream 與消費者群組、HyperLogLog、GEO、Bitmap、Pub/Sub 的限制）、**維運與診斷**（記憶體管理與碎片、延遲排查、fork 與寫時複製、叢集重分片、容量規劃、備份與遷移、安全設定）、**應用模式**（限流、分散式 ID 與計數器、排行榜、鍵設計、客戶端與連線池），以及**選型判斷**（作為訊息佇列的取捨、什麼時候不該用 Redis、授權變更後的替代方案）。

第二批的重心放在**判準與失敗模式**：032 的重點是「碎片率小於 1 比大於 1 嚴重得多」，034 完整說明 fork 的成本為什麼與記憶體量成正比、以及透明大頁如何放大它，046 完整走過一次「未授權存取導致伺服器淪陷」的攻擊鏈。049 給出一個核心的診斷問題——「如果 Redis 現在整個消失，會發生什麼」，050 則收在「回到需求」。

## 檔案格式

與其他類別相同：每題一個 `NNN-slug.md`，frontmatter 對應 [schema.sql](../../backend/sql/schema.sql) 的 `question` 表（`category: redis`）。正文含：題目、核心答案、詳細解析、面試回答方式、常見追問（3 題，各含核心答案／詳細解析／面試回答方式）、相關。部分題目透過 `[[../category/file.md]]` 交叉連結到 Java 併發類別（LongAdder 分散思路）。

## 題目清單

| # | 題目 | 難度 |
|---|------|------|
| 001 | Redis 的五種基本資料類型與應用場景 | easy |
| 002 | Redis 資料類型的底層編碼 | hard |
| 003 | Redis 的單執行緒模型為什麼快 | medium |
| 004 | Redis 的 IO 多路復用 | hard |
| 005 | RDB 持久化 | medium |
| 006 | AOF 持久化 | medium |
| 007 | RDB 與 AOF 的對比與混合持久化 | medium |
| 008 | Redis 的過期鍵刪除策略 | medium |
| 009 | Redis 的記憶體淘汰策略 | medium |
| 010 | 快取穿透 | medium |
| 011 | 快取擊穿 | medium |
| 012 | 快取雪崩 | medium |
| 013 | 快取與資料庫的一致性 | hard |
| 014 | Redis 分散式鎖 | hard |
| 015 | Redlock 演算法及其爭議 | hard |
| 016 | Redis 主從複製 | medium |
| 017 | Redis 哨兵機制 | medium |
| 018 | Redis Cluster 叢集與資料分片 | hard |
| 019 | 熱 key 與大 key 問題 | medium |
| 020 | Redis 的事務 | medium |
| 021 | Redis 管線（Pipeline） | easy |
| 022 | 跳躍表（Skip List）原理 | hard |
| 023 | Redis 與 Memcached 的比較 | easy |
| 024 | 布隆過濾器 | medium |
| 025 | Redis 6 之後的多執行緒 IO | medium |
| 026 | Stream 資料類型與消費者群組 | medium |
| 027 | 發布訂閱與它的可靠性限制 | easy |
| 028 | HyperLogLog 與基數統計 | medium |
| 029 | GEO 與地理位置查詢 | easy |
| 030 | Bitmap 與位元操作的應用 | medium |
| 031 | Lua 腳本的原子性與限制 | medium |
| 032 | Redis 的記憶體管理與碎片 | hard |
| 033 | Redis 的延遲排查 | medium |
| 034 | 持久化的 fork 與寫時複製 | hard |
| 035 | 叢集的槽位遷移與重分片 | hard |
| 036 | 客戶端快取與 Tracking 機制 | hard |
| 037 | Redis 作為訊息佇列的取捨 | medium |
| 038 | 用 Redis 實作限流 | medium |
| 039 | 用 Redis 做分散式 ID 與計數器 | medium |
| 040 | 排行榜與有序集合的實務設計 | medium |
| 041 | Redis 的鍵設計與命名規範 | easy |
| 042 | 過期鍵在主從與叢集下的行為 | hard |
| 043 | Redis 的持久性保證：能丟多少 | medium |
| 044 | 客戶端選型與連線池設定 | medium |
| 045 | Redis Function 與模組生態 | medium |
| 046 | Redis 的安全設定 | medium |
| 047 | 大規模 Redis 的容量規劃 | hard |
| 048 | Redis 的備份、恢復與遷移 | medium |
| 049 | 什麼時候不該用 Redis | medium |
| 050 | Redis 的選型與替代方案 | hard |

難度分布：easy 6、medium 30、hard 14（鐘型分布，中等題最多）。
