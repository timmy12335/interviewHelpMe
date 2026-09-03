# Spring 面試題（樣板類別）

InterviewHelpMe 第四個內容類別，共 50 題，涵蓋 IoC/DI、AOP、Bean 生命週期與作用域、循環依賴三級快取、宣告式交易（原理/失效/傳播）、Spring MVC 請求流程、Spring Boot 自動配置與 starter 機制、Bean 執行緒安全、設計模式、事件機制、擴展點（BeanPostProcessor）與條件裝配。

## 這個類別的設計

001 到 024 是最初的樣板，覆蓋容器、AOP、交易、MVC、自動配置這些最高頻的機制題。025 到 050 是後續補充的第二批，往四個方向延伸：**組態與可觀測性**（設定優先序、ConfigurationProperties、Actuator 與健康檢查、自訂 starter）、**容器的底層擴充點**（BeanDefinition 的動態註冊、FactoryBean、SPI 機制、型別轉換）、**Web 與安全**（參數解析與訊息轉換器、WebFlux 的適用邊界、Security 的過濾器鏈與方法級授權、全域例外處理），以及**工程實務**（JPA 的 N+1、快取抽象的陷阱、Async 與排程、測試切片與上下文快取、啟動流程、優雅關閉、AOT、反模式）。

第二批的重心是**判準與失敗模式**——028 的重點不是 Actuator 有哪些端點，而是「liveness 絕對不能包含外部依賴」以及違反它會怎麼把下游的短暫故障放大成全站中斷；042 的重點是「Spring 的快取抽象不管過期」；049 收集了六個常見反模式並歸納出共同根源。050 是收束題，從 Spring 的擴充點歸納出框架設計的五條原則。

Java 語言本身的題目歸在 [java](../java/)，併發歸在 [java-concurrency](../java-concurrency/)，JVM 內部機制歸在 [jvm](../jvm/)，本類別只在需要時交叉連結。

## 檔案格式

與其他類別相同：每題一個 `NNN-slug.md`，frontmatter 對應 [schema.sql](../../backend/sql/schema.sql) 的 `question` 表（`category: spring`）。正文含：題目、核心答案、詳細解析、面試回答方式、講稿、常見追問（3 題，各含核心答案／詳細解析／面試回答方式）、相關。部分題目透過 `[[../category/file.md]]` 交叉連結到 Java 核心、JVM、Java 併發類別。

## 題目清單

| # | 題目 | 難度 |
|---|------|------|
| 001 | IoC 與 DI 是什麼 | medium |
| 002 | Spring Bean 的生命週期 | medium |
| 003 | Spring Bean 的作用域 | easy |
| 004 | 循環依賴與三級快取 | hard |
| 005 | @Autowired 與 @Resource 的差異 | easy |
| 006 | AOP 的概念與底層實作 | medium |
| 007 | AOP 的通知類型與執行順序 | medium |
| 008 | @Transactional 的實作原理 | medium |
| 009 | @Transactional 失效的常見情境 | hard |
| 010 | 交易的傳播行為 | hard |
| 011 | Spring MVC 的請求處理流程 | medium |
| 012 | DispatcherServlet 與核心組件 | medium |
| 013 | Spring Boot 自動配置原理 | hard |
| 014 | @SpringBootApplication 註解剖析 | medium |
| 015 | Spring Boot Starter 機制 | medium |
| 016 | Spring 單例 Bean 是否執行緒安全 | medium |
| 017 | BeanFactory 與 ApplicationContext 的區別 | medium |
| 018 | Spring 中運用的設計模式 | medium |
| 019 | @Component/@Service/@Repository/@Controller 的區別 | easy |
| 020 | @Configuration 的 full 模式與 lite 模式 | hard |
| 021 | Spring 的事件機制 | medium |
| 022 | 攔截器與過濾器的區別 | medium |
| 023 | BeanPostProcessor 與 BeanFactoryPostProcessor | hard |
| 024 | @Conditional 條件裝配與 Profile | medium |
| 025 | Spring Boot 3 與 Jakarta EE 遷移 | medium |
| 026 | 組態外部化：Profile 與設定優先序 | medium |
| 027 | ConfigurationProperties 與 Value 的取捨 | easy |
| 028 | Actuator 與 Spring 應用的可觀測性 | medium |
| 029 | 自訂 starter 的設計 | medium |
| 030 | Spring 的資源與環境抽象 | easy |
| 031 | Bean 定義的註冊與 BeanDefinitionRegistryPostProcessor | hard |
| 032 | FactoryBean 與 Bean 方法的差別 | medium |
| 033 | Spring 的 SPI 機制與擴充點註冊 | medium |
| 034 | Spring 的型別轉換與資料綁定 | medium |
| 035 | Bean Validation 與分組驗證 | easy |
| 036 | 全域例外處理與錯誤回應設計 | medium |
| 037 | Spring MVC 的參數解析與訊息轉換器 | medium |
| 038 | WebFlux 與反應式堆疊的適用邊界 | hard |
| 039 | Spring Security 的過濾器鏈 | hard |
| 040 | 方法級授權與權限模型設計 | medium |
| 041 | Spring Data JPA 的查詢與 N+1 問題 | medium |
| 042 | Spring 的快取抽象與 Cacheable 的陷阱 | medium |
| 043 | Async 與 TaskExecutor 的正確使用 | medium |
| 044 | Scheduled 與分散式排程 | medium |
| 045 | Spring 的測試支援與上下文快取 | medium |
| 046 | Spring Boot 的啟動流程 | hard |
| 047 | 優雅關閉與生命週期回呼 | medium |
| 048 | Spring 的 AOT 與原生映像檔支援 | hard |
| 049 | Spring 應用的常見反模式 | medium |
| 050 | 從 Spring 的設計看框架的擴充點設計 | hard |

難度分布：easy 6、medium 32、hard 12（鐘型分布，中等題最多）。
