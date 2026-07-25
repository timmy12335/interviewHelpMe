---
id: spring-013
category: spring
slug: spring-boot-autoconfiguration
title: Spring Boot 自動配置原理
difficulty: hard
tags: [SpringBoot, 自動配置, 條件裝配]
source: original
---

# 題目

Spring Boot 的自動配置（Auto-Configuration）是怎麼實現的？為什麼引入一個 starter 就能自動配置好？

## 核心答案

Spring Boot 自動配置的核心是——`@EnableAutoConfiguration`（通常透過 `@SpringBootApplication` 引入）觸發自動配置機制：Spring Boot 從所有依賴 jar 的特定檔案（JDK 8 是 `META-INF/spring.factories`、Spring Boot 2.7+ 是 `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`）中載入一大批「自動配置類別」，然後每個自動配置類別透過 `@Conditional` 系列條件註解「按需生效」——只有當滿足條件（如 classpath 上有某個類別、容器中沒有某個 Bean、某個配置屬性開啟等）時，這個配置才會被套用。所以「引入 starter → 帶來對應的依賴和自動配置類別 → 條件滿足 → 自動配置好」。

## 詳細解析

**自動配置的完整鏈路**：

1. **`@SpringBootApplication`** 包含 `@EnableAutoConfiguration`，它是自動配置的開關。
2. **載入自動配置類別**：`@EnableAutoConfiguration` 透過 `AutoConfigurationImportSelector` 去掃描所有 jar 的 `META-INF/spring/...AutoConfiguration.imports` 檔案（舊版是 `spring.factories`），把裡面列出的所有「自動配置類別（XxxAutoConfiguration）」載入為候選。
3. **條件裝配（按需生效）**：每個自動配置類別上都有 `@Conditional` 系列註解，決定它「在什麼條件下才生效」。例如 `DataSourceAutoConfiguration` 上有 `@ConditionalOnClass(DataSource.class)`——只有 classpath 上存在 DataSource 相關類別（即引入了 JDBC 依賴）時才生效。
4. **配置生效**：滿足條件的自動配置類別被套用，自動註冊好對應的 Bean（如自動配置好 DataSource、JdbcTemplate 等），並可透過 `application.properties`/`yml` 的屬性來調整。

**關鍵的條件註解（@Conditional 系列）**：

- `@ConditionalOnClass` / `@ConditionalOnMissingClass`：classpath 上有/沒有某個類別時生效。
- `@ConditionalOnBean` / `@ConditionalOnMissingBean`：容器中有/沒有某個 Bean 時生效（`@ConditionalOnMissingBean` 極重要——它讓「使用者自訂的 Bean 優先於自動配置的預設 Bean」，實現「約定優於配置、但允許覆蓋」）。
- `@ConditionalOnProperty`：某個配置屬性符合條件時生效。
- `@ConditionalOnWebApplication`：是 Web 應用時生效。

**「約定優於配置」的體現**：自動配置提供了大量「合理的預設 Bean」，但都用 `@ConditionalOnMissingBean` 守護——如果你自己定義了同型別的 Bean，自動配置的預設就不生效（讓路給你的）。這實現了「預設能用、但可覆蓋」的優雅平衡。

## 面試回答方式

按「鏈路」講清楚——`@SpringBootApplication` → `@EnableAutoConfiguration` → 載入所有 jar 的自動配置類別（從 spring.factories / AutoConfiguration.imports）→ 每個配置類別用 `@Conditional` 按需生效。核心要突出兩點：一是「從特定檔案載入一大批自動配置類別」這個載入機制，二是「`@Conditional` 條件裝配讓配置按需生效」這個核心。特別強調 `@ConditionalOnMissingBean` 實現「約定優於配置、允許覆蓋」——這是 Spring Boot 設計哲學的精髓。能講出這兩點和它們如何配合實現「開箱即用又可自訂」，展現你理解自動配置的本質而非只知道「加了註解就自動配好」。

## 常見追問

### @ConditionalOnMissingBean 為什麼是自動配置的關鍵？

**核心答案**：因為它實現了「約定優於配置，但允許使用者覆蓋」這個 Spring Boot 的核心設計哲學。自動配置提供的都是「合理的預設 Bean」，但每個預設 Bean 通常都用 `@ConditionalOnMissingBean` 守護——意思是「只有當容器中還沒有這種型別的 Bean 時，我這個預設的才生效」。所以如果使用者自己定義了一個同型別的 Bean，自動配置就會「識趣地讓路」（因為 @ConditionalOnMissingBean 條件不滿足，預設 Bean 不生效），使用者的自訂 Bean 優先。這讓 Spring Boot 既能「開箱即用」（不配置也有合理預設），又能「隨時覆蓋」（想自訂時定義自己的 Bean 即可），達到了靈活性和便利性的優雅平衡。

**詳細解析**：這是理解 Spring Boot「魔法」為什麼不「霸道」的關鍵。沒有 @ConditionalOnMissingBean 的話，自動配置會「強制」注入它的預設 Bean，使用者想自訂就會和自動配置的 Bean 衝突（重複定義）。有了 @ConditionalOnMissingBean，自動配置變成了「謙讓的預設提供者」——它先看看使用者有沒有自己的，有就退讓、沒有才提供預設。例如 Spring Boot 自動配置了一個預設的 `ObjectMapper`（Jackson 的 JSON 處理器），但如果你想自訂 ObjectMapper 的行為（如日期格式、命名策略），你只需在自己的配置類別裡定義一個 `@Bean ObjectMapper`，Spring Boot 的預設 ObjectMapper 就因為 @ConditionalOnMissingBean 不生效了、用你的。這種「預設謙讓、自訂優先」的模式貫穿了整個 Spring Boot 自動配置，是它「約定優於配置」哲學的技術實現。理解這一點，展現你不只知道自動配置怎麼運作，還理解它為什麼能既方便又不失靈活。

