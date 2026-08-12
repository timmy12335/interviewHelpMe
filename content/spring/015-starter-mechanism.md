---
id: spring-015
category: spring
slug: starter-mechanism
title: Spring Boot Starter 機制
difficulty: medium
tags: [Starter, 依賴管理, 自動配置]
source: original
---

# 題目

Spring Boot 的 Starter 是什麼？它解決了什麼問題？和自動配置是什麼關係？

## 核心答案

Starter 是 Spring Boot 提供的「一站式依賴集合」——一個 starter（如 `spring-boot-starter-web`）把「使用某個功能所需的一組相關依賴」聚合打包在一起，你只要引入這一個 starter，就自動帶來這個功能需要的所有依賴（且版本相互相容），不用自己一個個找依賴、對版本。它解決的是「依賴管理繁瑣、版本衝突」的痛點。Starter 和自動配置的關係是——starter 負責「帶來依賴」，自動配置負責「根據這些依賴自動配好 Bean」，兩者配合實現「引入一個 starter 就開箱即用」。

## 詳細解析

**Starter 解決的問題**：在 Spring Boot 之前，要用一個功能（如 Spring MVC）要手動引入一堆相關依賴（spring-web、spring-webmvc、Jackson、Tomcat 等）並小心處理它們之間的版本相容。這很繁瑣且容易版本衝突。Starter 把「一個功能所需的一組相容的依賴」預先聚合好——你只需引入 `spring-boot-starter-web`，這一個依賴就透過它的傳遞依賴（transitive dependencies）把 Web 開發需要的所有東西都帶進來，版本也是經過 Spring Boot 統一管理、相互相容的。

**Starter 本身通常是「空殼」**：一個 starter 模組本身往往沒有程式碼，它就是一個 `pom.xml`（依賴清單），作用是「聚合一組依賴」。例如 `spring-boot-starter-web` 的 pom 裡宣告了對 spring-webmvc、jackson、tomcat 等的依賴，引入它就等於引入了這一整組。

**Starter 和自動配置的分工**：

- **Starter 負責「帶來依賴」**：引入 starter → classpath 上有了相關的類別庫。
- **自動配置負責「配好 Bean」**：classpath 上有了相關類別 → 對應的 `XxxAutoConfiguration`（透過 `@ConditionalOnClass` 判斷）條件滿足 → 自動註冊好需要的 Bean。
- 兩者配合——starter 把依賴帶進來，觸發自動配置生效，於是「引入一個 starter 就自動配好、開箱即用」。

**官方 starter 命名慣例**：官方的 starter 命名是 `spring-boot-starter-xxx`（如 `-web`、`-data-jpa`、`-security`）；第三方的慣例是 `xxx-spring-boot-starter`（把自己的名字放前面），這個命名區分讓人一眼看出是官方還是第三方的。

## 面試回答方式

先講「Starter 解決什麼問題」——依賴管理繁瑣、版本衝突，starter 把一組相容依賴聚合成一個，引入一個就全帶進來。接著點出「starter 本身通常是空殼（只是依賴清單）」這個容易被誤解的點。最核心的是講清「starter 和自動配置的分工」——starter 帶依賴、自動配置根據依賴配 Bean，兩者配合實現開箱即用。能區分官方（spring-boot-starter-xxx）和第三方（xxx-spring-boot-starter）的命名慣例是加分細節，展現你對 starter 生態的了解。

## 常見追問

### 引入一個 starter 後，「開箱即用」的完整鏈路是什麼？

**核心答案**：完整鏈路是——（1）引入 starter（如 spring-boot-starter-web）→ 它透過傳遞依賴把 Web 相關的類別庫（spring-webmvc、Tomcat、Jackson 等）帶到 classpath；（2）Spring Boot 啟動時，`@EnableAutoConfiguration` 載入所有自動配置類別；（3）Web 相關的自動配置類別（如 `WebMvcAutoConfiguration`、`DispatcherServletAutoConfiguration`）上的 `@ConditionalOnClass` 檢測到 classpath 上有了 Web 相關的類別（因為 starter 帶來了），條件滿足、生效；（4）這些自動配置類別自動註冊好 Web 所需的 Bean（DispatcherServlet、視圖解析、訊息轉換器、內嵌 Tomcat 等）；（5）於是你什麼都不用配，Web 功能就直接能用了。核心是「starter 帶依賴 → 依賴讓 @ConditionalOnClass 條件滿足 → 自動配置生效 → Bean 就緒」。

**詳細解析**：這條鏈路把 starter 和自動配置的配合具體化了，是理解 Spring Boot「魔法」的完整圖景。關鍵的銜接點是 `@ConditionalOnClass`——它是「starter 帶來依賴」和「自動配置生效」之間的橋樑。自動配置類別怎麼知道「該不該配 Web 相關的東西」？它不是無條件配，而是用 `@ConditionalOnClass(DispatcherServlet.class)` 之類的條件判斷「classpath 上有沒有 Web 的類別」——如果有（因為你引入了 web starter），就配；如果沒有（沒引入 web starter），就不配。所以整個機制是「條件驅動」的——你引入什麼 starter，就讓對應的類別出現在 classpath，就觸發對應的自動配置生效。這也解釋了「為什麼 Spring Boot 能根據你引入的依賴智慧地配置」——它不是真的智慧，而是每個自動配置都用 @Conditional 守著、按 classpath 的實際情況（由你引入的 starter 決定）來決定生效與否。理解這條完整鏈路，展現你把 starter、依賴、@ConditionalOnClass、自動配置串成了一個完整的因果鏈。

