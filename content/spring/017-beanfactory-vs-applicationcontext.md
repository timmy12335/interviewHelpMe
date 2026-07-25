---
id: spring-017
category: spring
slug: beanfactory-vs-applicationcontext
title: BeanFactory 與 ApplicationContext 的區別
difficulty: medium
tags: [BeanFactory, ApplicationContext, 容器]
source: original
---

# 題目

`BeanFactory` 和 `ApplicationContext` 有什麼區別？它們是什麼關係？

## 核心答案

`BeanFactory` 是 Spring IoC 容器的「最基礎介面」，提供最核心的功能——管理 Bean（定義、建立、獲取、依賴注入）。`ApplicationContext` 是 `BeanFactory` 的「子介面」，在 BeanFactory 的基礎上「擴展了大量企業級功能」——國際化（i18n）、事件發布機制、資源載入、以及和 Spring AOP、註解等更好的整合。兩者的關係是「ApplicationContext 繼承並增強了 BeanFactory」。另一個關鍵區別是「Bean 的載入時機」——BeanFactory 預設「延遲載入」（用到時才建立 Bean），ApplicationContext 預設「啟動時就預先建立所有單例 Bean」。實際開發中幾乎都用 ApplicationContext。

## 詳細解析

**BeanFactory（基礎容器）**：

- 是 IoC 容器的最基礎介面，定義了容器的核心能力——`getBean()`、管理 Bean 的定義和依賴。
- 功能最精簡，只做「Bean 的管理」這件核心的事。
- 預設「延遲載入（lazy）」——只有當你第一次 `getBean()` 請求某個 Bean 時，才真正建立它。

**ApplicationContext（企業級容器）**：

- 是 BeanFactory 的子介面，「繼承了 BeanFactory 的全部功能」，並在其上增加了大量企業級特性——
  - **國際化（MessageSource）**：支援多語言訊息。
  - **事件發布（ApplicationEventPublisher）**：支援發布/監聽應用事件（見 [[021-spring-events.md]]）。
  - **資源載入（ResourceLoader）**：統一的資源存取（classpath、檔案、URL 等）。
  - **與 AOP、註解等的更好整合**：自動偵測 BeanPostProcessor、BeanFactoryPostProcessor 等。
- 預設「預先載入（eager）」——容器啟動時就建立好所有的單例 Bean（非延遲的）。

**兩個關鍵區別**：

1. **功能豐富度**：BeanFactory 是基礎（只管 Bean）、ApplicationContext 是增強（Bean 管理 + 國際化 + 事件 + 資源 + 整合）。
2. **載入時機**：BeanFactory 延遲載入（用時才建）、ApplicationContext 預先載入（啟動就建好所有單例）。

**預先載入的好處**：ApplicationContext 啟動時就建立所有單例 Bean，好處是「問題早暴露」——如果某個 Bean 配置有誤（如缺依賴），啟動時就會報錯，而不是等到執行期第一次用到才失敗。這符合「快速失敗」原則，對生產環境更友好。

## 面試回答方式

先講關係——「ApplicationContext 是 BeanFactory 的子介面、繼承並增強了它」。兩個核心區別要講清楚：一是「功能」（BeanFactory 只管 Bean、ApplicationContext 加了國際化/事件/資源/整合等企業級功能），二是「載入時機」（BeanFactory 延遲、ApplicationContext 預先建立單例）。實務加分點——講「ApplicationContext 預先載入的好處是啟動時就暴露配置問題（快速失敗）」，並點出「實際開發幾乎都用 ApplicationContext」。能從「基礎 vs 增強」和「延遲 vs 預先」兩個維度清晰對比，展現你理解兩者的定位差異。

## 常見追問

### 為什麼 ApplicationContext 預設預先載入所有單例 Bean？這有什麼好處和代價？

**核心答案**：好處主要是「快速失敗（fail-fast）」——啟動時就建立所有單例 Bean，任何配置錯誤（缺依賴、Bean 建立失敗、循環依賴等）都會在「應用啟動階段」立即暴露並報錯，而不是等到執行期第一次用到那個 Bean 才失敗（那時可能已經在處理使用者請求了，失敗的影響更大、更難排查）。這對生產環境很重要——寧可啟動時就發現問題（還沒對外服務），也不要上線後才在某個請求中突然失敗。代價是——啟動時間會變長（要建立所有單例）、且啟動時就佔用了所有 Bean 的記憶體（即使有些 Bean 可能很久才用到）。

**詳細解析**：這是一個「早暴露問題 vs 啟動速度/資源」的權衡，而 Spring 選擇了「早暴露」。預先載入的核心價值是把「Bean 建立可能出的問題」的暴露時機從「執行期第一次使用」提前到「啟動期」。想像如果延遲載入——某個配置錯誤的 Bean 平時不用、直到某天一個特定請求觸發了它才第一次建立、然後建立失敗、請求報錯，這時應用早已上線在服務、排查起來也麻煩（要復現那個特定請求）。預先載入則讓這個問題在「應用還沒開始對外服務的啟動階段」就爆出來，你在部署時就能發現、修復，不會帶病上線。這符合「快速失敗」的工程原則——問題越早暴露、修復成本越低、影響越小。代價是啟動慢一點、記憶體佔用早一點，但對大多數服務端應用，這個代價遠小於「上線後才發現配置錯誤」的風險。當然，如果某些 Bean 確實建立成本高又很少用，可以用 `@Lazy` 讓它延遲載入（個別 Bean 退回延遲策略）。理解這個權衡，展現你理解預先載入背後的「快速失敗」設計哲學。

