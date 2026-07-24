---
id: java-concurrency-020
category: java-concurrency
slug: wait-notify-and-condition
title: wait/notify/notifyAll 與 Condition 的關係與正確用法
difficulty: medium
tags: [wait, notify, Condition, 虛假喚醒]
source: original
---

# 題目

`wait()`、`notify()`、`notifyAll()` 為什麼必須在 `synchronized` 區塊內呼叫？為什麼 `wait()` 通常要放在 `while` 迴圈而不是 `if` 裡？`Condition` 和它們有什麼關係？

## 核心答案

`wait`/`notify`/`notifyAll` 是 `Object` 類別的方法，操作的是這個物件對應的 Monitor 的等待集合（wait set），必須先持有這個物件的鎖（即在對應的 `synchronized` 區塊內）才能呼叫，否則拋出 `IllegalMonitorStateException`。`wait()` 要放在 `while` 迴圈判斷條件，是為了防範「虛假喚醒」與「條件在喚醒後被其他執行緒再次改變」的情況。`Condition` 是 `Lock` 體系下的等價物，功能更強，支援一個鎖對應多組獨立的等待佇列。

## 詳細解析

**為什麼必須持鎖才能呼叫**：`wait()` 的語意是「釋放目前持有的鎖，並讓當前執行緒進入這個物件 Monitor 的等待集合（`_WaitSet`）中阻塞」；`notify()`/`notifyAll()` 的語意是「從等待集合中喚醒一個/所有執行緒，讓它們重新競爭這把鎖」。這些操作直接涉及 Monitor 內部狀態的變更，必須確保呼叫者當下正持有這把鎖，才能保證操作的正確性與可見性，這也是為什麼它們被設計成必須在對應的 `synchronized` 區塊內呼叫。

**為什麼 `wait()` 要放在 `while` 而不是 `if`**：典型的等待模式是：

```java
synchronized (lock) {
    while (!條件成立) {
        lock.wait();
    }
    // 條件成立，執行後續邏輯
}
```

用 `while` 而不是 `if` 的原因：

1. **虛假喚醒（Spurious Wakeup）**：作業系統層級的執行緒喚醒機制在極少數情況下可能無緣無故喚醒一個正在 `wait()` 的執行緒，即使沒有任何執行緒呼叫過 `notify()`。JVM 規範明確允許這種情況發生，因此程式碼必須自行重新檢查條件。
2. **`notifyAll()` 喚醒多個執行緒但條件只滿足一次**：例如生產者消費者模式中，`notifyAll()` 喚醒了所有等待消費的執行緒，但佇列裡可能只新增了一筆資料，只有一個執行緒能真正消費到東西，其他被喚醒的執行緒重新檢查後應該發現條件不滿足，繼續回去等待。
3. **被喚醒後，鎖被重新競爭取得之前，條件可能已被其他執行緒再次改變**：執行緒被喚醒後不會立即恢復執行，還需要重新競爭鎖，這段時間內條件可能又變化了，用 `while` 迴圈能確保恢復執行時條件依然成立。

**`Condition` 是什麼**：`Condition` 是 `java.util.concurrent.locks` 包下的介面，透過 `lock.newCondition()` 建立，提供 `await()`（等同 `wait()`）、`signal()`（等同 `notify()`）、`signalAll()`（等同 `notifyAll()`）。與內建 Monitor 的關鍵差異是：一個 `Lock` 可以建立多個獨立的 `Condition`，分別對應不同的等待佇列，例如經典的有界緩衝區問題可以用兩個 `Condition`（`notFull`、`notEmpty`）分別管理「佇列已滿等待被消費」和「佇列為空等待被生產」的執行緒，比只有單一等待集合的內建 Monitor 更精細，能減少不必要的喚醒（不用每次都 `notifyAll` 喚醒所有等待者，可以只精準喚醒等待特定條件的那一組執行緒）。

## 常見追問

- `notify()` 和 `notifyAll()` 該怎麼選？為什麼大多數情況建議用 `notifyAll()`（避免遺漏喚醒導致的執行緒永久等待，除非能證明所有等待執行緒的等待條件完全相同）？
- 用 `Condition` 實作一個簡單的生產者消費者佇列的框架大致是什麼樣子？
- `LockSupport.park()`/`unpark()` 和 `wait()`/`notify()` 有什麼本質差異（`park`/`unpark` 不需要先持有鎖，且不受「先 wait 後 notify」順序限制）？

## 相關

- [[006-aqs-principle.md]]
- [[001-synchronized-lock-upgrade.md]]
