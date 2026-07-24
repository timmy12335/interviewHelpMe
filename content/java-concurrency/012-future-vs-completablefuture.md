---
id: java-concurrency-012
category: java-concurrency
slug: future-vs-completablefuture
title: Future 與 CompletableFuture 的差異
difficulty: easy
tags: [Future, CompletableFuture, 非同步]
source: original
---

# 題目

`Future` 有什麼限制？`CompletableFuture` 解決了哪些問題？

## 核心答案

`Future` 只能透過 `get()` 阻塞等待或反覆輪詢 `isDone()` 來取得非同步任務結果，無法對結果做進一步的鏈式處理，也無法組合多個 `Future`、無法主動完成或取消而不拋出例外。`CompletableFuture`（JDK 8）實作了 `Future` 與 `CompletionStage` 介面，提供了鏈式回呼、多任務組合、例外處理等豐富的 API，讓非同步程式設計更接近函數式風格。

## 詳細解析

**`Future` 的限制**：

1. **只能阻塞取得結果**：`get()` 會阻塞當前執行緒直到任務完成，`get(timeout, unit)` 雖然能設定逾時，但依然是阻塞式等待，無法註冊「完成後自動觸發下一步」的回呼。
2. **無法鏈式組合**：如果任務 B 依賴任務 A 的結果，用 `Future` 只能先 `get()` A 的結果（阻塞），再手動提交 B，無法宣告式地表達「A 完成後自動接著做 B」。
3. **無法合併多個 Future**：例如「等待多個 Future 全部完成」或「任一個完成即可」，用原生 `Future` 需要自己寫輪詢或搭配 `CountDownLatch` 之類的工具手動實作。
4. **例外處理不便**：任務內拋出的例外只有在呼叫 `get()` 時才會被包裝成 `ExecutionException` 拋出，無法在鏈路中間就地處理或恢復。

**`CompletableFuture` 的改進**：

- **鏈式回呼**：`thenApply`（轉換結果）、`thenAccept`（消費結果無返回值）、`thenRun`（不關心結果，完成後執行動作）、`thenCompose`（扁平化組合另一個 `CompletableFuture`，避免巢狀）。
- **多任務組合**：`allOf`（等待所有任務完成）、`anyOf`（任一任務完成即可）、`thenCombine`（合併兩個獨立任務的結果）。
- **例外處理**：`exceptionally`（類似 catch，恢復預設值）、`handle`（同時處理正常結果與例外）、`whenComplete`（無論成功失敗都執行，但不改變結果）。
- **執行緒控制**：預設回呼在完成任務的執行緒或 `ForkJoinPool.commonPool()` 中執行，可用帶 `Async` 後綴的方法（如 `thenApplyAsync`）並傳入自訂 `Executor`，避免佔用共用的 `ForkJoinPool`。

**面試建議**：回答這題時，最好能舉一個實際例子，例如「呼叫使用者服務拿到 userId 後，非同步呼叫訂單服務與商品服務，兩者都完成後再合併結果返回」，展示對 `thenCompose`/`thenCombine`/`allOf` 的實際應用理解，而不只是背 API 名稱。

## 常見追問

- `thenApply` 和 `thenApplyAsync` 的差異是什麼？什麼時候該用帶 Async 的版本？
- `CompletableFuture` 預設用的 `ForkJoinPool.commonPool()` 有什麼風險（被其他任務佔滿導致互相阻塞）？
- 如何取消一個 `CompletableFuture` 正在執行的任務？

## 相關

- [[013-completablefuture-composition.md]]
