# JVM 面試題（樣板類別）

InterviewHelpMe 第三個內容類別，共 24 題，涵蓋 JVM 記憶體結構、分代與 GC（演算法、收集器 G1/ZGC）、類別載入與雙親委派、物件建立與記憶體佈局、四種引用、JIT/逃逸分析/TLAB、安全點與 STW、調優與 OOM 排查。

## 檔案格式

與其他類別相同：每題一個 `NNN-slug.md`，frontmatter 對應 [schema.sql](../../backend/sql/schema.sql) 的 `question` 表（`category: jvm`）。正文含：題目、核心答案、詳細解析、面試回答方式、常見追問（3 題，各含核心答案／詳細解析／面試回答方式）、相關。部分題目透過 `[[../category/file.md]]` 交叉連結到 Java 核心與 Java 併發類別。

## 題目清單

| # | 題目 | 難度 |
|---|------|------|
| 001 | JVM 執行時記憶體結構 | medium |
| 002 | 堆的分代結構與物件晉升 | medium |
| 003 | GC Roots 與可達性分析 | medium |
| 004 | 垃圾回收演算法（標記清除／複製／標記整理） | medium |
| 005 | 垃圾收集器的演進（Serial/Parallel/CMS/G1/ZGC） | hard |
| 006 | G1 收集器的原理與回收流程 | hard |
| 007 | 類別載入的過程（載入、連結、初始化） | medium |
| 008 | 雙親委派模型 | medium |
| 009 | 類別載入器的種類與自訂類別載入器 | medium |
| 010 | 物件的建立過程 | medium |
| 011 | 物件的記憶體佈局 | hard |
| 012 | 四種引用（強、軟、弱、虛） | medium |
| 013 | 常見的 JVM 調優參數 | medium |
| 014 | GC 與記憶體問題的排查工具與方法 | medium |
| 015 | 記憶體洩漏與記憶體溢位 | medium |
| 016 | StackOverflowError 與虛擬機器棧 | easy |
| 017 | 元空間與永久代 | medium |
| 018 | JIT 即時編譯 | hard |
| 019 | 逃逸分析與棧上分配、鎖消除 | hard |
| 020 | TLAB（執行緒本地分配緩衝） | hard |
| 021 | 安全點（Safepoint）與 Stop-The-World | hard |
| 022 | 字串常數池與 intern() 的行為 | medium |
| 023 | 位元組碼與執行引擎 | medium |
| 024 | OutOfMemoryError 的種類與成因 | medium |

難度分布：easy 1、medium 16、hard 7（JVM 主題整體偏深，入門題較少）。

## 進度

9 大類第 3 類。已完成：Java 核心、Java 併發、JVM。待做：Spring、Redis、資料庫、後端工程、系統設計、AI 大模型、AI Agent。
