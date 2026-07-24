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

`ThreadPoolExecutor` 的核心參數有哪些？提交一個任務後，執行緒池內部的執行流程是什麼？

## 核心答案

`ThreadPoolExecutor` 有 7 個核心建構參數：`corePoolSize`、`maximumPoolSize`、`keepAliveTime`、`unit`、`workQueue`、`threadFactory`、`handler`（拒絕策略）。提交任務時，執行流程依序是：先看核心執行緒數是否已滿，未滿則建立新執行緒執行；已滿則嘗試放入佇列；佇列也滿了才嘗試建立非核心執行緒（直到 `maximumPoolSize`）；連最大執行緒數都用完，才觸發拒絕策略。

## 詳細解析

**7 個核心參數**：

1. **`corePoolSize`**：核心執行緒數，即使空閒也不會被回收（除非設定 `allowCoreThreadTimeOut(true)`）。
2. **`maximumPoolSize`**：執行緒池允許建立的最大執行緒數。
3. **`keepAliveTime` + `unit`**：非核心執行緒空閒超過這個時間就會被回收。
4. **`workQueue`**：任務佇列，暫存等待執行的任務，常見實作有 `ArrayBlockingQueue`（有界）、`LinkedBlockingQueue`（預設無界）、`SynchronousQueue`（不儲存任務，直接交給執行緒）。
5. **`threadFactory`**：建立執行緒的工廠，通常自訂用來設定執行緒名稱（方便排查問題）、是否為守護執行緒。
6. **`handler`**：拒絕策略，當任務既無法進入佇列、也無法建立新執行緒時觸發。

**任務提交後的執行順序**（`execute()` 方法核心邏輯）：

1. 若目前執行緒數 < `corePoolSize`：直接建立新的核心執行緒執行這個任務，即使此時有其他核心執行緒是空閒的。
2. 若執行緒數已達 `corePoolSize`：嘗試把任務放入 `workQueue`。
3. 若佇列已滿（放入失敗）：嘗試建立新執行緒（非核心），直到執行緒數達到 `maximumPoolSize`。
4. 若執行緒數已達 `maximumPoolSize` 且佇列已滿：呼叫 `handler` 執行拒絕策略。

**常見誤解澄清**：很多人以為「核心執行緒忙不過來才會用非核心執行緒」，但實際上是「核心執行緒數量不足時優先開新核心執行緒，而不是把任務丟進佇列排隊」——這意味著如果 `workQueue` 用的是無界佇列（如預設的 `LinkedBlockingQueue`），`maximumPoolSize` 這個參數其實永遠不會被觸發，因為任務會一直堆積在佇列裡而不會觸發建立非核心執行緒，這也是為什麼無界佇列容易導致記憶體溢位（OOM）的原因。

**執行緒回收**：非核心執行緒空閒超過 `keepAliveTime` 會被回收；若呼叫過 `allowCoreThreadTimeOut(true)`，核心執行緒閒置超過 `keepAliveTime` 也會被回收，執行緒池甚至可以縮到 0 個執行緒。

## 常見追問

- 為什麼無界佇列容易導致 OOM？應該怎麼設計佇列容量？
- 執行緒池執行任務時拋出未捕捉例外會發生什麼（`execute` vs `submit` 的差異，`Future.get()` 才會拋出）？
- 如何監控執行緒池的健康狀況（活躍執行緒數、佇列積壓量、拒絕次數）？

## 相關

- [[010-thread-pool-rejection-policy.md]]
- [[011-why-avoid-executors-factory-methods.md]]
