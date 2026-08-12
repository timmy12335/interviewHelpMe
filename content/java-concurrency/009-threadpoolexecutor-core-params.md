---
id: java-concurrency-009
category: java-concurrency
slug: threadpoolexecutor-core-params
title: ThreadPoolExecutor 的核心參數與任務執行流程
difficulty: medium
tags: [執行緒池, ThreadPoolExecutor]
source: original
---

# 題目

`ThreadPoolExecutor` 的核心參數有哪些？提交一個任務後，執行緒池（Thread Pool）內部的執行流程是什麼？

## 核心答案

`ThreadPoolExecutor` 有 7 個核心建構參數：`corePoolSize`、`maximumPoolSize`、`keepAliveTime`、`unit`、`workQueue`、`threadFactory`、`handler`（拒絕策略（Rejection Policy））。提交任務時，執行流程依序是：先看核心執行緒數是否已滿，未滿則建立新執行緒執行；已滿則嘗試放入佇列；佇列也滿了才嘗試建立非核心執行緒（直到 `maximumPoolSize`）；連最大執行緒數都用完，才觸發拒絕策略。

## 詳細解析

**7 個核心參數**：

1. **`corePoolSize`**：核心執行緒數，即使空閒也不會被回收（除非設定 `allowCoreThreadTimeOut(true)`）。
2. **`maximumPoolSize`**：執行緒池允許建立的最大執行緒數。
3. **`keepAliveTime` + `unit`**：非核心執行緒空閒超過這個時間就會被回收。
4. **`workQueue`**：任務佇列，暫存等待執行的任務，常見實作有 `ArrayBlockingQueue`（有界）、`LinkedBlockingQueue`（預設無界）、`SynchronousQueue`（不儲存任務，直接交給執行緒）。
5. **`threadFactory`**：建立執行緒的工廠，通常自訂用來設定執行緒名稱、是否為守護執行緒。
6. **`handler`**：拒絕策略，當任務既無法進入佇列、也無法建立新執行緒時觸發。

**任務提交後的執行順序**（`execute()` 方法核心邏輯）：

1. 若目前執行緒數 < `corePoolSize`：直接建立新的核心執行緒執行這個任務，即使此時有其他核心執行緒是空閒的。
2. 若執行緒數已達 `corePoolSize`：嘗試把任務放入 `workQueue`。
3. 若佇列已滿（放入失敗）：嘗試建立新執行緒（非核心），直到執行緒數達到 `maximumPoolSize`。
4. 若執行緒數已達 `maximumPoolSize` 且佇列已滿：呼叫 `handler` 執行拒絕策略。

**常見誤解澄清**：很多人以為「核心執行緒忙不過來才會用非核心執行緒」，但實際上是「核心執行緒數量不足時優先開新核心執行緒，而不是把任務丟進佇列排隊」——這意味著如果 `workQueue` 用的是無界佇列，`maximumPoolSize` 這個參數其實永遠不會被觸發，這也是為什麼無界佇列容易導致記憶體溢位（OOM）的原因。

**執行緒回收**：非核心執行緒空閒超過 `keepAliveTime` 會被回收；若呼叫過 `allowCoreThreadTimeOut(true)`，核心執行緒閒置超過 `keepAliveTime` 也會被回收，執行緒池甚至可以縮到 0 個執行緒。

## 面試回答方式

這題是執行緒池最基礎但最容易講不清楚的題目，關鍵是把「7 個參數」和「執行流程」分開講、並且流程要按順序講清楚。很多人背得出參數名稱，但講執行流程時會講錯順序（誤以為佇列滿了才會用非核心執行緒是對的，但誤以為核心執行緒沒滿也會先進佇列排隊）。建議直接用「核心執行緒 → 佇列 → 非核心執行緒 → 拒絕策略」這個四步驟講清楚，並主動點出「很多人誤解的地方」（核心執行緒優先開新的而非排隊），這個誤區澄清是這題的關鍵加分點，展現你不是含糊帶過而是真正理解細節。

## 常見追問

### 為什麼無界佇列容易導致 OOM？應該怎麼設計佇列容量？

**核心答案**：因為當任務提交速度長期大於處理速度時，無界佇列會無限制地累積任務物件在記憶體中，`maximumPoolSize` 永遠不會被觸發去建立更多執行緒分擔負載，最終導致記憶體被大量堆積的任務物件耗盡。

