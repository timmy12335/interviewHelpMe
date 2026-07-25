---
id: java-011
category: java
slug: exception-hierarchy
title: Java 例外體系（Checked vs Unchecked）
difficulty: medium
tags: [例外, Checked, Unchecked, Error]
source: original
---

# 題目

Java 的例外體系是怎麼組織的？受檢例外（Checked）和非受檢例外（Unchecked）有什麼差異？

## 核心答案

所有例外的根是 `Throwable`，它有兩個分支：`Error`（系統級嚴重錯誤，如 `OutOfMemoryError`、`StackOverflowError`，程式不該也無法處理）和 `Exception`（程式可處理的例外）。`Exception` 又分為受檢例外（Checked，除了 `RuntimeException` 及其子類別以外的 Exception）和非受檢例外（Unchecked，即 `RuntimeException` 及其子類別）。受檢例外必須在編譯期強制處理（try-catch 或 throws 宣告），非受檢例外則不強制。

## 詳細解析

**體系結構**：

```
Throwable
├── Error（系統級錯誤，不該捕捉）
│   ├── OutOfMemoryError
│   └── StackOverflowError
└── Exception
    ├── RuntimeException（非受檢，Unchecked）
    │   ├── NullPointerException
    │   ├── IllegalArgumentException
    │   └── IndexOutOfBoundsException
    └── 其他 Exception（受檢，Checked）
        ├── IOException
        └── SQLException
```

**Error**：代表 JVM 層級的嚴重問題（記憶體耗盡、堆疊溢位等），通常是無法透過程式邏輯恢復的，程式不應該去捕捉處理它們（捕捉了也沒意義，因為系統已經處於不健康狀態）。

**受檢例外（Checked Exception）**：編譯器強制要求處理——你呼叫一個宣告會拋出受檢例外的方法時，必須用 try-catch 捕捉，或者在自己的方法簽章上用 `throws` 繼續往上宣告，否則編譯不通過。設計意圖是「這類例外是可預期、呼叫方應該有能力恢復的」，例如 `IOException`（檔案不存在、網路中斷）——強制處理是為了讓開發者不要忽略這些常見的失敗情況。

**非受檢例外（Unchecked Exception，RuntimeException）**：不強制處理，通常代表「程式邏輯的 bug」，例如 `NullPointerException`（存取了 null）、`IllegalArgumentException`（傳了不合法的參數）、`IndexOutOfBoundsException`（陣列越界）。這類例外理論上應該透過修正程式碼來避免，而不是靠 try-catch 去捕捉。

## 面試回答方式

先畫出體系的骨架——`Throwable` 分 `Error` 和 `Exception`，`Exception` 再分 Checked 和 Unchecked（以 `RuntimeException` 為界）。核心對比是「Checked 編譯期強制處理、Unchecked 不強制」，並解釋設計意圖：「Checked 用於可預期、可恢復的外部失敗（如 IO），Unchecked 用於程式 bug（如 NPE）」。能講出這個「設計意圖」層面的區別，比只背「一個要 try-catch 一個不用」更有深度。可以主動補一句「Error 不該捕捉，因為代表系統已不健康」。

## 常見追問

### 受檢例外的設計在實務中有什麼爭議？

**核心答案**：受檢例外的爭議在於它「強制處理」的設計在實務中常導致程式碼冗餘和被濫用——開發者為了通過編譯，經常寫出空的 catch 區塊（吞掉例外）或無腦地一路 `throws Exception`，反而破壞了例外處理的本意；而且它與 Lambda、Stream 等函數式 API 相容性差。因此許多現代框架（如 Spring）和語言（如 Kotlin、C#）傾向於只用非受檢例外。

