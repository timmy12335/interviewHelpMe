# Spring 面試題（樣板類別）

InterviewHelpMe 第四個內容類別，共 24 題，涵蓋 IoC/DI、AOP、Bean 生命週期與作用域、循環依賴三級快取、宣告式交易（原理/失效/傳播）、Spring MVC 請求流程、Spring Boot 自動配置與 starter 機制、Bean 執行緒安全、設計模式、事件機制、擴展點（BeanPostProcessor）與條件裝配。

## 檔案格式

與其他類別相同：每題一個 `NNN-slug.md`，frontmatter 對應 [schema.sql](../../backend/sql/schema.sql) 的 `question` 表（`category: spring`）。正文含：題目、核心答案、詳細解析、面試回答方式、常見追問（3 題，各含核心答案／詳細解析／面試回答方式）、相關。部分題目透過 `[[../category/file.md]]` 交叉連結到 Java 核心、JVM、Java 併發類別。

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

難度分布：easy 3、medium 15、hard 6（鐘型分布，中等題最多）。

## 進度

9 大類第 4 類。已完成：Java 核心、Java 併發、JVM、Spring。待做：Redis、資料庫、後端工程、系統設計、AI 大模型、AI Agent。
