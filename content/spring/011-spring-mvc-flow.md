---
id: spring-011
category: spring
slug: spring-mvc-flow
title: Spring MVC 的請求處理流程
difficulty: medium
tags: [Spring MVC, DispatcherServlet, 請求流程]
source: original
---

# 題目

一個 HTTP 請求進入 Spring MVC 後，經歷了哪些處理流程？各組件扮演什麼角色？

## 核心答案

Spring MVC 的請求流程以 `DispatcherServlet`（前端控制器）為核心：（1）請求先到 `DispatcherServlet`；（2）它透過 `HandlerMapping` 找到能處理這個請求的 Handler（Controller 方法）及攔截器鏈；（3）透過 `HandlerAdapter` 呼叫實際的 Handler（Controller 方法），期間完成參數綁定、校驗等；（4）Handler 執行業務邏輯，返回 `ModelAndView`（或直接返回資料）；（5）透過 `ViewResolver` 把邏輯視圖名解析成實際的 View；（6）View 渲染（把 Model 資料填入視圖）；（7）把渲染結果回應給客戶端。對於前後端分離的 REST API（`@RestController`/`@ResponseBody`），則跳過視圖解析，直接由 `HttpMessageConverter` 把返回物件序列化成 JSON 回應。

## 詳細解析

**核心流程（傳統 MVC，返回視圖）**：

1. **DispatcherServlet 接收請求**：所有請求先到前端控制器 DispatcherServlet，它統一調度整個流程。
2. **HandlerMapping 找 Handler**：DispatcherServlet 問 HandlerMapping「這個 URL 該由誰處理」，HandlerMapping 返回對應的 Handler（通常是某個 Controller 的某個方法）以及攔截器鏈（HandlerExecutionChain）。
3. **HandlerAdapter 呼叫 Handler**：DispatcherServlet 不直接呼叫 Handler，而是透過 HandlerAdapter（適配器）來呼叫——因為 Handler 有多種形式，用適配器統一呼叫方式。期間完成請求參數的解析綁定（`@RequestParam`、`@RequestBody` 等）、資料校驗。
4. **執行 Controller 方法**：Handler（Controller 方法）執行業務邏輯，返回結果——傳統 MVC 返回 `ModelAndView`（Model 是資料、View 是邏輯視圖名）。
5. **ViewResolver 解析視圖**：DispatcherServlet 把邏輯視圖名交給 ViewResolver，解析成實際的 View 物件（如某個 JSP、Thymeleaf 模板）。
6. **View 渲染**：View 把 Model 中的資料填入，生成最終的 HTML。
7. **回應客戶端**：把渲染結果寫回 HTTP 回應。

**REST API 流程（前後端分離，返回 JSON）**：

- 如果 Controller 用 `@RestController` 或方法標 `@ResponseBody`，則第 4 步之後不走視圖解析，而是由 `HttpMessageConverter`（如 Jackson）把返回的物件直接序列化成 JSON（或其他格式）寫入回應體。這是現代前後端分離架構的主流。

**攔截器（HandlerInterceptor）**：在 Handler 執行前後有攔截器鏈——`preHandle`（Handler 執行前）、`postHandle`（Handler 執行後、視圖渲染前）、`afterCompletion`（整個請求完成後）。

## 面試回答方式

以 `DispatcherServlet` 為核心串起整個流程——它是「前端控制器」，統一調度。按「接收請求 → HandlerMapping 找 Handler → HandlerAdapter 呼叫 → Controller 執行返回 → ViewResolver 解析視圖 → 渲染 → 回應」講。務必區分「傳統 MVC（返回視圖）」和「REST API（@ResponseBody + HttpMessageConverter 返回 JSON）」兩條路徑——現在後端多是後者，能點出這個區別展現你了解實際開發。能說清楚各組件的職責（HandlerMapping 找誰處理、HandlerAdapter 怎麼呼叫、ViewResolver 解析視圖），展現你理解 MVC 的組件協作而非只背流程步驟。

## 常見追問

### DispatcherServlet 為什麼叫「前端控制器」？這個設計模式有什麼好處？

**核心答案**：DispatcherServlet 是「前端控制器（Front Controller）」設計模式的實現——所有的請求都先統一經過這一個中央控制器，由它來調度後續的處理（找 Handler、呼叫、解析視圖等）。這個設計的好處是「集中處理通用邏輯、統一調度」——把所有請求都必經的通用處理（如請求分發、攔截器執行、異常處理、視圖解析等）集中在一個地方，避免每個 Controller 都重複這些邏輯；也讓整個請求處理流程有一個統一的入口和調度中心，便於擴展和維護（例如要加全域的請求日誌、統一異常處理，都在這個中心點做）。

**詳細解析**：前端控制器模式的核心價值是「單一入口 + 集中調度」。想像沒有前端控制器的情況——每個 Servlet（Controller）都要自己處理「解析請求、找到業務邏輯、處理結果、選擇視圖、渲染」等一整套流程，大量重複且難以統一。DispatcherServlet 作為前端控制器，把這些「所有請求都需要的通用流程」抽取到一個中央控制器裡——它負責「編排」整個處理流程（委派給 HandlerMapping、HandlerAdapter、ViewResolver 等各司其職的組件），而各個 Controller 只需專注於自己的業務邏輯。這帶來幾個好處——通用邏輯集中（攔截器、異常處理、跨域等都在中央處理）、流程統一可控（所有請求走同一套流程、行為一致）、易於擴展（要改變或增強請求處理流程，改中央控制器和它調度的組件即可，不用動每個 Controller）。這也是為什麼 DispatcherServlet 是整個 Spring MVC 的心臟。理解前端控制器模式的價值，展現你不只知道流程，還理解這個架構設計的意圖。

