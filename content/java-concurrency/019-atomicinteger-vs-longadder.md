---
id: java-concurrency-019
category: java-concurrency
slug: atomicinteger-vs-longadder
title: AtomicInteger 與 LongAdder 的效能差異
difficulty: hard
tags: [AtomicInteger, LongAdder, CAS, 分段累加]
source: original
---

# 題目

高並發計數場景下，為什麼 `LongAdder` 通常比 `AtomicLong`/`AtomicInteger` 效能更好？它的原理是什麼？

## 核心答案

`AtomicInteger`/`AtomicLong` 用單一個變數配合 CAS 自旋更新，高並發下大量執行緒會集中競爭同一個記憶體位置，CAS 失敗率隨並發數上升而急遽增加。`LongAdder` 用「分段累加」的思路，把熱點資料拆分成多個 `Cell` 槽位，不同執行緒盡量寫入不同的槽位分散競爭，最後需要總和時才把所有槽位加總，大幅降低了高並發下的 CAS 競爭衝突。

## 詳細解析

**`AtomicInteger` 的瓶頸**：`incrementAndGet()` 本質上是一個 CAS 自旋迴圈：讀取目前值、計算新值（+1）、CAS 更新，失敗就重新讀取再試。當並發執行緒數量增加，所有執行緒都在競爭同一個 `value` 欄位，CAS 失敗率會顯著上升，大量執行緒陷入自旋重試，浪費 CPU 且吞吐量無法隨執行緒數線性提升，甚至可能不升反降。

**`LongAdder` 的分段累加設計**：

- 內部維護一個 `base` 值加上一個 `Cell[]` 陣列（每個 `Cell` 內部是一個獨立的 `long` 累加值，並做了快取行填充避免偽共享）。
- 沒有競爭時，直接對 `base` 做 CAS 累加（等同於 `AtomicLong` 的行為）。
- 一旦偵測到競爭（CAS 在 `base` 上失敗），就會把後續的累加操作分散到 `Cell[]` 陣列中的某個槽位（透過執行緒的 hash 值決定寫入哪個槽位，不同執行緒盡量落在不同槽位，減少互相競爭同一個記憶體位置）。
- 需要取得目前總和時（呼叫 `sum()`），才把 `base` 與所有 `Cell` 槽位的值加總起來。這也是為什麼 `LongAdder` 的 `sum()` 只是一個「近似值」而非絕對即時精確值——因為加總過程中，其他執行緒可能仍在對某些 `Cell` 進行寫入。

**為什麼適合「高並發寫入、低頻率讀取總和」的場景**：分段累加的核心思路是「空間換時間、分散熱點」——犧牲了一點記憶體（多個 `Cell` 槽位）與讀取總和時的即時精確性，換取寫入（累加）操作在高並發下幾乎不會互相競爭同一個記憶體位置，大幅提升了寫入的吞吐量。典型應用場景是各種計數器、統計指標（例如接口呼叫次數、QPS 統計），這類場景寫入極其頻繁，但讀取總和的頻率相對低，且不要求絕對即時精確。

**偽共享（False Sharing）的處理**：`Cell` 類別特別做了記憶體填充（padding），確保不同的 `Cell` 不會落在同一個 CPU 快取行（cache line）內，避免「明明是不同執行緒各自寫入不同的邏輯變數，卻因為它們實體上位於同一個快取行，導致 CPU 快取一致性協定觸發不必要的快取失效」這種效能陷阱。

**如何選擇**：如果只是需要一個「精確、即時」的計數值且並發量不高，`AtomicLong` 已經足夠且更簡單；如果是高並發寫入、只在需要時偶爾讀一次總和（例如監控指標定期上報），`LongAdder` 通常有明顯更好的效能。

## 常見追問

- 什麼是偽共享（False Sharing）？除了 `LongAdder`，還有哪裡也用到了類似的快取行填充技巧？
- `LongAdder.sum()` 為什麼不是強一致的？在什麼場景下這種弱一致性是可以接受的？
- `LongAccumulator` 和 `LongAdder` 有什麼關係（`LongAdder` 是 `LongAccumulator` 針對加法運算的特化版本）？

## 相關

- [[018-cas-and-aba-problem.md]]
