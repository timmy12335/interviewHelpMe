# Java 核心語言面試題（樣板類別）

InterviewHelpMe 第二個內容樣板類別，共 50 題，涵蓋集合框架、字串、泛型、例外、反射、動態代理、序列化、以及 Record/Sealed/Optional/Stream 等現代 Java 特性。與 [java-concurrency](../java-concurrency/) 分開（併發相關題目歸在該類別）。

## 這個類別的設計

001 到 024 是最初的樣板，覆蓋面試最高頻的語言與集合基礎。025 到 050 是後續補充的第二批，刻意往三個方向延伸：**集合框架的其餘實作與選型**（有序集合、LinkedHashMap 與 LRU、fail-fast 迭代器、不可變集合工廠）、**函式式與現代語法的底層**（lambda 的 invokedynamic、Collector 的五個部件、模式比對、文字區塊、var 的邊界）、以及**工程判斷題**（例外設計、不可變物件與防禦性拷貝、金額精度、日期時區、模組系統、語言演進主線）。

第二批的取材偏向**判準而非定義**——「什麼時候該用」與「什麼時候不該用」，因為前 24 題已經覆蓋了「是什麼」。050 是收束題，把 Java 8 之後的演進整理成四條主線，與 001 的基礎契約前後呼應。

併發相關的題目一律歸在 [java-concurrency](../java-concurrency/)，JVM 內部機制歸在 [jvm](../jvm/)，本類別只在需要時交叉連結，不重複那些題目的細節。

## 檔案格式

與 [java-concurrency](../java-concurrency/README.md) 相同：每題一個 `NNN-slug.md`，frontmatter 對應 [schema.sql](../../backend/sql/schema.sql) 的 `question` 表（`category: java`）。正文固定含：題目、核心答案、詳細解析、面試回答方式、講稿、常見追問（3 題，各含核心答案／詳細解析／面試回答方式）、相關。

新增題目請用 `node scripts/new-question.mjs java <slug> "<標題>"` 產生骨架。寫完跑 `npm test` 驗證結構與交叉連結，跑 `node scripts/check-scripts.mjs java` 驗證講稿品質。

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
| 025 | Comparable 與 Comparator：排序契約與常見陷阱 | medium |
| 026 | TreeMap 與有序集合：紅黑樹的取捨 | medium |
| 027 | LinkedHashMap 與 LRU 快取的實作 | medium |
| 028 | fail-fast 迭代器與 ConcurrentModificationException | medium |
| 029 | Arrays.asList、List.of 與不可變檢視的差別 | easy |
| 030 | HashSet、LinkedHashSet 與 TreeSet 的選型 | easy |
| 031 | Java 的參數傳遞：值傳遞還是引用傳遞 | easy |
| 032 | 抽象類別與介面：JDK 8 之後怎麼選 | easy |
| 033 | 內部類別、靜態巢狀類別與匿名類別 | medium |
| 034 | Lambda 的底層：invokedynamic 與函式介面 | hard |
| 035 | java.util.function 的設計與自訂函式介面 | medium |
| 036 | Collector 的組成與自訂收集器 | medium |
| 037 | parallelStream 什麼時候真的比較快 | hard |
| 038 | 位元組流、字元流與緩衝為什麼必要 | medium |
| 039 | 零拷貝在 Java 裡的實作與適用場景 | hard |
| 040 | File 與 NIO.2：路徑、檔案操作與遍歷 | easy |
| 041 | 文字區塊與 String 的現代方法 | easy |
| 042 | switch 表達式與模式比對 | medium |
| 043 | var 型別推斷的邊界 | easy |
| 044 | 例外設計：什麼時候包裝、什麼時候往上拋 | medium |
| 045 | 列舉的實作原理與進階用法 | medium |
| 046 | 不可變物件的設計與防禦性拷貝 | medium |
| 047 | Java 模組系統（JPMS）解決了什麼問題 | hard |
| 048 | java.time 與舊日期 API 的問題 | medium |
| 049 | BigDecimal 與浮點數精度 | medium |
| 050 | 從 Java 8 到 21：語言演進的主線 | hard |

難度分布：easy 11、medium 27、hard 12（鐘型分布，中等題最多）。
