---
id: spring-024
category: spring
slug: conditional-profiles
title: "@Conditional 條件裝配與 Profile"
difficulty: medium
tags: [Conditional, Profile, 環境, 條件裝配]
source: original
---

# 題目

`@Conditional` 條件裝配是什麼？`@Profile` 是做什麼的？它們和自動配置有什麼關係？

## 核心答案

`@Conditional` 是 Spring 的「條件裝配」機制——它讓一個 Bean/配置「只在滿足特定條件時才註冊生效」。你在 @Bean/@Configuration 上標 `@Conditional(某條件類別.class)`，只有當那個條件（實作 `Condition` 介面、判斷 classpath、Bean 存在性、配置屬性等）返回 true 時，這個 Bean 才會被建立。`@Profile` 是基於 @Conditional 實現的一個特化——它讓 Bean「只在特定的環境設定檔（profile，如 dev/test/prod）啟用時才生效」，用於「按環境提供不同的 Bean 配置」（如開發環境用記憶體資料庫、生產環境用真實資料庫）。它們和自動配置的關係是——Spring Boot 的整個自動配置機制就是建立在 @Conditional 之上的（每個自動配置類別都用 @ConditionalOnXxx 按條件生效）。

## 詳細解析

**@Conditional 條件裝配**：

- 作用——讓 Bean 的註冊「有條件」，只在條件滿足時才生效。
- 用法——`@Conditional(MyCondition.class)`，MyCondition 實作 `Condition` 介面的 `matches()` 方法返回 true/false。
- Spring Boot 提供了一系列現成的條件註解（都基於 @Conditional）——`@ConditionalOnClass`（classpath 上有某類別）、`@ConditionalOnMissingBean`（容器沒某 Bean）、`@ConditionalOnProperty`（某配置屬性符合條件）、`@ConditionalOnWebApplication`（是 Web 應用）等（見 [[013-spring-boot-autoconfiguration.md]]）。

**@Profile 環境設定檔**：

- 作用——讓 Bean「只在特定 profile 啟用時生效」，實現「按環境切換配置」。
- 用法——`@Profile("dev")` 標在 Bean/配置上，只有當前啟用的 profile 包含 "dev" 時這個 Bean 才生效。
- 啟用 profile——透過 `spring.profiles.active=dev`（配置檔）、環境變數、啟動參數等指定當前啟用哪個 profile。
- 典型場景——開發環境（dev）用 H2 記憶體資料庫和詳細日誌、測試環境（test）用測試資料庫、生產環境（prod）用真實資料庫和精簡日誌——用 @Profile 為不同環境提供不同的 Bean 配置，同一份程式碼、透過切換 profile 適應不同環境。

**它們和自動配置的關係**：

- @Profile 本質是一個特殊的 @Conditional（`@Profile` 底層是 `@Conditional(ProfileCondition.class)`）——判斷「當前啟用的 profile 是否匹配」。
- Spring Boot 的自動配置全靠 @Conditional——每個 XxxAutoConfiguration 都用各種 @ConditionalOnXxx 決定「在什麼條件下自動配置生效」。所以 @Conditional 是自動配置的「基石」。理解 @Conditional 就理解了自動配置「按需生效」的本質。

## 面試回答方式

先講 @Conditional 是「條件裝配——讓 Bean 只在條件滿足時生效」，並列出 Spring Boot 基於它的常用條件註解（@ConditionalOnClass/OnMissingBean/OnProperty）。@Profile 講「基於 @Conditional 的特化、按環境（dev/test/prod）切換配置」並舉例（開發用記憶體庫、生產用真實庫）。最能加分的是點出「它們和自動配置的關係——Spring Boot 自動配置全建立在 @Conditional 之上、@Profile 也是一種 @Conditional」，把這三個知識點（條件裝配、Profile、自動配置）串成一個體系，展現你理解它們共同的機制根基。

## 常見追問