**詳細解析**：佇列容量的設計沒有萬用公式，需要結合業務場景估算：先估算單一任務物件大概佔用的記憶體大小、系統能容忍的最大記憶體佔用、以及正常業務高峰期可能瞬間堆積的任務數量，抓一個既能吸收正常流量波動、又不會在異常流量下把記憶體吃光的容量上限（例如幾百到幾千的量級，視業務而定）。更重要的是佇列容量只是「第一道防線」，還需要搭配監控（佇列積壓長度告警）與合理的拒絕策略（見 [[010-thread-pool-rejection-policy.md]]）作為「第二道防線」，讓系統在真正扛不住時能明確地拒絕新任務、而不是被動地把記憶體撐爆。

**面試回答方式**：先講清楚無界佇列導致 OOM 的因果邏輯（任務堆積 → `maximumPoolSize` 不會被觸發 → 記憶體被耗盡），再談容量設計時強調「沒有萬用公式，要結合業務估算」，避免給出一個聽起來很武斷的具體數字卻說不出理由。

### 執行緒池執行任務時拋出未捕捉例外會發生什麼？

**核心答案**：用 `execute()` 提交的任務，如果拋出未捕捉例外，會導致該執行緒直接終止（該執行緒池會建立新執行緒補上），例外資訊通常只會印在標準錯誤輸出，容易被忽略；用 `submit()` 提交則例外會被封裝進回傳的 `Future`必須呼叫 `Future.get()` 才會以 `ExecutionException` 的形式重新拋出。

**詳細解析**：這是一個很容易踩雷的實務細節：如果用 `execute(Runnable)` 提交任務且任務內部拋出未捕捉的執行期例外，這個例外會沿著呼叫堆疊往上跑到執行緒的 `run()` 方法邊界，被 JVM 的預設未捕捉例外處理器捕捉並印出堆疊追蹤，但**不會**讓呼叫 `execute()` 的那個執行緒感知到任何異常，容易造成「任務悄悄失敗但沒人發現」的問題。用 `submit(Callable/Runnable)` 提交則不同：任務內的例外會被封裝進 `Future` 物件內部，只有真正呼叫 `future.get()` 時才會以 `ExecutionException`（包裝原始例外）的形式拋出；如果程式碼提交任務後從未呼叫 `get()`，例外同樣會被靜默吞掉。因此在執行緒池中執行任務時，最好在任務內部自行 `try-catch` 並記錄日誌，不要完全依賴呼叫方去發現例外。

**面試回答方式**：這題最好舉出具體差異（`execute` 例外印在標準錯誤但呼叫方無感知、`submit` 例外要呼叫 `get()` 才會看到），並補上最佳實踐「任務內部自行捕捉並記錄日誌」，這種「知道陷阱、也知道怎麼避免」的回答結構最容易讓面試官感受到實戰經驗。

### 如何監控執行緒池的健康狀況？

**核心答案**：核心監控指標包括活躍執行緒數（`getActiveCount()`）、目前執行緒總數（`getPoolSize()`）、佇列積壓量（`getQueue().size()`）、已完成任務數（`getCompletedTaskCount()`）、以及拒絕次數（需要在自訂拒絕策略中自行埋點統計）。

**詳細解析**：`ThreadPoolExecutor` 本身提供了不少內建方法可以取得執行時狀態（`getActiveCount`、`getPoolSize`、`getCorePoolSize`、`getMaximumPoolSize`、`getQueue()`、`getCompletedTaskCount`、`getTaskCount`），但沒有直接提供「被拒絕次數」的內建計數器，這需要在自訂的 `RejectedExecutionHandler` 中自行累加計數並上報監控系統。生產環境通常會定期（例如每隔幾秒）採集這些指標推送到 Prometheus、Grafana 等監控系統，設定告警規則（例如佇列積壓超過某個閾值、拒絕次數突然飆升）能讓團隊在系統真正被壓垮之前提早介入排查。

**面試回答方式**：能具體講出幾個 `ThreadPoolExecutor` 內建的監控方法名稱（而不是只說「監控活躍執行緒數和佇列長度」這種抽象描述），並補上「拒絕次數需要自己在拒絕策略裡埋點」這個容易被忽略的細節，會讓回答顯得更落地、更有實作經驗。

## 相關

- [[010-thread-pool-rejection-policy.md]]
- [[011-why-avoid-executors-factory-methods.md]]
