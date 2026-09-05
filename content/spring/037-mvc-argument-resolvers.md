---
id: spring-037
category: spring
slug: mvc-argument-resolvers
title: Spring MVC 的參數解析與訊息轉換器
difficulty: medium
tags: [ArgumentResolver, HttpMessageConverter, MVC, 擴充]
source: original
---

# 題目

`@RequestBody` 與 `@RequestParam` 分別經過什麼機制？怎麼加入自訂的參數型別？

## 核心答案

兩者走的是**不同的擴充機制**。

`@RequestParam`、`@PathVariable`、`@RequestHeader` 這類**從請求的結構化部分取值**的參數，由 **`HandlerMethodArgumentResolver`** 處理——每個註解有對應的解析器，取出字串後透過 `ConversionService` 轉成目標型別。

`@RequestBody` 與 `@ResponseBody` 則走 **`HttpMessageConverter`**——它負責整個請求體與物件之間的轉換，依 `Content-Type` 與 `Accept` 標頭選擇合適的轉換器（JSON 用 `MappingJackson2HttpMessageConverter`、表單用 `FormHttpMessageConverter`、字串用 `StringHttpMessageConverter`）。

加入自訂參數型別的方式也因此不同：如果是「從請求中萃取出一個物件」（例如從 JWT 解析出當前使用者），實作 `HandlerMethodArgumentResolver` 並註冊到 `WebMvcConfigurer.addArgumentResolvers`；如果是「支援一種新的媒體型別」（例如 Protobuf、MessagePack），實作 `HttpMessageConverter`。

分清這兩者是理解 Spring MVC 擴充點的關鍵——用錯機制會發現怎麼都接不上。

## 詳細解析

自訂 `ArgumentResolver` 最常見的用途是「當前使用者」。與其在每個控制器方法裡從 `SecurityContext` 取出使用者再轉換，不如寫一個解析器讓方法簽章直接寫 `@CurrentUser User user`。這消除了大量重複，也讓控制器方法的依賴變得顯式（從簽章就看得出它需要當前使用者）。實作只需要兩個方法：`supportsParameter`（判斷這個參數是不是我負責的）與 `resolveArgument`（實際產生值）。

**`HttpMessageConverter` 的選擇邏輯值得知道**。請求時依 `Content-Type` 找到能讀該型別的轉換器；回應時依 `Accept` 標頭與方法的回傳型別做**內容協商**（content negotiation）。**順序有影響**——多個轉換器都能處理時取第一個，所以自訂的轉換器要插在正確的位置。常見的坑是用 `addAll` 或 `add` 把自訂轉換器加到清單末尾，結果永遠被預設的 Jackson 搶先。

Jackson 的設定是實務上最常調整的部分。`ObjectMapper` 的設定（日期格式、null 處理、未知欄位的行為、命名策略）影響所有 JSON 的序列化與反序列化。**Spring Boot 提供了 `spring.jackson.*` 屬性與 `Jackson2ObjectMapperBuilderCustomizer` 兩種方式**，應該用它們而不是自己 new 一個 `ObjectMapper` bean——後者會取代 Spring Boot 精心配置的那個，導致一堆預設行為改變（例如 Java 8 日期型別的支援模組不再被註冊）。這是一個很常見的錯誤。

內容協商的細節常常造成困惑。預設情況下 Spring Boot 依 `Accept` 標頭決定回應格式；舊版本還支援依副檔名（`/api/user.json`）與查詢參數（`?format=json`），但副檔名策略在新版本預設關閉了，因為它有安全風險（路徑中的副檔名可能繞過某些安全規則的路徑比對）。知道這件事能解釋「為什麼升級之後 `.json` 後綴不管用了」。

## 面試回答方式

先講清楚**兩條不同的路徑**：`@RequestParam` 這類走 `HandlerMethodArgumentResolver` 加 `ConversionService`，`@RequestBody` 走 `HttpMessageConverter` 處理整個請求體。由此推出**加入自訂型別的方式也不同**——萃取物件用 ArgumentResolver、支援新媒體型別用 MessageConverter，並指出用錯機制會發現怎麼都接不上。加分點有三個：自訂 ArgumentResolver 最常見的用途是「當前使用者」，讓方法簽章直接寫 `@CurrentUser User user`，消除重複也讓依賴顯式；自訂 MessageConverter 加在清單末尾會永遠被 Jackson 搶先，順序有影響；以及**不要自己 new 一個 `ObjectMapper` bean**，那會取代 Spring Boot 精心配置的那個導致一堆預設行為改變（Java 8 日期模組不再註冊），應該用 `spring.jackson.*` 或 `Jackson2ObjectMapperBuilderCustomizer`。

## 講稿

兩者走的是不同的擴充機制，這是理解 MVC 擴充點的關鍵。

從請求的結構化部分取值的參數，像是查詢參數、路徑變數、標頭，由參數解析器處理，取出字串之後透過轉換服務轉成目標型別。

請求體則走訊息轉換器，它負責整個請求體跟物件之間的轉換，依內容型別標頭選擇合適的轉換器。

所以加入自訂參數型別的方式也不同。如果是從請求中萃取出一個物件，比如從 JWT 解析出當前使用者，就實作參數解析器。如果是支援一種新的媒體型別，就實作訊息轉換器。用錯機制會發現怎麼都接不上。

參數解析器最常見的用途就是當前使用者。與其在每個控制器方法裡從安全上下文取出使用者再轉換，不如讓方法簽章直接寫一個註解加型別。這消除了重複，也讓控制器的依賴變得顯式。

