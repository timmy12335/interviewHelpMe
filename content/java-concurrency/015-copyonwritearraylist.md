---
id: java-concurrency-015
category: java-concurrency
slug: copyonwritearraylist
title: CopyOnWriteArrayList 的原理與適用場景
difficulty: medium
tags: [CopyOnWriteArrayList, 讀寫分離, fail-safe]
source: original
---

# 題目

`CopyOnWriteArrayList` 是怎麼實現執行緒安全的？它適合什麼場景，又有什麼明顯缺點？

## 核心答案

`CopyOnWriteArrayList` 採用「寫入時複製」策略：每次寫操作（新增、刪除、修改）都會複製一份新的底層陣列，在新陣列上完成修改後，再把引用指向新陣列，寫操作之間用 `ReentrantLock` 互斥，但讀操作完全不加鎖。它適合「讀多寫極少」的場景，缺點是寫入成本高（每次都要複製整個陣列）且無法保證讀到最新資料（弱一致性）。

## 詳細解析

**寫入時複製（Copy-On-Write）機制**：

1. 呼叫 `add()`、`remove()`、`set()` 等寫方法時，先用 `ReentrantLock` 加鎖（保證同一時間只有一個執行緒在寫）。
2. 把目前的底層陣列複製一份新陣列（長度通常是原陣列 +1 或相應調整）。
3. 在新陣列上執行實際的增刪改操作。
4. 把 `volatile Object[] array` 欄位指向這個新陣列，然後釋放鎖。

**讀操作為什麼不用加鎖**：讀取只是直接存取 `volatile array` 這個引用指向的陣列快照，`volatile` 保證了寫操作完成後（陣列引用切換）對其他執行緒的可見性，讀取本身不涉及修改操作，因此不需要鎖。

**為什麼是「弱一致性」／fail-safe 迭代**：透過 `iterator()` 取得的迭代器，實際上是綁定在建立迭代器那一刻的陣列快照上。如果迭代過程中，其他執行緒對 List 進行了寫入（產生了新陣列），迭代器手上拿的仍然是舊陣列的快照，**不會拋出 `ConcurrentModificationException`**（這就是所謂的 fail-safe，與 `ArrayList` 迭代時檢測到結構性修改就拋出例外的 fail-fast 行為相對）。但這也意味著：透過這個迭代器看到的資料，可能不是「當下最新」的資料，這是一種弱一致性保證。

**適用場景與缺點**：

- **適合**：讀操作遠多於寫操作，且能接受讀到的資料略有延遲（不要求強一致性）的場景，例如：系統設定/黑白名單這種很少變動但頻繁被讀取的清單、監聽器列表（觀察者模式中的 listener 集合）。
- **缺點**：
  1. **寫入成本高**：每次寫入都要複製整個陣列，若陣列很大或寫入頻繁，效能會明顯劣化，且會產生大量垃圾物件增加 GC 壓力。
  2. **記憶體佔用瞬間翻倍**：複製陣列的瞬間，記憶體中同時存在新舊兩份陣列。
  3. **不適合資料量大、寫入頻繁的場景**。

**與 `ConcurrentHashMap` 的設計理念對比**：`CopyOnWriteArrayList` 是「讀寫分離、犧牲寫入效能換取讀取的極致效能與簡單性」；`ConcurrentHashMap` 則是「鎖粒度細化，讀寫都要兼顧效能」，兩者的設計取捨方向不同，面試時能對比說明會顯示出更全面的理解。

## 常見追問

- 為什麼說 `CopyOnWriteArrayList` 的迭代器是 fail-safe 而 `ArrayList` 是 fail-fast？
- 如果要在高寫入頻率場景下做讀寫分離，有沒有比 `CopyOnWriteArrayList` 更合適的方案（例如讀寫鎖 `ReentrantReadWriteLock`）？
- `CopyOnWriteArraySet` 和 `CopyOnWriteArrayList` 的關係是什麼？

## 相關

- [[014-concurrenthashmap-internals.md]]
- [[016-blockingqueue-implementations.md]]
