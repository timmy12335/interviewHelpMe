---
id: java-concurrency-006
category: java-concurrency
slug: aqs-principle
title: AQS（AbstractQueuedSynchronizer）的原理
difficulty: hard
tags: [AQS, ReentrantLock, CLH佇列]
source: original
---

# 題目

AQS 是什麼？它是如何用一個 `int` 狀態值和一個佇列，支撐起 `ReentrantLock`、`Semaphore`、`CountDownLatch` 這麼多不同的同步工具的？

## 核心答案

AQS 是 `java.util.concurrent.locks` 包下的一個抽象基礎框架，核心是一個 `volatile int state` 表示同步狀態，加上一個 CLH 變種的雙向等待佇列（FIFO）管理搶不到資源的執行緒。子類別只需要實作「如何解讀與修改 `state`」（獨佔或共享語意），佇列的排隊、阻塞、喚醒邏輯全部由 AQS 統一處理。

## 詳細解析

**三個核心組件**：

1. **`state`**：一個 `volatile int`，語意由子類別自行定義。例如 `ReentrantLock` 用它表示重入次數（0 表示未鎖定，每次重入 +1）；`Semaphore` 用它表示剩餘許可數；`CountDownLatch` 用它表示剩餘倒數次數。
2. **CLH 變種佇列**：搶不到資源的執行緒被包裝成 `Node` 加入雙向鏈結佇列尾部並阻塞（`LockSupport.park()`）；持有資源的執行緒釋放時，喚醒佇列頭部的下一個節點。
3. **模板方法**：子類別只需覆寫 `tryAcquire`/`tryRelease`（獨佔模式）或 `tryAcquireShared`/`tryReleaseShared`（共享模式），AQS 的 `acquire()`/`release()` 等模板方法負責呼叫這些方法並處理排隊、阻塞、喚醒的通用邏輯。

**獨佔 vs 共享模式**：

- **獨佔模式**：同一時間只有一個執行緒能持有資源，例如 `ReentrantLock`（`state` 為 0/1，重入疊加）。
- **共享模式**：同一時間可以有多個執行緒持有資源，例如 `Semaphore`（`state` 為剩餘許可數，每次 `acquire` 減 1）、`CountDownLatch`（`state` 為剩餘計數，減到 0 才釋放所有等待者）。

**為什麼要抽象出 AQS**：如果沒有 AQS，每個同步工具都要自己實作「執行緒排隊、阻塞、喚醒、避免虛假喚醒」這套複雜且容易出錯的邏輯。AQS 把這套通用機制抽出來，讓上層工具只需要專注於「資源狀態的語意判斷」，大幅降低了實作正確、高效能同步工具的門檻，這也是 Doug Lea 設計 `java.util.concurrent` 包的核心思想之一。

**與 `synchronized` 的本質差異**：`synchronized` 的 Monitor 是 JVM／作業系統層級實作，行為固定；AQS 是純 Java 程式碼實作的框架，可以被靈活擴展出各種不同語意的同步工具，這也是 `java.util.concurrent.locks` 包比內建 `synchronized` 更靈活的根本原因。

## 常見追問

- `ReentrantReadWriteLock` 如何用一個 `state` 同時表示讀鎖與寫鎖的狀態（高低位元拆分）？
- AQS 如何避免執行緒被喚醒後又立即因競爭失敗而反覆掛起（自旋 + park 的結合）？
- 自己動手寫一個簡單的「只允許兩個執行緒同時存取」的同步器需要覆寫哪些方法？

## 相關

- [[004-synchronized-vs-reentrantlock.md]]
- [[005-reentrantlock-fair-vs-unfair.md]]
- [[007-countdownlatch-cyclicbarrier-semaphore.md]]