**面試回答方式**：講出「前端控制器 = 所有請求統一經過的中央控制器、負責調度整個處理流程」，並說明好處——「集中處理通用邏輯（攔截器、異常、視圖解析）、統一入口便於擴展維護、Controller 只需專注業務」。能點出「這讓通用邏輯不用在每個 Controller 重複」，展現你理解這個設計模式的價值。

### @RequestBody 和 @ResponseBody 是怎麼工作的？

**核心答案**：兩者都靠 `HttpMessageConverter`（HTTP 訊息轉換器）工作。`@RequestBody` 用於「把請求體反序列化成 Java 物件」——當方法參數標了 @RequestBody，HandlerAdapter 會用合適的 HttpMessageConverter（如 Jackson 的 `MappingJackson2HttpMessageConverter`）把請求體的 JSON（或其他格式）反序列化成參數的 Java 物件。`@ResponseBody`（或類別上的 @RestController）用於「把返回物件序列化成回應體」——方法返回的 Java 物件會被 HttpMessageConverter 序列化成 JSON（或其他格式）寫入回應體，跳過視圖解析。核心都是 HttpMessageConverter 在「Java 物件 ↔ HTTP 訊息體」之間做轉換。

**詳細解析**：HttpMessageConverter 是 Spring MVC 處理「請求/回應體與 Java 物件轉換」的關鍵抽象。它解決的是——HTTP 傳輸的是位元組流/文字（如 JSON 字串），而 Java 程式碼要操作的是物件，中間需要序列化/反序列化。Spring 註冊了一系列 HttpMessageConverter，每個負責特定的格式——`MappingJackson2HttpMessageConverter`（JSON最常用）、`StringHttpMessageConverter`（純文字）、`ByteArrayHttpMessageConverter`（位元組）等。當請求進來、方法參數有 @RequestBody 時，Spring 根據請求的 `Content-Type` 選一個能處理該型別的 converter，把請求體反序列化成物件；當方法返回、有 @ResponseBody 時，Spring 根據請求的 `Accept` 頭和返回型別選一個 converter，把物件序列化成回應體。這個機制讓「前後端用 JSON 通訊」變得透明——你在 Controller 裡直接收發 Java 物件，序列化/反序列化由 converter 自動完成。理解 HttpMessageConverter 是理解現代 REST API 開發的關鍵，也解釋了很多實務問題（如「為什麼返回的 JSON 欄位格式不對」往往是 Jackson converter 的配置問題）。

**面試回答方式**：講出「兩者都靠 HttpMessageConverter——@RequestBody 把請求體反序列化成物件、@ResponseBody 把返回物件序列化成回應體、跳過視圖解析」。點出「根據 Content-Type/Accept 選對應的 converter（JSON 用 Jackson）」。能連結到「這是現代 REST API 前後端 JSON 通訊的基礎、JSON 格式問題常是 Jackson 配置問題」，展現你理解這個機制的實際應用。

### 攔截器（Interceptor）的三個方法分別在什麼時機執行？

**核心答案**：`HandlerInterceptor` 有三個方法——`preHandle`（在 Handler/Controller 方法「執行之前」呼叫，返回 true 才繼續往下、返回 false 則中斷請求）、`postHandle`（在 Handler「執行之後、視圖渲染之前」呼叫，可以修改 ModelAndView）、`afterCompletion`（在「整個請求完成後、視圖渲染完畢」呼叫，不管成功還是異常都會執行，適合資源清理、記錄最終狀態）。多個攔截器時，preHandle 按註冊順序執行，postHandle 和 afterCompletion 按逆序執行（類似洋蔥模型/棧結構）。

**詳細解析**：攔截器提供了在請求處理流程的關鍵節點插入邏輯的能力，常用於權限檢查、登入驗證、請求日誌、效能監控等。三個方法的時機——`preHandle` 在 Controller 執行前，最常用於「攔截和前置檢查」（如檢查登入狀態，未登入返回 false 中斷請求、跳轉登入頁），它的返回值決定請求是否繼續。`postHandle` 在 Controller 執行完、視圖還沒渲染時，可以對 Model 資料或視圖做調整（在前後端分離的 REST 場景用得少，因為沒有視圖渲染）。`afterCompletion` 在整個請求徹底結束後（視圖也渲染完了），不管過程中是否發生異常都會執行，適合做清理和最終記錄（如記錄請求總耗時、釋放資源）。多攔截器的執行順序是洋蔥模型——preHandle 正序（先註冊的先執行），到了 postHandle/afterCompletion 就逆序（先註冊的後執行），像進棧出棧。要注意——只有 preHandle 返回 true 的攔截器，它的 afterCompletion 才會被執行（保證「進去了才清理」的對稱性）。理解攔截器的時機和順序，是實作橫切關注點（如統一登入驗證）的基礎。

**面試回答方式**：講出三個方法的時機——「preHandle（Controller 前、返回 false 中斷）、postHandle（Controller 後、視圖渲染前）、afterCompletion（請求完全結束後、不管成敗都執行、適合清理）」。點出多攔截器是「preHandle 正序、後兩者逆序（洋蔥模型）」。能提到「只有 preHandle 返回 true 的攔截器其 afterCompletion 才執行」這個對稱性細節，展現你對攔截器機制的精確掌握。

## 相關

- [[012-dispatcherservlet-components.md]]
- [[022-interceptor-vs-filter.md]]
