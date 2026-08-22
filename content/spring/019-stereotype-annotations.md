---
id: spring-019
category: spring
slug: stereotype-annotations
title: "@Component、@Service、@Repository、@Controller 的區別"
difficulty: easy
tags: [Component, Service, Repository, Controller]
source: original
---

# 題目

`@Component`、`@Service`、`@Repository`、`@Controller` 有什麼區別？它們功能上一樣嗎？

## 核心答案

這四個註解本質上「功能相同」——都是把類別標記為 Spring 管理的 Bean（都能被元件掃描發現並註冊為 Bean）。其中 `@Component` 是「通用」的元件標記，而 `@Service`、`@Repository`、`@Controller` 都是 `@Component` 的「特化（衍生）」——它們內部都被 `@Component` 標註，所以效果上和 @Component 一樣能註冊為 Bean，但它們透過「語意化的命名」表達了這個 Bean 在分層架構中的「角色」（Service 是業務層、Repository 是資料存取層、Controller 是 Web 層），提升了程式碼的可讀性。此外個別註解有一點額外功能——`@Repository` 會把資料存取的異常轉換成 Spring 統一的 DataAccessException、`@Controller` 配合 Spring MVC 處理 Web 請求。

## 詳細解析

**共同點——都是 Bean 標記**：這四個註解都能讓類別被 `@ComponentScan` 掃描到並註冊為 Spring 容器管理的 Bean。從「能不能成為 Bean」的角度，它們完全等價。

**`@Component`（通用標記）**：最基礎、通用的元件標記，表示「這是一個 Spring 管理的元件」，不帶特定的分層語意。適合那些「不屬於明確分層角色」的通用元件（工具類、配置類等）。

**三個特化註解（都是 @Component 的衍生）**：

- **`@Service`**：標記「業務邏輯層」的元件。功能上等同 @Component，但語意上明確表達「這是 Service（業務層）」，讓程式碼分層清晰。
- **`@Repository`**：標記「資料存取層（DAO）」的元件。除了語意，它還有一個「額外功能」——會啟用「異常轉換」，把資料存取技術特定的異常（如 JDBC 的 SQLException、JPA 的異常）轉換成 Spring 統一的 `DataAccessException` 體系，讓上層不依賴具體的資料存取技術異常。
- **`@Controller`**：標記「Web 表現層」的元件。它配合 Spring MVC——被 @Controller 標記的類別，其方法上的 @RequestMapping 等才會被 Spring MVC 識別為請求處理器。（`@RestController` = @Controller + @ResponseBody，用於 REST API。）

**核心價值——語意化分層**：這些特化註解的主要價值是「表達意圖」——透過註解名稱就能看出一個 Bean 在架構中的角色（哪一層），讓程式碼結構清晰、便於理解和維護，也讓某些工具/切面能按角色處理（如「對所有 @Service 記錄日誌」）。

## 面試回答方式

先給核心結論——「四個功能上基本相同（都是把類別註冊為 Bean）、@Service/@Repository/@Controller 都是 @Component 的特化」。這是這題的關鍵，避免被誤導以為它們功能差很多。接著講「主要區別是語意化分層」——用不同註解表達 Bean 在架構中的角色（業務/資料/Web層），提升可讀性。務必補上兩個「額外功能」的細節——`@Repository` 的異常轉換、`@Controller` 配合 MVC 處理請求，這些是它們「不只是換個名字」的實質差異，能講出來展現你不只知道「差不多」還知道細微的實質區別。

## 常見追問

### @Repository 的「異常轉換」具體做什麼？有什麼好處？

**核心答案**：`@Repository` 會啟用 Spring 的「持久層異常轉換」——把各種資料存取技術（JDBC、JPA、Hibernate、MyBatis）拋出的「技術特定的、通常是受檢的異常」（如 JDBC 的 `SQLException`、Hibernate 的 `HibernateException`）自動轉換成 Spring 統一的、非受檢的 `DataAccessException` 異常體系。好處是「解耦」——上層的業務程式碼不需要依賴、捕捉具體資料存取技術的異常類型，而是統一面對 Spring 的 `DataAccessException`，這樣即使你更換底層的資料存取技術（如從 JDBC 換成 JPA），上層處理異常的程式碼也不用改（因為都是 DataAccessException）。

**詳細解析**：這是 @Repository「不只是語意標記」的實質功能。不同的資料存取技術有各自的異常體系——JDBC 拋 `SQLException`（受檢異常，還要求你 try-catch）、Hibernate 拋 `HibernateException`、JPA 拋 `PersistenceException` 等。如果上層直接面對這些技術特定的異常，會有兩個問題——一是耦合（業務程式碼要 import 和處理具體技術的異常，換技術就要改）、二是受檢異常的麻煩（如 SQLException 是受檢的，逼你到處 try-catch 或 throws）。Spring 的解法是——`@Repository` 標記的類別，Spring 會用一個 `PersistenceExceptionTranslationPostProcessor` 為它加一層異常轉換的代理，把技術特定的異常統一「翻譯」成 Spring 的 `DataAccessException` 體系（這是一套非受檢的、和具體技術無關的異常，如 `DataAccessException`、`DuplicateKeyException`、`DataIntegrityViolationException` 等，語意清晰且分類合理）。這樣上層只需面對這套統一的異常，不依賴底層技術、也不用被受檢異常糾纏。這也是 Spring「用統一抽象隔離底層技術差異」設計理念的一個體現。理解這個功能，展現你知道 @Repository 有實質作用而非只是換名字。

