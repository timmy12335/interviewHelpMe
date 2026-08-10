---
id: spring-023
category: spring
slug: bean-post-processor
title: BeanPostProcessor 與 BeanFactoryPostProcessor
difficulty: hard
tags: [BeanPostProcessor, BeanFactoryPostProcessor, 擴展點]
source: original
---

# 題目

`BeanPostProcessor` 和 `BeanFactoryPostProcessor` 有什麼區別？它們是 Spring 擴展性的關鍵，為什麼？

## 核心答案

兩者都是 Spring 的核心擴展點，但介入的階段和對象不同：`BeanFactoryPostProcessor` 在「BeanDefinition（Bean 的定義/藍圖）已載入、但 Bean 還沒實例化」時介入——它能修改 Bean 的「定義」（如改屬性值、改作用域、動態註冊新的 BeanDefinition），作用對象是「Bean 的定義」。`BeanPostProcessor` 在「每個 Bean 實例化之後、初始化前後」介入——它能對「每個 Bean 實例」做處理（在初始化前後攔截、包裝、增強），作用對象是「Bean 的實例」。簡言之——BeanFactoryPostProcessor 改「藍圖（定義）」、BeanPostProcessor 改「成品（實例）」。它們是 Spring 擴展性的關鍵，因為很多核心功能（AOP、@Autowired、@Value 的處理等）都是透過它們實現的。

## 詳細解析

**時機不同（對應容器啟動的兩個階段）**：

- **BeanFactoryPostProcessor**：在容器啟動的「BeanDefinition 註冊完成後、Bean 實例化之前」執行。此時所有 Bean 的「定義（BeanDefinition）」已經載入到容器，但還沒有任何 Bean 被實例化。它能「修改這些定義」。
- **BeanPostProcessor**：在「每個 Bean 被實例化和屬性填充之後、初始化方法前後」執行。它為每個 Bean 提供 `postProcessBeforeInitialization`（初始化前）和 `postProcessAfterInitialization`（初始化後）兩個攔截點。

**作用對象不同**：

- **BeanFactoryPostProcessor 作用於「BeanDefinition（定義）」**：它拿到的是 `ConfigurableListableBeanFactory`，能存取和修改所有 Bean 的定義——例如修改某個 Bean 定義的屬性值、改作用域、或動態註冊新的 Bean 定義。經典例子——`PropertySourcesPlaceholderConfigurer`（處理配置檔的 `${...}` 佔位符替換，它在 Bean 實例化前把定義裡的佔位符替換成實際的配置值）。
- **BeanPostProcessor 作用於「Bean 實例」**：它拿到的是已經建立好的 Bean 實例，能對實例做處理——最重要的是「返回一個包裝過的物件替換原始 Bean」，AOP 就是靠這個（在 `postProcessAfterInitialization` 裡把原始 Bean 換成代理）。`@Autowired`、`@Value` 的注入也是由 BeanPostProcessor（`AutowiredAnnotationBeanPostProcessor`）處理的。

**為什麼是擴展性的關鍵**：Spring 自己的很多核心功能都是透過這兩個擴展點實現的——`@Autowired`/`@Resource`/`@Value` 的注入、`@PostConstruct`/`@PreDestroy` 的處理、AOP 代理的生成、配置佔位符的解析等，全都是內建的 BeanPostProcessor/BeanFactoryPostProcessor 在做。這意味著——Spring 把自己的核心功能也建立在這套公開的擴展機制上，你可以用同樣的機制擴展 Spring（如自訂一個 BeanPostProcessor 對所有 Bean 做統一處理）。這種「框架自身也用公開的擴展點實現」的設計，讓 Spring 極其靈活可擴展。

## 面試回答方式

用「時機 + 對象」兩個維度清晰對比——BeanFactoryPostProcessor（Bean 實例化前、改定義/藍圖）vs BeanPostProcessor（Bean 實例化後、改實例/成品）。用「藍圖 vs 成品」這個比喻概括最容易記。務必舉出各自的經典應用——BeanFactoryPostProcessor 的佔位符解析、BeanPostProcessor 的 AOP 代理生成和 @Autowired 處理。最能加分的是點出「Spring 自己的核心功能（AOP、依賴注入、佔位符）都是靠這兩個擴展點實現的、框架自身也用公開擴展點」——這揭示了 Spring 高度可擴展的設計本質，展現你的理解達到了「看清框架設計哲學」的層次。

