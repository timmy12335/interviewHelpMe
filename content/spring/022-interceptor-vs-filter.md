---
id: spring-022
category: spring
slug: interceptor-vs-filter
title: 攔截器與過濾器的區別（Interceptor / Filter）
difficulty: medium
tags: [攔截器, 過濾器, Filter, Interceptor]
source: original
---

# 題目

Spring MVC 的攔截器（Interceptor）和 Servlet 的過濾器（Filter）有什麼區別？各適合什麼場景？

## 核心答案

過濾器（Filter）是「Servlet 規範」的一部分——它工作在更底層（Servlet 容器層級），能攔截「所有進入 Servlet 容器的請求」（包括靜態資源），在請求進入 DispatcherServlet「之前」和回應返回「之後」處理。攔截器（Interceptor）是「Spring MVC 框架」的一部分——它工作在 Spring MVC 的層級（DispatcherServlet 內部），只能攔截「進入 Spring MVC 的請求（Controller 的請求）」，且能存取 Spring 的上下文（如注入其他 Bean）、能在 Handler 執行前後、視圖渲染前後等更細的節點介入。簡言之——Filter 更底層、範圍更廣、但脫離 Spring 上下文；Interceptor 更上層、範圍限於 MVC、但能用 Spring 的能力、控制點更細。

## 詳細解析

**過濾器（Filter）**：

- 屬於「Servlet 規範」，由 Servlet 容器（Tomcat 等）管理，工作在 Servlet 容器層級。
- 攔截範圍廣——能攔截所有進入容器的請求，包括對靜態資源（圖片、CSS、JS）、以及所有 Servlet 的請求。
- 執行時機——在請求進入 DispatcherServlet「之前」介入，回應離開時再介入（包裹整個請求處理，包括 DispatcherServlet）。
- 局限——它工作在 Spring 容器之外，「較難直接使用 Spring 的能力」（早期難以注入 Spring Bean，雖然現在有辦法，但本質上它不是 Spring 管理的）。
- 典型用途——編碼設定（如 UTF-8）、跨域（CORS）、請求日誌、安全過濾（如 XSS 過濾）、壓縮等「與 Spring 業務無關的通用底層處理」。

**攔截器（Interceptor）**：

- 屬於「Spring MVC 框架」，由 Spring 管理，工作在 DispatcherServlet 內部。
- 攔截範圍——只攔截「經過 Spring MVC 處理的請求」（即 Controller 的請求），不攔截靜態資源等。
- 執行時機——更細的控制點：`preHandle`（Handler 執行前）、`postHandle`（Handler 執行後、視圖渲染前）、`afterCompletion`（請求完成後）（見 [[011-spring-mvc-flow.md]]）。
- 優勢——它是 Spring Bean，「能直接注入和使用其他 Spring Bean」、能存取 Spring 的上下文，且控制點更細（能拿到 Handler 資訊）。
- 典型用途——登入/權限驗證、記錄業務相關的請求日誌、統一的業務前置處理等「需要 Spring 能力或業務相關」的處理。

**執行順序**：Filter 在更外層（先執行 Filter 的前置、再進入 Spring MVC 的 Interceptor），回應時反過來（Interceptor 後置先、Filter 後置後）——Filter 包著 Interceptor。

## 面試回答方式

用「所屬層級」這個根本區別來組織回答——Filter 屬於 Servlet 規範（底層、Spring 容器之外）、Interceptor 屬於 Spring MVC（上層、Spring 內部）。由此推導出其他區別：範圍（Filter 攔所有請求含靜態資源、Interceptor 只攔 Controller 請求）、能力（Filter 難用 Spring、Interceptor 能注入 Bean）、控制點（Filter 粗、Interceptor 細）。各配典型場景（Filter 做編碼/跨域/XSS、Interceptor 做登入/權限）。能點出「執行順序上 Filter 包著 Interceptor」，展現你理解兩者的層級關係。

## 常見追問

### 為什麼登入/權限驗證通常用攔截器而不是過濾器？

