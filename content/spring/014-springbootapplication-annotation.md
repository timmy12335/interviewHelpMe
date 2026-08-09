---
id: spring-014
category: spring
slug: springbootapplication-annotation
title: "@SpringBootApplication 註解剖析"
difficulty: medium
tags: [SpringBootApplication, 組合註解, ComponentScan]
source: original
---

# 題目

`@SpringBootApplication` 這個註解包含了哪些東西？它做了什麼？

## 核心答案

`@SpringBootApplication` 是一個「組合註解」，主要由三個核心註解組成：`@SpringBootConfiguration`（本質是 `@Configuration`，宣告這是一個配置類別，可以定義 @Bean）、`@EnableAutoConfiguration`（開啟自動配置機制，載入並按條件套用各種 XxxAutoConfiguration）、`@ComponentScan`（開啟元件掃描，掃描並註冊主類別所在包及其子包下的 @Component/@Service/@Controller 等 Bean）。所以一個 `@SpringBootApplication` 就同時做了「這是配置類別 + 開啟自動配置 + 掃描元件」三件事，是 Spring Boot 應用的入口標記。

## 詳細解析

**三個核心組成註解**：

1. **`@SpringBootConfiguration`**：它本身被 `@Configuration` 標註，所以本質上就是 `@Configuration`——宣告當前類別是一個配置類別，可以在其中用 `@Bean` 定義 Bean。（Spring Boot 用 `@SpringBootConfiguration` 這個特化名稱主要是為了語意和內部識別。）

2. **`@EnableAutoConfiguration`**：自動配置的開關（見 [[013-spring-boot-autoconfiguration.md]]）。它透過 `AutoConfigurationImportSelector` 載入所有 jar 的自動配置類別，並用 `@Conditional` 條件篩選出該生效的，自動配置好各種 Bean。這是 Spring Boot「開箱即用」的核心。

3. **`@ComponentScan`**：開啟元件掃描——掃描指定範圍（預設是主類別所在包及其所有子包）內的類別，把標了 `@Component`、`@Service`、`@Repository`、`@Controller`、`@Configuration` 等註解的類別註冊為 Bean。這是為什麼「你的 Controller/Service 只要放在主類別的包或子包下、標上註解，就能被自動發現和註冊」。

**一個註解做三件事**：`@SpringBootApplication` 把這三個常用註解組合成一個，簡化了主類別的宣告——你不用分別寫這三個，一個 `@SpringBootApplication` 就搞定「配置類別 + 自動配置 + 元件掃描」。這體現了 Spring Boot「簡化配置、開箱即用」的設計目標。

**主類別的位置很重要**：因為 @ComponentScan 預設掃描主類別所在包及子包，所以主類別（標了 @SpringBootApplication 的類別）應該放在專案的「根包」——這樣才能掃描到所有的元件。如果主類別放錯位置（如放在某個子包裡），就會掃描不到其他包的元件。

## 面試回答方式

直接拆解 `@SpringBootApplication` 的三個核心組成——`@SpringBootConfiguration`（=@Configuration，配置類別）、`@EnableAutoConfiguration`（自動配置）、`@ComponentScan`（元件掃描）。分別說清楚各自做什麼。這是這題的主軸。能連結到「@EnableAutoConfiguration 開啟前面講的自動配置機制」展現知識串聯。實務加分點——主動提「主類別要放在根包，因為 @ComponentScan 預設掃描主類別所在包及子包」，這是一個真實會踩的坑（主類別放錯位置導致 Bean 掃不到），展現你有實際開發經驗。

## 常見追問

### @ComponentScan 預設掃描的範圍是什麼？如果元件在掃描範圍外怎麼辦？

**核心答案**：`@ComponentScan` 預設掃描「標註它的類別（即主類別）所在的包，以及該包的所有子包」。所以慣例是把主類別放在專案的根包（如 `com.example.myapp`），這樣它下面所有的子包（controller、service、dao 等）都在掃描範圍內。如果某些元件放在了掃描範圍外的包（例如引入的另一個模組的包），有幾種解法——（1）調整 `@ComponentScan(basePackages = "...")` 明確指定要掃描的包；（2）把主類別移到更外層的包以覆蓋這些元件；（3）用 `@Import` 顯式導入那些配置類別；（4）如果是第三方模組，通常它會提供自己的自動配置（透過 starter 機制）而不依賴你的元件掃描。

**詳細解析**：這是一個高頻的實務坑——「明明寫了 @Service 為什麼注入不到/找不到 Bean」，很多時候答案是「這個類別不在元件掃描範圍內」。理解掃描範圍的規則——@ComponentScan 從「它所在的類別的包」開始、向下掃描所有子包。所以如果你的主類別在 `com.example.app`，那 `com.example.app.controller`、`com.example.app.service` 都會被掃到，但 `com.example.other`（不是 app 的子包）就掃不到。解決的核心是「讓需要的元件進入掃描範圍」——最常見是確保主類別在根包（大部分情況這樣就對了）；如果確實需要掃描其他包，用 `@ComponentScan(basePackages = {"com.example.app", "com.example.other"})` 明確指定；或用 `@Import` 導入特定配置。要注意——手動指定 basePackages 後就「覆蓋」了預設行為，要記得把原本的包也加進去（別漏了主包）。理解這個坑和解法，展現你有處理實際專案結構問題的經驗。