## 常見追問

### AOP 代理是在 BeanPostProcessor 的哪個階段生成的？為什麼是那個階段？

**核心答案**：AOP 代理通常在 `BeanPostProcessor` 的 `postProcessAfterInitialization`（初始化「之後」）階段生成——由一個叫 `AnnotationAwareAspectJAutoProxyCreator`（一種 BeanPostProcessor）在 Bean 完成初始化後，判斷這個 Bean 是否需要 AOP（是否匹配某個切面），需要的話就在這裡生成它的代理物件、返回代理來替換原始 Bean。之所以在「初始化之後」，是因為——AOP 是對「一個完整、初始化好的 Bean」進行包裝增強，必須等 Bean 的實例化、屬性填充、初始化（@PostConstruct 等）都完成後、拿到一個「就緒的成品 Bean」，才對它做代理包裝，這樣代理包裝的是一個功能完整的物件。

**詳細解析**：這題把 AOP 和 Bean 生命週期、BeanPostProcessor 三者串起來。回顧 Bean 生命週期（見 [[002-bean-lifecycle.md]]）——實例化 → 屬性填充 → BeanPostProcessor 前置 → 初始化（@PostConstruct 等）→ BeanPostProcessor 後置。AOP 的代理生成安排在最後的「後置處理（postProcessAfterInitialization）」，是有道理的——此時 Bean 已經完全準備好了（依賴注入完成、初始化邏輯執行完），是一個「功能完整的成品」。AOP 的 `AnnotationAwareAspectJAutoProxyCreator` 這個 BeanPostProcessor 在後置階段檢查「這個成品 Bean 是否需要被某個切面增強」，如果需要，就用 JDK/CGLIB 生成一個代理來包裝這個成品 Bean、返回代理（於是容器裡存的、別人注入到的都是這個代理）。為什麼不在更早的階段——因為如果在初始化前就代理，此時 Bean 還沒初始化好（可能依賴還沒注入、@PostConstruct 還沒跑），代理一個「半成品」是不對的。所以「初始化之後」是生成代理的正確時機。（唯一的例外是循環依賴——為了解決循環依賴，AOP 代理可能需要在更早的階段透過三級快取的工廠「提前生成」，見 [[004-circular-dependency.md]]。）理解 AOP 代理生成的時機和原因，展現你把 AOP、生命週期、BeanPostProcessor 串起來的整體理解。

**面試回答方式**：講出「AOP 代理在 postProcessAfterInitialization（初始化之後）生成、由 AnnotationAwareAspectJAutoProxyCreator 這個 BeanPostProcessor 做」，並解釋原因——「AOP 要包裝一個完整初始化好的成品 Bean、所以等實例化/注入/初始化都完成後才代理」。能提到「循環依賴時例外——透過三級快取工廠提前生成」，展現你把 AOP 生成時機、生命週期、循環依賴都串起來理解。

### 自訂一個 BeanPostProcessor 可以做什麼？舉個實際例子。

**核心答案**：自訂 BeanPostProcessor 能對「容器中的每一個 Bean」在初始化前後做統一的處理，用途很廣——例如：（1）**統一增強/包裝**：對符合條件的 Bean 統一做代理增強（AOP 就是這麼實現的）；（2）**統一注入/修改**：對標了某個自訂註解的 Bean 統一注入某些東西、或修改其屬性；（3）**統一校驗/檢查**：在 Bean 初始化後檢查它是否符合某些規範；（4）**統一註冊/收集**：把符合條件的 Bean 收集起來（如收集所有實作了某介面的 Bean 註冊到一個管理器）。一個實際例子——自訂一個 BeanPostProcessor，掃描所有 Bean 的欄位，對標了自訂 `@InjectConfig` 註解的欄位，從配置中心動態注入配置值。

