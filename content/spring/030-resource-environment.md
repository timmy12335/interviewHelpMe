---
id: spring-030
category: spring
slug: resource-environment
title: Spring 的資源與環境抽象
difficulty: easy
tags: [Resource, Environment, 抽象, 設計]
source: original
---

# 題目

`Resource` 與 `Environment` 這兩個抽象解決了什麼問題？

## 核心答案

`Resource` 統一了**「從某個地方取得一段資料」**這件事。JDK 原本要處理檔案用 `File`、處理 classpath 資源用 `ClassLoader.getResourceAsStream`、處理 URL 用 `URL.openStream`——**三套 API、三種錯誤處理、三種存在性檢查**。`Resource` 把它們統一成一個介面（`getInputStream`、`exists`、`getFilename`、`lastModified`），並提供 `ClassPathResource`、`FileSystemResource`、`UrlResource`、`ByteArrayResource` 等實作。配合 `ResourceLoader` 與**位置字串前綴**（`classpath:`、`file:`、`http:`），使用方只要一個字串就能取得任何來源的資源。

`Environment` 統一了**「取得一個設定值」**這件事。它把系統屬性、環境變數、設定檔、命令列參數等**多個 `PropertySource` 抽象成一個有序的清單**，`getProperty` 依序查找。同時它也管理 **profile** 的啟用狀態。

**兩者的共同價值是「讓使用方不必知道來源」**——這正是抽象的意義：把「要什麼」與「從哪裡拿」分開，使得來源可以替換而使用方不必改動。

## 詳細解析

**`Resource` 的實用之處在於「一個字串涵蓋多種來源」**。`@Value("classpath:templates/mail.html") Resource template` 這樣的宣告，讓同一段程式碼可以在開發時讀 classpath、在生產時改成讀外部檔案（只要改設定值成 `file:/etc/app/mail.html`）。**這種「改設定就換來源」的能力，正是抽象帶來的彈性。** `ResourcePatternResolver` 更支援萬用字元（`classpath*:config/**/*.xml`），一次取得多個資源。

**`classpath:` 與 `classpath*:` 的差別是一個經典的細節**：前者只找**第一個**符合的資源，後者會掃描**所有** classpath 上的 JAR 找出全部符合的。**這正是 Spring 自己載入多個 JAR 中的自動配置與擴充點時用的機制**——每個 JAR 都可以提供自己的一份，框架把它們全部收集起來。理解這個差別，就理解了「可插拔擴充」在 classpath 層面是怎麼實現的。

**`Environment` 的 `PropertySource` 是可擴充的**。可以實作自訂的 `PropertySource` 從資料庫、設定中心或機密管理服務讀取，並在啟動早期透過 `EnvironmentPostProcessor` 加入。**這是把外部設定來源接進 Spring 的標準做法**——比在每個使用點自己去讀好得多，因為所有既有的 `@Value` 與 `@ConfigurationProperties` 都會自動受益。

**這兩個抽象展示了 Spring 的一個一貫做法：為 JDK 已有但不統一的能力提供統一的介面。** 同樣的模式出現在 `DataAccessException`（統一各家資料庫的例外）、`Cache` 抽象（統一各家快取實作）、以及 `TaskExecutor`（統一執行緒池）。**它們的共同代價是多一層間接與學習成本，共同收益是讓實作可替換、讓程式碼與具體技術解耦。** 判斷這種抽象值不值得，要看「替換的可能性有多高」以及「統一之後的介面是否真的夠用」。

## 面試回答方式

先分別給兩者解決的問題：`Resource` 統一了**「從某個地方取得資料」**（JDK 原本檔案、classpath、URL 三套 API），`Environment` 統一了**「取得一個設定值」**（多個 PropertySource 依序查找）。用一句話串起來：**共同價值是讓使用方不必知道來源**，把「要什麼」與「從哪裡拿」分開。加分點有三個：**`@Value("classpath:...") Resource` 讓改設定就能換來源**（開發讀 classpath、生產讀外部檔案）；**`classpath:` 與 `classpath*:` 的差別**——後者掃描所有 JAR，這正是可插拔擴充在 classpath 層面的實現方式；以及**自訂 `PropertySource` 是接入外部設定來源的標準做法**，所有既有的 `@Value` 與 `@ConfigurationProperties` 都會自動受益。收在一個一貫的模式：Spring 常為 JDK 已有但不統一的能力提供統一介面，代價是多一層間接。

## 講稿

Resource 統一了從某個地方取得一段資料這件事。JDK 原本要處理檔案用一套、classpath 資源用另一套、URL 又是一套，三種 API、三種錯誤處理。Resource 把它們統一成一個介面，配合位置字串的前綴，使用方只要一個字串就能取得任何來源的資源。

Environment 統一了取得設定值這件事。它把系統屬性、環境變數、設定檔、命令列參數抽象成一個有序的清單，依序查找。

兩者的共同價值是讓使用方不必知道來源。把要什麼跟從哪裡拿分開，來源就可以替換而使用方不必改動。

有一個很實用的推論。用 Resource 型別接一個設定值的話，同一段程式碼在開發時可以讀 classpath，生產時只要把設定改成檔案路徑前綴就換成讀外部檔案，程式碼完全不動。

還有一個經典的細節是兩種 classpath 前綴的差別。一種只找第一個符合的資源，另一種會掃描所有 JAR 找出全部符合的。後者正是 Spring 自己收集多個 JAR 裡的擴充點時用的機制，理解這個差別就理解了可插拔擴充在 classpath 層面怎麼實現。