**核心答案**：主要因為攔截器「能方便地使用 Spring 的能力、且控制點更貼合業務」。登入/權限驗證通常需要——存取 Spring 管理的服務（如查使用者的權限、驗證 token 的邏輯可能封裝在某個 Spring Bean 裡）、拿到當前請求對應的 Handler 資訊（如根據 Controller 方法上的權限註解判斷）、以及和 Spring MVC 的其他機制（如統一異常處理）配合。攔截器作為 Spring Bean 能直接注入這些服務、能在 preHandle 拿到 Handler、能拋出被 Spring 統一異常處理捕捉的異常，非常契合。過濾器雖然也能做驗證，但它在 Spring 容器外、使用 Spring Bean 較不方便、拿不到 Handler 資訊、也不易和 Spring 的異常處理配合，所以權限驗證這種「業務相關、需要 Spring 能力」的處理更適合用攔截器。

**詳細解析**：這題考的是「根據需求特性選對工具」。登入/權限驗證的特性是——它是「業務相關」的（要查使用者、驗證權限，這些邏輯往往在 Spring Service 裡）、需要「Spring 上下文」（注入驗證服務）、且常需要「Handler 級的資訊」（例如根據方法上的 `@RequiresPermission` 註解判斷需要什麼權限——這需要拿到 Handler/方法資訊，只有攔截器的 preHandle 能拿到 `HandlerMethod`）。攔截器完美契合這些需求——它是 Spring Bean（能注入驗證服務）、preHandle 能拿到 Handler（能讀方法上的權限註解）、能和 Spring 的統一異常處理配合（驗證失敗拋一個異常、由 @ControllerAdvice 統一轉成 401/403 回應）。過濾器則因為在 Spring 之外，這些都不方便。反過來，那些「與業務無關、需要作用於所有請求（含靜態資源）、越底層越好」的處理（如字元編碼、CORS、請求壓縮、基礎的安全過濾）適合用過濾器——它們不需要 Spring 能力、且需要在最外層作用於所有請求。所以選擇的準則是——「業務相關、需要 Spring 能力、需要 Handler 資訊」用攔截器；「通用底層、與業務無關、要作用於所有請求」用過濾器。理解這個「按需求特性選工具」的判斷，展現你不是死記兩者區別、而是能實際做選型。

**面試回答方式**：講出「權限驗證用攔截器是因為它能注入 Spring Bean（驗證服務）、能拿到 Handler 資訊（讀方法上的權限註解）、能配合 Spring 統一異常處理，而這些是業務相關驗證需要的；過濾器在 Spring 外不方便」。給出選型準則——「業務相關/需要 Spring 能力用攔截器、通用底層/作用於所有請求用過濾器」。展現你能按需求特性正確選型。

### Filter、Interceptor、AOP 三者的攔截層級和適用場景？

**核心答案**：三者是「由外到內、由粗到細」的三層攔截——`Filter`（最外層，Servlet 容器層級，攔截所有 HTTP 請求包括靜態資源，適合編碼/跨域/壓縮等最底層通用處理）、`Interceptor`（中間層，Spring MVC 層級，攔截 Controller 請求，能拿 Handler 資訊、用 Spring 能力，適合登入/權限等 Web 層業務前置處理）、`AOP`（最內層，方法呼叫層級，能攔截任意 Spring Bean 的方法（不限於 Controller），適合交易/日誌/快取等細粒度的、跨層的橫切邏輯）。層級越內、粒度越細、越貼近具體的方法呼叫。

**詳細解析**：這三者形成一個清晰的「攔截層級光譜」，理解它們的定位能幫你在不同需求下選對工具。從外到內——請求先經過 `Filter`（在進入 Spring 之前，最粗粒度，作用於整個 HTTP 請求層級，連靜態資源都能攔），然後進入 Spring MVC 被 `Interceptor` 攔（在 Controller 前後，能拿到 Handler、用 Spring 能力，但只作用於 Web 請求），最後在方法呼叫層級被 `AOP` 攔（能作用於任意 Bean 的任意方法——不只是 Controller，還有 Service、Repository 等，粒度最細、最靈活）。適用場景對應各自的層級特性——最底層通用的（編碼、CORS、壓縮、基礎安全）用 Filter；Web 層業務相關的（登入、權限、Web 請求日誌）用 Interceptor；細粒度跨層的橫切邏輯（交易、方法級日誌、快取、方法耗時監控——這些可能作用於 Service 而非 Controller）用 AOP。三者不是互斥的，實際專案常同時用——Filter 做編碼和跨域、Interceptor 做登入驗證、AOP 做交易和業務日誌，各司其職。理解這個「由外到內、由粗到細」的三層攔截體系，展現你對 Web 請求處理的橫切機制有系統性的全局理解。

