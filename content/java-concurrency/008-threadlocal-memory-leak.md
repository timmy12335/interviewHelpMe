---
id: java-concurrency-008
category: java-concurrency
slug: threadlocal-memory-leak
title: ThreadLocal 原理與記憶體洩漏問題
difficulty: medium
tags: [ThreadLocal, 記憶體洩漏, 弱引用]
source: original
---

# 題目

`ThreadLocal` 的原理是什麼？為什麼常說它可能導致記憶體洩漏？在執行緒池場景下要注意什麼？

## 核心答案

每個 `Thread` 物件內部持有一個 `ThreadLocalMap`，`ThreadLocalMap` 的 key 是 `ThreadLocal` 實例本身（以弱引用形式儲存），value 是實際存放的資料。記憶體洩漏的根源在於：key 是弱引用會被 GC 回收，但 value 是強引用不會被自動回收，若執行緒長期存活（例如執行緒池中的核心執行緒）且忘記呼叫 `remove()`，這些 value 就會一直佔用記憶體，形成洩漏。

## 詳細解析

**資料結構**：`Thread` 類別內部有一個 `ThreadLocal.ThreadLocalMap threadLocals` 欄位。呼叫 `threadLocal.set(value)` 實際上是：取得目前執行緒，找到它的 `ThreadLocalMap`，以 `threadLocal` 自己作為 key、`value` 作為值存入這個 map。因此不同執行緒的資料天然隔離在各自的 `Thread` 物件裡，不需要額外加鎖。

**為什麼 key 用弱引用**：`ThreadLocalMap` 的 `Entry` 繼承自 `WeakReference<ThreadLocal<?>>`，這樣設計是為了讓外部不再持有 `ThreadLocal` 實例的強引用時，GC 能夠回收這個 `ThreadLocal` 物件本身，避免 `ThreadLocal` 實例洩漏。

**洩漏是怎麼發生的**：

1. `ThreadLocal` 實例本身可能被 GC 回收（因為 key 是弱引用），此時 `Entry` 的 key 變成 `null`，但 value 仍然是強引用，不會被回收。
2. 如果目前執行緒之後不再存取這個 `ThreadLocalMap`，這些 key 為 `null` 的 Entry 及其 value 就會一直留在 map 裡，永遠沒有機會被清理，直到執行緒本身被銷毀。
3. 在使用執行緒池的場景下，執行緒是被重複使用、長期存活的，這使得洩漏風險被放大：一個請求用 `ThreadLocal` 存放使用者上下文後忘記 `remove()`，下一個請求複用了同一個執行緒卻拿到了上一個請求殘留的資料，不只是記憶體洩漏，還可能是嚴重的資料串號 bug。

**最佳實踐**：

- 使用完 `ThreadLocal` 後，務必在 `finally` 區塊呼叫 `remove()`，尤其是在執行緒池、Web 請求過濾器這類執行緒會被重複使用的場景。
- 部分框架（如 Spring 的 `RequestContextHolder`、日誌框架的 MDC）都是靠 `ThreadLocal` 實作請求上下文傳遞，這些框架通常在請求結束時的攔截器裡呼叫對應的清理方法。

## 面試回答方式

先講資料結構（`Thread` 內部有 `ThreadLocalMap`，key 是 `ThreadLocal` 自己），這是理解後面所有問題的基礎。接著講「為什麼會洩漏」時，務必按「key 弱引用被回收 → value 強引用留下 → 執行緒長期存活時永遠不會被清理」這個因果鏈說清楚，而不是只說一句「因為忘記 remove」。最後一定要連結到執行緒池場景，講出「污染下一個請求資料」這個比記憶體洩漏本身更嚴重的實務風險，這是資深工程師才會主動提到的細節，也是這題的加分關鍵。

## 常見追問

### InheritableThreadLocal 解決了什麼問題？在執行緒池場景下為什麼還是可能失效？

**核心答案**：`InheritableThreadLocal` 讓子執行緒能自動繼承父執行緒建立時的 `ThreadLocal` 值；但在執行緒池場景下，執行緒是預先建立好並反覆重複使用的，不是每次任務執行時才建立新的子執行緒，因此「建立子執行緒時複製父執行緒的值」這個時機根本不會發生。

