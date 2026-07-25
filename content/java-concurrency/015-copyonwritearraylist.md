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

`CopyOnWriteArrayList` 採用「寫入時複製」策略：每次寫操作都會複製一份新的底層陣列，在新陣列上完成修改後，再把引用指向新陣列，寫操作之間用 `ReentrantLock` 互斥，但讀操作完全不加鎖。它適合「讀多寫極少」的場景，缺點是寫入成本高且無法保證讀到最新資料（弱一致性）。

## 詳細解析

**寫入時複製機制**：

1. 呼叫寫方法時，先用 `ReentrantLock` 加鎖。
2. 把目前的底層陣列複製一份新陣列。
3. 在新陣列上執行實際的增刪改操作。
4. 把 `volatile Object[] array` 欄位指向這個新陣列，然後釋放鎖。

**讀操作為什麼不用加鎖**：讀取只是直接存取 `volatile array` 這個引用指向的陣列快照，`volatile` 保證了寫操作完成後對其他執行緒的可見性。

**為什麼是弱一致性／fail-safe 迭代**：透過 `iterator()` 取得的迭代器綁定在建立那一刻的陣列快照上，不會拋出 `ConcurrentModificationException`（fail-safe），但看到的資料可能不是「當下最新」的。

**適用場景與缺點**：適合讀多寫極少、能接受讀到略有延遲資料的場景（設定/黑白名單、監聽器列表）；缺點是寫入成本高（每次複製整個陣列）、記憶體佔用瞬間翻倍、不適合資料量大寫入頻繁的場景。

## 面試回答方式

這題最好用「讀寫分離、犧牲寫換取讀」這句話當開場總結，立刻讓面試官知道你抓住了設計核心，再展開講寫入時複製的四個步驟。務必主動提到「fail-safe」這個關鍵詞並和 `ArrayList` 的 fail-fast 做對比，這是這題經常被追問的重點，先講清楚能減少一輪來回。結尾用「讀多寫少」這個判斷準則收尾，並舉一到兩個具體場景（監聽器列表、白名單），讓回答落地而不是停留在機制描述。

## 常見追問

### 為什麼說 CopyOnWriteArrayList 的迭代器是 fail-safe 而 ArrayList 是 fail-fast？

**核心答案**：`ArrayList` 的迭代器在迭代過程中會檢查一個 `modCount`（結構修改次數）欄位，若發現與建立迭代器時記錄的值不一致就立即拋出 `ConcurrentModificationException`（fail-fast）；`CopyOnWriteArrayList` 的迭代器則是綁定在建立當下的陣列快照上，之後不管原始 List 怎麼被修改，這個快照都不會變，因此永遠不會偵測到「結構被修改」，也就永遠不會拋出例外（fail-safe）。

**詳細解析**：`ArrayList` 這樣設計是為了在單執行緒（或明確知道沒有並行修改）情境下，盡早偵測出「一邊迭代一邊修改」這種容易導致邏輯錯誤的用法，用快速失敗的方式提醒開發者；但這個機制在多執行緒場景下反而是個麻煩——只要有其他執行緒在迭代過程中修改了 List，就會讓迭代執行緒收到例外而中斷。`CopyOnWriteArrayList` 從根本設計上避開了這個問題：既然每次寫入都會產生一個全新的陣列，迭代器只需要老老實實地拿著它建立時那份陣列的引用走到底，完全不需要關心之後有沒有人修改了「現在」的 List，因為它手上這份資料本來就是一份獨立的歷史快照，這是用「弱一致性」換取「迭代過程中不會出錯」的設計取捨。

**面試回答方式**：用 `modCount` 這個具體機制名稱解釋 `ArrayList` 的 fail-fast，再對比 `CopyOnWriteArrayList` 「迭代器直接綁定快照」的做法，這種「講清楚兩邊各自的底層機制再對比」的答法，比只丟出「fail-fast/fail-safe」這兩個名詞更有深度。

### 如果要在高寫入頻率場景下做讀寫分離，有沒有比 CopyOnWriteArrayList 更合適的方案？

**核心答案**：可以考慮 `ReentrantReadWriteLock` 包裝一個普通的 `ArrayList`（讀鎖允許多執行緒同時讀，寫鎖互斥），或是 JDK 8 引入的 `StampedLock`（提供樂觀讀模式，讀取時完全不加鎖，只在偵測到期間有寫入發生時才降級為悲觀讀重試），這兩種方案都避免了 `CopyOnWriteArrayList` 每次寫入都要複製整個陣列的開銷。

**詳細解析**：`CopyOnWriteArrayList` 的核心問題是寫入成本隨資料量線性增長（複製整個陣列），完全不適合寫入頻繁的場景；`ReentrantReadWriteLock` 的方式雖然寫入仍然互斥，但至少不需要複製整份資料，只是直接修改原本的資料結構，寫入成本回到正常等級，只是讀取之間不再是完全無鎖（讀鎖之間雖然可以並行，但仍然有加鎖/解鎖的開銷）；`StampedLock` 則更進一步，提供了「樂觀讀」模式——讀取前先記錄一個版本戳記，讀完後檢查版本戳記是否仍然有效（期間沒有寫入發生），如果有效就直接使用讀到的資料，完全不需要真正加鎖，只有在偵測到期間確實發生了寫入時才需要退回傳統的加鎖讀取重試，這在讀多寫少但寫入沒有稀少到能接受複製陣列成本的場景中，通常能提供比 `ReentrantReadWriteLock` 更好的讀取效能。

**面試回答方式**：不要只回答「用讀寫鎖」，而要進一步比較 `ReentrantReadWriteLock` 和 `StampedLock` 的差異，並說明「樂觀讀」的概念，這種能同時提出多個方案並分析取捨的回答方式，最能展現你在並行容器選型上的廣度。

### CopyOnWriteArraySet 和 CopyOnWriteArrayList 的關係是什麼？

**核心答案**：`CopyOnWriteArraySet` 內部直接用一個 `CopyOnWriteArrayList` 來儲存元素，並在新增元素時（`add`）先線性檢查是否已經存在相同元素以維持 Set 語意（不重複），本質上是 `CopyOnWriteArrayList` 的一層包裝，而不是獨立的實作。

**詳細解析**：因為底層直接複用 `CopyOnWriteArrayList` 的寫入時複製機制，`CopyOnWriteArraySet` 具備完全一樣的效能特性與適用場景（讀多寫少、fail-safe 迭代）。但也因為「檢查重複」這個操作在底層是線性掃描整個陣列（`indexOf` 為 O(n)），`CopyOnWriteArraySet` 的新增操作比一般的 `HashSet` 慢得多，只適合元素數量不大、且同樣是讀遠多於寫的場景，例如維護一組事件監聽器、觀察者物件的集合，這也是 Java 官方文件中明確建議的典型用途。

**面試回答方式**：直接點出「底層就是包了一層 `CopyOnWriteArrayList`，用線性掃描檢查重複」這個實作事實，並補上「所以新增操作是 O(n) 比 `HashSet` 慢很多，只適合小規模讀多寫少的集合」這個效能提醒，展現你不只知道兩者有關係，還知道這個關係帶來的效能後果。

## 相關

- [[014-concurrenthashmap-internals.md]]
- [[016-blockingqueue-implementations.md]]
