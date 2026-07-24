---
id: java-concurrency-014
category: java-concurrency
slug: concurrenthashmap-internals
title: ConcurrentHashMap 的原理（JDK 7 分段鎖 vs JDK 8 CAS + synchronized）
difficulty: hard
tags: [ConcurrentHashMap, 分段鎖, CAS]
source: original
---

# 題目

`ConcurrentHashMap` 在 JDK 7 和 JDK 8 的實作原理有什麼差異？為什麼要這樣改？

## 核心答案

JDK 7 用「分段鎖（Segment）」把整個 Map 切成多個獨立加鎖的段，鎖粒度是「段」；JDK 8 拿掉了 Segment，改用「CAS + synchronized 鎖單一鏈結串列頭節點」的方式，鎖粒度細化到「桶（bucket）」層級，並且用紅黑樹優化長鏈結串列的查詢效能，整體並行度與效能都比 JDK 7 更好。

## 詳細解析

**JDK 7 的分段鎖設計**：

- 整個 `ConcurrentHashMap` 由多個 `Segment` 組成，每個 `Segment` 內部是一個獨立的小型 HashMap（`HashEntry` 陣列 + 鏈結串列），且 `Segment` 繼承自 `ReentrantLock`，本身就是一把鎖。
- 寫入操作只需要鎖住資料所在的那個 `Segment`，不同 `Segment` 之間的寫入可以完全並行，預設併發度（`Segment` 數量）是 16。
- 缺點：`Segment` 數量在初始化後基本固定，並行度的上限被鎖死；且結構上多了一層 `Segment` 陣列，記憶體開銷較大。

**JDK 8 的重新設計**：

- 拿掉 `Segment`，直接用 `Node[] table`（結構上更接近普通 `HashMap`）。
- **寫入鎖粒度細化到桶**：對某個 key 進行 `put` 時，先透過 CAS 嘗試在空桶位直接放入節點（無鎖）；如果該桶已經有節點（發生雜湊衝突），才對這個桶的**頭節點**加 `synchronized` 鎖，鎖的範圍只影響這一個桶內的鏈結串列/紅黑樹操作，不影響其他桶。
- **紅黑樹優化**：當某個桶內的鏈結串列長度超過閾值（預設 8）且陣列容量達到一定大小（預設 64），鏈結串列會轉換成紅黑樹，把該桶內查詢的時間複雜度從 O(n) 降到 O(log n)，避免雜湊衝突嚴重時效能劣化成鏈結串列的線性查詢。
- **併發度更高**：理論上並行度等於桶的數量（陣列大小），遠高於 JDK 7 固定的 `Segment` 數量，且陣列可以隨著元素增加而擴容（resize），JDK 8 甚至支援多執行緒協同 resize（其他執行緒發現正在擴容時可以幫忙搬遷資料，而不是傻等）。

**讀操作為什麼不太需要加鎖**：`table` 陣列與 `Node` 的關鍵欄位都用 `volatile` 修飾，讀取操作大多數情況下可以無鎖進行（利用 `volatile` 的可見性保證），只有在極少數需要等待節點遷移完成的情況才會有短暫的自旋等待。

**面試延伸**：這題常被拿來考察「鎖粒度細化」這個通用的並行設計思想——不管是資料庫的行鎖 vs 表鎖，還是 `ConcurrentHashMap` 的桶鎖 vs 段鎖，核心邏輯都是「盡量縮小鎖保護的資料範圍，讓不衝突的操作可以真正並行」，回答時能點出這個共通原理會是加分項。

## 常見追問

- JDK 8 的 `size()` 方法是怎麼在不加全域鎖的情況下統計元素個數的（`baseCount` + `CounterCell` 分段累加）？
- 為什麼鏈結串列轉紅黑樹的閾值是 8，轉回鏈結串列的閾值是 6（避免頻繁在臨界值來回轉換的抖動）？
- `ConcurrentHashMap` 的 `computeIfAbsent` 在高並發下需要注意什麼陷阱（同一個桶內遞迴呼叫可能死鎖）？

## 相關

- [[015-copyonwritearraylist.md]]