**詳細解析**：受檢例外的初衷是好的——強迫開發者正視可能的失敗。但實務中它帶來幾個問題：一是「異常吞噬」，開發者為了讓程式碼編譯過，寫 `catch (IOException e) {}` 什麼都不做,反而讓錯誤被隱藏;二是「污染方法簽章」,底層的一個受檢例外會逼得整條呼叫鏈上的每個方法都要宣告 throws,破壞封裝;三是與函數式介面衝突,Lambda 中拋出受檢例外需要額外包裝很麻煩。正因如此,Spring 把大量 JDBC 的受檢 `SQLException` 包裝成非受檢的 `DataAccessException`,Kotlin 乾脆完全取消了受檢例外的概念。這個爭議也反映了「編譯期強制」這種約束在靈活性與安全性之間的取捨。

**面試回答方式**：能講出受檢例外的實際問題（異常吞噬、污染簽章、與 Lambda 衝突）並舉出「Spring 把 SQLException 包成非受檢的 DataAccessException」「Kotlin 取消受檢例外」這些業界證據，展現你不只知道語法規則，還了解這個設計在真實工程中的爭議與演進，是很有深度的回答。

### finally 區塊一定會執行嗎？有例外情況嗎？

**核心答案**：`finally` 在絕大多數情況下一定會執行（不管 try 區塊正常結束、拋出例外、還是有 return），但有幾個例外情況不會執行：在 try/catch 中呼叫了 `System.exit()` 直接終止 JVM、執行緒被強制殺死、或 JVM 崩潰（如斷電、OOM 導致的崩潰）。

**詳細解析**：`finally` 的設計目的是「保證清理程式碼一定執行」（如關閉資源），所以它的執行優先級很高——即使 try 或 catch 中有 return，也會先執行完 finally 再真正返回。但有無法違抗的情況：`System.exit(0)` 會直接請求 JVM 終止，此時 finally 沒有機會執行;如果 JVM 本身崩潰（硬體斷電、被作業系統強制殺掉進程）,自然也不會有任何 Java 程式碼能執行。另外要注意一個陷阱——如果在 finally 中寫 return,會覆蓋掉 try 中的 return 值,且會吞掉 try 中拋出的例外,這是應該避免的反模式（finally 中不該有 return 或拋例外）。

**面試回答方式**：先回答「絕大多數情況會執行」，再列出例外情況（`System.exit()`、執行緒被殺、JVM 崩潰），最後主動補上「finally 中不該寫 return，會覆蓋返回值並吞例外」這個實務陷阱,展現你既知道規則的邊界又知道實務中的注意事項。

### try-with-resources 相比傳統 try-finally 有什麼優勢？

**核心答案**：`try-with-resources`（JDK 7 引入）能自動關閉資源（只要資源實作了 `AutoCloseable` 介面），編譯器會自動生成關閉邏輯，比手動寫 finally 關閉更簡潔、更不易出錯；而且它能正確處理「關閉資源時也拋出例外」的情況——原始例外會被保留，關閉時的例外被記錄為「被抑制的例外（suppressed exception）」，不會像手動 try-finally 那樣互相覆蓋。

**詳細解析**：這題與 [[012-try-with-resources.md]] 高度相關。傳統 try-finally 手動關閉資源有兩個痛點：一是程式碼冗長且容易忘記關閉或關閉順序寫錯（尤其多個資源時要巢狀多層 finally）；二是「例外覆蓋」——如果 try 中拋了例外 A，finally 中關閉資源時又拋了例外 B，B 會覆蓋 A，導致真正的錯誤原因 A 遺失。`try-with-resources` 完美解決這兩點：資源在 try() 括號中宣告，離開 try 區塊時自動按宣告的逆序關閉；且如果關閉時拋例外，原始例外會被保留為主例外，關閉例外被附加為 suppressed，可透過 `getSuppressed()` 取得，不會遺失任何錯誤資訊。

**面試回答方式**：講出兩大優勢——「自動關閉更簡潔不易漏」和「正確處理例外覆蓋（保留原始例外、關閉例外變 suppressed）」，尤其第二點（例外抑制機制）是很多人不知道的細節，能講出來明顯加分。可以順帶提「資源需實作 AutoCloseable」這個前提條件。

## 相關

- [[012-try-with-resources.md]]
