---
id: java-012
category: java
slug: try-with-resources
title: try-with-resources 與資源管理
difficulty: medium
tags: [try-with-resources, AutoCloseable, 資源管理]
source: original
---

# 題目

`try-with-resources` 是什麼？它如何保證資源被正確關閉？和傳統 try-finally 相比有什麼好處？

## 核心答案

`try-with-resources`（JDK 7 引入）是一種在 try 的括號中宣告資源的語法，只要資源實作了 `AutoCloseable` 介面，離開 try 區塊時（不管正常結束或拋例外）編譯器都會自動呼叫資源的 `close()` 方法關閉它。相比手動寫 try-finally 關閉，它更簡潔、不會忘記關閉、能自動處理多個資源的關閉順序、且能正確保留原始例外（關閉時的例外變成「被抑制的例外」而非覆蓋原始例外）。

## 詳細解析

**基本語法**：

```java
try (var reader = new BufferedReader(new FileReader("file.txt"))) {
    return reader.readLine();
}  // 離開這裡時，reader.close() 被自動呼叫
```

資源在 `try(...)` 括號中宣告，只要它實作了 `AutoCloseable`（或其子介面 `Closeable`），JVM 保證在離開 try 區塊時自動關閉。

**解決傳統 try-finally 的兩大痛點**：

1. **避免忘記關閉 / 順序錯誤**：傳統寫法要在 finally 中手動 `close()`，多個資源要巢狀多層或小心處理關閉順序，容易出錯或遺漏。`try-with-resources` 自動按「宣告的逆序」關閉所有資源，不需要手寫。

2. **正確處理例外覆蓋**：傳統 try-finally 中，如果 try 拋了例外 A，finally 關閉資源時又拋了例外 B，B 會覆蓋 A，導致真正的根因 A 遺失。`try-with-resources` 則保留 A 作為主例外，把 B 記錄為「被抑制的例外（suppressed exception）」，可透過 `Throwable.getSuppressed()` 取得，不遺失任何錯誤資訊。

**多資源的關閉順序**：可以在括號中宣告多個資源（用分號分隔），關閉時按「宣告順序的逆序」關閉——先宣告的後關閉，這符合資源依賴的常識（後建立的通常依賴先建立的，所以先關後建立的）。

**AutoCloseable vs Closeable**：`AutoCloseable.close()` 宣告可拋出 `Exception`，是 JDK 7 為 try-with-resources 新增的通用介面；`Closeable`（更早存在，主要用於 IO）繼承自 `AutoCloseable`其 `close()` 宣告拋出 `IOException` 且要求冪等（重複呼叫無副作用）。

## 面試回答方式

先講「是什麼」——try 括號中宣告資源、自動關閉、前提是實作 `AutoCloseable`。接著講「好處」，這是重點：對比傳統 try-finally 的兩個痛點（容易忘記關閉/順序錯、例外覆蓋遺失根因），說明 try-with-resources 如何各自解決。尤其「被抑制的例外（suppressed exception）」這個機制是很多人不知道的細節，主動講出來能明顯加分。最後可以補一句「多資源按逆序關閉」和「AutoCloseable 是前提介面」，讓回答更完整。

## 常見追問

### 什麼是「被抑制的例外（suppressed exception）」？

**核心答案**：當 try 區塊拋出一個例外，而在自動關閉資源時 `close()` 又拋出另一個例外，`try-with-resources` 會保留 try 中的原始例外作為「主例外」向上拋出，把 close() 的例外附加到主例外的「被抑制例外列表」中（透過 `addSuppressed()`）可用 `getSuppressed()` 取得。這樣兩個例外都不會遺失，且真正的根因（try 中的原始例外）不會被關閉時的次要例外覆蓋。