**面試回答方式**：完整講出鏈路——「引入 starter 帶來依賴到 classpath → @EnableAutoConfiguration 載入自動配置類別 → @ConditionalOnClass 檢測到相關類別存在、條件滿足 → 自動配置生效註冊 Bean → 開箱即用」。強調關鍵橋樑「@ConditionalOnClass 是 starter 和自動配置之間的銜接」。能點出「Spring Boot 不是真智慧、而是條件驅動、按你引入的 starter 決定配什麼」，展現你對整個機制的透徹理解。

### spring-boot-starter-parent 和 dependencyManagement 有什麼作用？

**核心答案**：`spring-boot-starter-parent`（作為專案的 parent POM）或 `spring-boot-dependencies`（透過 dependencyManagement 引入）的核心作用是「統一管理依賴的版本」——它們用 Maven 的 `<dependencyManagement>` 預先定義了大量常用依賴（包括各種 starter 和第三方庫）的「相容版本」。有了它，你在專案裡引入這些依賴時「不需要寫版本號」（版本由 parent 統一管理），Spring Boot 保證這些版本是相互相容、經過測試的。這解決了「多個依賴之間版本相容」這個大痛點——你不用自己去研究「Spring 5.x 該配哪個版本的 Jackson」，Spring Boot 已經幫你選好了相容的一整套。

**詳細解析**：這是 Spring Boot 依賴管理的另一半（starter 管「引入哪些依賴」、parent/dependencies 管「這些依賴用什麼版本」）。`spring-boot-starter-parent` 繼承自 `spring-boot-dependencies`後者在 `<dependencyManagement>` 中列出了幾百個依賴的推薦版本。`<dependencyManagement>` 的作用是「只管版本、不實際引入」——它聲明「如果你用到某個依賴，就用這個版本」，但不會真的把依賴加進來。所以你在自己的 `<dependencies>` 裡引入某個 starter 或庫時，可以省略 `<version>`，Maven 會從 dependencyManagement 找到 Spring Boot 定義的相容版本。這帶來的好處是——你引入的一整套依賴（Spring 全家桶、資料庫驅動、JSON 庫、日誌庫等）的版本都是 Spring Boot 精心測試過相容的，避免了「A 依賴要 Jackson 2.12、B 依賴要 Jackson 2.14」這類版本衝突的噩夢。如果不想用 starter-parent 作為 parent（例如已經有自己的 parent），也可以用 `<dependencyManagement>` 引入 `spring-boot-dependencies` 達到同樣的版本管理效果。理解這個機制，展現你理解 Spring Boot 依賴管理的完整圖景（引入 + 版本兩方面）。

**面試回答方式**：講出核心作用「統一管理依賴版本——用 dependencyManagement 預定義大量依賴的相容版本、讓你引入時不用寫版本號、保證版本相互相容」。點出「starter 管引入哪些、parent/dependencies 管用什麼版本」的分工。能提到「不想用 starter-parent 可以用 dependencyManagement 引入 spring-boot-dependencies」，展現你對依賴管理機制的完整掌握。

### 自訂 starter 時，autoconfigure 模組和 starter 模組為什麼要分開？

**核心答案**：慣例上把自訂 starter 分成兩個模組——`xxx-spring-boot-autoconfigure`（放自動配置的實際邏輯：配置類別、屬性類別、註冊檔案）和 `xxx-spring-boot-starter`（一個空殼聚合模組，只依賴 autoconfigure 模組和相關的第三方庫）。分開的原因是「職責分離和靈活性」——autoconfigure 模組專注於「怎麼自動配置」的邏輯，starter 模組專注於「聚合依賴、方便引入」。這讓使用者有選擇——大多數人引入 starter（一次帶來所有東西，方便）；但如果有人只想要自動配置邏輯、自己管理其他依賴（例如想用不同版本的某個庫），可以只引入 autoconfigure 模組，更靈活。

**詳細解析**：這個分模組的慣例是 Spring Boot 官方推薦的最佳實踐（官方 starter 大多也是這樣組織的——例如有 `spring-boot-autoconfigure` 這個大模組放各種自動配置，然後各個 `spring-boot-starter-xxx` 是聚合特定依賴的空殼）。分開的價值在於「解耦『自動配置邏輯』和『依賴聚合』這兩個關注點」——autoconfigure 模組是「有程式碼的」（配置類別、條件邏輯、屬性綁定），它應該只依賴 `spring-boot-autoconfigure` 和它要整合的核心庫，保持輕量和專注；starter 模組是「沒程式碼的」（純 pom），它的作用純粹是「把 autoconfigure 模組和使用這個功能需要的一整套依賴聚合在一起」，讓使用者引入一個就夠。這種分離讓——普通使用者引入 starter（方便），進階使用者可以只引入 autoconfigure（如果他們想自己精確控制其他依賴的版本或組合）。雖然對很多簡單的自訂 starter，把兩者合在一個模組也能用，但遵循分模組慣例更專業、更符合生態習慣。理解這個慣例的原因，展現你不只會寫能用的 starter，還理解怎麼寫「符合最佳實踐的」starter。

**面試回答方式**：講出「分成 autoconfigure（自動配置邏輯：配置類別、屬性、註冊檔案）和 starter（空殼聚合依賴）兩個模組、職責分離」，並說明價值——「autoconfigure 專注配置邏輯保持輕量、starter 專注聚合依賴方便引入、給使用者選擇（引入 starter 方便 or 只引 autoconfigure 更靈活）」。能點出「這是官方推薦的最佳實踐」，展現你了解 starter 開發的專業慣例。

## 相關

- [[013-spring-boot-autoconfiguration.md]]
- [[014-springbootapplication-annotation.md]]
