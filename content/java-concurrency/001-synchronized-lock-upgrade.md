---
id: java-concurrency-001
category: java-concurrency
slug: synchronized-lock-upgrade
title: synchronized 的底層實作與鎖升級機制
difficulty: medium
tags: [synchronized, monitor, 鎖升級, JVM]
source: original
---

# 題目

`synchronized` 底層是怎麼實作的？什麼是鎖升級（偏向鎖 → 輕量級鎖 → 重量級鎖）？

## 核心答案

`synchronized` 依賴物件頭（Mark Word）與 Monitor（管程）實作。JDK 6 之後引入鎖升級機制，鎖只會單向升級（不會降級），依競爭程度從偏向鎖逐步升級為輕量級鎖、最終升級為重量級鎖，藉此在低競爭場景避免作業系統層級互斥鎖的開銷。

## 詳細解析

**物件頭與 Mark Word**：每個 Java 物件的物件頭包含 Mark Word，儲存鎖狀態、hashCode、GC 分代年齡等資訊，鎖狀態就記錄在 Mark Word 的低位元。

**三種鎖狀態**：

1. **偏向鎖（Biased Locking）**：假設鎖大多數時間只被同一執行緒重複取得。第一次取得鎖時，把執行緒 ID 寫入 Mark Word；之後同一執行緒再進入同步塊，只需比對 Mark Word 中的執行緒 ID，無需 CAS。一旦有其他執行緒嘗試競爭，立即撤銷偏向鎖並升級。
2. **輕量級鎖（Lightweight Locking）**：出現輕度競爭（但非同時競爭，交替執行）時使用。執行緒在自己的棧幀中建立 Lock Record，透過 CAS 把 Mark Word 指向 Lock Record；若 CAS 失敗，代表存在競爭，先自旋嘗試，自旋失敗則升級為重量級鎖。
3. **重量級鎖（Heavyweight Locking）**：多執行緒同時競爭激烈時，鎖對應到作業系統層級的 Monitor（`ObjectMonitor`），未取得鎖的執行緒會被掛起（阻塞），涉及使用者態／核心態切換，開銷最大。

**鎖只升不降**：因為降級判斷成本高、收益低，JVM 設計上鎖狀態只會單向升級，不會從重量級降回輕量級或偏向鎖。

**Monitor 與 wait/notify**：重量級鎖對應的 `ObjectMonitor` 內部維護 `_owner`（持有鎖的執行緒）、`_EntryList`（等待取得鎖的執行緒佇列）與 `_WaitSet`（呼叫 `wait()` 後等待被喚醒的執行緒集合），這也是 `Object.wait()/notify()/notifyAll()` 必須在 `synchronized` 區塊內呼叫的原因——它們操作的正是同一個 Monitor。

**注意**：JDK 15 起偏向鎖預設關閉（`-XX:-UseBiasedLocking` 影響已不明顯），因為現代高並發服務裡偏向鎖的撤銷成本反而常常超過收益；面試回答時應同時提到這個演進背景，而不是只背三段式升級。

## 常見追問

- 為什麼 JDK 15 之後預設關閉偏向鎖？
- 輕量級鎖的自旋策略是固定次數還是自適應自旋？
- `synchronized` 修飾靜態方法和實例方法鎖的對象分別是什麼？

## 相關

- [[003-jmm-happens-before.md]]
- [[004-synchronized-vs-reentrantlock.md]]
