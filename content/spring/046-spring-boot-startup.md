---
id: spring-046
category: spring
slug: spring-boot-startup
title: Spring Boot 的啟動流程
difficulty: hard
tags: [啟動流程, SpringApplication, 生命週期, 擴充點]
source: original
---

# 題目

`SpringApplication.run()` 做了哪些事？有哪些擴充點可以介入？

## 核心答案

大致分七步。**準備環境**——建立 `Environment`、載入設定來源、確定 profile；此時 `EnvironmentPostProcessor` 可以介入（**這是最早的擴充點**，適合加入自訂的設定來源）。**印出橫幅**。**建立 `ApplicationContext`**——依應用類型（Servlet、Reactive、或非 Web）選擇實作。**準備上下文**——執行 `ApplicationContextInitializer`、註冊主要來源。**重新整理上下文（refresh）**——這是最核心的一步：載入 bean 定義、執行 `BeanFactoryPostProcessor`、註冊 `BeanPostProcessor`、實例化所有非延遲的單例 bean、**啟動內嵌的 Web 伺服器**。**執行 runner**——`ApplicationRunner` 與 `CommandLineRunner`。**發布就緒事件**。

貫穿全程的是 **`ApplicationListener`**，它可以監聽整條時間軸上的事件：`ApplicationStartingEvent`、`ApplicationEnvironmentPreparedEvent`、`ApplicationPreparedEvent`、`ContextRefreshedEvent`、`ApplicationStartedEvent`、`ApplicationReadyEvent`、以及失敗時的 `ApplicationFailedEvent`。

選對擴充點的關鍵是「你需要的東西在那個時間點存在嗎」——要改設定就用最早的 `EnvironmentPostProcessor`，要用到 bean 就得等到 refresh 之後。

## 詳細解析

`ApplicationReadyEvent` 與 `ContextRefreshedEvent` 的差別很重要。後者在上下文重新整理完成時發布，此時 Web 伺服器可能還沒開始接受請求；前者在整個啟動流程結束（包含 runner 執行完）之後發布，這才是「應用真的準備好了」。要在啟動後做初始化（預熱快取、註冊到服務發現）應該用 `ApplicationReadyEvent`，用 `ContextRefreshedEvent` 可能在還沒完全就緒時就執行。而且 `ContextRefreshedEvent` 在某些情況下（父子上下文）**會被發布多次**，這常常造成初始化邏輯重複執行。

**`CommandLineRunner` 與 `ApplicationRunner` 的差別只在參數形式**——前者拿到原始的 `String[]`，後者拿到解析過的 `ApplicationArguments`（可以問「有沒有 `--debug` 這個選項」）。兩者都在應用就緒之前執行，而且拋出例外會讓應用啟動失敗——這是好的（快速失敗），但要意識到：在 runner 裡做一個可能失敗的外部呼叫，會讓應用因為外部依賴不可用而起不來。

啟動失敗的診斷有專門的機制：`FailureAnalyzer` 把常見的啟動錯誤（埠被佔用、資料庫連不上、bean 定義衝突）轉成人類可讀的訊息與建議行動，而不是一長串堆疊。**這是 Spring Boot 開發體驗的一個亮點**，也是自訂 starter 值得提供的東西——為你的 starter 常見的設定錯誤寫一個 `FailureAnalyzer`，能大幅降低使用者的困惑。

**啟動時間的分解**可以用 `ApplicationStartup` 介面（Boot 2.4 起）——`BufferingApplicationStartup` 會記錄每個啟動步驟的耗時，透過 `/actuator/startup` 端點檢視。**這比猜測「是哪個 bean 慢」精確得多**，尤其在自動配置很多的應用上。

## 面試回答方式

先給**七個步驟**並在每步標出對應的擴充點，然後給出選擇擴充點的核心判準：「你需要的東西在那個時間點存在嗎」——改設定用最早的 `EnvironmentPostProcessor`、要用 bean 就得等 refresh 之後。加分點有三個：`ApplicationReadyEvent` 與 `ContextRefreshedEvent` 的差別——後者時 Web 伺服器可能還沒接受請求、而且父子上下文下會被發布多次造成初始化重複，啟動後的初始化該用前者；runner 拋例外會讓應用起不來，所以在裡面做外部呼叫會讓應用因為外部依賴不可用而無法啟動；以及 `FailureAnalyzer` 把常見啟動錯誤轉成可讀訊息，自訂 starter 值得為常見設定錯誤提供一個。最後給診斷手段：`BufferingApplicationStartup` 加 `/actuator/startup` 能精確分解啟動耗時。

## 講稿

大致分七步。準備環境、印出橫幅、建立應用上下文、準備上下文、重新整理上下文、執行 runner、發布就緒事件。其中重新整理那一步是最核心的，它載入 bean 定義、執行各種後處理器、實例化所有非延遲的單例、還有啟動內嵌的 Web 伺服器。

貫穿全程的是應用監聽器，它可以監聽整條時間軸上的事件。

我選擇擴充點的判準是，你需要的東西在那個時間點存在嗎。要改設定就用最早的環境後處理器，要用到 bean 就得等到重新整理之後。

有一個差別很重要。上下文重新整理完成的事件發布時，Web 伺服器可能還沒開始接受請求。而應用就緒事件是在整個啟動流程結束之後才發布，那才是應用真的準備好了。所以啟動後的初始化，像是預熱快取或註冊到服務發現，應該用就緒事件。

而且重新整理事件在父子上下文的情況下會被發布多次，常常造成初始化邏輯重複執行。

還有一點要注意，runner 拋出例外會讓應用啟動失敗。這是好的，快速失敗。但要意識到，在 runner 裡做一個可能失敗的外部呼叫，會讓應用因為外部依賴不可用而起不來。

