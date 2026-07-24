---
id: java-concurrency-021
category: java-concurrency
slug: thread-lifecycle-states
title: Java 執行緒的生命週期與狀態轉換
difficulty: easy
tags: [執行緒狀態, Thread.State]
source: original
---

# 題目

Java 執行緒有哪些狀態？`BLOCKED` 和 `WAITING` 有什麼區別？

## 核心答案

`Thread.State` 定義了 6 種狀態：`NEW`（新建尚未啟動）、`RUNNABLE`（可執行，包含作業系統層級的就緒與執行中）、`BLOCKED`（阻塞，等待取得 `synchronized` 鎖）、`WAITING`（無限期等待，需要其他執行緒明確喚醒）、`TIMED_WAITING`（限時等待，逾時後自動恢復）、`TERMINATED`（已終止）。`BLOCKED` 專指「等待進入 `synchronized` 臨界區」，`WAITING`/`TIMED_WAITING` 則涵蓋 `wait()`、`join()`、`LockSupport.park()` 等更廣泛的主動等待場景。

## 詳細解析

**六種狀態詳解**：

1. **`NEW`**：`Thread` 物件已建立，但尚未呼叫 `start()`。
2. **`RUNNABLE`**：呼叫 `start()` 之後的狀態，這個狀態涵蓋了作業系統層級的「就緒（ready，等待 CPU 排程）」與「執行中（running）」兩種情況——Java 執行緒模型不區分這兩者，都統一算作 `RUNNABLE`。
3. **`BLOCKED`**：執行緒正在等待取得一個 `synchronized` 鎖（進入同步方法/區塊，或從 `wait()` 中被喚醒後要重新競爭鎖）時的狀態。
4. **`WAITING`**：執行緒呼叫了 `Object.wait()`（無逾時參數）、`Thread.join()`（無逾時參數）、`LockSupport.park()` 後進入這個狀態，需要其他執行緒呼叫對應的喚醒方法（`notify`/`notifyAll`、目標執行緒結束、`LockSupport.unpark()`）才能恢復。
5. **`TIMED_WAITING`**：與 `WAITING` 類似，但呼叫的是帶逾時參數的版本，例如 `Thread.sleep(ms)`、`Object.wait(ms)`、`Thread.join(ms)`、`LockSupport.parkNanos()`，逾時後會自動恢復，不需要其他執行緒喚醒。
6. **`TERMINATED`**：執行緒的 `run()` 方法已執行完畢（正常結束或因未捕捉例外而終止）。

**`BLOCKED` 與 `WAITING` 的核心差異**：

- **觸發原因不同**：`BLOCKED` 只在「競爭 `synchronized` 鎖失敗」時出現；`WAITING`/`TIMED_WAITING` 則是執行緒**主動**呼叫了某個等待方法（`wait`、`join`、`park` 等）而進入的狀態。
- **能否被中斷**：處於 `BLOCKED` 狀態的執行緒無法回應 `interrupt()`（會一直阻塞直到搶到鎖）；處於 `WAITING`（呼叫 `wait()`）的執行緒可以被 `interrupt()` 喚醒並拋出 `InterruptedException`。
- **對應場景不同**：`BLOCKED` 對應「隱式鎖競爭」；`WAITING` 對應「主動的協調等待」，例如生產者消費者模式中消費者呼叫 `wait()` 等待新資料。

**排查應用**：分析 `jstack` 線程堆疊快照時，正確理解這些狀態是判斷問題的第一步——如果大量執行緒處於 `BLOCKED` 狀態且都在等待同一把鎖，通常代表鎖競爭激烈或發生死鎖；如果執行緒長時間處於 `WAITING`/`TIMED_WAITING`，則需要看它在等待什麼條件、為什麼遲遲沒有被滿足或喚醒。

## 常見追問

- 為什麼 `Thread.State` 沒有直接對應作業系統的「就緒」與「執行中」兩種狀態？
- `Thread.sleep()` 和 `Object.wait()` 有什麼本質差異（`sleep` 不釋放鎖，`wait` 會釋放鎖）？
- 執行緒被 `interrupt()` 之後，狀態會如何變化？

## 相關

- [[020-wait-notify-and-condition.md]]
- [[017-deadlock-conditions-and-troubleshooting.md]]