**面試回答方式**：講出好處「快速失敗——啟動時就暴露配置錯誤、不會帶病上線、比執行期第一次用到才失敗好排查」，代價「啟動變慢、記憶體早佔用」。能點出「符合快速失敗原則、且個別 Bean 可用 @Lazy 退回延遲」，展現你理解這個權衡和它的設計哲學（也呼應了前面 JVM 題裡的 fail-fast 思想）。

### ApplicationContext 有哪些常見的實作類別？

**核心答案**：常見實作按「配置來源」和「應用類型」分——按配置來源有 `ClassPathXmlApplicationContext`（從 classpath 的 XML 載入）、`FileSystemXmlApplicationContext`（從檔案系統的 XML 載入）、`AnnotationConfigApplicationContext`（從 Java 註解配置類別載入，現代主流）；按 Web 應用有 `AnnotationConfigWebApplicationContext`、以及 Spring Boot 用的 `AnnotationConfigServletWebServerApplicationContext`（內嵌 Servlet 容器的 Web 應用上下文）等。現代開發（尤其 Spring Boot）主要用基於註解和 Java Config 的實作，XML 的實作已經很少用了。

**詳細解析**：這些實作類別的差異主要在「從哪裡讀配置」和「是不是 Web 環境」。早期 Spring 用 XML 配置——`ClassPathXmlApplicationContext("beans.xml")` 從 classpath 讀 XML 定義。後來註解配置成為主流——`AnnotationConfigApplicationContext(AppConfig.class)` 從標了 `@Configuration` 的 Java 類別讀配置（不用寫 XML，用 Java Config + 註解）。Web 環境有專門的實作（能整合 ServletContext、支援 request/session 作用域等）。Spring Boot 進一步——它根據應用類型（Servlet Web、Reactive Web、非 Web）自動選擇合適的 ApplicationContext 實作（如 Servlet Web 應用用 `AnnotationConfigServletWebServerApplicationContext`，它還負責啟動內嵌的 Tomcat/Jetty），所以用 Spring Boot 時你通常不用手動選擇——`SpringApplication.run()` 會根據 classpath 上的依賴自動決定用哪種上下文。理解這些實作的區別，主要是理解「配置來源（XML/註解）」和「應用類型（Web/非Web）」這兩個維度，展現你了解容器實作的演進（從 XML 到註解、從手動到 Spring Boot 自動選擇）。

**面試回答方式**：按維度講——「配置來源：ClassPathXmlApplicationContext（XML）、AnnotationConfigApplicationContext（註解，現代主流）；Web 環境有專門的實作；Spring Boot 根據應用類型自動選（如內嵌 Servlet 容器的上下文）」。能點出「現代主要用註解/Java Config、Spring Boot 自動選擇不用手動」，展現你了解容器實作的演進和現狀。

### BeanFactory 和 FactoryBean 是一回事嗎？

**核心答案**：完全不是一回事，只是名字容易混淆。`BeanFactory` 是「IoC 容器本身的基礎介面」——它是「生產和管理 Bean 的工廠（容器）」。`FactoryBean` 是「一種特殊的 Bean」——它是一個「能生產其他 Bean 的 Bean」，實作 `FactoryBean` 介面的類別，當你從容器獲取它時，容器返回的不是這個 FactoryBean 實例本身，而是它的 `getObject()` 方法生產出來的物件。簡言之——BeanFactory 是「容器」，FactoryBean 是「容器裡一種能生產物件的特殊 Bean」，兩者是完全不同層次的概念。

**詳細解析**：這是一個經典的「名字相似但概念完全不同」的面試考點。`BeanFactory` 是容器層面的——它是整個 IoC 容器的最基礎介面，代表「管理所有 Bean 的工廠」。`FactoryBean` 是 Bean 層面的——它是「容器管理的眾多 Bean 中的一種特殊 Bean」，特殊在於「它的作用是生產另一個物件」。FactoryBean 的用途是——當某個物件的建立過程很複雜（不是簡單 new，而是需要複雜的邏輯、配置、或整合第三方框架），把這個複雜的建立邏輯封裝到一個 FactoryBean 的 `getObject()` 方法裡，然後容器獲取這個 Bean 時，實際拿到的是 `getObject()` 生產的物件。典型應用——Spring 整合 MyBatis 時的 `SqlSessionFactoryBean`（封裝了建立 SqlSessionFactory 的複雜過程）、整合各種第三方框架時常用 FactoryBean 封裝複雜的物件建立。有個細節——如果你想獲取 FactoryBean 本身（而不是它生產的物件），在 Bean 名稱前加 `&`（如 `getBean("&myFactoryBean")`）。理解「BeanFactory 是容器、FactoryBean 是能生產物件的特殊 Bean」，是區分這兩個易混淆概念的關鍵。

**面試回答方式**：明確回答「完全不同——BeanFactory 是 IoC 容器的基礎介面（容器本身）、FactoryBean 是容器裡一種能生產其他物件的特殊 Bean（獲取它時拿到的是它 getObject 生產的物件）」。舉 `SqlSessionFactoryBean` 說明用途（封裝複雜的物件建立）。能提到「加 & 前綴獲取 FactoryBean 本身」的細節，展現你清楚區分這兩個易混淆的概念。

## 相關

- [[001-ioc-di-concept.md]]
- [[021-spring-events.md]]
