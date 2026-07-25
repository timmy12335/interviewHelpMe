---
id: spring-002
category: spring
slug: bean-lifecycle
title: Spring Bean 的生命週期
difficulty: medium
tags: [Bean生命週期, 初始化, BeanPostProcessor]
source: original
---

# 題目

Spring Bean 從建立到銷毀經歷了哪些階段？有哪些擴展點可以介入？

## 核心答案

Bean 的生命週期主要是：實例化（呼叫建構子建立物件）→ 屬性填充（依賴注入）→ Aware 介面回呼（注入容器相關的資訊如 BeanName、ApplicationContext）→ BeanPostProcessor 前置處理 → 初始化（`@PostConstruct` → `InitializingBean.afterPropertiesSet()` → 自訂 init-method）→ BeanPostProcessor 後置處理（AOP 代理通常在這裡生成）→ Bean 就緒被使用 → 容器關閉時銷毀（`@PreDestroy` → `DisposableBean.destroy()` → 自訂 destroy-method）。核心擴展點是 BeanPostProcessor（能在初始化前後對每個 Bean 做處理，AOP 就是靠它織入）。

## 詳細解析

**完整生命週期階段**：

1. **實例化（Instantiation）**：容器根據 BeanDefinition 呼叫建構子建立物件實例（此時物件的屬性還是空的）。
2. **屬性填充（Populate）**：進行依賴注入，把這個 Bean 依賴的其他 Bean 注入進來（`@Autowired` 的欄位/setter 在此填充）。
3. **Aware 回呼**：如果 Bean 實作了 Aware 系列介面，容器會回呼注入相應資訊——`BeanNameAware`（注入 Bean 的名字）、`BeanFactoryAware`、`ApplicationContextAware`（注入容器本身）等。
4. **BeanPostProcessor 前置處理**：`postProcessBeforeInitialization()`，在初始化方法之前對 Bean 做處理（如 `@PostConstruct` 實際上是由一個 BeanPostProcessor 在這個階段觸發的）。
5. **初始化（Initialization）**：依序執行——`@PostConstruct` 標註的方法 → `InitializingBean.afterPropertiesSet()` → 自訂的 init-method。
6. **BeanPostProcessor 後置處理**：`postProcessAfterInitialization()`，在初始化之後處理——**AOP 代理通常在這裡生成**（把原始 Bean 包裝成代理返回）。
7. **Bean 就緒**：此時 Bean 完全初始化好，可以被使用。
8. **銷毀（Destruction）**：容器關閉時，依序執行——`@PreDestroy` 方法 → `DisposableBean.destroy()` → 自訂 destroy-method。（只對單例 Bean，且需要正常關閉容器。）

**核心擴展點——BeanPostProcessor**：它能攔截「每一個」Bean 的初始化前後，是 Spring 最重要的擴展機制。很多功能靠它實現——AOP（後置處理時生成代理）、`@Autowired`/`@Value` 的處理、`@PostConstruct`/`@PreDestroy` 的處理等。理解 BeanPostProcessor 是理解 Spring 擴展性的關鍵（見 [[023-bean-post-processor.md]]）。

## 面試回答方式

按階段順序講——實例化 → 屬性填充 → Aware 回呼 → BeanPostProcessor 前置 → 初始化（@PostConstruct / afterPropertiesSet / init-method 三者順序）→ BeanPostProcessor 後置（AOP 在此）→ 使用 → 銷毀。不用逐字背，但要能講出主幹和幾個關鍵擴展點。最重要的是點出「BeanPostProcessor 是核心擴展點、AOP 代理在後置處理時生成」——這連結到後面循環依賴、AOP 等題目。能講出初始化方法的三種方式及其執行順序（@PostConstruct 最先），展現你對生命週期細節的掌握。

## 常見追問

### @PostConstruct、InitializingBean、init-method 三種初始化方式的執行順序和區別？

**核心答案**：執行順序是——`@PostConstruct` 標註的方法最先執行，接著是 `InitializingBean` 介面的 `afterPropertiesSet()`，最後是配置中指定的自訂 init-method。區別在於「耦合程度」——`@PostConstruct` 是 JSR-250 標準註解（不綁定 Spring）、`InitializingBean` 需要實作 Spring 的介面（和 Spring 耦合）、init-method 透過配置指定（最靈活、完全不侵入程式碼）。推薦用 `@PostConstruct`（標準、簡潔、不綁定 Spring）。

**詳細解析**：三者都是「Bean 屬性填充完成後、進行初始化邏輯」的時機，但實現方式和耦合度不同。`@PostConstruct` 是 Java 標準（`javax.annotation`/`jakarta.annotation`），標在方法上即可，換掉 Spring 也還是標準註解，且語意清晰，是首選。`InitializingBean.afterPropertiesSet()` 需要你的 Bean 實作 Spring 的介面，把業務類別和 Spring 框架耦合了，一般不推薦（除非有特殊需要）。init-method 是在 `@Bean(initMethod="...")` 或 XML 中指定初始化方法名，完全不侵入你的類別程式碼（類別不需要任何 Spring 相關的註解或介面），適合「無法修改原始碼的第三方類別」。執行順序上 Spring 明確定義為 `@PostConstruct` → `afterPropertiesSet` → init-method。理解三者的區別和耦合度，展現你不只知道有這些方式，還能根據場景做選擇。

