---
id: java-concurrency-011
category: java-concurrency
slug: why-avoid-executors-factory-methods
title: 為什麼阿里巴巴 Java 開發手冊建議不要用 Executors 建立執行緒池
difficulty: medium
tags: [執行緒池, Executors, OOM]
source: original
---

# 題目

阿里巴巴 Java 開發手冊建議不要直接用 `Executors` 的工廠方法建立執行緒池（Thread Pool），而是用 `ThreadPoolExecutor` 建構子。為什麼？

## 核心答案

`Executors` 的工廠方法（`newFixedThreadPool`、`newCachedThreadPool`、`newSingleThreadExecutor` 等）內部預設使用了無界佇列或無限制的最大執行緒數，容易在高負載下堆積過多任務或執行緒，導致記憶體溢位（OOM）。直接用 `ThreadPoolExecutor` 建構子能強制開發者顯式思考並設定每個參數，尤其是佇列容量的上限。

## 詳細解析

**逐一分析常見工廠方法的問題**：

- **`newFixedThreadPool(n)`**：`corePoolSize = maximumPoolSize = n`，但佇列用的是 `LinkedBlockingQueue`（預設容量 `Integer.MAX_VALUE`，等同無界）。任務提交速度長期大於處理速度時，佇列會無限堆積，最終耗盡記憶體。
- **`newCachedThreadPool()`**：佇列用 `SynchronousQueue`，但 `maximumPoolSize` 是 `Integer.MAX_VALUE`，執行緒數量沒有上限，任務提交過快會不斷建立新執行緒，可能耗盡系統資源。
- **`newSingleThreadExecutor()`**：本質上是 `newFixedThreadPool(1)`，一樣有無界佇列的問題。
- **`newScheduledThreadPool(n)`**：底層用 `DelayedWorkQueue`，理論上也是無界的，同樣有堆積風險。

**正確做法**：直接使用 `new ThreadPoolExecutor(...)`，明確指定一個**有界佇列**與合理的 `maximumPoolSize`，並搭配自訂拒絕策略（Rejection Policy）。

**面試延伸**：這題本質上考的是「防禦性程式設計」與「快速失敗（fail-fast）」思維——與其讓問題累積到系統資源耗盡才總爆發，不如在資源使用超出預期時就立即、明確地暴露問題。

## 面試回答方式

這題的標準結構是「先講內建工廠方法各自的隱藏地雷，再講正確做法」。不需要四個工廠方法都詳細展開，挑 `newFixedThreadPool` 和 `newCachedThreadPool` 這兩個最常被誤用的講清楚（分別是無界佇列、無界執行緒數），就足以說明問題本質。最關鍵的加分點是最後把這題提升到「快速失敗（fail-fast）設計原則」的高度——不要只回答「因為手冊這樣規定」，而是解釋「為什麼這樣規定是合理的」，展現你理解規範背後的工程原理，而不只是記得規範條文。

## 常見追問

### 如果一定要用無界佇列，可以搭配什麼機制降低 OOM 風險？

**核心答案**：可以透過監控佇列長度並設定告警閾值提早發現積壓、限制單一任務攜帶的資料量避免大物件佔用過多記憶體、以及在應用層額外加一層限流（Rate Limiting）（如 `Semaphore`）控制提交速度，從源頭減少湧入佇列的任務量。

**詳細解析**：如果業務上真的有「絕對不能拒絕任何任務」的需求（例如某些必須保證不遺失的關鍵事件），導致無法接受有界佇列搭配拒絕策略丟棄任務，這時可以退而求其次，用「監控 + 限流」的組合拳降低風險：定期採集 `getQueue().size()` 並在超過閾值時觸發告警，讓人為介入擴容或排查根因；確保放入佇列的任務本身盡量輕量（例如只放 ID 或必要參數，而非整個大物件），減少單一任務的記憶體佔用；在任務提交的入口處，用 `Semaphore` 或類似的限流機制控制「同時能有多少任務進入待處理狀態」，把壓力提前擋在佇列之外而不是任其無限堆積。但需要說明的是，這些都是緩解手段，無法從根本上消除無界佇列的 OOM 風險，最徹底的做法仍然是改用有界佇列並明確處理拒絕情境。

