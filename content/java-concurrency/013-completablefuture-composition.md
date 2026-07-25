---
id: java-concurrency-013
category: java-concurrency
slug: completablefuture-composition
title: CompletableFuture 的組合方法與例外傳播
difficulty: hard
tags: [CompletableFuture, 非同步, 例外處理]
source: original
---

# 題目

`CompletableFuture` 的 `thenApply`、`thenCompose`、`thenCombine`、`allOf` 分別用在什麼場景？非同步鏈中的例外是怎麼傳播的？

## 核心答案

`thenApply` 做單一結果的轉換；`thenCompose` 用於串接「回傳另一個 `CompletableFuture`」的方法，避免產生巢狀的 `CompletableFuture<CompletableFuture<T>>`；`thenCombine` 合併兩個彼此獨立、平行執行的 `CompletableFuture` 結果；`allOf`/`anyOf` 用於等待一組任務全部/任一完成。例外會沿著鏈路傳播，直到被 `exceptionally` 或 `handle` 捕捉，若都沒有處理，最終呼叫 `get()` 或 `join()` 時才會拋出。

## 詳細解析

**四個組合方法的區別**：

- **`thenApply(Function)`**：單純把上一步的結果做同步轉換。
- **`thenCompose(Function)`**：當轉換函式本身回傳的是另一個 `CompletableFuture<R>` 時使用，會自動「拆箱」，避免巢狀結構，和 `Optional.flatMap`/`Stream.flatMap` 的設計理念一致。
- **`thenCombine(other, BiFunction)`**：兩個獨立、平行執行的非同步任務，都完成後把兩者的結果合併處理。
- **`CompletableFuture.allOf(...)`**：等待多個任務全部完成，但不會自動收集結果。
- **`CompletableFuture.anyOf(...)`**：任一個任務完成就返回，常用於資料來源競速。

**例外傳播機制**：

- 鏈路中任何一步拋出例外，會被包裝並沿著後續方法「短路」傳播下去，直到遇到 `exceptionally` 或 `handle`。
- 若整條鏈路都沒有例外處理節點，最終呼叫 `get()` 拋出 `ExecutionException`，呼叫 `join()` 拋出 `CompletionException`。
- `whenComplete` 不會吞掉或恢復例外，只是「無論成功失敗都執行一段程式碼」。

## 面試回答方式

這題是進階題，考的是你對 `CompletableFuture` API 家族的整體掌握，而不是單一方法。建議用一句話先分類：「轉換用 `thenApply`、串接非同步依賴用 `thenCompose`、合併平行任務用 `thenCombine`、批量等待用 `allOf`/`anyOf`」，把四個方法放進同一個分類框架講，展現你不是零散記憶 API 而是有系統性理解。例外傳播的部分，務必講清楚「短路傳播」與「`get()` vs `join()` 拋出的例外型別不同」這兩個細節，這是這題最容易被進一步追問、也最容易踩雷的地方。

## 常見追問

### 為什麼 thenApply 用在回傳 CompletableFuture 的方法上是一個常見錯誤？

**核心答案**：因為 `thenApply` 不會自動拆箱巢狀的 `CompletableFuture`，如果傳入的轉換函式本身回傳 `CompletableFuture<R>`，結果會變成 `CompletableFuture<CompletableFuture<R>>`，之後每次要取用真正的結果都要多一層 `.join()` 或 `.get()`，非常容易出錯且失去了非同步鏈的意義。

**詳細解析**：舉例來說，如果有一個方法 `queryOrderAsync(userId)` 回傳 `CompletableFuture<Order>`，如果寫成 `userIdFuture.thenApply(id -> queryOrderAsync(id))`，得到的型別會是 `CompletableFuture<CompletableFuture<Order>>`——外層的 `CompletableFuture` 其實在「內層的非同步查詢還沒真正完成」時就已經完成了（因為它完成的定義只是「拿到了內層那個 `CompletableFuture` 物件的參照」，而不是「內層查詢真正跑完」），這會導致後續的鏈式呼叫（例如 `.thenAccept(order -> ...)`）拿到的其實是一個 `CompletableFuture<Order>` 物件而不是 `Order` 本身，型別完全對不上，編譯器會直接報錯，或者即使勉強繞過型別檢查，邏輯上也完全錯誤。正確做法是用 `thenCompose` 取代 `thenApply`，讓 API 自動把巢狀結構「拍平（flatten）」成 `CompletableFuture<Order>`。

**面試回答方式**：用具體的型別推導（`CompletableFuture<CompletableFuture<Order>>`）來解釋為什麼會出錯，比抽象地說「會產生巢狀結構」更清楚，也更容易讓面試官確認你真的理解型別系統的運作，而不只是背「這種情況要用 `thenCompose`」這個結論。

### allOf(...).join() 之後要怎麼優雅地收集每個子任務的實際結果？

**核心答案**：因為 `allOf` 回傳的是 `CompletableFuture<Void>`，不能直接拿到各子任務的結果，常見做法是先把所有 `CompletableFuture<T>` 存在一個 `List` 或陣列中，`allOf(...).join()` 完成後，再對這個 `List` 逐一呼叫已經完成的每個 `CompletableFuture` 的 `join()`（因為已經確定全部完成，這裡的 `join()` 不會再阻塞），通常搭配 Stream API 收集成一個結果列表。

**詳細解析**：典型寫法類似：`List<CompletableFuture<T>> futures = ...; CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join(); List<T> results = futures.stream().map(CompletableFuture::join).collect(Collectors.toList());`。這裡的關鍵理解是：`allOf` 本身只負責「等待」，不負責「收集」，因為 Java 的型別系統無法讓 `allOf` 這種可變參數方法知道每個 `CompletableFuture` 內部承載的具體型別並統一收集起來；因此收集結果的責任仍然落在呼叫方身上，透過保留原始的 `CompletableFuture` 物件清單，等 `allOf` 確認全部完成後再逐一取值，是最常見也最直接的做法。

**面試回答方式**：把程式碼邏輯用口語清楚描述一次（先收集 Future 列表、等待全部完成、再逐一取值），即使不方便寫出完整程式碼，講清楚這個「先等待、後收集」的兩階段邏輯，就足以證明你真的實作過這個模式而不是憑印象猜測。

### 什麼場景該用 anyOf 而不是 allOf？

**核心答案**：當有多個資料來源理論上都能提供同一份所需結果、且只需要「最快回來的那一個」時，該用 `anyOf`；當任務彼此獨立且都各自貢獻不同的必要資料，必須全部拿到才能繼續時，該用 `allOf`。

**詳細解析**：`anyOf` 的典型場景是「競速（racing）」——例如同時向多個快取節點或多個可互相替代的下游服務發起查詢，只要其中任何一個先回應就可以使用這個結果，不需要等其他還沒回來的請求（甚至可以在拿到結果後主動取消其餘還在進行中的請求以節省資源）。`allOf` 的典型場景則是「彙總（aggregation）」——例如同時查詢使用者資訊、訂單資訊、庫存資訊，三者都是最終結果不可或缺的一部分，缺一不可，必須全部完成才能組裝出完整的回應。判斷該用哪一個的關鍵問題是：「這些平行任務之間，是『互相替代、擇一使用』的關係，還是『各自互補、缺一不可』的關係？」

**面試回答方式**：用「競速 vs 彙總」這組對比詞彙來回答，比直接描述兩個方法的行為更容易讓面試官快速抓到判斷準則，也更容易延伸舉出具體業務例子加分。

## 相關

- [[012-future-vs-completablefuture.md]]
