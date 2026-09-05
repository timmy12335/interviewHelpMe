---
id: spring-031
category: spring
slug: bean-definition-registry
title: Bean 定義的註冊與 BeanDefinitionRegistryPostProcessor
difficulty: hard
tags: [BeanDefinition, 擴充點, 動態註冊, 容器]
source: original
---

# 題目

Spring 怎麼在執行期動態註冊 bean？MyBatis 的 Mapper 介面是怎麼變成 bean 的？

## 核心答案

關鍵是 **`BeanDefinition`** 這個抽象——Spring 容器裡真正的「定義」不是類別而是 `BeanDefinition` 物件，它描述了「這個 bean 是什麼型別、怎麼建立、有哪些依賴、什麼作用域」。`@Component` 掃描與 `@Bean` 方法只是**產生 `BeanDefinition` 的兩種方式**，不是唯一的方式。

動態註冊的擴充點是 **`BeanDefinitionRegistryPostProcessor`**，它的 `postProcessBeanDefinitionRegistry` 方法在所有 bean 定義載入之後、任何 bean 實例化之前被呼叫，此時可以任意新增、修改、移除 `BeanDefinition`。

MyBatis 的做法正是如此：掃描指定套件下的 Mapper 介面，**為每個介面註冊一個 `BeanDefinition`，其 beanClass 設成 `MapperFactoryBean`**（一個 `FactoryBean`），並把介面型別當作建構子參數。容器實例化時，`MapperFactoryBean` 用 JDK 動態代理生成該介面的實作——於是一個沒有實作類別的介面，變成了可以被注入的 bean。

這個機制是所有「掃描介面產生實作」類框架的共同基礎：MyBatis 的 Mapper、Spring Data 的 Repository、Feign 的 Client，做法都一樣。

## 詳細解析

**`BeanDefinition` 是「定義」與「實例」分離的體現**。容器啟動分兩個階段：**先收集所有定義**（掃描、解析設定類別、執行 registry post processor），**再依序實例化**。這個分離讓「在實例化之前修改定義」成為可能——這正是 `BeanFactoryPostProcessor` 家族的作用點。理解這個兩階段模型，是理解 Spring 擴充點的關鍵。

兩個相關擴充點的差別要分清。`BeanDefinitionRegistryPostProcessor`（可以**新增**定義）在 `BeanFactoryPostProcessor`（只能**修改**既有定義）之前執行。而 `BeanPostProcessor` 則作用在**實例**上（bean 建立之後、初始化前後），AOP 代理就是在這裡包裝的。「定義層 vs 實例層」是這幾個擴充點的分界線。

**在 post processor 裡注入其他 bean 是危險的**。`BeanFactoryPostProcessor` 執行得非常早，此時去注入一個普通 bean 會**強迫它提前實例化**，而那時候其他的 post processor 可能還沒執行——結果是這個 bean 沒有被 AOP 代理、沒有被屬性後處理，行為與預期不符且極難察覺。**所以 post processor 應該盡量不依賴其他 bean**，需要設定值時直接讀 `Environment`。**這是 Spring 中最隱蔽的一類 bug**，症狀是「這個 bean 的 `@Transactional` 沒生效」而原因在幾百行外的另一個類別。

動態註冊的能力也帶來可理解性的成本。用 `@Bean` 或 `@Component` 定義的 bean，讀程式碼就看得到；動態註冊的 bean **在原始碼裡找不到任何宣告**，只能靠理解框架的機制或看 `/actuator/beans` 才知道它從哪來。所以自訂動態註冊時，應該在日誌中明確記錄註冊了什麼——這是對後來維護者的基本禮貌。

## 面試回答方式

先把 **`BeanDefinition`** 這個抽象講清楚——容器裡真正的定義不是類別而是 `BeanDefinition` 物件，`@Component` 掃描與 `@Bean` 方法只是產生它的兩種方式。接著給擴充點 `BeanDefinitionRegistryPostProcessor` 的執行時機（所有定義載入之後、任何實例化之前）。用 **MyBatis 的 Mapper** 完整說明機制：掃描介面 → 為每個介面註冊一個 beanClass 為 `MapperFactoryBean` 的定義 → 實例化時用動態代理生成實作，並指出 **Spring Data 的 Repository 與 Feign 的 Client 做法完全相同**。加分點有兩個：「定義層 vs 實例層」是幾個擴充點的分界線（`BeanDefinitionRegistryPostProcessor` 新增定義、`BeanFactoryPostProcessor` 修改定義、`BeanPostProcessor` 作用在實例）；以及在 post processor 裡注入其他 bean 會強迫它提前實例化，導致它沒有被 AOP 代理——這是 Spring 中最隱蔽的一類 bug。

## 講稿

關鍵是 BeanDefinition 這個抽象。容器裡真正的定義不是類別，而是描述「這個 bean 是什麼型別、怎麼建立、有哪些依賴」的物件。註解掃描跟配置方法只是產生它的兩種方式，不是唯一的方式。

動態註冊的擴充點會在所有 bean 定義載入之後、任何 bean 實例化之前被呼叫，這時候可以任意新增、修改、移除定義。

MyBatis 就是這樣做的。它掃描 Mapper 介面，為每個介面註冊一個定義，型別設成一個工廠 bean。容器實例化的時候，那個工廠用動態代理生成介面的實作。於是一個沒有實作類別的介面，變成了可以被注入的 bean。Spring Data 的 Repository 跟 Feign 的 Client 做法完全一樣。

理解這裡的關鍵是兩階段模型。容器先收集所有定義，再依序實例化。這個分離讓在實例化之前修改定義成為可能。

