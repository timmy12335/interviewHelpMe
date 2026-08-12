---
id: spring-003
category: spring
slug: bean-scopes
title: Spring Bean 的作用域
difficulty: easy
tags: [作用域, singleton, prototype]
source: original
---

# 題目

Spring Bean 有哪些作用域（scope）？singleton 和 prototype 有什麼區別？預設是哪個？

## 核心答案

Spring 內建的 Bean 作用域主要有：`singleton`（單例預設，整個容器中只有一個實例）、`prototype`（原型，每次請求都建立新實例）、`request`（每個 HTTP 請求一個實例，僅 Web 環境）、`session`（每個 HTTP session 一個實例，僅 Web 環境）、`application`（每個 ServletContext 一個實例）。預設是 `singleton`。singleton 和 prototype 的核心區別是——singleton 全容器共享同一個實例、由容器全程管理生命週期；prototype 每次獲取都建立新實例、容器只負責建立不負責銷毀。

## 詳細解析

**五種主要作用域**：

- **singleton（單例，預設）**：整個 Spring 容器中，這個 Bean 只有一個實例，所有對它的請求都返回同一個物件。容器啟動時就建立（非延遲）、由容器全程管理生命週期（包括銷毀）。
- **prototype（原型）**：每次從容器獲取這個 Bean 時都建立一個新的實例。容器只負責建立和初始化，不負責銷毀（見 [[002-bean-lifecycle.md]]）。
- **request**：每個 HTTP 請求建立一個實例，請求結束就銷毀。僅在 Web 應用中有效。
- **session**：每個 HTTP session 建立一個實例。僅 Web 應用。
- **application**：每個 ServletContext（整個 Web 應用）一個實例。僅 Web 應用。
- （還有 WebSocket 作用域等。）

**singleton vs prototype 對比**：

| 面向 | singleton | prototype |
|------|-----------|-----------|
| 實例數 | 全容器唯一 | 每次請求新建 |
| 建立時機 | 容器啟動時（非延遲） | 每次獲取時 |
| 生命週期管理 | 容器全程管理（含銷毀） | 容器只管建立初始化，不管銷毀 |
| 執行緒安全 | 需注意（共享實例，見執行緒安全題） | 天然隔離（各用各的實例） |

**注意單例的執行緒安全**：因為 singleton 是全容器共享的同一個實例，多個執行緒會同時存取它，如果這個 Bean 有可變的成員狀態，就會有執行緒安全問題（見 [[016-bean-thread-safety.md]]）。這是 Spring 最常見的坑之一。

## 面試回答方式

先列出主要作用域（singleton、prototype、request、session、application）並點出「預設是 singleton」。核心是講清楚 singleton vs prototype 的區別——實例數（唯一 vs 每次新建）、生命週期管理（容器全管 vs 只管建立）。這是基礎題，但一定要主動延伸兩個關鍵點：「singleton 是共享實例所以要注意執行緒安全」和「prototype 容器不負責銷毀」——這兩個是實務中最容易踩的坑，能主動提及展現你不只背定義還理解實際影響。request/session 等 Web 作用域點到即可。

## 常見追問

### 為什麼 Spring 預設用單例？單例會有什麼問題？

**核心答案**：預設用單例主要是為了「效能和資源」——大部分 Bean（如 Service、DAO、Controller）是「無狀態」的（只有方法邏輯、沒有可變的實例狀態），這種 Bean 完全可以全應用共享一個實例，避免了每次都建立新物件的開銷（記憶體、GC），效能更好。但單例的問題是——如果 Bean 有「可變的成員狀態」，因為所有執行緒共享同一個實例，多執行緒並發存取這些可變狀態就會有執行緒安全問題（資料錯亂、串號）。所以用單例的前提是「Bean 應該設計成無狀態的」。

**詳細解析**：這個設計取捨的核心是「大部分 Bean 天生無狀態、適合共享」。想想一個典型的 `UserService`——它通常只有一些方法（`createUser`、`findUser`），這些方法的邏輯依賴的是「傳入的參數」和「注入的其他無狀態 Bean（如 DAO）」，本身不儲存任何會變的實例欄位。這種無狀態的 Bean，一個實例被所有執行緒共享完全沒問題（每個執行緒呼叫方法時用的是自己的棧幀和參數，不會互相影響），且共享省下了大量重複建立物件的開銷。問題只出在「有人給 Bean 加了可變的成員欄位」——例如在 Service 裡加了一個 `private User currentUser` 欄位並在方法中賦值，那麼多執行緒共享這個單例時，A 執行緒設的 currentUser 可能被 B 執行緒覆蓋，造成資料串號。所以正確的做法是「保持 Bean 無狀態」，需要保存的狀態應該放在方法的區域變數、方法參數、或請求作用域的物件裡，而不是單例 Bean 的成員欄位。理解「單例的前提是無狀態」，是避免 Spring 執行緒安全坑的關鍵認知。