## 常見追問

### 啟動慢的時候怎麼定位是哪一步？

**核心答案**：用 **`BufferingApplicationStartup`**（在 `SpringApplication` 上設定 `setApplicationStartup`）加 `/actuator/startup` 端點——它會列出每個啟動步驟（bean 實例化、自動配置評估、上下文重新整理）的耗時，形成一棵可以展開的時間樹。這比 `--debug` 的自動配置報告更精確，因為後者只告訴你哪些配置生效而不告訴你花了多久。

**詳細解析**：**常見的耗時來源有四類**：**bean 數量多**（每個都要實例化與初始化）、**類別掃描範圍過大**（`@ComponentScan` 掃了整個 `com` 套件）、**啟動時的外部連線**（資料庫連線池預熱、服務發現註冊、遠端設定拉取），以及**自動配置的條件評估**（依賴多時有數百個配置類別要評估）。對應的改善分別是：延遲初始化、縮小掃描範圍、把連線改成懶建立、以及移除不需要的依賴。 `spring.main.lazy-initialization=true` 是最快的實驗——它讓所有 bean 延遲到第一次使用時才建立，如果啟動時間大幅下降，就知道瓶頸在 bean 的建立上。但它不該長期開啟，因為它把成本移到了第一次請求，而且會讓「啟動時就該發現的錯誤」延後到執行期。

**面試回答方式**：給出工具（`BufferingApplicationStartup` 加 `/actuator/startup`）並指出它比 `--debug` 報告精確在哪。給四類耗時來源與對應改善。加分點是提出 `lazy-initialization=true` 是最快的診斷實驗——啟動大幅變快就知道瓶頸在 bean 建立上，並誠實說明它不該長期開啟（成本移到第一次請求、啟動時該發現的錯誤延後到執行期）。

### 為什麼有時候 bean 的初始化順序不如預期？

**核心答案**：因為Spring 只保證「依賴關係決定的順序」，不保證其他順序。A 依賴 B 時 B 一定先建立；但兩個沒有依賴關係的 bean，建立順序取決於定義的註冊順序、掃描的檔案系統順序等實作細節——**這些在不同環境可能不同**。需要明確順序時要用 `@DependsOn` 表達，或者**重新設計成真正的依賴關係**（讓 A 注入 B 而不是「希望 B 先建立」）。

**詳細解析**：「靠順序而非依賴」是一個設計訊號。如果 A 需要 B 先完成某件事，那應該把那件事表達成一個 A 可以呼叫或注入的東西，而不是依賴建立順序。用 `@DependsOn` 能解決眼前的問題，但它是一個隱式的耦合——讀 A 的程式碼看不出它為什麼需要 B 先建立。更好的做法通常是把初始化邏輯從建構子或 `@PostConstruct` 移到一個明確的啟動階段（監聽 `ApplicationReadyEvent` 或用 `SmartLifecycle` 的 `getPhase` 明確排序），那裡的順序是顯式且可讀的。`SmartLifecycle` 特別適合「需要按階段啟動與關閉」的元件（先啟動連線、再啟動消費者、關閉時反過來），而它的 phase 數字讓順序寫在程式碼裡而非藏在建立順序中。

**面試回答方式**：給出保證的範圍——**只保證依賴關係決定的順序**，其他取決於註冊與掃描順序這些實作細節，不同環境可能不同。指出**「靠順序而非依賴」是設計訊號**，`@DependsOn` 能解決但是隱式耦合。給出更好的做法：把初始化移到明確的啟動階段（`ApplicationReadyEvent` 或 `SmartLifecycle` 的 phase），讓順序顯式可讀。加分點是說明 `SmartLifecycle` 特別適合需要按階段啟動與關閉的元件。

### 自訂 FailureAnalyzer 有什麼價值？

**核心答案**：把難懂的技術錯誤轉成可操作的指引。預設情況下一個設定錯誤會產生一長串堆疊，使用者要從中猜出「原來是我少設了一個屬性」。`FailureAnalyzer` 讓你攔截特定的例外型別，輸出「**描述問題 + 建議行動**」兩段話——例如「找不到 `app.api.key` 這個必要的設定，請在 application.yml 中設定它，或提供 `APP_API_KEY` 環境變數」。

**詳細解析**：這是「開發體驗也是產品的一部分」的具體體現。一個 starter 如果在設定錯誤時只丟出 `NullPointerException`，使用者可能花半小時才找到原因；有了清楚的失敗分析，那半小時變成一分鐘。成本是幾十行程式碼，收益乘以所有使用者與所有次數。 實作只需要繼承 `AbstractFailureAnalyzer<T>` 並註冊到 `spring.factories`。同樣的思路適用於任何面向開發者的工具：錯誤訊息應該回答「發生了什麼」「為什麼」「我該做什麼」三個問題。很多內部工具與函式庫的採用障礙不是功能不足，而是出錯時沒有人知道該怎麼辦——投資在錯誤訊息上的回報常常被低估。

**面試回答方式**：給出價值（把難懂的技術錯誤轉成「描述問題加建議行動」）並舉一個具體的訊息範例。真正的加分點是把它提升成觀點：**開發體驗也是產品的一部分**，成本是幾十行程式碼而收益乘以所有使用者與所有次數。收在通用原則：錯誤訊息應該回答「發生了什麼、為什麼、我該做什麼」，而很多內部工具的採用障礙不是功能不足而是出錯時沒人知道該怎麼辦。

## 相關

- [[045-testing-slices.md]]
- [[047-graceful-shutdown-lifecycle.md]]
