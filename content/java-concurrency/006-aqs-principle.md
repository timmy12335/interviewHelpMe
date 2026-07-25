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

## 面試回答方式

這是一題「框架設計題」，最好的答法是先講「AQS 是什麼」（一個 `state` + 一個佇列 + 模板方法的抽象框架），再解釋「為什麼這樣設計能支撐這麼多不同工具」——重點放在「子類別只需要決定 state 怎麼解讀，排隊喚醒都是共用邏輯」這個核心洞見，這才是這題真正想考的設計思想，而不是背誦某個工具的 `state` 具體代表什麼數字。如果面試官是資深工程師，講到最後可以主動提一句「這是 Doug Lea 用模板方法模式（Template Method Pattern）解決『重複造輪子』問題」的設計模式視角，會是明顯加分項。

## 常見追問

### ReentrantReadWriteLock 如何用一個 state 同時表示讀鎖與寫鎖的狀態？

**核心答案**：把 32 位元的 `state` 拆成高 16 位與低 16 位，高 16 位表示讀鎖被持有的次數（共享鎖計數），低 16 位表示寫鎖的重入次數（獨佔鎖計數）。

**詳細解析**：這是一個典型的「位元運算節省狀態空間」的設計技巧。取得讀鎖時，用位移運算把高 16 位加 1；取得寫鎖時，直接對低 16 位做加法（因為寫鎖是獨佔的，判斷條件是低 16 位是否為 0，或持有者是否為當前執行緒本身以支援重入）。因為讀鎖和寫鎖的狀態被編碼進同一個 `int` 裡，AQS 原本「一個 state 對應一種語意」的模型才能被擴展成同時管理兩種鎖的複合狀態，這也展示了 AQS 的 `state` 語意可以由子類別完全自訂解讀方式的彈性。

**面試回答方式**：能講出「高 16 位、低 16 位」這個具體拆分方式，會比只說「內部有個機制同時管理讀寫鎖」更有說服力，這是能明顯看出是否讀過原始碼的細節題。

### AQS 如何避免執行緒被喚醒後又立即因競爭失敗而反覆掛起？

**核心答案**：AQS 在執行緒被喚醒、準備重新嘗試取得資源之前，通常會結合「自旋（在少量重試次數內不立即掛起）」與「park/unpark」機制，並透過佇列節點的等待狀態（`waitStatus`）減少不必要的喚醒與競爭。

**詳細解析**：AQS 的 `acquireQueued` 方法邏輯是：執行緒被喚醒後，會先嘗試呼叫 `tryAcquire` 搶佔資源；如果自己確實是佇列中排在最前面（前驅是 `head`）且搶佔成功，才真正繼續執行；如果搶佔失敗，會再次呼叫 `LockSupport.park()` 掛起，等待下一次被喚醒。這個「喚醒後先嘗試、失敗再掛起」的迴圈設計本身就是為了避免每次喚醒都要立即進入完整的阻塞/喚醒開銷；同時，AQS 用節點的 `waitStatus` 欄位（例如 `SIGNAL` 狀態）確保只有真正需要被喚醒的節點才會收到喚醒信號，避免無意義的廣播式喚醒導致大量執行緒同時醒來競爭卻大部分又失敗掛回去。

**面試回答方式**：這題偏底層原始碼細節，如果不確定具體實作，誠實地說「機制上是喚醒後重新嘗試、失敗則再次掛起，具體節點狀態管理的細節我還需要再深入原始碼確認」也是合理誠實的回答方式，好過硬掰一個不確定的答案。

### 自己動手寫一個「只允許兩個執行緒同時存取」的同步器需要覆寫哪些方法？

**核心答案**：這是共享模式的需求，需要繼承 AQS 並覆寫 `tryAcquireShared` 與 `tryReleaseShared` 兩個方法，把 `state` 初始化為 2（代表剩餘可用名額）。

**詳細解析**：`tryAcquireShared` 的邏輯是：用 CAS 嘗試把 `state` 減 1，若減完後結果 `>= 0` 代表搶佔成功（回傳正數或 0 表示成功），若 `state` 已經是 0 則搶佔失敗（回傳負數），執行緒會被放入佇列等待；`tryReleaseShared` 則是把 `state` 加 1，並回傳是否需要喚醒後續等待的執行緒。這其實就是 `Semaphore` 內部實作的簡化版本（`Semaphore` 就是把初始 `state` 設為傳入的許可數，邏輯完全一致）。能親手推導出這個實作，代表你真正理解 AQS 共享模式的運作原理，而不只是會使用現成的 `Semaphore`。

**面試回答方式**：如果被要求現場推導，先講清楚「這其實就是 `Semaphore` 許可數為 2 的特例」，再具體說明 `tryAcquireShared`/`tryReleaseShared` 各自要做什麼判斷，這種「把新問題歸約成你已經懂的已知問題」的回答方式在面試中是很強的訊號。

## 相關

- [[004-synchronized-vs-reentrantlock.md]]
- [[005-reentrantlock-fair-vs-unfair.md]]
- [[007-countdownlatch-cyclicbarrier-semaphore.md]]
