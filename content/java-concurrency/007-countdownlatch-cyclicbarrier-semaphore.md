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
- 典型場景：主執行緒等待多個子執行緒完成初始化任務後才繼續（例如等待多個微服務（Microservices）健康檢查全部通過）；或反過來多個執行緒等待主執行緒發出「開始」信號（把計數設為 1，一聲令下所有執行緒同時開跑，常用於壓測場景）。

**CyclicBarrier**：

- 建構時指定「參與方數量」，每個參與執行緒呼叫 `await()` 後阻塞，直到所有參與方都呼叫了 `await()`，才會一起被釋放繼續執行。
- 可重複使用：所有執行緒通過屏障後，計數會自動重置，可以進行下一輪等待。
- 可以在建構時傳入一個 `Runnable`，所有執行緒到齊時會先執行這個回呼（常用於彙總每一輪的結果）。
- 典型場景：把一個大任務拆成多個執行緒分片並行計算，每一輪計算完都要「所有分片都完成」才能進入下一輪。

**Semaphore**：

- 維護一組「許可證」（permits），`acquire()` 取得一個許可（不足則阻塞），`release()` 歸還一個許可。
- 典型場景：限制同時存取某資源的執行緒數量，例如限制同時連線資料庫連線池（Connection Pool）的執行緒數、限流（同時最多 N 個請求呼叫下游 API）、實作物件池。

**三者對比表**：

| 工具 | 是否可重用 | 核心語意 | 典型場景 |
|------|-----------|---------|---------|
| CountDownLatch | 否（一次性） | 等待 N 個事件完成 | 等待多執行緒初始化完成 |
| CyclicBarrier | 是（自動重置） | 等待 N 個執行緒互相到齊 | 分階段並行計算 |
| Semaphore | 是（許可可反覆借還） | 控制併發存取數量 | 限流（Rate Limiting）、連線池 |

## 面試回答方式

三個工具的題型，最忌諱的答法是逐一背定義然後就結束。更好的結構是先講一句話總結「三者都基於 AQS，但語意各自解決不同問題」，然後用「一次性 vs 可重複」「等待事件 vs 等待彼此 vs 控制數量」這種對比維度快速區分三者，最後每個工具各配一個具體場景例子（初始化等待、分階段計算、限流）。舉例是這題的加分關鍵，因為它直接證明你不是死背 API，而是真的知道什麼時候該用哪個工具解決什麼問題。

## 常見追問

### CountDownLatch 的 await() 底層是 AQS 的共享模式，state 代表什麼？

**核心答案**：`state` 代表「剩餘尚未完成的事件數量」，初始值等於建構子傳入的計數值，每次 `countDown()` 讓 `state` 減 1`await()` 的執行緒會在 `state` 歸零之前持續等待。

**詳細解析**：`CountDownLatch` 是共享模式的典型應用：`tryAcquireShared` 的邏輯很簡單，直接檢查 `state` 是否已經是 0，是則返回成功（允許繼續執行），否則失敗（進入佇列等待）；`countDown()` 對應的是 `tryReleaseShared`，用 CAS 把 `state` 減 1，如果減到 0，就代表所有事件都已完成，這時需要喚醒所有在 `await()` 等待的執行緒（回傳 true 觸發喚醒後續佇列中的所有節點，而不是只喚醒一個，因為這是共享模式）。這也解釋了為什麼 `CountDownLatch` 一旦計數歸零就無法逆轉——沒有任何方法可以把 `state` 加回去。

**面試回答方式**：能具體說出「`state` 歸零時觸發的是喚醒『所有』等待者，而不是喚醒一個」這個共享模式的特徵，會比只回答「`state` 就是剩餘次數」更展現你理解共享模式與獨佔模式在喚醒行為上的差異。

### CyclicBarrier 內部是怎麼實現「重置」的？

**核心答案**：`CyclicBarrier` 內部用一個 `Generation`（世代）物件標記「這一輪」的屏障狀態，當所有執行緒都到齊、屏障被打破時，會建立一個新的 `Generation` 物件並重置計數，讓下一輪的等待可以重新開始。

**詳細解析**：`CyclicBarrier` 並非直接基於 AQS 實作，而是用一個 `ReentrantLock` + `Condition` 自行管理狀態。每一輪等待都關聯到一個 `Generation` 物件；當最後一個執行緒呼叫 `await()` 讓計數歸零時，會先執行建構時傳入的回呼 `Runnable`然後呼叫 `nextGeneration()`：喚醒所有在這一輪 `Condition` 上等待的執行緒、把計數重置回初始的參與方數量、並建立一個新的 `Generation` 物件供下一輪使用。這個「世代」的設計也用來處理屏障被中斷或逾時的情況——如果某個執行緒在等待中被中斷或逾時，會將目前的 `Generation` 標記為「已破壞（broken）」，讓同一輪中其他還在等待的執行緒都能感知到屏障已失效並拋出 `BrokenBarrierException`，而不是無限期卡住。

**面試回答方式**：能講出「用 `Generation` 世代物件標記每一輪」這個具體機制名稱是加分項；如果進一步能提到「屏障被破壞（broken）」的例外處理機制，展現你了解這個工具在異常情況下如何避免死等，會是更深入的回答。

### Semaphore 可以實作公平模式嗎？和 ReentrantLock 的公平鎖概念是否一致？

**核心答案**：可以，`Semaphore` 建構子同樣可以傳入 `boolean fair` 參數選擇公平或非公平模式，概念和 `ReentrantLock` 的公平鎖完全一致——公平模式下嚴格按照請求許可的順序分配，非公平模式允許插隊搶佔。

**詳細解析**：因為 `Semaphore` 同樣是基於 AQS 實作的共享模式同步工具，它的公平／非公平邏輯與 `ReentrantLock` 如出一轍：非公平模式下，`tryAcquireShared` 會直接嘗試 CAS 減少 `state`，不管佇列裡是否已有人排隊；公平模式下，會先檢查 `hasQueuedPredecessors()`，若佇列中已有等待者就不搶佔。這再次印證了 AQS 框架的威力——不同的同步工具即使語意不同（互斥 vs 控制數量），公平性的實作模式卻可以完全共用同一套邏輯。

**面試回答方式**：直接肯定「可以，而且概念與 `ReentrantLock` 完全一致」，然後補一句「這是因為兩者底層都是 AQS，公平性邏輯是共用的框架能力」，把這題轉化成再次展示你對 AQS 整體設計理解的機會。

## 相關

- [[006-aqs-principle.md]]
