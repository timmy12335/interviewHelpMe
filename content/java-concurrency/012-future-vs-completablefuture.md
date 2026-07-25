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

1. **只能阻塞取得結果**：`get()` 會阻塞當前執行緒直到任務完成，無法註冊「完成後自動觸發下一步」的回呼。
2. **無法鏈式組合**：如果任務 B 依賴任務 A 的結果，用 `Future` 只能先 `get()` A 的結果（阻塞），再手動提交 B。
3. **無法合併多個 Future**：例如「等待多個 Future 全部完成」，用原生 `Future` 需要自己寫輪詢或搭配其他工具手動實作。
4. **例外處理不便**：任務內拋出的例外只有在呼叫 `get()` 時才會被包裝成 `ExecutionException` 拋出。

**`CompletableFuture` 的改進**：

- **鏈式回呼**：`thenApply`、`thenAccept`、`thenRun`、`thenCompose`。
- **多任務組合**：`allOf`、`anyOf`、`thenCombine`。
- **例外處理**：`exceptionally`、`handle`、`whenComplete`。
- **執行緒控制**：可用帶 `Async` 後綴的方法並傳入自訂 `Executor`，避免佔用共用的 `ForkJoinPool`。

**面試建議**：回答這題時，最好能舉一個實際例子，展示對 `thenCompose`/`thenCombine`/`allOf` 的實際應用理解，而不只是背 API 名稱。

## 面試回答方式

這是這一批題目中相對基礎的一題，適合用來快速展現「你知道 Java 非同步程式設計的演進脈絡」。回答結構是「先講 `Future` 的限制（重點是無法鏈式、無法組合），再講 `CompletableFuture` 怎麼解決這些限制」，每個限制對應到 `CompletableFuture` 提供的具體解法，形成一一對應的清楚結構，而不是分別列舉兩份不相關的清單。如果時間充裕，補一個實際例子（例如「查完使用者再非同步查訂單」）會讓回答更立體，這也是接下來追問（[[013-completablefuture-composition.md]]）的自然銜接點。

## 常見追問

### thenApply 和 thenApplyAsync 的差異是什麼？什麼時候該用帶 Async 的版本？

**核心答案**：`thenApply` 預設會在「完成上一步的那個執行緒」上直接執行回呼（如果呼叫時上一步已經完成，則由呼叫執行緒本身執行）；`thenApplyAsync` 則會把回呼提交到一個執行緒池（預設是 `ForkJoinPool.commonPool()`，或指定的自訂 `Executor`）中非同步執行，不會佔用原本的執行緒。

**詳細解析**：這個差異在實務上很重要：如果回呼邏輯很輕量（例如簡單的資料轉換），用 `thenApply` 讓它直接在原執行緒執行沒什麼問題，甚至能省去一次執行緒切換的開銷；但如果回呼邏輯本身比較耗時（例如涉及網路呼叫或複雜運算），繼續用 `thenApply` 可能導致這個回呼「意外地」佔用了原本負責完成上一步任務的執行緒（可能是重要的 I/O 執行緒或 `ForkJoinPool.commonPool()` 中的執行緒），阻塞了其他任務。這種情況應該用 `thenApplyAsync` 並傳入自訂的 `Executor`，明確地把耗時的回呼邏輯調度到獨立的執行緒池，避免互相搶佔資源。

**面試回答方式**：用「回呼邏輯輕量 vs 耗時」這個判斷準則來回答「什麼時候該用 Async 版本」，比單純背「Async 版本會用別的執行緒執行」更有實務指導意義。

### CompletableFuture 預設用的 ForkJoinPool.commonPool() 有什麼風險？

**核心答案**：因為 `commonPool()` 是 JVM 全域共用的執行緒池，如果應用程式中有大量非同步任務（尤其是耗時或會阻塞的任務）都依賴這個共用池執行，可能互相搶佔執行緒資源，導致原本應該獨立的任務彼此拖慢，甚至互相阻塞。

**詳細解析**：`ForkJoinPool.commonPool()` 的執行緒數量預設是 `CPU 核心數 - 1`，這個數量對於 CPU 密集型的分治任務（Fork/Join 框架原本的設計目的）通常足夠，但如果應用程式同時把它當成 `parallelStream()`、`CompletableFuture` 非同步鏈的共用執行緒池，且其中混雜了會阻塞的 I/O 任務，這些任務會長時間佔用原本數量就不多的執行緒，導致其他也依賴 `commonPool()` 的任務（不管是否相關）都要排隊等待，形成意外的效能瓶頸甚至互相阻塞的連鎖反應。生產環境中若大量使用 `CompletableFuture` 處理 I/O 密集型的非同步任務，建議明確傳入一個獨立設定的 `Executor`（例如自訂的 `ThreadPoolExecutor`），而不是依賴預設的共用池。

**面試回答方式**：把這個風險類比成「所有部門共用同一組會議室，其中一個部門開了個超長會議，其他部門全部卡住」，這種比喻式的解釋能幫助面試官快速理解「共用資源被少數任務長期佔用」這個核心問題，比純技術描述更容易讓人留下印象。

### 如何取消一個 CompletableFuture 正在執行的任務？

**核心答案**：呼叫 `cancel(mayInterruptIfRunning)` 可以把 `CompletableFuture` 標記為已取消（後續 `get()` 會拋出 `CancellationException`），但如果任務本身已經在執行中，`CompletableFuture` **無法真正中斷**正在執行的程式碼邏輯，除非任務內部自行檢查中斷標誌或某個取消旗標並主動結束。

**詳細解析**：這是一個常見的誤解——很多人以為呼叫 `cancel(true)` 就能像喊停一樣讓正在執行的任務立刻停下來，但實際上 `CompletableFuture` 的 `cancel` 方法主要影響的是「這個 Future 物件本身的完成狀態」，如果任務已經提交給執行緒開始執行，`cancel` 頂多只能嘗試對執行該任務的執行緒呼叫 `interrupt()`（且僅當 `mayInterruptIfRunning` 為 true，並且底層執行機制有支援時），但如果任務內部的程式碼從未檢查中斷狀態（例如純 CPU 運算迴圈，沒有呼叫任何會拋出 `InterruptedException` 的阻塞方法），這個中斷訊號會被完全忽略，任務仍會繼續執行到自然結束。要讓任務真正能被「取消」，任務程式碼本身必須設計成會定期檢查 `Thread.currentThread().isInterrupted()` 或某個自訂的取消旗標，並在偵測到後主動提前結束執行。

**面試回答方式**：這題的核心是澄清「取消 Future 物件」和「真正終止正在執行的程式碼」是兩件不同的事，回答時務必講清楚「除非任務本身配合檢查中斷狀態，否則 `cancel()` 無法真正打斷執行中的邏輯」，這是很多人容易誤解、但資深工程師會特別在意的細節。

## 相關

- [[013-completablefuture-composition.md]]