## 常見追問

### 怎麼把外部設定中心接進 Spring？

**核心答案**：實作一個 **`PropertySource`** 並在啟動早期加入 `Environment`。加入的時機有兩種：**`EnvironmentPostProcessor`**（透過 `spring.factories` 註冊，在 `ApplicationContext` 建立之前執行，**這是正確的時機**）或者 `ApplicationContextInitializer`。**不要在 `@Configuration` 類別裡加**——那時候很多 bean 的屬性已經解析過了，加了也來不及。

**詳細解析**：**優先序的放置位置需要決定**：把新的 `PropertySource` 加在最前面（優先權最高，設定中心覆蓋一切）還是最後面（只當作預設值）。**多數情況下應該放在「環境變數之後、設定檔之前」左右**——讓設定中心能覆蓋打包的預設值，但仍然允許部署時的環境變數與命令列參數覆蓋設定中心（這在緊急處理時很重要，你不會希望某個值只能透過設定中心改）。**「總是保留一條本地覆蓋的路徑」是一個有價值的維運原則**——當設定中心本身故障或設定錯誤時，你需要能直接改實例的設定把服務救起來。

**面試回答方式**：給實作方式（自訂 `PropertySource`）與**正確的加入時機**（`EnvironmentPostProcessor`，在 ApplicationContext 建立之前），並明確指出不要在 `@Configuration` 裡加。真正的加分點是**優先序的放置決定**：放在環境變數之後、設定檔之前，讓設定中心能覆蓋打包的預設值但仍允許部署時覆蓋。收在維運原則：**總是保留一條本地覆蓋的路徑**，因為設定中心本身可能故障或設錯。

### 從 JAR 裡讀取資源時有什麼陷阱？

**核心答案**：**`Resource.getFile()` 在資源位於 JAR 內時會失敗**，拋 `FileNotFoundException`——因為 JAR 內的項目不是檔案系統上的檔案。開發時從 IDE 執行（資源在 `target/classes` 下是真實檔案）一切正常，**打包成 JAR 部署後就壞掉**，這是一個經典的「本機好好的、上線就爆」問題。正確做法是**一律用 `getInputStream()`**，它對所有 `Resource` 實作都有效。

**詳細解析**：延伸的問題是**「取得 JAR 內某個目錄下的所有檔案」**——`getFile()` 之後列目錄的做法完全行不通。正確做法是用 `PathMatchingResourcePatternResolver` 搭配 `classpath*:dir/**` 模式，它會處理 JAR 的內部結構。**還有一個相關陷阱是 Spring Boot 的可執行 JAR 是巢狀的**（JAR 裡面還有 JAR），標準的 `java.util.jar` API 處理不了，必須靠 Spring Boot 的載入器。**這一類問題的共同教訓是：開發環境與生產環境在檔案系統層面的差異，是最容易被忽略的部署風險之一**——所以「在打包後的成品上跑一次測試」比只跑 IDE 裡的測試有價值得多。

**面試回答方式**：給出具體陷阱——**`getFile()` 在 JAR 內失敗，IDE 裡正常、打包後爆掉**，正確做法是一律用 `getInputStream()`。延伸到「列出 JAR 內某目錄的所有檔案」要用 `PathMatchingResourcePatternResolver` 加 `classpath*:` 模式。加分點是提到 Spring Boot 的可執行 JAR 是巢狀的、標準 API 處理不了。收在教訓：**開發與生產在檔案系統層面的差異是最容易被忽略的部署風險**，所以應該在打包後的成品上跑一次測試。

### 這類「統一抽象」什麼時候反而是負擔？

**核心答案**：當**底層實作的差異大到無法被介面隱藏**時。統一介面只能暴露各實作的**交集**，如果某個實作有重要的獨特能力（例如某個快取支援原子的批次操作、某個資料庫支援特殊的鎖模式），抽象要嘛不提供它（使用者被迫繞過抽象直接用底層 API），要嘛提供但在其他實作上不支援（**抽象洩漏，使用者仍然要知道底層是誰**）。

**詳細解析**：Spring 的 `Cache` 抽象是一個典型例子——它提供了 `get`、`put`、`evict` 這些共通操作，但**沒有統一的 TTL 設定、沒有統一的批次操作、也沒有統一的統計介面**，因為各家實作差太多。結果是稍微複雜的快取需求都要直接用底層 API（Caffeine 或 Redis 的原生介面），抽象只在最簡單的場景有用。**判斷一個統一抽象值不值得的問題是：使用者真的會替換實作嗎？如果不會，抽象的主要價值（可替換性）就不存在，只剩下成本。** 實務上很多「為了將來可能換掉」而引入的抽象，最後既沒有換掉、也讓程式碼多了一層無謂的間接。**這與「不要預先抽象」是同一個判斷。**

**面試回答方式**：給出核心條件——**底層差異大到無法被介面隱藏時**，統一介面只能暴露交集，獨特能力要嘛不提供要嘛造成抽象洩漏。用 Spring 的 `Cache` 抽象當具體例子（沒有統一的 TTL、批次操作、統計介面，稍複雜的需求都要用底層 API）。收在判斷問題：**使用者真的會替換實作嗎？不會的話抽象的主要價值就不存在，只剩成本**，並連到「不要預先抽象」是同一個判斷。

## 相關

- [[026-externalized-configuration.md]]
- [[034-type-conversion-binding.md]]
