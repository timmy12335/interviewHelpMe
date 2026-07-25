# Java 核心語言面試題（樣板類別）

InterviewHelpMe 第二個內容樣板類別，共 24 題，涵蓋集合框架、字串、泛型、例外、反射、動態代理、序列化、以及 Record/Sealed/Optional/Stream 等現代 Java 特性。與 [java-concurrency](../java-concurrency/) 分開（併發相關題目歸在該類別）。

## 檔案格式

與 [java-concurrency](../java-concurrency/README.md) 相同：每題一個 `NNN-slug.md`，frontmatter 對應 [schema.sql](../../backend/sql/schema.sql) 的 `question` 表（`category: java`）。正文固定含：題目、核心答案、詳細解析、面試回答方式、常見追問（3 題，各含核心答案／詳細解析／面試回答方式）、相關。

## 題目清單

| # | 題目 | 難度 |
|---|------|------|
| 001 | equals 與 hashCode 的契約 | medium |
| 002 | == 與 equals() 的差異 | easy |
| 003 | String 的不可變性與字串常數池 | medium |
| 004 | String、StringBuilder、StringBuffer 的差異 | easy |
| 005 | HashMap 的底層原理（陣列 + 鏈結串列 + 紅黑樹） | hard |
| 006 | HashMap 的擴容機制與為什麼容量是 2 的次方 | hard |
| 007 | ArrayList 與 LinkedList 的差異 | easy |
| 008 | 泛型與型別擦除（Type Erasure） | hard |
| 009 | 泛型通配符與 PECS 原則 | hard |
| 010 | 自動裝箱拆箱與 Integer 快取 | medium |
| 011 | Java 例外體系（Checked vs Unchecked） | medium |
| 012 | try-with-resources 與資源管理 | medium |
| 013 | 反射（Reflection）的原理與應用 | medium |
| 014 | 動態代理（JDK Proxy vs CGLIB） | hard |
| 015 | 註解（Annotation）與元註解 | medium |
| 016 | BIO、NIO、AIO 的差異 | hard |
| 017 | 序列化與 serialVersionUID | medium |
| 018 | 深拷貝與淺拷貝 | medium |
| 019 | final、finally、finalize 的差異 | easy |
| 020 | 介面的預設方法與多重繼承衝突 | medium |
| 021 | Record 類別（JDK 16） | medium |
| 022 | 密封類別 Sealed Class（JDK 17） | medium |
| 023 | Optional 的正確使用 | medium |
| 024 | Stream API 與惰性求值 | hard |

難度分布：easy 4、medium 13、hard 7（鐘型分布，中等題最多）。

## 尚待確認

- 這批 Java 核心內容是否符合預期？確認後，其餘類別（Spring、JVM、Redis、資料庫、後端工程、系統設計、AI 大模型、AI Agent）將採用同一套格式繼續擴充。
