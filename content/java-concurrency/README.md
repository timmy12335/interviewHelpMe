# Java 併發面試題（樣板類別）

InterviewHelpMe 的第一個內容樣板類別，共 24 題，涵蓋鎖機制、JMM、AQS、執行緒池、CompletableFuture、並行容器、CAS、單例、Fork/Join、虛擬執行緒等 Java 併發面試高頻主題。用途是驗證題庫格式與內容深度，確認滿意後再依此格式擴充到全部 9 大類、每類 200 題。

## 檔案格式

每題一個檔案，命名為 `NNN-slug.md`，frontmatter 對應 [schema.sql](../../backend/sql/schema.sql) 的 `question` 表欄位：

```yaml
---
id: java-concurrency-NNN     # 對應未來的 question.slug（category 內唯一）
category: java-concurrency   # 對應 category.slug
slug: xxx-yyy
title: 題目標題
difficulty: easy|medium|hard
tags: [標籤1, 標籤2]
source: original              # original | community | adapted
---
```

正文固定分為：題目、核心答案（一句話）、詳細解析、常見追問、相關（連到同類其他題目）。

## 題目清單

| # | 題目 | 難度 |
|---|------|------|
| 001 | synchronized 的底層實作與鎖升級機制 | medium |
| 002 | volatile 關鍵字保證了什麼，又不保證什麼 | easy |
| 003 | Java 記憶體模型（JMM）與 happens-before 規則 | medium |
| 004 | synchronized 與 ReentrantLock 的差異與選型 | medium |
| 005 | ReentrantLock 公平鎖與非公平鎖的差異 | medium |
| 006 | AQS（AbstractQueuedSynchronizer）的原理 | hard |
| 007 | CountDownLatch、CyclicBarrier、Semaphore 的差異與適用場景 | medium |
| 008 | ThreadLocal 原理與記憶體洩漏問題 | medium |
| 009 | ThreadPoolExecutor 的核心參數與任務執行流程 | medium |
| 010 | 執行緒池的拒絕策略有哪些，該怎麼選 | medium |
| 011 | 為什麼阿里巴巴 Java 開發手冊建議不要用 Executors 建立執行緒池 | medium |
| 012 | Future 與 CompletableFuture 的差異 | easy |
| 013 | CompletableFuture 的組合方法與例外傳播 | hard |
| 014 | ConcurrentHashMap 的原理（JDK 7 分段鎖 vs JDK 8 CAS + synchronized） | hard |
| 015 | CopyOnWriteArrayList 的原理與適用場景 | medium |
| 016 | BlockingQueue 常見實作類別比較 | medium |
| 017 | 死鎖的產生條件、案例與排查方法 | medium |
| 018 | CAS 原理與 ABA 問題 | medium |
| 019 | AtomicInteger 與 LongAdder 的效能差異 | hard |
| 020 | wait/notify/notifyAll 與 Condition 的關係與正確用法 | medium |
| 021 | Java 執行緒的生命週期與狀態轉換 | easy |
| 022 | 雙重檢查鎖定（DCL）單例為什麼必須加 volatile | hard |
| 023 | Fork/Join 框架與工作竊取演算法 | hard |
| 024 | 虛擬執行緒（Virtual Threads）與傳統執行緒池的適用邊界 | hard |

難度分布：easy 3、medium 14、hard 7 — 大致呈現真實面試的鐘型分布（基礎題較少、中等題最多、少數深度題）。

## 尚待確認

- 這批內容是否符合預期的深度與格式？是否需要調整（例如加程式碼範例、加圖解、拆分更細）？
- 確認後，其餘 8 大類（Java、Spring、JVM、Redis、資料庫、後端工程、系統設計、AI 大模型、AI Agent）將採用同一套格式，分批擴充到每類 200 題。
