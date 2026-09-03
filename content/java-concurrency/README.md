# Java 併發面試題（樣板類別）

InterviewHelpMe 的第一個內容樣板類別，共 50 題，涵蓋鎖機制、JMM、AQS、執行緒池、CompletableFuture、並行容器、CAS、單例、Fork/Join、虛擬執行緒等 Java 併發面試高頻主題。

## 這個類別的設計

001 到 024 是最初的樣板，覆蓋面試最高頻的機制題（鎖、JMM、AQS、執行緒池、併發容器）。025 到 050 是後續補充的第二批，往四個方向延伸：**生命週期管理**（中斷與取消、優雅關閉、定時任務、監控與調優）、**硬體與記憶體層**（偽共享、指令重排序、記憶體順序模式、Amdahl 與擴展性）、**現代併發模型**（結構化併發、作用域值、虛擬執行緒的釘住與診斷、上下文傳遞），以及**工程實務**（併發測試、執行緒轉儲判讀、選型地圖、什麼時候不該用併發）。

第二批刻意少講「這個 API 怎麼用」，多講**判準與失敗模式**——例如 026 的重點不是 `shutdown` 的簽章而是「四步關閉流程與容器寬限期的時間預算」，048 的重點不是測試框架而是「偶發失敗的測試是併發 bug 的第一個訊號」。050 是收束題，主張併發是用永久的複雜度換當下的效能。

Java 語言與集合本身的題目歸在 [java](../java/)，JVM 內部機制歸在 [jvm](../jvm/)，本類別只在需要時交叉連結。

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
| 025 | 執行緒中斷與取消的正確做法 | medium |
| 026 | 執行緒池的優雅關閉與任務排空 | medium |
| 027 | ReadWriteLock 與 StampedLock 的取捨 | hard |
| 028 | 偽共享與快取行填充 | hard |
| 029 | 執行緒安全的定義與判斷方法 | easy |
| 030 | 安全發布的四種方式 | medium |
| 031 | 生產者消費者模型的實作選擇 | medium |
| 032 | Exchanger 與 Phaser：較少用但有用的同步器 | medium |
| 033 | ScheduledThreadPoolExecutor 與定時任務的坑 | medium |
| 034 | 執行緒池的監控與參數調優 | medium |
| 035 | ConcurrentLinkedQueue 與無鎖佇列 | hard |
| 036 | Disruptor 與環形緩衝：為什麼比佇列快 | hard |
| 037 | 跨執行緒的上下文傳遞 | hard |
| 038 | 指令重排序與 as-if-serial 語意 | hard |
| 039 | 活鎖、飢餓與公平性 | easy |
| 040 | 鎖的粒度與分段鎖設計 | medium |
| 041 | 併發下的效能量測：Amdahl 定律與爭用 | hard |
| 042 | 非同步編排的錯誤處理與逾時 | medium |
| 043 | 併發集合的選型地圖 | easy |
| 044 | 原子類別家族與 VarHandle | hard |
| 045 | 結構化併發解決了什麼問題 | hard |
| 046 | 作用域值與 ThreadLocal 的替代 | medium |
| 047 | 虛擬執行緒的釘住與診斷 | hard |
| 048 | 並行測試：如何測出競爭條件 | hard |
| 049 | 執行緒轉儲的判讀 | medium |
| 050 | 併發設計的整體判斷：什麼時候不要用併發 | hard |

難度分布：easy 6、medium 25、hard 19 — 大致呈現真實面試的鐘型分布（基礎題較少、中等題最多），第二批的深度題比例較高，因為它們處理的是硬體層與現代併發模型。
