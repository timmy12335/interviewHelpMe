# 後端工程面試題（樣板類別）

InterviewHelpMe 第七個內容類別，共 24 題，涵蓋 API 設計與治理（RESTful 設計、版本管理、冪等性、JWT/OAuth2 認證）、服務韌性模式（限流、熔斷器、服務降級、艙壁隔離、重試退避）、微服務基礎設施（服務發現、API 閘道、服務網格）、訊息與分散式一致性（訊息佇列投遞語義、分散式事務 2PC/TCC/Saga、Outbox 模式、CAP 定理）、以及可觀測性與協定選型（分散式追蹤、健康檢查與優雅關閉、gRPC vs REST、事件驅動架構與 CQRS）。

## 檔案格式

與其他類別相同：每題一個 `NNN-slug.md`，frontmatter 對應 [schema.sql](../../backend/sql/schema.sql) 的 `question` 表（`category: backend-engineering`）。正文含：題目、核心答案、詳細解析、面試回答方式、常見追問（3 題，各含核心答案／詳細解析／面試回答方式）、相關。部分題目透過 `[[../category/file.md]]` 交叉連結到資料庫類別（分散式 ID、binlog 兩階段提交、正規化取捨）和 Redis 類別（分散式鎖、Redis Cluster）。

## 題目清單

| # | 題目 | 難度 |
|---|------|------|
| 001 | RESTful API 設計原則 | easy |
| 002 | API 版本管理策略 | medium |
| 003 | 冪等性設計 | medium |
| 004 | JWT 認證機制與安全性 | medium |
| 005 | OAuth 2.0 授權流程 | medium |
| 006 | 限流演算法（令牌桶/漏桶） | medium |
| 007 | 熔斷器模式（Circuit Breaker） | medium |
| 008 | 服務降級策略 | medium |
| 009 | 微服務架構下的服務發現 | medium |
| 010 | API 閘道的作用 | easy |
| 011 | 訊息佇列的核心作用與應用場景 | easy |
| 012 | 訊息佇列的投遞語義（至少一次/最多一次/精確一次） | hard |
| 013 | 分散式事務解決方案（2PC/TCC/Saga 比較） | hard |
| 014 | Saga 模式深入（編排式 vs 協同式） | medium |
| 015 | Outbox 模式解決本地訊息表一致性問題 | hard |
| 016 | CAP 定理與實務取捨 | medium |
| 017 | 一致性雜湊（Consistent Hashing） | hard |
| 018 | 重試機制與退避演算法 | medium |
| 019 | 艙壁隔離模式（Bulkhead） | medium |
| 020 | 分散式追蹤（Distributed Tracing） | medium |
| 021 | 健康檢查與優雅關閉（Graceful Shutdown） | easy |
| 022 | gRPC 與 REST 的比較 | medium |
| 023 | 事件驅動架構與 CQRS | hard |
| 024 | 服務網格與 Sidecar 模式 | hard |

難度分布：easy 4、medium 14、hard 6（鐘型分布，中等題最多）。

## 進度

9 大類第 7 類。已完成：Java 核心、Java 併發、JVM、Spring、Redis、資料庫、後端工程。待做：系統設計、AI 大模型、AI Agent。
