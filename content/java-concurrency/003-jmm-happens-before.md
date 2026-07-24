---
id: java-concurrency-003
category: java-concurrency
slug: jmm-happens-before
title: Java 記憶體模型（JMM）與 happens-before 規則
difficulty: medium
tags: [JMM, happens-before, 記憶體模型]
source: original
---

# 題目

什麼是 Java 記憶體模型？happens-before 有哪些常見規則？它解決了什麼問題？

## 核心答案

JMM 定義了多執行緒程式中，一個執行緒對共享變數的寫入何時對另一個執行緒可見。happens-before 是 JMM 用來描述「操作 A 的結果對操作 B 可見」的偏序關係，只要兩個操作滿足 happens-before，前者的記憶體效果就保證對後者可見，即使兩者在不同執行緒上執行。

## 詳細解析

**為什麼需要 JMM**：現代 CPU 有多級快取，編譯器與處理器都可能為了效能對指令重排。在單執行緒中重排不影響最終結果（as-if-serial），但在多執行緒中，若沒有規範，一個執行緒的寫入何時、以何種順序被另一個執行緒看到將完全不確定。JMM 就是規範這件事的抽象模型。

**常見 happens-before 規則**：

1. **程式順序規則**：同一執行緒內，前面的操作 happens-before 後面的操作。
2. **監視器鎖規則**：對一個鎖的解鎖操作 happens-before 後續對這個鎖的加鎖操作（即 A 執行緒解鎖後，B 執行緒加鎖時能看到 A 在鎖內的所有寫入）。
3. **volatile 變數規則**：對一個 `volatile` 變數的寫操作 happens-before 後續對這個變數的讀操作。
4. **執行緒啟動規則**：`Thread.start()` 之前對變數的寫入，happens-before 該執行緒內的所有操作。
5. **執行緒終止規則**：執行緒內的所有操作 happens-before 其他執行緒偵測到該執行緒已終止（如透過 `Thread.join()` 返回，或 `Thread.isAlive()` 返回 false）。
6. **傳遞性**：若 A happens-before B，且 B happens-before C，則 A happens-before C。
7. **中斷規則**：對執行緒 `interrupt()` 方法的呼叫 happens-before 被中斷執行緒偵測到中斷事件。

**與具體實作的關係**：`synchronized`、`volatile`、`java.util.concurrent` 中的鎖與工具類（如 `CountDownLatch`、執行緒池的任務提交與執行）背後都是靠建立 happens-before 關係來保證可見性，面試時最好能舉出「執行緒池任務提交 happens-before 任務內部執行」這種具體例子，而不只是背規則。

**常見誤區**：happens-before 不代表「時間上先發生」，而是一種可見性保證的偏序關係；兩個操作即使時間上 A 先於 B 執行，若沒有建立 happens-before 關係，B 依然可能看不到 A 的寫入結果。

## 常見追問

- `final` 欄位的 happens-before 保證是什麼（安全發布相關）？
- 為什麼說 `synchronized` 的可見性保證比 `volatile` 更強（同時保證原子性）？
- happens-before 和指令重排、記憶體屏障之間的關係？

## 相關

- [[002-volatile-semantics.md]]
- [[001-synchronized-lock-upgrade.md]]