**面試回答方式**：講出「預設掃描主類別所在包及所有子包、所以主類別放根包」，並給出元件在範圍外的解法（@ComponentScan(basePackages) 指定、主類別移外層、@Import 導入）。能點出「這是『@Service 卻找不到 Bean』的常見原因」，展現你有排查實際專案結構問題的經驗。

### 可以排除某些自動配置嗎？怎麼做？

**核心答案**：可以。有幾種方式——（1）用 `@SpringBootApplication(exclude = {XxxAutoConfiguration.class})` 排除特定的自動配置類別；（2）如果那個自動配置類別不在 classpath 上（無法用 class 引用），用 `excludeName` 指定全類名字串；（3）在 `application.properties`/`yml` 中用 `spring.autoconfigure.exclude` 屬性列出要排除的自動配置類別。典型場景是——引入了某個依賴但不想用它的預設自動配置（例如引入了資料庫依賴但這個服務暫時不連資料庫，可以排除 `DataSourceAutoConfiguration` 避免它因為找不到資料庫配置而啟動失敗）。

**詳細解析**：排除自動配置是實務中偶爾需要的操作。因為自動配置是「classpath 上有相關依賴就會嘗試生效」，有時你引入某個依賴是為了用它的一部分功能、但不想要它的某個自動配置——例如專案引入了 spring-boot-starter-data-jpa（帶來資料庫相關依賴），但某個特定的部署環境暫時不需要連資料庫，此時 `DataSourceAutoConfiguration` 會因為「找不到資料庫連線配置」而導致啟動失敗。這時就可以排除它——`@SpringBootApplication(exclude = DataSourceAutoConfiguration.class)`，讓 Spring Boot 跳過這個自動配置。三種排除方式各有適用——`exclude`（用 class 引用，最直接，適合類別在 classpath 上）、`excludeName`（用字串，適合類別不在 classpath 上無法直接引用）、`spring.autoconfigure.exclude`（在配置檔中，適合想透過外部配置控制、不改程式碼）。理解如何排除自動配置，展現你不只會用自動配置的便利，還能在需要時精確地控制/關閉它。

**面試回答方式**：講出三種排除方式（@SpringBootApplication 的 exclude / excludeName、配置檔的 spring.autoconfigure.exclude），並舉典型場景（引入了資料庫依賴但暫不連庫、排除 DataSourceAutoConfiguration 避免啟動失敗）。展現你既會用自動配置的便利、也能在需要時精確控制它。

### @Configuration 的類別為什麼預設會被 CGLIB 代理？（full 模式）

**核心答案**：因為 `@Configuration` 預設是「full 模式」——Spring 會用 CGLIB 為 @Configuration 類別生成代理子類別，目的是攔截其中 `@Bean` 方法的呼叫，保證「即使在配置類別內部一個 @Bean 方法呼叫另一個 @Bean 方法，返回的仍是容器裡的同一個單例 Bean，而不是每次呼叫都 new 一個新的」。這維護了單例的語意——如果不代理，配置類別內部方法互相呼叫就是普通的 Java 方法呼叫，每次都會建立新物件，破壞單例。這個話題在 [[020-configuration-full-lite.md]] 有完整說明。

**詳細解析**：這是 @Configuration 一個容易被忽略但很重要的機制。考慮一個配置類別裡有兩個 @Bean 方法，`beanA()` 內部呼叫了 `beanB()`——如果 @Configuration 不被代理，`beanB()` 就是個普通 Java 方法呼叫，每次呼叫都 `new` 一個 B，那麼容器裡的 B 和 beanA 裡用的 B 就是不同的物件（破壞單例）。Spring 用 CGLIB 代理 @Configuration 類別解決這個問題——代理攔截 @Bean 方法的呼叫，當 `beanA()` 內部呼叫 `beanB()` 時，代理不是真的執行 beanB 方法體（new 一個 B），而是「去容器裡拿已經建立好的單例 B」返回，這樣保證了 beanA 裡用的 B 和容器裡的 B 是同一個。這就是 @Configuration 的「full 模式」（會被 CGLIB 增強）。與之相對的是「lite 模式」（如用 @Component 裡的 @Bean 方法、或設定 proxyBeanMethods = false）——不代理、方法互相呼叫就是普通呼叫、不保證單例，但省去了 CGLIB 代理的開銷。理解 full 模式的代理機制，展現你理解 @Configuration 不只是「放 @Bean 的地方」，還有維護單例語意的深層機制。

**面試回答方式**：講出「@Configuration 預設 full 模式、被 CGLIB 代理、目的是攔截 @Bean 方法互相呼叫、保證返回容器裡的同一個單例而非每次 new」。用「beanA 內部呼叫 beanB、代理讓它拿容器裡的單例 B」的例子說明。能提到「對比 lite 模式（不代理、不保證單例、省開銷）」，展現你理解這個機制及其權衡，並連結到 full/lite 的深入話題。

## 相關

- [[013-spring-boot-autoconfiguration.md]]
- [[019-stereotype-annotations.md]]
- [[020-configuration-full-lite.md]]
