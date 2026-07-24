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

**為什麼 key 用弱引用**：`ThreadLocalMap` 的 `Entry` 繼承自 `WeakReference<ThreadLocal<?>>`，這樣設計是為了讓外部不再持有 `ThreadLocal` 實例的強引用時（例如 `ThreadLocal` 變數本身生命週期結束），GC 能夠回收這個 `ThreadLocal` 物件本身，避免 `ThreadLocal` 實例洩漏。

**洩漏是怎麼發生的**：

1. `ThreadLocal` 實例本身可能被 GC 回收（因為 key 是弱引用），此時 `Entry` 的 key 變成 `null`，但 value 仍然是強引用，不會被回收。
2. 如果目前執行緒之後不再存取這個 `ThreadLocalMap`（例如執行緒池的執行緒長期存活，但這個 key 對應的 `ThreadLocal` 已經沒有業務程式碼會再用到），這些 key 為 `null` 的 Entry 及其 value 就會一直留在 map 裡，永遠沒有機會被清理，直到執行緒本身被銷毀。
3. 在使用執行緒池的場景下，執行緒是被重複使用、長期存活的，這使得洩漏風險被放大：一個請求用 `ThreadLocal` 存放使用者上下文（例如 traceId、當前使用者資訊）後忘記 `remove()`，下一個請求複用了同一個執行緒卻拿到了上一個請求殘留的資料，不只是記憶體洩漏，還可能是嚴重的資料串號 bug。

**最佳實踐**：

- 使用完 `ThreadLocal` 後，務必在 `finally` 區塊呼叫 `remove()`，尤其是在執行緒池、Web 請求過濾器（Filter/Interceptor）這類執行緒會被重複使用的場景。
- 部分框架（如 Spring 的 `RequestContextHolder`、日誌框架的 MDC）都是靠 `ThreadLocal` 實作請求上下文傳遞，這些框架通常在請求結束時的攔截器裡呼叫對應的清理方法，理解這個機制才能正確排查「為什麼上一個請求的資料跑到這一個請求」這類詭異 bug。

## 常見追問

- `InheritableThreadLocal` 解決了什麼問題？在執行緒池場景下為什麼還是可能失效（執行緒池執行緒是預先建立好的，不是子執行緒建立時複製父執行緒的值）？
- `ThreadLocalMap` 用「線性探測」處理 hash 衝突，這和 `HashMap` 用鏈結串列/紅黑樹處理衝突的方式有何不同？
- 為什麼 `ThreadLocalMap` 不直接用強引用 key，而是用弱引用？（權衡：弱引用至少能回收 ThreadLocal 本身，強引用連 ThreadLocal 都不會被回收）

## 相關

- [[009-threadpoolexecutor-core-params.md]]
