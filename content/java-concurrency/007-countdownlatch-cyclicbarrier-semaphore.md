---
id: java-concurrency-007
category: java-concurrency
slug: countdownlatch-cyclicbarrier-semaphore
title: CountDownLatch、CyclicBarrier、Semaphore 的差異與適用場景
difficulty: medium
tags: [CountDownLatch, CyclicBarrier, Semaphore, AQS]
source: original
---

# 題目

`CountDownLatch`、`CyclicBarrier`、`Semaphore` 分別解決什麼問題？可以舉例說明適用場景嗎？

## 核心答案

三者都基於 AQS，但語意不同：`CountDownLatch` 讓一個或多個執行緒等待「一組事件全部完成」，只能用一次（不可重置）；`CyclicBarrier` 讓一組執行緒互相等待「所有人都到齊」才繼續，且可重複使用；`Semaphore` 控制「同時能有多少執行緒存取某資源」。

## 詳細解析

**CountDownLatch**：

- 建構時指定計數值，每次呼叫 `countDown()` 讓計數減 1，呼叫 `await()` 的執行緒會阻塞到計數歸零。
- 一次性：計數歸零後無法重置，若要重新使用需要建立新的實例。
- 典型場景：主執行緒等待多個子執行緒完成初始化任務後才繼續（例如等待多個微服務健康檢查全部通過）；或反過來，多個執行緒等待主執行緒發出「開始」信號（把計數設為 1，一聲令下所有執行緒同時開跑，常用於壓測場景）。

**CyclicBarrier**：

- 建構時指定「參與方數量」，每個參與執行緒呼叫 `await()` 後阻塞，直到所有參與方都呼叫了 `await()`，才會一起被釋放繼續執行。
- 可重複使用：所有執行緒通過屏障後，計數會自動重置，可以進行下一輪等待。
- 可以在建構時傳入一個 `Runnable`，所有執行緒到齊時會先執行這個回呼（常用於彙總每一輪的結果）。
- 典型場景：把一個大任務拆成多個執行緒分片並行計算，每一輪計算完都要「所有分片都完成」才能進入下一輪（例如分треш式矩陣運算的分階段同步）。

**Semaphore**：

- 維護一組「許可證」（permits），`acquire()` 取得一個許可（不足則阻塞），`release()` 歸還一個許可。
- 典型場景：限制同時存取某資源的執行緒數量，例如限制同時連線資料庫連線池的執行緒數、限流（同時最多 N 個請求呼叫下游 API）、實作物件池。

**三者對比表**：

| 工具 | 是否可重用 | 核心語意 | 典型場景 |
|------|-----------|---------|---------|
| CountDownLatch | 否（一次性） | 等待 N 個事件完成 | 等待多執行緒初始化完成 |
| CyclicBarrier | 是（自動重置） | 等待 N 個執行緒互相到齊 | 分階段並行計算 |
| Semaphore | 是（許可可反覆借還） | 控制併發存取數量 | 限流、連線池 |

## 常見追問

- `CountDownLatch` 的 `await()` 底層是 AQS 的共享模式，`state` 代表什麼？
- `CyclicBarrier` 內部是怎麼實現「重置」的（用 `Generation` 物件標記每一輪）？
- `Semaphore` 可以實作公平模式嗎？和 `ReentrantLock` 的公平鎖概念是否一致？

## 相關

- [[006-aqs-principle.md]]