**面試回答方式**：用「由外到內、由粗到細」串起三者——「Filter（Servlet 層、攔所有請求含靜態資源、最粗）→ Interceptor（Spring MVC 層、攔 Controller 請求、能拿 Handler）→ AOP（方法層、攔任意 Bean 方法、最細）」，並各配場景（Filter 編碼/跨域、Interceptor 登入/權限、AOP 交易/日誌/快取）。點出「三者常同時用、各司其職」。這種能把三個橫切機制放進統一層級體系的回答，展現你的系統性理解。

### 過濾器現在能注入 Spring Bean 嗎？

**核心答案**：能，但需要一點配置。原生的 Servlet Filter 因為是 Servlet 容器管理的、不在 Spring 容器裡，早期確實難以直接注入 Spring Bean。但現在有幾種方式讓 Filter 用上 Spring——（1）把 Filter 本身宣告為 Spring Bean（如標 `@Component`），Spring Boot 會自動把它註冊到 Servlet 容器，這樣它就是 Spring 管理的、能注入其他 Bean；（2）繼承 Spring 提供的 `OncePerRequestFilter`（Spring 的抽象 Filter 基類，本身是 Spring 友好的）；（3）用 `DelegatingFilterProxy` 把實際的過濾邏輯委派給一個 Spring Bean。所以現代 Spring Boot 中，Filter 也能方便地使用 Spring 能力，只是它的定位（底層、作用於所有請求）和攔截器仍然不同。

**詳細解析**：這題是對前面「Filter 難用 Spring」這個說法的補充和更新——早期確實如此，但現代 Spring Boot 已經讓 Filter 和 Spring 的整合變得容易。在 Spring Boot 中，如果你把一個 Filter 類別標上 `@Component`（或用 `FilterRegistrationBean` 註冊），Spring Boot 會自動把它加入 Servlet 容器的過濾器鏈，而因為它是 Spring Bean，就能像普通 Bean 一樣 `@Autowired` 注入其他 Spring Bean。Spring 還提供了 `OncePerRequestFilter` 這個抽象基類（保證一次請求只執行一次過濾，且是 Spring 友好的），很多自訂 Filter 繼承它。所以「Filter 不能用 Spring」的說法在現代已經不完全準確——它能用 Spring Bean 了。但要注意——即使 Filter 能注入 Bean，它和 Interceptor 的「定位差異」依然存在：Filter 仍然工作在更底層（Servlet 層、作用於所有請求含靜態資源、拿不到 Spring MVC 的 Handler 資訊），Interceptor 仍然在 Spring MVC 層（能拿 Handler、控制點更細）。所以選型時，「能不能用 Spring Bean」已經不是主要的區分點了，更關鍵的是「攔截範圍」和「是否需要 Handler 資訊」等定位差異。理解這個「說法的演進」，展現你的知識是與時俱進的、不停留在過時的認知。

**面試回答方式**：回答「現在能——把 Filter 標 @Component 讓 Spring Boot 註冊它、或繼承 OncePerRequestFilter、或用 DelegatingFilterProxy，都能讓 Filter 注入 Spring Bean」。但要點出「即使能用 Spring Bean，Filter 和 Interceptor 的定位差異（攔截範圍、能否拿 Handler）依然存在、選型看這些而非能否用 Bean」。這種能更新過時說法、又抓住本質區別的回答，展現你的知識與時俱進且理解深入。

## 相關

- [[011-spring-mvc-flow.md]]
- [[006-aop-concept.md]]
