---
id: java-concurrency-002
category: java-concurrency
slug: volatile-semantics
title: volatile 關鍵字保證了什麼，又不保證什麼
difficulty: easy
tags: [volatile, 可見性, 記憶體屏障]
source: original
---

# 題目

`volatile` 關鍵字提供了哪些保證？為什麼 `volatile` 不能保證 `i++` 這種操作的執行緒安全？

## 核心答案

`volatile` 保證**可見性**與**有序性**（禁止特定的指令重排），但**不保證原子性**。因此 `count++` 這種「讀取－修改－寫回」的複合操作即使加了 `volatile` 仍然不是執行緒安全的。

## 詳細解析

**可見性**：一個執行緒寫入 `volatile` 變數後，會立即刷新到主記憶體；其他執行緒讀取該變數時，會強制從主記憶體重新讀取，而不是使用 CPU 快取或暫存器中的舊值。

**有序性（禁止重排）**：JVM 透過插入記憶體屏障（Memory Barrier）限制指令重排：

- 每個 `volatile` 寫操作前插入 StoreStore 屏障，寫操作後插入 StoreLoad 屏障。
- 每個 `volatile` 讀操作後插入 LoadLoad 與 LoadStore 屏障。

這確保了 `volatile` 寫入之前的所有普通變數寫入，不會被重排到 `volatile` 寫入之後（常用於安全發布物件，例如雙重檢查鎖定單例）。

**為什麼不保證原子性**：`count++` 實際上是三個步驟：讀取 `count`、加 1、寫回 `count`。即使每一步對 `volatile` 變數的讀寫都是可見的，兩個執行緒仍可能同時讀到相同的舊值，各自加 1 後寫回，導致一次更新遺失。要解決這個問題，需要用 `synchronized`、`AtomicInteger` 這類提供原子性保證的機制。

**適用場景**：`volatile` 適合「狀態標誌位」（例如執行緒的停止旗標 `running`）、單次寫入多次讀取、或搭配雙重檢查鎖定確保物件建構完全發布後才被其他執行緒看到，而不適合需要複合操作的計數器或累加場景。

## 常見追問

- `volatile` 陣列能保證陣列元素的可見性嗎（只保證陣列引用本身）？
- `volatile` 與 `synchronized` 在有序性保證上的差異？
- 為什麼雙重檢查鎖定單例中的實例變數必須加 `volatile`？

## 相關

- [[003-jmm-happens-before.md]]
- [[022-double-checked-locking-singleton.md]]
- [[018-cas-and-aba-problem.md]]
