---
id: java-concurrency-004
category: java-concurrency
slug: synchronized-vs-reentrantlock
title: synchronized 與 ReentrantLock 的差異與選型
difficulty: medium
tags: [synchronized, ReentrantLock, AQS]
source: original
---

# 題目

`synchronized` 和 `ReentrantLock` 有什麼差異？什麼情況該選哪一個？

## 核心答案

兩者都提供互斥鎖語義且都支援可重入，但 `ReentrantLock` 是 API 層級（`java.util.concurrent.locks`）的顯式鎖，功能更豐富（可中斷、可設定逾時、可實作公平鎖、支援多個 `Condition`），需要手動 `lock()/unlock()`；`synchronized` 是 JVM 層級的關鍵字，由編譯器與 JVM 自動管理加解鎖，語法更簡潔且不會忘記釋放鎖。

## 詳細解析

**共同點**：

- 都是可重入鎖（同一執行緒可重複取得同一把鎖）。
- 都能保證互斥與（配合 JMM）可見性。

**差異點**：

| 面向 | synchronized | ReentrantLock |
|------|---------------|----------------|
| 鎖釋放 | JVM 自動釋放，即使拋出例外也會釋放 | 必須手動在 `finally` 中呼叫 `unlock()`，否則死鎖 |
| 可中斷 | 不支援，執行緒阻塞後無法被中斷 | 支援 `lockInterruptibly()`，等待鎖過程中可回應中斷 |
| 逾時等待 | 不支援 | 支援 `tryLock(timeout, unit)` |
| 公平性 | 不保證公平（重量級鎖狀態下由 OS 排程） | 可選擇公平鎖或非公平鎖（建構子參數） |
| 條件變數 | 只有一組隱式的 wait-set | 可透過 `newCondition()` 建立多組等待佇列，做更精細的執行緒喚醒 |
| 效能 | JDK 6 後鎖升級機制優化了低競爭場景效能，目前與 ReentrantLock 差異不大 | 基於 AQS 實作，高競爭下表現穩定 |

**選型建議**：

- 大多數簡單同步場景，優先用 `synchronized`：語法簡潔、不會忘記釋放鎖、JVM 已充分優化。
- 需要「嘗試取鎖但不阻塞」「可設定逾時」「可回應中斷」「需要公平鎖語意」「需要多組等待條件（例如生產者/消費者用不同 Condition 區分佇列滿/空）」時，選 `ReentrantLock`。

**踩坑提醒**：使用 `ReentrantLock` 時，必須把 `unlock()` 放在 `finally` 區塊，且 `lock()` 呼叫要放在 `try` 之前（不能放進 `try` 裡），否則加鎖失敗時仍會嘗試釋放一把沒有持有的鎖，拋出 `IllegalMonitorStateException`。

## 常見追問

- `ReentrantLock` 的公平鎖是如何實作的（AQS 佇列 + `hasQueuedPredecessors()`）？
- `ReentrantReadWriteLock` 解決了什麼問題？
- 為什麼公平鎖通常吞吐量比非公平鎖低？

## 相關

- [[006-aqs-principle.md]]
- [[005-reentrantlock-fair-vs-unfair.md]]