**詳細解析**：BeanPostProcessor 的威力在於它是「作用於每一個 Bean 的統一攔截點」——你在這裡寫的邏輯會被應用到容器裡所有的 Bean（或你篩選的那些）。這讓它成為實現「跨所有 Bean 的統一橫切處理」的利器。實際的應用例子很多——Spring 自己用它實現了 @Autowired（`AutowiredAnnotationBeanPostProcessor` 掃描每個 Bean 的 @Autowired 欄位/方法並注入）、@PostConstruct（`CommonAnnotationBeanPostProcessor` 呼叫每個 Bean 的初始化方法）、AOP（`AutoProxyCreator` 代理每個需要的 Bean）。你也可以自訂——比如做一個「自動記錄所有 Service 方法耗時」的處理器（在後置階段對所有 @Service Bean 做代理增強）、或「從外部配置中心動態注入配置」的處理器（掃描每個 Bean 標了自訂註解的欄位、注入配置中心的值）、或「收集所有實作了 `Plugin` 介面的 Bean 註冊到外掛管理器」的處理器。要注意的是——BeanPostProcessor 本身要盡量輕量高效（因為它會處理每一個 Bean，慢的話拖累整個啟動），且它自己會比普通 Bean 更早被實例化（因為它要處理別的 Bean）。理解自訂 BeanPostProcessor 的能力和例子，展現你不只知道這個擴展點的存在，還能實際運用它擴展 Spring。

**面試回答方式**：講出 BeanPostProcessor 能「對每個 Bean 統一處理」的用途（統一增強/注入/校驗/收集），並舉 Spring 自己的例子（@Autowired、@PostConstruct、AOP 都是它實現的）和一個自訂例子（如掃描自訂註解從配置中心注入配置、或收集某介面的所有實作）。能提到「它要輕量、且比普通 Bean 更早實例化」的注意點，展現你能實際運用這個擴展點。

### BeanFactoryPostProcessor 和 BeanDefinitionRegistryPostProcessor 有什麼關係？

**核心答案**：`BeanDefinitionRegistryPostProcessor` 是 `BeanFactoryPostProcessor` 的「子介面」，它擴展了一個更強的能力——「動態註冊新的 BeanDefinition」。普通的 BeanFactoryPostProcessor 能「修改已存在的 Bean 定義」（改屬性、改作用域等），但 `BeanDefinitionRegistryPostProcessor` 額外提供了 `postProcessBeanDefinitionRegistry` 方法，讓你能在更早的時機「往容器裡動態註冊全新的 Bean 定義」（憑空增加 Bean）。它執行的時機比普通 BeanFactoryPostProcessor 更早（先執行完所有的 registry 後置處理、再執行普通的 factory 後置處理）。很多框架整合（如 MyBatis 的 Mapper 掃描、動態代理（Dynamic Proxy）生成的 Bean）就是靠它動態註冊 Bean 定義的。

**詳細解析**：這題是 BeanFactoryPostProcessor 的進階延伸。兩者的能力差異——普通 `BeanFactoryPostProcessor.postProcessBeanFactory` 拿到的是 `ConfigurableListableBeanFactory`，主要用於「修改已註冊的 Bean 定義」（改現有藍圖）。`BeanDefinitionRegistryPostProcessor.postProcessBeanDefinitionRegistry` 拿到的是 `BeanDefinitionRegistry`，能「往裡面註冊全新的 BeanDefinition」（增加新藍圖）。這個「動態註冊 Bean」的能力對框架整合極其重要——典型例子是 MyBatis 的 `MapperScannerConfigurer`：MyBatis 的 Mapper 是介面（沒有實作類別），Spring 正常無法為介面建立 Bean，MyBatis 就用 `BeanDefinitionRegistryPostProcessor` 掃描所有 Mapper 介面、為每個介面「動態註冊一個 BeanDefinition」（這個定義指向一個 FactoryBean，會為介面生成動態代理實作），這樣你才能 `@Autowired` 注入 Mapper 介面。很多需要「根據掃描結果動態生成一批 Bean」的框架整合都靠這個機制。理解 `BeanDefinitionRegistryPostProcessor` 的「動態註冊 Bean」能力和它在框架整合中的應用（如 MyBatis Mapper），展現你對 Spring 擴展機制的理解達到了能解釋「第三方框架如何整合進 Spring」的深度。

**面試回答方式**：講出「BeanDefinitionRegistryPostProcessor 是 BeanFactoryPostProcessor 的子介面、額外能『動態註冊新的 BeanDefinition』（普通的只能改已有定義）、執行時機更早」。舉 MyBatis 的例子——「MyBatis 用它掃描 Mapper 介面、為每個介面動態註冊 Bean 定義（指向生成代理的 FactoryBean）、所以你能注入 Mapper 介面」。能解釋「框架整合靠它動態生成一批 Bean」，展現你對擴展機制在框架整合中的應用有深入理解。

## 相關

- [[002-bean-lifecycle.md]]
- [[004-circular-dependency.md]]
- [[006-aop-concept.md]]