**面試回答方式**：講出執行順序（@PostConstruct → afterPropertiesSet → init-method）和三者的耦合度差異（標準註解 / Spring 介面 / 配置指定），並給出推薦（@PostConstruct，標準且不綁 Spring）。能點出「init-method 適合無法改原始碼的第三方類別」，展現你理解每種方式的適用場景。

### Aware 系列介面是做什麼的？舉幾個例子。

**核心答案**：Aware 系列介面讓 Bean 能夠「感知（aware）」到容器相關的基礎設施資訊——當一個 Bean 實作某個 Aware 介面時，容器會在生命週期的特定階段回呼、把對應的資訊注入給它。常見的有——`BeanNameAware`（讓 Bean 知道自己在容器中的名字）、`BeanFactoryAware`/`ApplicationContextAware`（讓 Bean 拿到容器本身的引用，從而能主動獲取其他 Bean）、`EnvironmentAware`（拿到環境配置）等。它們是 Bean「反向獲取容器能力」的橋樑。

**詳細解析**：正常情況下 Bean 應該是「被動接受注入」的（符合 IoC 的思想），不需要知道容器的存在。但有些場景下，Bean 確實需要主動和容器互動——例如一個工具類需要根據執行期條件動態獲取某個 Bean、或需要讀取環境配置。Aware 介面就是為這些場景提供的「受控的後門」——透過實作對應介面，Bean 能拿到它需要的容器基礎設施。最常用的是 `ApplicationContextAware`（拿到 ApplicationContext 後可以 `getBean()`、發布事件等）。要注意——實作 Aware 介面會讓你的 Bean 和 Spring 耦合（依賴了 Spring 的介面），所以應該謹慎使用，只在確實需要主動與容器互動時才用，不要為了方便到處注入 ApplicationContext（那會破壞 IoC 的解耦初衷）。理解 Aware 的用途和「它是有代價的後門」，展現你既知道這個機制又有正確的使用判斷。

**面試回答方式**：講出 Aware 的作用（讓 Bean 感知並獲取容器基礎設施資訊），舉幾個例子（BeanNameAware、ApplicationContextAware、EnvironmentAware）。能點出「它讓 Bean 和 Spring 耦合、是受控的後門、應謹慎使用不要濫用注入 ApplicationContext」，展現你理解這個機制的代價和正確用法。

### 原型（prototype）作用域的 Bean 生命週期和單例有什麼不同？

**核心答案**：最主要的區別是——對原型 Bean，容器只負責「建立和初始化」，不負責「銷毀」。也就是說，容器每次請求原型 Bean 時都建立一個新實例並完成初始化（實例化 → 屬性填充 → 初始化回呼），但建立完交給呼叫方之後，容器就不再管理它的生命週期了——不會呼叫它的銷毀方法（`@PreDestroy`/`destroy-method` 對原型 Bean 無效），它的銷毀由 JVM 的 GC 在它不再被引用時負責。所以原型 Bean 的資源清理需要呼叫方自己處理，不能依賴容器的銷毀回呼。

**詳細解析**：這個區別源於單例和原型的管理模式不同。單例 Bean 由容器全程管理——容器持有它的引用、在容器關閉時統一銷毀它們（呼叫銷毀回呼）。原型 Bean 則是「用完即棄，容器不持有」——容器建立好、初始化完、交給你之後就「撒手不管」了，因為容器根本不知道你什麼時候用完這個原型實例（可能有很多個實例散落在各處），無法統一管理它們的銷毀。這帶來一個實務注意點——如果原型 Bean 持有需要清理的資源（如連線、檔案控制代碼），不能指望 `@PreDestroy` 被呼叫（它不會被容器呼叫），必須由使用這個原型 Bean 的程式碼自己負責清理。另一個相關的坑是「單例 Bean 注入原型 Bean」——如果一個單例 Bean 注入了一個原型 Bean，因為單例只初始化一次、注入也只發生一次，所以這個單例裡拿到的「原型 Bean」實際上永遠是同一個實例（失去了原型「每次都新」的意義），要解決需要用 `@Lookup`、`ObjectProvider` 或 scoped proxy 等方式每次動態獲取新的原型實例。

**面試回答方式**：講出核心區別——「容器只負責原型 Bean 的建立和初始化、不負責銷毀（@PreDestroy 對原型無效、由 GC 回收）」，並說明原因（容器不持有原型實例、不知何時用完）。能延伸「單例注入原型會導致原型退化成單例、需用 @Lookup/ObjectProvider 解決」這個經典坑，展現你對作用域和生命週期交互的深入理解。

## 相關

- [[001-ioc-di-concept.md]]
- [[003-bean-scopes.md]]
- [[023-bean-post-processor.md]]
