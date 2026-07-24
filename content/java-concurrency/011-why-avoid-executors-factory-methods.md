---
id: java-concurrency-011
category: java-concurrency
slug: why-avoid-executors-factory-methods
title: 為什麼阿里巴巴 Java 開發手冊建議不要用 Executors 建立執行緒池
difficulty: medium
tags: [執行緒池, Executors, OOM]
source: original
---

# 題目

阿里巴巴 Java 開發手冊建議不要直接用 `Executors` 的工廠方法建立執行緒池，而是用 `ThreadPoolExecutor` 建構子。為什麼？

## 核心答案

`Executors` 的工廠方法（`newFixedThreadPool`、`newCachedThreadPool`、`newSingleThreadExecutor` 等）內部預設使用了無界佇列或無限制的最大執行緒數，容易在高負載下堆積過多任務或執行緒，導致記憶體溢位（OOM）。直接用 `ThreadPoolExecutor` 建構子能強制開發者顯式思考並設定每個參數，尤其是佇列容量的上限。

## 詳細解析

**逐一分析常見工廠方法的問題**：

- **`newFixedThreadPool(n)`**：`corePoolSize = maximumPoolSize = n`，但佇列用的是 `LinkedBlockingQueue`（預設容量 `Integer.MAX_VALUE`，等同無界）。當任務提交速度長期大於處理速度時，佇列會無限堆積，最終耗盡記憶體導致 OOM。
- **`newCachedThreadPool()`**：佇列用 `SynchronousQueue`（不儲存任務），但 `maximumPoolSize` 是 `Integer.MAX_VALUE`，等同執行緒數量沒有上限。當任務提交速度過快，會不斷建立新執行緒，可能耗盡系統執行緒資源或記憶體（每個執行緒預設佔用 1MB 左右的棧空間），同樣可能導致 OOM 或系統崩潰。
- **`newSingleThreadExecutor()`**：本質上是 `newFixedThreadPool(1)`，一樣有無界佇列的問題。
- **`newScheduledThreadPool(n)`**：底層用的是 `DelayedWorkQueue`，理論上也是無界的，同樣有堆積風險。

**正確做法**：直接使用 `new ThreadPoolExecutor(corePoolSize, maximumPoolSize, keepAliveTime, unit, workQueue, threadFactory, handler)`，明確指定一個**有界佇列**（例如 `new ArrayBlockingQueue<>(1000)`）與合理的 `maximumPoolSize`，並搭配前面提到的自訂拒絕策略。這樣當系統負載超出處理能力時，會透過拒絕策略明確地暴露問題（報錯、降級、告警），而不是無聲無息地把記憶體吃光。

**面試延伸**：這題本質上考的是「防禦性程式設計」與「快速失敗（fail-fast）」思維——與其讓問題累積到系統資源耗盡才總爆發，不如在資源使用超出預期時就立即、明確地暴露問題，這樣才有機會在早期就發現並修復根因，而不是靠運氣祈禱流量永遠不會超過預期。

## 常見追問

- 如果一定要用無界佇列，可以搭配什麼機制降低 OOM 風險（監控佇列長度並主動告警、限制單一任務的記憶體佔用）？
- 業務系統中，執行緒池的核心/最大執行緒數該如何估算（CPU 密集型 vs I/O 密集型的經驗公式）？
- Spring 的 `@Async` 預設使用的執行緒池有這個問題嗎？

## 相關

- [[009-threadpoolexecutor-core-params.md]]
- [[010-thread-pool-rejection-policy.md]]