**面試回答方式**：講出「預設單例是為了效能（無狀態 Bean 適合共享、省建立開銷）、問題是有可變狀態時的執行緒安全」，並強調「用單例的前提是 Bean 無狀態、需要的狀態放區域變數而非成員欄位」。能舉「在 Service 加可變成員欄位導致串號」的具體例子，展現你理解單例的適用前提和常見誤用。

### 如何在單例 Bean 中正確使用原型 Bean？

**核心答案**：直接把原型 Bean 用 `@Autowired` 注入到單例 Bean 是有問題的——因為單例只初始化一次、注入也只發生一次，所以單例裡拿到的原型 Bean 實際上永遠是同一個實例（失去了原型「每次新」的意義）。要每次獲取新的原型實例，可以用——`@Lookup` 註解（讓 Spring 覆寫方法每次返回新原型）、注入 `ObjectProvider<T>` 或 `ObjectFactory<T>`（呼叫 `getObject()` 時才動態獲取新實例）、注入 `ApplicationContext` 手動 `getBean()`、或給原型 Bean 配置 scoped proxy（注入的是代理、每次呼叫方法時代理去獲取新實例）。

**詳細解析**：這是作用域交互的經典坑。問題根源是「注入的時機」——`@Autowired` 的注入發生在單例 Bean 初始化時，只發生一次，所以那一刻獲取的原型實例就被「固定」在單例的欄位裡了，之後每次用的都是這同一個。解法的共同思路都是「把『獲取原型』的動作從『注入時一次性』改成『每次使用時動態進行』」——`ObjectProvider`/`ObjectFactory` 是最推薦的方式（型別安全、語意清晰），你注入的是一個「提供者」，每次呼叫 `provider.getObject()` 才向容器要一個新的原型實例。`@Lookup` 是讓 Spring 用 CGLIB 覆寫你的一個方法，讓這個方法每次被呼叫都返回新原型。scoped proxy 則是給原型 Bean 包一層代理，注入代理後每次呼叫代理的方法它都去獲取新實例。理解「問題是注入只發生一次、解法是改成每次動態獲取」，展現你理解作用域和注入時機的交互。

**面試回答方式**：先講清楚問題——「注入只發生一次、所以單例裡的原型退化成固定的同一個實例」，再給出解法（ObjectProvider/ObjectFactory 推薦、@Lookup、scoped proxy、手動 getBean），並點出解法的共同思路「把一次性注入改成每次動態獲取」。這種能講出問題本質和多種解法的回答，展現你對這個坑有透徹理解。

### request 和 session 作用域的 Bean 是怎麼實現「每個請求/會話一個實例」的？

**核心答案**：它們透過「作用域代理（scoped proxy）」+「儲存在請求/會話上下文中」來實現。因為 request/session 作用域的 Bean 生命週期比單例短，如果直接注入到一個單例 Bean 裡會有生命週期不匹配的問題（單例長期存在、request Bean 每個請求就換）。解法是注入一個「代理物件」到單例中，這個代理在每次方法被呼叫時，會去「當前執行緒綁定的請求/會話上下文」中獲取真正屬於當前請求/會話的那個實例來執行。這樣同一個注入的代理，在不同請求中會路由到不同的實際實例。

**詳細解析**：這裡的核心挑戰是「短生命週期 Bean 注入到長生命週期 Bean」的不匹配——一個單例 Controller 想用 request 作用域的 Bean，但單例只注入一次、而 request Bean 每個請求都不同。scoped proxy 巧妙地解決了這個問題——注入的不是真正的 request Bean，而是一個代理；這個代理在每次被呼叫方法時，透過 `RequestContextHolder`（它用 ThreadLocal 綁定當前請求的上下文）拿到「當前這個 HTTP 請求對應的那個實際實例」，然後把呼叫轉發過去。因為每個 HTTP 請求由不同執行緒處理、而 ThreadLocal 是執行緒隔離的，所以每個請求的代理都會路由到屬於自己請求的實例。Spring 靠這個機制讓「短命的 request/session Bean 能被安全地注入到長命的單例中」。理解這個機制，能把作用域、代理、ThreadLocal 幾個知識點串起來，展現你對 Spring Web 作用域實現的深入理解。

**面試回答方式**：講出核心——「用 scoped proxy 解決短生命週期 Bean 注入長生命週期 Bean 的不匹配，代理每次呼叫時透過 RequestContextHolder（ThreadLocal）獲取當前請求對應的實例」。能連結到「每個請求不同執行緒、ThreadLocal 隔離所以路由到各自的實例」，展現你把作用域和 ThreadLocal 機制串起來理解，是很有深度的回答。

## 相關

- [[002-bean-lifecycle.md]]
- [[016-bean-thread-safety.md]]