還有一個很隱蔽的坑。在這類早期的處理器裡注入其他 bean 會強迫它提前實例化，而那時候別的處理器可能還沒執行，結果那個 bean 沒有被 AOP 代理。症狀是某個 bean 的交易註解沒生效，而原因在幾百行外的另一個類別。

## 常見追問

### FactoryBean 與一般的 @Bean 方法差在哪？

**核心答案**：`FactoryBean<T>` 是一個 bean，但它的職責是生產另一個 bean。容器發現某個 bean 實作了 `FactoryBean` 時，注入時給的是 `getObject()` 的回傳值而不是 `FactoryBean` 本身；要取得 `FactoryBean` 實例本身，要在 bean 名稱前加 `&`。`@Bean` 方法則是直接回傳實例。

**詳細解析**：`FactoryBean` 的價值在於「建立邏輯複雜且需要容器參與」的場景——它本身是一個 bean，所以可以被注入依賴、可以有生命週期回呼、可以被 `BeanPostProcessor` 處理。而 `@Bean` 方法是設定類別裡的一個方法，**它的邏輯無法被動態註冊**（你不能在執行期產生一個新的 `@Bean` 方法），但可以動態註冊一個 `FactoryBean` 的定義。**這正是 MyBatis 選它的原因**：Mapper 的數量在編譯期未知，必須動態產生。判斷用哪個很簡單：定義是靜態已知的用 `@Bean`（更簡單直接），需要動態產生或建立邏輯需要容器能力的用 `FactoryBean`。

**面試回答方式**：給出行為差別（注入時給 `getObject()` 的結果、加 `&` 取得工廠本身）。重點在價值差異：`FactoryBean` 本身是 bean，可以被注入依賴、有生命週期、被 post processor 處理，而 `@Bean` 方法無法被動態註冊。指出**這正是 MyBatis 選它的原因**——Mapper 數量在編譯期未知。收在簡單判準：定義靜態已知用 `@Bean`，需要動態產生用 `FactoryBean`。

### Spring Data 的 Repository 是怎麼實作的？

**核心答案**：與 MyBatis 同樣的模式，但多了一層**查詢方法的解析**。掃描 `Repository` 介面 → 為每個註冊一個 `RepositoryFactoryBean` 的定義 → 實例化時建立代理。代理的方法呼叫會走幾條路徑：**繼承自 `CrudRepository` 的方法**（由 `SimpleJpaRepository` 這類基礎實作處理）、**標註 `@Query` 的方法**（直接用宣告的查詢）、以及**依方法名推導的方法**（`findByNameAndAgeGreaterThan` 被解析成查詢的 where 條件）。

**詳細解析**：方法名推導是這個設計最聰明也最有爭議的部分。它讓簡單查詢完全不必寫實作，但**方法名一長就難讀**（`findByFirstNameAndLastNameAndAgeGreaterThanOrderByCreatedAtDesc`），而且**推導失敗是在啟動時拋例外**——這是好的（早失敗），但錯誤訊息有時難以理解。實務上的界線是：簡單的一兩個條件用方法名推導，複雜的用 `@Query` 或 Criteria／QueryDSL。 另外要注意方法名推導對重構不友善——欄位改名時方法名不會被 IDE 自動更新，只會在啟動時才發現。這是「用字串或命名慣例表達邏輯」的共同代價，同樣的問題出現在 SpEL、Bean 名稱引用、以及各種基於註解的路由。

**面試回答方式**：給出與 MyBatis 相同的模式，並列出代理方法的三條路徑（基礎實作、`@Query`、方法名推導）。重點展開**方法名推導的爭議**：讓簡單查詢零實作，但方法名一長就難讀、且對重構不友善（欄位改名不會被 IDE 更新，只在啟動時才發現）。給出實務界線（簡單條件用推導、複雜的用 `@Query` 或 QueryDSL）。收在共同代價：**用字串或命名慣例表達邏輯**，SpEL 與註解路由都有同樣問題。

### 什麼時候該自己用這些擴充點？

**核心答案**：**很少**。多數需求可以用更簡單的方式滿足：需要多個相似的 bean 用 `@Bean` 方法加迴圈（在 `@Configuration` 裡回傳一個集合或用 `ObjectProvider`）、需要條件註冊用 `@Conditional`、需要修改既有 bean 用 `BeanPostProcessor`。只有在「bean 的數量或型別在編譯期完全未知」時，才真的需要 `BeanDefinitionRegistryPostProcessor`——也就是你在做一個框架或 starter，要為使用者的介面生成實作。

**詳細解析**：濫用這些擴充點的代價很具體：程式碼裡看不到 bean 的宣告（可理解性）、執行順序的細微問題（可靠性）、以及與其他框架擴充點的互動難以預測（相容性）。而且它們的錯誤通常在啟動時以難懂的方式失敗——循環引用、bean 已存在、型別不匹配，堆疊追蹤深達幾十層框架內部。判斷的問題是：這個動態性是本質的，還是我只是不想寫幾個 `@Bean` 方法？ 前者才值得付出這個複雜度。這與「不要為了少寫幾行而引入反射」是同一個判斷——動態機制的成本大部分不在寫的時候，而在後來讀與除錯的時候。

**面試回答方式**：明確回答「很少」，並給出更簡單的替代（`@Bean` 加集合、`@Conditional`、`BeanPostProcessor`），劃出真正需要的界線：bean 的數量或型別在編譯期完全未知，也就是在做框架或 starter。給出濫用的三個代價（可理解性、執行順序、與其他擴充點的互動）並指出錯誤通常在啟動時以難懂的方式失敗。收在判斷問題：這個動態性是本質的，還是我只是不想寫幾個 `@Bean` 方法，並連到「不要為了少寫幾行而引入反射」的同一判斷。

## 相關

- [[023-bean-post-processor.md]]
- [[032-factory-bean.md]]
