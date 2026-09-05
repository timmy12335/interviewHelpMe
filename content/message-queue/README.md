# 訊息佇列面試題

InterviewHelpMe 第 17 個內容類別，共 50 題，取材自 [JavaGuide](https://github.com/Snailclimb/JavaGuide) 的高效能章節與 [backend-interview](https://github.com/yongxinz/backend-interview) 的中介軟體章節，以 Kafka 為主軸，並涵蓋 RabbitMQ 與 RocketMQ 的模型差異。

## 這個類別的設計

`backend-engineering` 已經有兩題入門（訊息佇列的核心作用、投遞語義），所以這裡**直接從內部機制開始**，不重複解釋「什麼是訊息佇列」。001 到 013 是 Kafka 的機制與使用（架構、分區、副本、消費者群組、位移、效能、保留策略），014 到 016 是與其他中介的模型比較，017 到 024 是可靠性、維運與選型判斷。

第 025 到 050 題是第二批，往兩個方向深入：**Kafka 的內部機制與運維**（儲存佈局、controller 與 KRaft、副本同步、unclean 選舉、生產與消費調校、rebalance 協定、位移管理、擴縮容、跨機房、升級、故障恢復、安全），以及**設計與判斷**（schema 演進、大訊息、事件設計、分區鍵與傾斜、消費端交易邊界、重放與修復、流式處理、端到端精確一次、託管服務、成本、佇列與日誌兩種模型的根本差異、選型判斷，以及收束題「非同步的代價」）。

貫穿這個類別的主張是：**可靠性是三個環節各自的責任，而且終點一定是消費端冪等**。生產端、broker、消費端任何一段沒處理好都會丟訊息；而所有能防止遺失的機制都建立在重試之上，重試必然帶來重複——所以冪等不是可選項。017 與 018 兩題專門處理這條主線。

024 是「什麼時候不該用訊息佇列」。放在最後是因為前面 23 題講的都是怎麼用好它，但實務上更常見的錯誤是**在不需要的地方引入它**——這題把成本攤開來講。

## 檔案格式

與其他類別相同：每題一個 `NNN-slug.md`，frontmatter 對應 [schema.sql](../../backend/sql/schema.sql) 的 `question` 表（`category: message-queue`，`source: original`）。正文含：題目、核心答案、詳細解析、面試回答方式、講稿、常見追問（3 題）、相關。

新增題目請用 `node scripts/new-question.mjs message-queue <slug> "<標題>"` 產生骨架。寫完跑 `npm test` 驗證結構與交叉連結，跑 `node scripts/check-scripts.mjs message-queue` 驗證講稿品質。

## 題目清單

| # | 題目 | 難度 |
|---|------|------|
| 001 | Kafka 的整體架構：broker、topic、partition 與 replica | easy |
| 002 | 分區解決什麼問題，又帶來什麼問題 | medium |
| 003 | 生產者的分區策略與有序性保證 | medium |
| 004 | ISR、高水位與 leader epoch：副本怎麼保證不丟資料 | hard |
| 005 | 確認策略與最小同步副本數的取捨 | medium |
| 006 | 消費者群組與 rebalance：為什麼會停頓 | hard |
| 007 | 位移提交：自動、手動與重複消費 | medium |
| 008 | Kafka 為什麼快：順序寫、頁快取與零拷貝 | medium |
| 009 | 日誌保留與壓實：資料要留多久 | medium |
| 010 | 訊息積壓怎麼處理 | medium |
| 011 | 順序性保證：全域有序真的需要嗎 | medium |
| 012 | 冪等生產者與交易：精準一次的真實範圍 | hard |
| 013 | 死信佇列與重試策略 | easy |
| 014 | Kafka 與 RabbitMQ 的模型差異 | medium |
| 015 | RabbitMQ 的交換器與路由模型 | medium |
| 016 | RocketMQ 的事務訊息與本地訊息表 | medium |
| 017 | 訊息可靠性：三個環節都可能丟 | hard |
| 018 | 消費端冪等的具體做法 | medium |
| 019 | 延遲訊息與定時任務 | easy |
| 020 | Kafka 該監控哪些指標 | medium |
| 021 | 分區數怎麼定 | medium |
| 022 | Kafka 與 Pulsar：儲存與運算分離的差別 | hard |
| 023 | 用訊息佇列做資料同步：CDC 與 binlog | medium |
| 024 | 什麼時候不該用訊息佇列 | medium |
| 025 | Kafka 的儲存結構：segment、索引與檔案佈局 | medium |
| 026 | Controller 與中繼資料：從 ZooKeeper 到 KRaft | hard |
| 027 | 副本同步的細節：fetch 流程與同步落後 | hard |
| 028 | Unclean leader election：可用性與一致性的取捨 | medium |
| 029 | 生產者的批次、壓縮與吞吐調校 | medium |
| 030 | 消費者的並行模型：分區、執行緒與拉取 | medium |
| 031 | Rebalance 協定的演進：eager、cooperative 與靜態成員 | hard |
| 032 | 消費位移的儲存與重設 | medium |
| 033 | Kafka 的擴容與分區重分配 | medium |
| 034 | 跨機房與多叢集：MirrorMaker 與 stretch cluster | hard |
| 035 | Kafka 的升級與相容性 | medium |
| 036 | Broker 故障與資料恢復 | medium |
| 037 | Kafka 的安全：認證、授權與加密 | medium |
| 038 | 訊息格式與 schema 演進 | medium |
| 039 | 訊息大小與大訊息的處理 | medium |
| 040 | 事件的設計：事件、命令與狀態 | medium |
| 041 | 分區鍵的設計與資料傾斜 | medium |
| 042 | 消費端的批次處理與交易邊界 | medium |
| 043 | 訊息重放與資料修復 | medium |
| 044 | 訊息佇列上的流式處理 | medium |
| 045 | 端到端的精確一次：範圍與代價 | hard |
| 046 | 雲端託管的訊息服務：SQS、Pub/Sub 與 Kinesis | medium |
| 047 | 訊息佇列的成本 | medium |
| 048 | 佇列與日誌：兩種模型的根本差異 | hard |
| 049 | 訊息佇列的選型判斷 | medium |
| 050 | 訊息系統的整體判斷：非同步的代價 | hard |

難度分布：easy 3、medium 35、hard 12。