**面試回答方式**：先承認「這些都是緩解而非根治」，再具體講出「監控告警」「任務輕量化」「入口限流」三個緩解手段，展現你在權衡業務需求與技術風險時能提出務實的折衷方案，而不是非黑即白地說「無界佇列絕對不能用」。

### 業務系統中，執行緒池的核心/最大執行緒數該如何估算？

**核心答案**：CPU 密集型任務建議設定為 `CPU 核心數 + 1`（避免任務間偶爾的頁面錯誤造成空等，同時避免過多執行緒導致頻繁上下文切換）；I/O 密集型任務可以設定得更高，常見經驗公式是 `CPU 核心數 × (1 + 平均等待時間/平均運算時間)`。

**詳細解析**：CPU 密集型任務（例如複雜運算、資料壓縮）幾乎不會阻塞等待，執行緒數超過 CPU 核心數只會增加無謂的上下文切換開銷，因此執行緒數接近核心數是最有效率的；I/O 密集型任務（例如呼叫下游 API、資料庫查詢）大部分時間在等待 I/O 完成而非真正佔用 CPU，此時可以讓執行緒數遠超過核心數，因為多出來的執行緒能在其他執行緒等待 I/O 時佔用 CPU 做事。這些公式只是「起點」，實際生產環境更可靠的做法是先用經驗公式抓一個初始值，然後透過壓測（觀察 CPU 使用率、任務排隊時間、吞吐量）逐步調校到符合實際負載特徵的數值，並保留監控機制持續觀察是否需要動態調整。

**面試回答方式**：先給出公式，但務必補充「這只是起點，實際要靠壓測調校」，避免給人「背了一個公式就以為能解決所有場景」的印象；如果對方追問虛擬執行緒相關話題，可以連結到 [[024-virtual-threads-suitable-scope.md]] 說明 I/O 密集場景現在有了新的選擇。

### Spring 的 @Async 預設使用的執行緒池有這個問題嗎？

**核心答案**：有。Spring Boot 若未額外設定，`@Async` 預設使用 `SimpleAsyncTaskExecutor`，這個執行器**每次呼叫都會建立一個新執行緒**，完全不做執行緒重複使用，也沒有上限控制，在高並發下同樣可能因為建立過多執行緒而導致資源耗盡，甚至比 `Executors` 的問題更直接。

**詳細解析**：`SimpleAsyncTaskExecutor` 顧名思義是一個「簡單」的實作，它不維護執行緒池，每次提交任務都直接 `new Thread` 執行，執行緒用完即丟，完全沒有 `corePoolSize`/`maximumPoolSize`/佇列的概念。這在低頻率呼叫的場景下沒有明顯問題，但如果 `@Async` 方法被高頻呼叫，會導致系統不斷建立新執行緒，很快就會耗盡系統資源。正確做法是在設定類別中自訂並註冊一個 `ThreadPoolTaskExecutor`（Spring 對 `ThreadPoolExecutor` 的封裝），明確設定核心/最大執行緒數與有界佇列，並透過 `@Async("自訂執行器名稱")` 指定使用這個執行器，而不是依賴預設值。

**面試回答方式**：這題如果面試官是做 Spring 生態系統的團隊會特別喜歡問，因為它直接連結「理論知識」與「框架預設值的實務陷阱」。回答時明確點出 `SimpleAsyncTaskExecutor` 這個具體類別名稱，並給出正確做法（自訂 `ThreadPoolTaskExecutor`），會比只說「Spring 的 `@Async` 也可能有類似問題」更有說服力。

## 相關

- [[009-threadpoolexecutor-core-params.md]]
- [[010-thread-pool-rejection-policy.md]]