**詳細解析**：這解決了傳統 try-finally 的一個隱蔽問題。假設你讀檔案時拋了 `IOException`（真正的問題），然後 finally 中 `close()` 時因為某種原因也拋了例外——在傳統寫法中，finally 拋出的例外會直接取代 try 的例外向上傳播，導致你在日誌中只看到 close 的例外，完全看不到真正的根因 IOException，排查時一頭霧水。`try-with-resources` 的抑制機制讓「主例外優先保留、次要例外被記錄但不覆蓋」，你在處理主例外時，還能透過 `getSuppressed()` 查到關閉時發生的次要例外，兩邊資訊都完整。這個設計體現了「保留最重要的錯誤資訊、同時不丟棄任何線索」的周到考量。

**面試回答方式**：用「try 例外是主例外、close 例外被抑制附加而非覆蓋」這個機制回答，並強調它解決的實際痛點——「傳統寫法 close 的例外會蓋掉真正的根因」。能講出 `getSuppressed()` 這個具體 API 和「主例外優先」的原則，展現你對這個容易被忽略的細節有真正的掌握。

### 資源的關閉順序是怎樣的？為什麼是這個順序？

**核心答案**：`try-with-resources` 按資源「宣告順序的逆序」關閉——最後宣告的資源最先關閉，最先宣告的最後關閉。這是因為後宣告的資源通常依賴先宣告的資源（例如先建立 Connection、再基於它建立 Statement），關閉時應該先關閉依賴方（Statement）、再關閉被依賴方（Connection），逆序關閉剛好符合這個依賴關係。

**詳細解析**：資源之間常有依賴關係，典型例子是 JDBC——先建立 `Connection`，再用它建立 `Statement`，再執行得到 `ResultSet`。這三者的建立順序是 Connection → Statement → ResultSet，而正確的關閉順序應該是反過來 ResultSet → Statement → Connection（先關閉依賴別人的，再關閉被依賴的），否則可能出現「Connection 都關了，Statement 卻還想用它做清理」的問題。`try-with-resources` 的「逆序關閉」設計正好自動符合這個常見的資源依賴模式，讓開發者不需要手動操心關閉順序。

**面試回答方式**：回答「按宣告的逆序關閉」，並用 JDBC 的 Connection/Statement/ResultSet 這個經典依賴鏈說明「為什麼逆序才對」（先關依賴方、後關被依賴方），這種用具體例子解釋設計合理性的回答，比只背「逆序」這個規則更能證明你真正理解。

### 一個資源類別要能用於 try-with-resources 需要滿足什麼條件？

**核心答案**：只需要實作 `AutoCloseable` 介面（或其子介面 `Closeable`），也就是提供一個 `close()` 方法。編譯器會在離開 try 區塊時自動呼叫這個 `close()`。因此不只是 IO 流，任何需要「用完後清理」的自訂資源（如資料庫連線、鎖、網路連線、自訂的資源池物件）都可以實作 `AutoCloseable` 來享受自動關閉。

**詳細解析**：`AutoCloseable` 是一個只有單一 `close()` 方法的函數式介面，這個簡潔的設計讓 try-with-resources 具有很強的通用性——不限於 JDK 內建的 IO 類別，開發者可以讓自己的任何類別實作它。例如你可以寫一個包裝了分散式鎖（Distributed Lock）的類別，在 `close()` 中釋放鎖然後用 `try (var lock = acquireLock()) { ... }` 確保鎖一定會被釋放；或者包裝一個效能計時器，在 close 時記錄耗時。這種模式讓「取得資源—使用—保證釋放」的邏輯變得非常簡潔可靠，是一個值得善用的語言特性。實作時要注意 `close()` 最好是冪等的（重複呼叫無害），且不應該拋出會掩蓋主要邏輯的例外。

**面試回答方式**：回答「實作 `AutoCloseable` 即可」，並主動舉出「不限 IO，自訂的鎖、計時器、連線都能用」的擴展應用，展現你把 try-with-resources 理解成一個通用的資源管理模式，而不只是「用來關檔案流的語法」，這種舉一反三的回答很能展現理解深度。

## 相關

- [[011-exception-hierarchy.md]]
- [[016-io-vs-nio.md]]