**詳細解析**：`InheritableThreadLocal` 的實作是在 `Thread` 建構子中，如果父執行緒的 `inheritableThreadLocals` 不為空，就把它複製一份給新建立的子執行緒。這個機制的前提是「有一個新執行緒被建立」這個動作發生。但執行緒池的核心思想正是「重複使用一組固定的、已經存在的執行緒」，執行緒本身在應用程式啟動時就建立好了，之後每次提交任務只是把 `Runnable` 丟給這些既有執行緒執行，並不會觸發新執行緒建立，也就不會有「複製父執行緒 `ThreadLocal` 值」這個時機。這也是為什麼在使用執行緒池時，若要在任務之間傳遞上下文（如 traceId），通常需要自己在任務包裝層手動複製並傳遞這些值（例如阿里巴巴開源的 TransmittableThreadLocal 就是為了解決這個問題而設計的）。

**面試回答方式**：這題的關鍵是講清楚「複製的時機是建立子執行緒的那一刻」，然後直接點出「執行緒池不會建立新執行緒」這個根本矛盾，最後可以主動提一句 TransmittableThreadLocal 這類解決方案，展現你不只知道問題、也知道業界怎麼解。

### ThreadLocalMap 用「線性探測」處理雜湊衝突，這和 HashMap 的方式有何不同？

**核心答案**：`ThreadLocalMap` 用開放定址法中的線性探測（找到衝突就往下一個槽位找空位存放），`HashMap` 則用鏈結串列（或紅黑樹）把同一個桶內的多個元素串起來。

**詳細解析**：`ThreadLocalMap` 內部是一個 `Entry[]` 陣列，當計算出的雜湊槽位已被佔用時，會線性地往後探測下一個槽位（`nextIndex`），直到找到空位或找到已存在的相同 key 為止，整個結構沒有鏈結串列或樹狀結構。這種設計適合 `ThreadLocalMap` 的使用情境——每個執行緒內的 `ThreadLocal` 數量通常很少（一般只有個位數到十幾個），線性探測的簡單性帶來的記憶體局部性優勢，超過了鏈結串列在大量元素、高衝突率下的優勢；而 `HashMap` 面對的元素數量可能非常大，鏈結串列（甚至紅黑樹）在高衝突情境下能提供更穩定的查詢效能。

**面試回答方式**：直接對比「線性探測 vs 鏈結串列」這兩種雜湊衝突解決策略，再補一句「因為 `ThreadLocal` 通常數量很少，線性探測反而更簡單高效」解釋設計取捨的原因，會比單純描述兩者的資料結構差異更有深度。

### 為什麼 ThreadLocalMap 不直接用強引用 key，而是用弱引用？

**核心答案**：因為即使 value 可能因為忘記 `remove()` 而洩漏，至少用弱引用能保證 `ThreadLocal` 實例本身（key）可以被正常回收；如果 key 也用強引用，連 `ThreadLocal` 實例都無法被回收，洩漏會更嚴重。

**詳細解析**：這是一個「兩害相權取其輕」的設計取捨。假設 `ThreadLocal` 變數本身的生命週期已經結束（例如它是一個區域變數，方法執行完就沒有其他地方引用它了），如果 `ThreadLocalMap` 用強引用持有這個 `ThreadLocal` 作為 key，那麼只要執行緒還活著，這個 `ThreadLocal` 物件就永遠不會被回收（因為 `ThreadLocalMap` 一直強引用著它），這比目前「至少 `ThreadLocal` 本身能被回收，只是 value 還留著」的情況更糟。設計者選擇了弱引用 key，是為了盡量減少洩漏的範圍，但這個設計本身無法完全消除洩漏風險，仍然需要開發者主動呼叫 `remove()` 才能徹底解決。

**面試回答方式**：這題適合用「兩害相權取其輕」這個角度回答——先講如果用強引用 key 會更糟的具體理由，再說明弱引用只是減緩問題、不是根治問題，這種能看到設計取捨兩面的回答方式，比單純背「因為弱引用能被回收」更顯示批判性思考。

## 相關

- [[009-threadpoolexecutor-core-params.md]]
