---
id: java-concurrency-016
category: java-concurrency
slug: blockingqueue-implementations
title: BlockingQueue 常見實作類別比較
difficulty: medium
tags: [BlockingQueue, 生產者消費者]
source: original
---

# 題目

`ArrayBlockingQueue`、`LinkedBlockingQueue`、`SynchronousQueue`、`PriorityBlockingQueue` 有什麼差異？各自適合什麼場景？

## 核心答案

`ArrayBlockingQueue` 是有界佇列，底層陣列，一把鎖控制存取；`LinkedBlockingQueue` 預設無界（可指定容量），底層鏈結串列，讀寫可用兩把鎖分離提升並行度；`SynchronousQueue` 本身不儲存任何元素，每個 `put` 必須配對一個 `take` 才能完成，適合直接交接任務；`PriorityBlockingQueue` 是無界的優先級佇列，元素按照優先級（`Comparable`/`Comparator`）出列而非先進先出。

## 詳細解析

**`ArrayBlockingQueue`**：

- 底層是固定大小的陣列，建構時必須指定容量（有界）。
- 讀寫共用同一把 `ReentrantLock`（可搭配兩個 `Condition`：`notEmpty`、`notFull`），意味著同一時間只能有一個執行緒在存取（無論讀或寫）。
- 適合需要明確控制記憶體上限、對佇列容量有嚴格要求的場景（例如前面提到的執行緒池佇列，避免無界導致 OOM）。

**`LinkedBlockingQueue`**：

- 底層是鏈結串列，若建構時不指定容量，預設容量是 `Integer.MAX_VALUE`（等同無界，需注意 OOM 風險）。
- 讀鎖與寫鎖是分開的兩把鎖（`takeLock`、`putLock`），因此在佇列非空且未滿的情況下，讀取和寫入可以同時進行，並行度比 `ArrayBlockingQueue` 高。
- 適合任務生產和消費速度較穩定、需要更高吞吐量的生產者消費者場景，但務必顯式指定容量上限。

**`SynchronousQueue`**：

- 內部沒有任何容量，`put()` 操作會阻塞，直到有另一個執行緒呼叫 `take()` 來「接手」這個元素，反之亦然——本質上是一個「執行緒對執行緒」的直接交接點，而不是一個真正的儲存容器。
- 適合任務量不大但需要極低延遲交接的場景，`Executors.newCachedThreadPool()` 就是用 `SynchronousQueue`，讓提交的任務盡快被某個執行緒接手執行，而不是排隊等待。

**`PriorityBlockingQueue`**：

- 底層用二元堆（heap）實作，無界，元素出列順序由 `compareTo()` 或傳入的 `Comparator` 決定優先級，而非先進先出。
- 適合需要「優先處理重要任務」的場景，例如任務排程系統中依優先級或截止時間排序待執行任務。
- 注意事項：因為無界，同樣要小心大量堆積導致記憶體問題；且多個優先級相同的元素之間，出列順序不保證與插入順序一致。

**選型速查表**：

| 需求 | 建議 |
|------|------|
| 需要嚴格控制記憶體上限 | `ArrayBlockingQueue` |
| 高吞吐、讀寫分離提升並行度 | `LinkedBlockingQueue`（顯式指定容量） |
| 任務需要立即交接、不緩衝 | `SynchronousQueue` |
| 任務需要按優先級處理 | `PriorityBlockingQueue` |

## 常見追問

- `SynchronousQueue` 有公平模式和非公平模式，兩者實作機制有何不同（公平模式底層用佇列，非公平模式底層用棧）？
- `LinkedBlockingQueue` 的讀寫分離鎖為什麼在佇列為空或為滿時仍需要額外同步（邊界情況需要同時持有兩把鎖）？
- `DelayQueue` 是如何實現「延遲任務排程」的？

## 相關

- [[009-threadpoolexecutor-core-params.md]]
