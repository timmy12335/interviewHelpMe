---
id: spring-008
category: spring
slug: transactional-principle
title: "@Transactional 的實作原理"
difficulty: medium
tags: [Transactional, 交易, AOP, 宣告式交易]
source: original
---

# 題目

`@Transactional` 是怎麼實現的？宣告式交易的底層原理是什麼？

## 核心答案

`@Transactional` 是 Spring 的「宣告式交易」——透過 AOP 動態代理實現。當一個類別/方法標了 `@Transactional`，Spring 會為它生成一個代理物件，代理在呼叫目標方法時，用一個「交易攔截器」在方法前後織入交易管理邏輯——方法執行前開啟交易（獲取資料庫連線、關閉自動提交）、方法正常返回後提交交易、方法拋出異常時回滾交易。底層依賴 `PlatformTransactionManager`（交易管理器）來實際執行開啟/提交/回滾操作，並用 `ThreadLocal` 綁定當前執行緒的資料庫連線，保證同一個交易內的所有操作用同一個連線。

## 詳細解析

**宣告式 vs 程式式交易**：

- 程式式交易：手動寫程式碼控制交易（`transactionManager.commit()`/`rollback()`），侵入業務程式碼、繁瑣。
- 宣告式交易（`@Transactional`）：只需在方法/類別上加註解「宣告」它需要交易，具體的開啟/提交/回滾由 Spring 透過 AOP 自動處理，業務程式碼保持乾淨。這是 AOP 的經典應用（交易是典型的橫切關注點）。

**@Transactional 的執行流程**：

1. Spring 為標了 `@Transactional` 的 Bean 生成代理（透過 AOP）。
2. 呼叫方呼叫方法時，實際呼叫的是代理，代理中的「交易攔截器（TransactionInterceptor）」介入。
3. 攔截器在目標方法執行「前」：透過 `PlatformTransactionManager` 開啟交易——獲取資料庫連線、把連線的自動提交關閉（`autoCommit=false`）、並把連線綁定到當前執行緒的 `ThreadLocal`（保證這個交易內後續的所有 DB 操作都用這條連線）。
4. 執行目標方法（業務邏輯，中間的 DB 操作都用綁定的連線）。
5. 方法「正常返回」：攔截器提交交易（`commit`）。
6. 方法「拋出異常」：攔截器根據回滾規則決定是否回滾（`rollback`）。
7. 最後清理——解除連線與 ThreadLocal 的綁定、釋放連線。

**關鍵組件**：

- **PlatformTransactionManager**：交易管理器介面，是實際執行交易操作的抽象。不同的資料存取技術有不同實作（如 `DataSourceTransactionManager` 用於 JDBC/MyBatis、`JpaTransactionManager` 用於 JPA）。
- **ThreadLocal 綁定連線**：Spring 用 `ThreadLocal`（透過 `TransactionSynchronizationManager`）把資料庫連線綁定到當前執行緒，保證同一個交易的所有操作共用同一條連線（交易必須在同一條連線上才有意義）。

## 面試回答方式

先講「宣告式交易 = @Transactional + AOP」這個本質——它是 AOP 的經典應用，把交易這個橫切關注點抽離。接著講執行流程——代理攔截、方法前開啟交易、正常返回提交、異常回滾。務必點出兩個關鍵——「PlatformTransactionManager 負責實際的交易操作」和「用 ThreadLocal 綁定連線保證同一交易用同一連線」。能把 @Transactional 連結到 AOP 動態代理（前面的題），展現你理解它不是「魔法註解」而是建立在 AOP 之上的機制，這也為後面「@Transactional 失效」題鋪墊（很多失效都源於「代理沒生效」）。

## 常見追問

### @Transactional 預設只在什麼異常下回滾？為什麼？

**核心答案**：`@Transactional` 預設只在遇到「執行期異常（RuntimeException）」和「Error」時才回滾，遇到「受檢異常（Checked Exception，如 IOException、SQLException）」預設「不回滾」（會正常提交）。這個設計源於 Java 的異常分類慣例——RuntimeException 通常代表「程式的意外錯誤/bug」（應該回滾），而受檢異常通常代表「可預期的、業務上可能發生並需要處理的情況」（Spring 保守地認為你可能想在受檢異常時仍提交）。可以透過 `@Transactional(rollbackFor = Exception.class)` 明確指定「所有異常都回滾」來覆蓋這個預設行為。

**詳細解析**：這是 `@Transactional` 極其容易踩的坑——很多人以為「只要方法拋異常交易就會回滾」，但實際上受檢異常預設不回滾。這個預設行為的理由是 Spring 遵循了一個慣例——RuntimeException 是「非預期的錯誤」（如空指標、非法狀態），發生了就該回滾；受檢異常是「預期內的、你被強制處理的情況」（如檔案不存在、網路問題），Spring 保守地假設「既然這是你預期會發生的情況，你可能有自己的處理邏輯、不一定想回滾」。但這個預設常常不符合實際需求——大多數時候，只要業務方法拋了任何異常（包括受檢異常），我們都希望回滾。所以實務中非常常見的做法是明確指定 `@Transactional(rollbackFor = Exception.class)`（所有異常都回滾），避免「拋了受檢異常結果交易卻提交了、資料髒了」的坑。這也是程式碼審查時要特別注意的點。理解這個預設行為和它的坑，是正確使用 @Transactional 的關鍵。