### @ConditionalOnProperty 的典型用法是什麼？

**核心答案**：`@ConditionalOnProperty` 讓 Bean「根據配置檔中某個屬性的值來決定是否生效」——典型用法是「功能開關（feature toggle）」：透過一個配置屬性來控制某個功能（一組 Bean）的啟用/停用。例如 `@ConditionalOnProperty(name = "myapp.cache.enabled", havingValue = "true")`——只有當配置檔中 `myapp.cache.enabled=true` 時，這個快取相關的 Bean 才生效。這讓你能透過改配置（而非改程式碼）來開關功能，很適合——按環境啟用不同功能、灰度發布時控制新功能開關、或讓某些可選功能預設關閉、需要時才開。

**詳細解析**：`@ConditionalOnProperty` 是實現「配置驅動的功能開關」的利器。它的幾個關鍵屬性——`name`（要判斷的配置屬性名）、`havingValue`（期望的值，屬性值等於它才生效）、`matchIfMissing`（屬性不存在時是否算匹配，用來設定預設行為）。典型應用場景——（1）功能開關：一個功能模組的所有 Bean 都標 `@ConditionalOnProperty(name="feature.x.enabled", havingValue="true")`，透過配置一鍵開關整個功能，不用改程式碼、重新部署即可；（2）多實作切換：例如簡訊服務有多個供應商實作，用 `@ConditionalOnProperty(name="sms.provider", havingValue="aliyun")` 之類的讓不同配置啟用不同的供應商實作；（3）可選功能預設關閉：某個進階功能預設不啟用（matchIfMissing=false），需要的環境才在配置裡開啟。這種「用配置控制 Bean 是否生效」的能力，讓應用的行為可以透過外部配置靈活調整，符合「配置與程式碼分離」的十二要素應用原則。理解 @ConditionalOnProperty 的功能開關用法，展現你了解如何用條件裝配實現靈活的、配置驅動的應用行為控制。

**面試回答方式**：講出「@ConditionalOnProperty 根據配置屬性值決定 Bean 是否生效、典型用法是功能開關」，並舉例（`havingValue="true"` 控制功能啟用、多實作切換、可選功能預設關閉）。能點出「這實現了配置驅動的功能開關、改配置就能開關功能不用改碼、符合配置與程式碼分離」，展現你理解它的實際價值。

### Profile 和配置檔（application-{profile}.yml）是怎麼配合的？

**核心答案**：兩者配合實現「按環境的完整配置切換」——`@Profile` 控制「哪些 Bean 在哪個環境生效」（程式碼層面的條件裝配），而 `application-{profile}.yml`（如 application-dev.yml、application-prod.yml）控制「每個環境的配置屬性值」（配置層面）。當你透過 `spring.profiles.active=prod` 啟用 prod 環境時——Spring Boot 會載入 `application-prod.yml` 的配置（覆蓋/補充預設的 application.yml），同時標了 `@Profile("prod")` 的 Bean 生效、標了 `@Profile("dev")` 的不生效。兩者一個管「Bean 的啟用」、一個管「屬性值」，配合起來讓「同一份程式碼透過切換一個 active profile 就能完整地適應不同環境（Bean 組合 + 配置值都切換）」。

**詳細解析**：這是 Spring Boot 多環境管理的完整圖景。實際專案中，不同環境的差異體現在兩個層面——「用哪些 Bean」（如開發用一個 mock 的第三方服務、生產用真實的）和「配置值是什麼」（如資料庫連線字串、外部服務地址、日誌級別）。`@Profile` 解決前者——在程式碼裡用 `@Profile("dev")`/`@Profile("prod")` 標記「這個 Bean 屬於哪個環境」。`application-{profile}.yml` 解決後者——為每個環境準備一個配置檔（application-dev.yml 放開發的配置值、application-prod.yml 放生產的），Spring Boot 根據啟用的 profile 載入對應的檔案。載入規則是——先載入通用的 application.yml（放共通配置），再根據 active profile 載入對應的 application-{profile}.yml（放環境特定配置，會覆蓋通用的同名配置）。這樣切換環境只需改一個地方——`spring.profiles.active`（通常透過啟動參數或環境變數指定，如部署到生產時設 `--spring.profiles.active=prod`），Bean 組合和配置值就一起切換到生產環境的了。這實現了「一次構建、多環境部署」——同一個打包好的應用，透過不同的 active profile 適應開發、測試、生產各環境，不用為每個環境改程式碼或重新打包。理解這個配合，展現你了解 Spring Boot 多環境管理的完整實踐。