**面試回答方式**：講出「@Repository 啟用異常轉換——把 JDBC/JPA/Hibernate 等技術特定的異常統一轉成 Spring 的 DataAccessException 體系」，好處「解耦——上層不依賴具體技術的異常、換底層技術上層異常處理不用改、且 DataAccessException 是非受檢的更好用」。能連結到「這是 Spring 用統一抽象隔離底層技術差異的理念」，展現你理解這個功能的實質價值。

### 為什麼要用 @Service/@Repository 而不是全都用 @Component？

**核心答案**：技術上全用 @Component 也能工作（都能註冊為 Bean），但用特化的 @Service/@Repository/@Controller 有幾個好處——（1）**可讀性/語意**：一眼就能看出這個 Bean 在架構中的角色（哪一層），讓程式碼結構清晰、符合分層架構的表達；（2）**額外功能**：@Repository 的異常轉換、@Controller 的 MVC 整合，這些是 @Component 沒有的；（3）**便於按角色處理**：可以寫切面/工具「針對某一類角色」做統一處理（如「對所有 @Service 記錄方法耗時」用 `@within(org.springframework.stereotype.Service)` 精確匹配）。所以雖然功能上 @Component 夠用，但特化註解在可讀性、額外功能、可切面性上都更好，是推薦做法。

**詳細解析**：這題考的是「約定和表達力的價值」。程式碼不只是給機器執行的、更是給人讀的——用 @Service 標一個業務類別、@Repository 標一個 DAO，讀程式碼的人立刻就知道每個類別的職責和它在分層架構中的位置，這種「自文件化」的清晰是 @Component 給不了的（全是 @Component 就看不出角色）。其次是實質功能——@Repository 的異常轉換是真的有用的額外能力。再者是「按角色做切面」——因為角色被註解明確標出，你可以精確地「只對某一層做某種橫切處理」，例如只對所有標了 @Service 的 Bean 記錄業務方法的呼叫日誌和耗時（用切入點表達式匹配這個註解），如果全用 @Component 就無法區分角色、做不到這種精確的按層處理。所以這些特化註解體現了「用有語意的約定，換來可讀性、額外功能、和可操作性」。這也是一個好的工程習慣——用最能表達意圖的工具，而不是只用最通用的。理解這個展現你注重程式碼的表達力和可維護性。

**面試回答方式**：講出用特化註解的好處——「可讀性（一眼看出角色和分層）、額外功能（@Repository 異常轉換、@Controller MVC 整合）、可按角色做切面（如只對 @Service 記日誌）」，並承認「技術上 @Component 也能用、但特化註解更好」。能點出「這體現用有語意的約定換可讀性和可操作性、是好的工程習慣」，展現你注重程式碼表達力。

### @Controller 和 @RestController 有什麼區別？

**核心答案**：`@RestController` 是一個組合註解，等於 `@Controller` + `@ResponseBody`。區別在於返回值的處理——`@Controller` 的方法預設返回「邏輯視圖名」（會走 ViewResolver 解析成視圖、渲染 HTML），適合傳統的服務端渲染頁面；`@RestController`（因為含 @ResponseBody）的方法返回值會被 `HttpMessageConverter` 直接序列化成 JSON（或其他格式）寫入回應體、跳過視圖解析，適合前後端分離的 REST API。現代前後端分離開發主要用 `@RestController`。

**詳細解析**：這個區別連結到前面 Spring MVC 的兩條路徑（視圖 vs JSON，見 [[011-spring-mvc-flow.md]]）。核心是「返回值怎麼處理」——`@Controller` 的方法如果返回一個字串，預設會被當成「邏輯視圖名」（如返回 "user/list" 會去找對應的 JSP/Thymeleaf 模板渲染）；如果想讓 @Controller 的某個方法直接返回資料（JSON）而非視圖，要在那個方法上單獨加 `@ResponseBody`。`@RestController` 則是「類別級別」地把 @ResponseBody 應用到所有方法——標了 @RestController 的類別，所有方法的返回值都自動被序列化成回應體（通常是 JSON），不走視圖解析。所以——傳統 MVC（返回頁面）用 @Controller；REST API（返回 JSON）用 @RestController（省得每個方法都加 @ResponseBody）。這個區別反映了 Web 開發從「服務端渲染頁面」到「前後端分離 API」的演進，現代後端主要寫 REST API，所以 @RestController 用得最多。理解這個區別，展現你了解 Web 開發的主流模式和對應的註解選擇。

**面試回答方式**：講出「@RestController = @Controller + @ResponseBody、區別在返回值處理——@Controller 返回視圖名走視圖解析（服務端渲染頁面）、@RestController 返回值直接序列化成 JSON（REST API）」。點出「現代前後端分離主要用 @RestController」。能連結到「這對應 Spring MVC 的兩條路徑（視圖 vs JSON）」，展現你理解這個區別和它反映的 Web 開發演進。

## 相關

- [[005-autowired-vs-resource.md]]
- [[011-spring-mvc-flow.md]]
- [[019-stereotype-annotations.md]]