**面試回答方式**：講出「@ConditionalOnMissingBean 實現『約定優於配置、允許覆蓋』——自動配置的預設 Bean 用它守護、使用者自訂同型別 Bean 時預設讓路」。用「自訂 ObjectMapper 覆蓋預設」的例子說明。能點出「這讓 Spring Boot 既開箱即用又可隨時覆蓋、是設計哲學的技術實現」，展現你理解這個註解的深層價值。

### spring.factories 和 Spring Boot 2.7+ 的新機制有什麼區別？

**核心答案**：在 Spring Boot 2.7 之前，自動配置類別是註冊在每個 jar 的 `META-INF/spring.factories` 檔案裡（以 `EnableAutoConfiguration` 為 key 列出所有自動配置類別）。Spring Boot 2.7 引入了新的機制——自動配置類別改為註冊在 `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` 檔案裡（每行一個類別全名，格式更簡潔）。2.7 是過渡版本（兩者都支援），到 Spring Boot 3.0 則完全移除了用 spring.factories 註冊自動配置的方式，只支援新的 `.imports` 檔案。這個改變主要是為了效能（新格式解析更快、不用載入整個 spring.factories）和清晰度。

**詳細解析**：這個演進反映了 Spring Boot 對自動配置載入機制的優化。舊的 `spring.factories` 是一個通用的「工廠載入」機制——一個檔案裡用不同的 key 列各種東西（自動配置、監聽器、初始化器等），自動配置只是其中一個 key（`org.springframework.boot.autoconfigure.EnableAutoConfiguration`）。它的問題是——自動配置類別列在一個很長的 value 裡（逗號分隔、要換行轉義），可讀性差；且載入時要解析整個 spring.factories（包含其他無關的 key）。新機制把「自動配置類別的註冊」獨立出來，用一個專門的檔案 `AutoConfiguration.imports`，格式是「每行一個類別全名」，更簡潔清晰、解析更快、也和其他工廠載入的內容解耦。Spring Boot 2.7 同時支援新舊兩種（過渡），Spring Boot 3.0 徹底切換到新機制。這是面試中一個能體現「你是否關注框架版本演進」的細節——如果你寫自訂 starter，在 Spring Boot 3.x 就必須用新的 `.imports` 檔案。理解這個演進，展現你跟進了 Spring Boot 的版本變化。

**面試回答方式**：講出「2.7 前用 spring.factories（EnableAutoConfiguration 為 key）、2.7 引入新的 AutoConfiguration.imports 檔案（每行一個類別、更簡潔）、3.0 完全移除舊方式」。能點出改變動機（效能、清晰度、解耦）和實務影響（3.x 寫自訂 starter 要用新格式），展現你關注框架的版本演進。

### 如何自己寫一個 Spring Boot Starter？

**核心答案**：大致步驟——（1）建立一個模組，引入 `spring-boot-autoconfigure`（和你要整合的依賴）；（2）寫「自動配置類別」（`XxxAutoConfiguration`），用 `@Configuration` + `@Bean` 定義要自動註冊的 Bean，並用 `@Conditional` 系列註解（尤其 `@ConditionalOnMissingBean` 讓使用者可覆蓋、`@ConditionalOnClass` 判斷相關類別存在）控制生效條件；（3）通常配一個 `@ConfigurationProperties` 類別，把可配置項對應到 `application.yml` 的屬性，讓使用者能透過配置檔調整；（4）把自動配置類別註冊到 `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`（Spring Boot 3.x）或舊的 `spring.factories`（2.x）；（5）（可選）建立一個 starter 模組聚合這個 autoconfigure 模組和相關依賴，方便使用者一次引入。

**詳細解析**：寫自訂 starter 是「把自動配置的原理反過來用」——你要提供的正是前面講的那套機制：自動配置類別 + 條件註解 + 屬性綁定 + 註冊檔案。慣例上分兩個模組——`xxx-spring-boot-autoconfigure`（放自動配置的邏輯：配置類別、屬性類別、註冊檔案）和 `xxx-spring-boot-starter`（一個「空殼」聚合模組，它只是把 autoconfigure 模組和 xxx 本身的依賴打包在一起，讓使用者引入一個 starter 就把所有需要的都帶進來）。核心是自動配置類別的設計——用 `@ConditionalOnClass` 保證「只在使用者引入了相關依賴時才生效」、用 `@ConditionalOnMissingBean` 保證「使用者能覆蓋你的預設」、用 `@ConfigurationProperties` 讓使用者能透過 `application.yml` 配置。這樣使用者引入你的 starter 後，只要滿足條件就自動配好、且能透過配置檔調整、還能定義自己的 Bean 覆蓋。理解如何寫 starter，證明你真正吃透了自動配置的原理（能造而不只是用），是很有說服力的加分。

**面試回答方式**：講出步驟——「引入 spring-boot-autoconfigure、寫自動配置類別（@Configuration + @Bean + @Conditional 條件註解）、配 @ConfigurationProperties 綁定配置、註冊到 AutoConfiguration.imports、可選聚合成 starter 模組」。強調關鍵設計（@ConditionalOnClass 判斷依賴、@ConditionalOnMissingBean 允許覆蓋、@ConfigurationProperties 可配置）。能講出「autoconfigure 和 starter 通常分兩個模組」的慣例，展現你真正吃透了自動配置原理。

## 相關

- [[014-springbootapplication-annotation.md]]
- [[015-starter-mechanism.md]]
- [[024-conditional-profiles.md]]
