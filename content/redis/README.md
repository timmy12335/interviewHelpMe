# Redis 面試題（樣板類別）

InterviewHelpMe 第五個內容類別，共 24 題，涵蓋資料類型與底層編碼、單執行緒模型與 IO 多路復用、持久化（RDB/AOF/混合）、過期與淘汰策略、快取三大問題（穿透/擊穿/雪崩）與一致性、分散式鎖與 Redlock、主從/哨兵/叢集、熱key大key、事務、Pipeline、跳躍表、與 Memcached 比較、布隆過濾器。

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

難度分布：easy 3、medium 14、hard 7（鐘型分布，中等題最多）。

## 進度

9 大類第 5 類。已完成：Java 核心、Java 併發、JVM、Spring、Redis。待做：資料庫、後端工程、系統設計、AI 大模型、AI Agent。