**面試回答方式**：講出「@Profile 管『哪些 Bean 在哪個環境生效』、application-{profile}.yml 管『每個環境的配置值』、透過 spring.profiles.active 切換時兩者一起生效」。說明載入規則（先 application.yml 通用配置、再 application-{profile}.yml 覆蓋）。能點出「實現一次構建多環境部署——同一個包透過改 active profile 適應各環境」，展現你理解多環境管理的完整實踐。

### 如何自訂一個 @Conditional 條件？

**核心答案**：自訂條件需要——（1）實作 `Condition` 介面，覆寫 `matches(ConditionContext context, AnnotatedTypeMetadata metadata)` 方法，在裡面寫判斷邏輯（可以透過 context 拿到容器、環境、classpath 等資訊來判斷），返回 true（條件滿足、Bean 生效）或 false；（2）在 @Bean/@Configuration 上用 `@Conditional(你的Condition類別.class)` 引用它。例如寫一個「只在 Linux 作業系統上才生效」的條件——實作 Condition，在 matches 裡判斷 `System.getProperty("os.name")` 是否包含 "Linux"，然後用 `@Conditional(OnLinuxCondition.class)` 標在需要的 Bean 上。Spring Boot 的那些 @ConditionalOnXxx 註解，本質都是「預先寫好的 Condition 實作 + @Conditional 的組合」。

**詳細解析**：自訂 @Conditional 讓你能表達任意的「Bean 生效條件」。核心是實作 `Condition` 介面的 `matches` 方法——它能拿到 `ConditionContext`（透過它可以存取 BeanFactory、Environment 環境配置、ClassLoader、資源載入器等，用來做各種判斷）和 `AnnotatedTypeMetadata`（被標註元素的元資料）。在 matches 裡你可以做任何判斷——檢查某個配置屬性、檢查 classpath 上有沒有某個類別、檢查作業系統、檢查某個外部服務是否可用、檢查時間等等——返回 true 則被標註的 Bean 生效、false 則不生效。Spring Boot 的一系列 `@ConditionalOnXxx`（OnClass、OnMissingBean、OnProperty 等）就是官方預先寫好的一批常用 Condition 實作，用註解的形式封裝好方便使用（例如 @ConditionalOnClass 背後就是一個檢查 classpath 是否有指定類別的 Condition）。你可以組合使用官方的這些、也可以像上面那樣自訂全新的條件。自訂 @Conditional 的能力，讓你能實現「非常客製化的、基於任意執行期條件的裝配邏輯」。理解如何自訂條件（實作 Condition + @Conditional 引用），展現你不只會用現成的條件註解、還能造自己的，真正掌握了條件裝配這個機制。

**面試回答方式**：講出自訂步驟——「實作 Condition 介面的 matches 方法（透過 ConditionContext 拿容器/環境/classpath 等資訊做判斷、返回 true/false）、用 @Conditional(你的Condition.class) 引用」。舉個例子（如判斷作業系統的 OnLinuxCondition）。能點出「Spring Boot 的 @ConditionalOnXxx 本質就是官方預寫的 Condition + @Conditional 組合」，展現你理解條件裝配的機制、既會用也能造。

## 相關

- [[013-spring-boot-autoconfiguration.md]]
- [[014-springbootapplication-annotation.md]]
