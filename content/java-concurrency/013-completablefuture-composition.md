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

- **`thenApply(Function)`**：`CompletableFuture<T>` → `CompletableFuture<R>`，單純把上一步的結果做同步轉換（例如把 `User` 轉成 `UserDTO`）。
- **`thenCompose(Function)`**：當轉換函式本身回傳的是另一個 `CompletableFuture<R>` 時使用（例如「查到 userId 後，再非同步查詢這個使用者的訂單」），`thenCompose` 會自動「拆箱」，避免 `thenApply` 用在這種場景會產生的 `CompletableFuture<CompletableFuture<R>>` 巢狀結構。這和 `Optional.flatMap`/`Stream.flatMap` 的設計理念是一致的。
- **`thenCombine(other, BiFunction)`**：兩個獨立、平行執行的非同步任務（例如同時查詢使用者資訊和商品資訊），都完成後把兩者的結果合併處理。
- **`CompletableFuture.allOf(cf1, cf2, ...)`**：回傳 `CompletableFuture<Void>`，用於等待多個任務全部完成，但**不會自動幫你收集結果**，通常搭配 `join()` 逐一取得各任務結果（因為 `allOf` 不知道各任務結果的型別）。
- **`CompletableFuture.anyOf(cf1, cf2, ...)`**：任一個任務完成就返回，常用於「多個資料來源，哪個先回來就用哪個」的場景（例如多個快取節點查詢競速）。

**例外傳播機制**：

- 鏈路中任何一步拋出例外，這個例外會被包裝並沿著後續的 `thenApply`/`thenCompose` 等方法「短路」傳播下去（後續的 `thenApply` 不會被執行），直到遇到 `exceptionally`（只處理例外，回傳恢復值）或 `handle`（同時處理正常結果與例外，兩者互斥，其中一個一定是 `null`）。
- 如果整條鏈路都沒有例外處理節點，最終呼叫 `get()` 會拋出 `ExecutionException`（包裝原始例外），呼叫 `join()` 則拋出 `CompletionException`（同樣包裝原始例外，但屬於非受檢例外）。
- `whenComplete` 常被誤用為例外處理，但它**不會**吞掉或恢復例外——它只是「無論成功失敗都執行一段程式碼（例如記錄日誌）」，執行完之後原本的例外仍然會繼續往下傳播。

## 常見追問

- 為什麼 `thenApply` 用在回傳 `CompletableFuture` 的方法上是一個常見錯誤？
- `allOf(...).join()` 之後要怎麼優雅地收集每個子任務的實際結果？
- 什麼場景該用 `anyOf` 而不是 `allOf`？

## 相關

- [[012-future-vs-completablefuture.md]]
