---
id: spring-012
category: spring
slug: dispatcherservlet-components
title: DispatcherServlet 與核心組件
difficulty: medium
tags: [DispatcherServlet, HandlerMapping, HandlerAdapter, 組件]
source: original
---

# 題目

DispatcherServlet 依賴哪些核心組件？HandlerMapping 和 HandlerAdapter 為什麼要分開？

## 核心答案

DispatcherServlet 依賴一組核心組件協同完成請求處理：`HandlerMapping`（根據請求找到對應的 Handler）、`HandlerAdapter`（用統一的方式呼叫不同型別的 Handler）、`HandlerExceptionResolver`（處理請求過程中的異常）、`ViewResolver`（把邏輯視圖名解析成 View）、`HttpMessageConverter`（Java 物件與 HTTP 訊息體的轉換，REST 場景用）、`LocaleResolver`（國際化）、`MultipartResolver`（檔案上傳）等。HandlerMapping 和 HandlerAdapter 分開，是為了「解耦『找到誰處理』和『如何呼叫』」——遵循單一職責，且讓 Spring MVC 能支援多種不同形式的 Handler（透過不同的 Adapter 適配），有很好的擴展性。

## 詳細解析

**核心組件及職責**：

- **HandlerMapping（處理器映射）**：負責「根據請求（URL、方法等）找到對應的 Handler」。返回 Handler 和攔截器鏈。有多種實作——`RequestMappingHandlerMapping`（處理 `@RequestMapping`/`@GetMapping` 等註解，最常用）等。
- **HandlerAdapter（處理器適配器）**：負責「用統一的方式呼叫找到的 Handler」。因為 Handler 有多種形式（註解方法、實作特定介面的類別等），用適配器模式統一呼叫。`RequestMappingHandlerAdapter` 負責呼叫 @RequestMapping 註解的方法（完成參數綁定、返回值處理）。
- **HandlerExceptionResolver（異常解析器）**：處理請求處理過程中拋出的異常（如把異常對應到錯誤頁面或錯誤回應）。`@ExceptionHandler`、`@ControllerAdvice` 就靠它。
- **ViewResolver（視圖解析器）**：把 Controller 返回的邏輯視圖名解析成實際的 View 物件。
- **HttpMessageConverter**：REST 場景下 Java 物件 ↔ JSON 等格式的轉換。
- **LocaleResolver、ThemeResolver、MultipartResolver**：分別處理國際化、主題、檔案上傳。

**為什麼 HandlerMapping 和 HandlerAdapter 分開**：

- **單一職責**：「找到誰處理（映射）」和「如何呼叫它（適配）」是兩個不同的職責，分開更清晰。
- **擴展性（適配器模式）**：Handler 可以有多種形式——不只是 @RequestMapping 的方法，還可能是實作 `Controller` 介面的類別、`HttpRequestHandler` 等。如果 DispatcherServlet 直接呼叫 Handler，就要為每種 Handler 寫不同的呼叫邏輯（耦合）。用 HandlerAdapter 適配器把「呼叫方式」抽象出來——每種 Handler 有對應的 Adapter，DispatcherServlet 只需對 Adapter 介面編程，就能統一地呼叫任何形式的 Handler。要支援新的 Handler 形式，只需加一個新的 Adapter，不用改 DispatcherServlet。

## 面試回答方式

先列出核心組件及各自職責（HandlerMapping 找誰處理、HandlerAdapter 怎麼呼叫、ViewResolver 解析視圖、HttpMessageConverter 轉 JSON、HandlerExceptionResolver 處理異常）。「HandlerMapping 和 HandlerAdapter 為什麼分開」是這題的深度考點——講出「單一職責 + 適配器模式的擴展性」，尤其「用 Adapter 適配不同形式的 Handler、要支援新 Handler 只需加 Adapter 不用改 DispatcherServlet」。能從「設計模式（適配器）和擴展性」角度回答，展現你理解這個拆分不是隨意的而是有明確的設計意圖。

## 常見追問

### @ExceptionHandler 和 @ControllerAdvice 是怎麼實現全域異常處理的？

**核心答案**：它們靠 `HandlerExceptionResolver`（具體是 `ExceptionHandlerExceptionResolver`）實現。`@ExceptionHandler` 標在一個方法上，宣告「這個方法處理某種類型的異常」；`@ControllerAdvice`（或 `@RestControllerAdvice`）標在一個類別上，讓其中的 `@ExceptionHandler` 方法「全域生效」（作用於所有 Controller 而非單個）。當 Controller 方法拋出異常時，DispatcherServlet 會遍歷註冊的 HandlerExceptionResolver，找到能處理這個異常類型的 @ExceptionHandler 方法來處理（例如把異常轉換成一個統一格式的錯誤回應 JSON），實現「集中的、統一的全域異常處理」，避免在每個 Controller 裡重複寫 try-catch。

**詳細解析**：全域異常處理是實際專案的必備——它讓你能「集中定義各種異常該如何回應給前端」，而不是在每個方法裡散落 try-catch。機制上——`@ControllerAdvice` 類別中的 `@ExceptionHandler` 方法被註冊為全域的異常處理器；當任何 Controller 拋出異常且沒被自己 catch 時，DispatcherServlet 會把異常交給 HandlerExceptionResolver 處理，`ExceptionHandlerExceptionResolver` 會根據異常的類型找到匹配的 @ExceptionHandler 方法（例如一個處理 `BusinessException`、一個處理 `ValidationException`、一個兜底處理 `Exception`），呼叫它生成對應的回應。實務中典型用法是——定義一個 `@RestControllerAdvice` 類別，裡面針對不同異常類型寫 @ExceptionHandler 方法，把異常轉換成統一格式的錯誤回應（如 `{code, message, data}`），這樣前端收到的所有錯誤都是統一格式、後端也不用在業務程式碼裡到處處理異常回應。這是 AOP 思想（異常處理是橫切關注點）在 MVC 層的體現。理解這個機制，展現你了解實際專案中如何做優雅的統一異常處理。