還有一個很常見的錯誤要提。不要自己宣告一個 ObjectMapper bean，那會取代 Spring Boot 精心配置的那個，導致一堆預設行為改變，比如 Java 8 日期型別的支援模組不再被註冊。應該用設定屬性或客製化器。

## 常見追問

### 自訂 ArgumentResolver 有什麼要注意的？

**核心答案**：三點。`supportsParameter` 要精確——用註解加型別雙重判斷，只看註解或只看型別都可能誤判別人的參數。不要在解析器裡做重活——它在每個請求的每個參數上執行，做資料庫查詢會讓每個請求都多一次 IO（如果需要，考慮從已經解析過的上下文取，例如安全過濾器已經放進 `SecurityContext` 的資訊）。**要處理解析失敗**——找不到值時是拋例外、回傳 null、還是回傳 `Optional`，應該明確決定並與其他解析器的慣例一致。

**詳細解析**：「不要在解析器裡做重活」有一個微妙的推論：如果解析當前使用者需要查資料庫，那麼每個帶有 `@CurrentUser` 參數的請求都會多一次查詢——而這件事在控制器的程式碼裡完全看不出來。隱式的成本是這類「便利抽象」的共同代價。緩解方式是把使用者資訊在認證階段就放進請求上下文（過濾器已經驗證過 token，順便把使用者資訊帶上），解析器只是從上下文取出。這也體現了一個設計原則：便利的抽象應該只做「取用已有的東西」，不應該偷偷觸發昂貴的操作。

**面試回答方式**：給三點注意事項並各配理由。真正的加分點是展開第二點的推論：如果解析需要查資料庫，每個帶該參數的請求都會多一次查詢，而這在控制器程式碼裡完全看不出來——隱式成本是便利抽象的共同代價。給出緩解（認證階段就放進上下文）並收在設計原則：便利的抽象應該只做「取用已有的東西」，不該偷偷觸發昂貴操作。

### 為什麼自己宣告 ObjectMapper 會出問題？

**核心答案**：因為 Spring Boot 的自動配置用 `@ConditionalOnMissingBean` 提供 `ObjectMapper`——你一旦宣告了自己的，它就完全退讓。而 Spring Boot 提供的那個經過了大量配置：註冊了 Java 8 日期時間模組（`JavaTimeModule`）、參數名模組、關閉了把日期寫成時間戳的行為、套用了 `spring.jackson.*` 的所有設定。**自己 new 的那個什麼都沒有**，症狀是 `LocalDateTime` 序列化成一個奇怪的物件、或者反序列化直接失敗。

**詳細解析**：正確的做法有兩層。**只需要改幾個設定**——用 `spring.jackson.*` 屬性（例如 `spring.jackson.default-property-inclusion=non_null`）。**需要程式化的調整**——宣告一個 `Jackson2ObjectMapperBuilderCustomizer` bean，它會作用在 Spring Boot 建立的 builder 上，保留所有預設配置的同時加上你的調整。這個「客製化器」模式在 Spring Boot 裡到處出現（`RestTemplateCustomizer`、`WebClientCustomizer`、`TomcatConnectorCustomizer`），它的價值正是讓使用者能調整而不必接管整個物件的建立。認出這個模式，遇到「我想改一點點但不想全部自己來」的需求時就知道該找什麼。

**面試回答方式**：給出機制——自動配置用 `@ConditionalOnMissingBean`，你一宣告它就完全退讓，而它原本註冊了 Java 8 日期模組等一系列配置，自己 new 的什麼都沒有。給出兩層正確做法（屬性設定、`Jackson2ObjectMapperBuilderCustomizer`）。真正的加分點是認出**「客製化器」是 Spring Boot 到處出現的模式**（RestTemplate、WebClient、Tomcat 都有），它讓使用者能調整而不必接管整個物件的建立。

### 內容協商該怎麼設定？

**核心答案**：預設且推薦的是依 `Accept` 標頭協商，這是 HTTP 規範的做法。Spring Boot 也支援依查詢參數（`?format=json`，需要 `spring.mvc.contentnegotiation.favor-parameter=true`）與**副檔名**（`/api/user.json`，新版本預設關閉）。副檔名策略被關閉是因為安全風險——路徑中的副檔名可能讓安全規則的路徑比對被繞過（`/admin/users.json` 可能不匹配針對 `/admin/**` 的規則，取決於規則怎麼寫）。

**詳細解析**：在純 JSON 的 API 上，內容協商其實不太需要——只支援一種格式時，協商只是多一層可能出錯的地方。明確地把回應型別寫在 `@RequestMapping(produces = "application/json")` 上更清楚，也讓不接受 JSON 的請求得到明確的 406 而不是意外的行為。真正需要協商的是同時支援多種格式的 API（JSON 與 XML、或 JSON 與 Protobuf），那時 `Accept` 標頭是正確的機制。這是一個「框架提供的能力不一定要用」的例子——內容協商是一個完整而正確的機制，但如果你的 API 只有一種格式，用不到它反而更簡單。

**面試回答方式**：給三種策略與推薦（依 `Accept` 標頭），並說明副檔名策略被關閉的安全理由（路徑中的副檔名可能讓安全規則的路徑比對被繞過）。真正的加分點是實務判斷：**純 JSON 的 API 其實不需要協商**，明確寫 `produces` 更清楚也讓不接受的請求得到明確的 406。收在一般觀點：**框架提供的能力不一定要用**，內容協商是完整正確的機制但單一格式時用不到它反而更簡單。

## 相關

- [[011-spring-mvc-flow.md]]
- [[034-type-conversion-binding.md]]