**面試回答方式**：明確講出「預設只在 RuntimeException 和 Error 回滾、受檢異常預設不回滾」，並解釋原因（Java 異常分類慣例、Spring 保守假設受檢異常你可能想提交）。強調這是常見坑——「很多人以為拋異常就回滾、實際受檢異常不回滾、實務常用 rollbackFor = Exception.class 覆蓋」。能點出這是程式碼審查要注意的點，展現你有實戰經驗。

### 為什麼交易必須綁定同一條資料庫連線？Spring 怎麼保證？

**核心答案**：因為資料庫交易是「連線層級」的概念——一個交易的開啟（begin）、其中的所有 SQL 操作、以及最終的提交/回滾，必須在「同一條資料庫連線」上進行才有意義（不同連線是不同的交易上下文，在連線 A 開的交易無法提交連線 B 上的操作）。Spring 用 `ThreadLocal`（透過 `TransactionSynchronizationManager`）把「當前交易使用的連線」綁定到當前執行緒，這樣同一個執行緒內、同一個交易中的所有資料存取操作（不管在哪個方法、哪個 DAO），去獲取連線時都會拿到 ThreadLocal 裡綁定的這同一條連線，保證它們都在同一個交易裡。

**詳細解析**：這是理解 @Transactional 如何讓「散落在不同方法/DAO 的多個 DB 操作」處於同一個交易的關鍵。資料庫交易的本質——`BEGIN` 一個交易後，這條連線上的所有操作都屬於這個交易，直到 `COMMIT`/`ROLLBACK`。所以要讓 Service 方法裡呼叫的多個 DAO 操作（可能 DAO1.insert、DAO2.update）在同一個交易，就必須讓它們都用同一條連線。Spring 的解法是 ThreadLocal 綁定——交易開始時，把獲取的連線放進 ThreadLocal；之後 MyBatis/JdbcTemplate 等在執行 SQL 前，會先透過 Spring 的 `DataSourceUtils.getConnection()` 檢查「當前執行緒的 ThreadLocal 裡有沒有已綁定的交易連線」，有就用那條（而不是從連線池新拿一條），這樣所有操作自然都在同一條連線、同一個交易裡。交易結束時解除綁定、歸還連線。這也解釋了為什麼「交易和執行緒綁定」——如果一個 @Transactional 方法內部把工作丟到另一個執行緒去做（如用 @Async 或線程池），那個新執行緒沒有綁定的交易連線，它的 DB 操作就不在原交易裡了（這是一個常見的交易失效場景）。理解 ThreadLocal 綁定連線，能把交易、連線、執行緒的關係串起來。

**面試回答方式**：講出「交易是連線層級的、同一交易的所有操作必須在同一條連線上、Spring 用 ThreadLocal 綁定連線讓同執行緒同交易的操作都拿到同一條連線」。能延伸「所以把工作丟到別的執行緒（@Async）會導致新執行緒不在原交易裡、交易失效」，展現你把交易和執行緒綁定的關係理解透徹，也連結到失效場景。

### 宣告式交易和程式式交易各適合什麼場景？

**核心答案**：宣告式交易（`@Transactional`）適合「絕大多數常規場景」——只需加註解、業務程式碼乾淨、交易邊界清晰（通常就是一個 Service 方法），是首選。程式式交易（用 `TransactionTemplate` 或直接操作 `PlatformTransactionManager`）適合「需要精細控制交易邊界」的少數場景——例如一個方法裡只有一小段需要交易（不想整個方法都在交易裡）、或需要根據執行期條件動態決定交易邊界、或需要在同一方法裡精確控制多個小交易。程式式交易更靈活但侵入程式碼，宣告式更簡潔但交易邊界是「整個方法」。

**詳細解析**：兩者的取捨是「簡潔 vs 精細控制」。宣告式交易的優勢是「無侵入、宣告即用」——把 `@Transactional` 標在方法上，整個方法就是一個交易，非常省事，適合「一個 Service 方法就是一個業務單元、整體要麼成功要麼失敗」的典型場景（這佔了絕大多數）。它的局限是「交易邊界 = 方法邊界」不夠靈活——如果一個方法裡只有中間幾行需要交易、前後還有耗時的非 DB 操作（如呼叫外部 API），用 @Transactional 會讓整個方法（包括那些耗時操作）都持有資料庫連線和交易，拉長交易時間、佔用連線（這是效能問題）。這時程式式交易更合適——用 `TransactionTemplate.execute()` 把「真正需要交易的那幾行」包起來，交易邊界精確控制到最小範圍，前後的非 DB 操作不佔交易。所以原則是——常規場景（整個方法一個交易）用宣告式，需要「交易邊界小於方法、或動態控制邊界」時用程式式。理解這個取捨，展現你不只會用 @Transactional，還知道它的局限和何時該用程式式交易。

**面試回答方式**：講出「宣告式（@Transactional）簡潔無侵入、適合絕大多數常規場景（一個方法一個交易）；程式式（TransactionTemplate）靈活、適合需要精細控制交易邊界（如只包方法中的幾行、避免耗時操作佔交易）」。能舉「方法裡有呼叫外部 API 的耗時操作、用程式式交易把交易邊界縮到最小」的例子，展現你理解宣告式的局限和程式式的價值。

## 相關

- [[006-aop-concept.md]]
- [[009-transactional-pitfalls.md]]
- [[010-transaction-propagation.md]]