**面試回答方式**：講出「靠 HandlerExceptionResolver 實現——@ExceptionHandler 宣告處理某類異常、@ControllerAdvice 讓它全域生效、Controller 拋異常時由 resolver 找匹配的處理方法生成統一錯誤回應」。能點出實務價值「集中定義異常回應、前端收到統一格式、業務碼不用散落 try-catch」，展現你有實際專案的全域異常處理經驗。

### 一個請求進來，HandlerMapping 是怎麼匹配到具體的 Controller 方法的？

**核心答案**：以最常用的 `RequestMappingHandlerMapping` 為例——它在 Spring 啟動時就掃描所有 `@Controller`/`@RestController` 的方法，把每個方法上的 `@RequestMapping`（及 @GetMapping 等）資訊解析成一個「請求映射（RequestMappingInfo，包含 URL 路徑、HTTP 方法、參數條件、請求頭條件等）」，建立一個「映射 → 方法」的註冊表。當請求進來時，它根據請求的 URL、HTTP 方法等資訊，在註冊表中匹配出符合的那個方法（如果匹配到多個，按精確度排序選最匹配的），返回這個方法作為 Handler。

**詳細解析**：這個匹配過程分「啟動時建表」和「請求時查表」兩階段。啟動時——`RequestMappingHandlerMapping` 掃描所有 Controller Bean，對每個標了 @RequestMapping 的方法，把它的映射條件（路徑如 `/users/{id}`、方法如 GET、可能還有 params/headers/consumes/produces 等條件）封裝成 `RequestMappingInfo`，註冊到一個 map 裡（映射資訊 → HandlerMethod）。請求時——根據當前請求的實際情況（URL、方法、內容類型等），去 map 裡找所有「條件都滿足」的候選，如果有多個（例如 `/users/{id}` 和 `/users/admin` 對 `/users/admin` 都可能匹配），會按「匹配精確度」排序（更具體的路徑優先於萬用/路徑變數），選出最佳匹配的那個 HandlerMethod。這個機制支撐了 Spring MVC 靈活的路由能力——支援路徑變數、萬用、按 HTTP 方法/參數/請求頭區分等。理解「啟動建表、請求查表、多匹配按精確度選」，展現你理解 URL 路由這個 MVC 核心機制的實現。

**面試回答方式**：講出兩階段——「啟動時掃描所有 @RequestMapping 方法建立映射註冊表、請求時根據 URL/HTTP方法等匹配、多個候選按精確度選最匹配的」。能舉「/users/{id} vs /users/admin 對具體路徑的精確度排序」說明多匹配的處理，展現你理解路由匹配的機制而非只知道「@GetMapping 就能對應到方法」。

### Spring MVC 中，同一個 Controller 是單例還是每個請求一個？執行緒安全嗎？

**核心答案**：Spring MVC 的 Controller 預設是「單例（singleton）」——整個應用共享同一個 Controller 實例，所有請求（不同執行緒）都用這一個實例來處理。它「是否執行緒安全」取決於——如果 Controller 是「無狀態」的（只有處理邏輯、沒有可變的成員欄位，請求相關的資料都在方法參數和區域變數裡），那麼單例是執行緒安全的（不同執行緒各用自己的棧幀和參數、互不干擾）；但如果 Controller 有「可變的成員欄位」並在方法中讀寫它，多執行緒共享這個單例就會有執行緒安全問題（資料串號）。所以正確做法是保持 Controller 無狀態。

**詳細解析**：這題把 Bean 作用域（見 [[003-bean-scopes.md]]）和 MVC 結合。Controller 作為一種 Bean，預設也是單例——這意味著一個 `UserController` 實例被所有處理請求的執行緒共享。這通常沒問題，因為 Controller 方法一般是無狀態的——`getUser(@PathVariable Long id)` 這樣的方法，它依賴的 `id` 是方法參數（每個執行緒的棧幀各有一份）、它呼叫的 Service 也是無狀態的注入 Bean，方法內不儲存任何請求相關的可變狀態到成員欄位。這種無狀態的 Controller，單例被多執行緒共享是安全的。危險的做法是——在 Controller 裡加一個成員欄位（如 `private User currentUser;`）並在方法中賦值，這樣多個並發請求會互相覆蓋這個共享欄位，導致 A 請求看到 B 請求的資料（串號），這是嚴重的安全漏洞。所以規則和單例 Service 一樣——「保持 Controller 無狀態，請求相關的資料放方法參數/區域變數，絕不放可變成員欄位」。理解「Controller 單例、無狀態才安全」，是避免 Web 層執行緒安全坑的關鍵。

**面試回答方式**：講出「Controller 預設單例、多執行緒共享一個實例、無狀態時安全、有可變成員欄位時會串號不安全」，並強調「保持 Controller 無狀態、請求資料放參數/區域變數而非成員欄位」。能連結到「這和單例 Service 的執行緒安全是同一個道理」，展現你把作用域和執行緒安全在 Web 層的應用理解一致。

## 相關

- [[011-spring-mvc-flow.md]]
- [[016-bean-thread-safety.md]]
