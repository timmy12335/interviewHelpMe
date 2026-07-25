---
id: java-concurrency-021
category: java-concurrency
slug: thread-lifecycle-states
title: Java 執行緒的生命週期與狀態轉換
difficulty: easy
tags: [執行緒狀態, Thread.State]
source: original
---

# 題目

Java 執行緒有哪些狀態？`BLOCKED` 和 `WAITING` 有什麼區別？

## 核心答案

`Thread.State` 定義了 6 種狀態：`NEW`、`RUNNABLE`、`BLOCKED`（等待取得 `synchronized` 鎖）、`WAITING`（無限期等待，需要其他執行緒明確喚醒）、`TIMED_WAITING`（限時等待）、`TERMINATED`。`BLOCKED` 專指「等待進入 `synchronized` 臨界區」，`WAITING`/`TIMED_WAITING` 則涵蓋 `wait()`、`join()`、`LockSupport.park()` 等更廣泛的主動等待場景。

## 詳細解析

**六種狀態**：`NEW`（尚未啟動）、`RUNNABLE`（涵蓋作業系統的就緒與執行中）、`BLOCKED`（等待 synchronized 鎖）、`WAITING`（`wait()`、`join()`、`park()` 無逾時版本）、`TIMED_WAITING`（帶逾時參數的版本）、`TERMINATED`（已結束）。

**`BLOCKED` 與 `WAITING` 的核心差異**：觸發原因不同（`BLOCKED` 只在競爭 synchronized 鎖失敗時出現，`WAITING` 是主動呼叫等待方法）；能否被中斷不同（`BLOCKED` 無法回應 interrupt，`WAITING` 可以）。

**排查應用**：分析 `jstack` 堆疊時，大量 `BLOCKED` 通常代表鎖競爭激烈或死鎖；長時間 `WAITING`/`TIMED_WAITING` 則要看在等待什麼條件。

## 面試回答方式

這是基礎題，適合用來快速展現你對 Java 執行緒模型的掌握是否扎實。六個狀態不需要花太多時間逐一解釋，重點應該放在「`BLOCKED` 和 `WAITING` 的差異」這個核心考點上，用「觸發原因」和「能否中斷」兩個維度對比，講清楚就足夠。如果面試官接著問排查相關問題，順勢提到「這些狀態在 `jstack` 排查中怎麼解讀」，能自然延伸到更實務的話題，展現你不只知道理論定義，也知道怎麼在真實場景中運用這些知識。

## 常見追問

### 為什麼 Thread.State 沒有直接對應作業系統的就緒與執行中兩種狀態？

**核心答案**：因為 Java 執行緒模型是建立在作業系統執行緒之上的一層抽象，JVM 本身並不直接參與 CPU 排程的細節決策（這完全交給作業系統排程器處理），從 JVM 的角度來看，一個執行緒「可以執行」和「正在被 CPU 執行」在 Java 語言層級並不需要區分，兩者統一歸類為 `RUNNABLE` 就已經足夠表達「這個執行緒沒有在等待任何東西，隨時可以被排程執行」這個語意。

**詳細解析**：如果 Java 語言層級硬要區分「就緒」和「執行中」，會需要 JVM 持續且精確地追蹤作業系統排程器的即時決策，這不僅增加了 JVM 實作的複雜度，對開發者來說這個區分在絕大多數應用開發場景中也沒有實際意義——開發者關心的通常是「這個執行緒是不是卡住了、在等什麼」，而不是「這個執行緒此時此刻有沒有真的佔用 CPU 核心」。這也反映了 Java 執行緒模型的設計哲學：把底層排程細節完全交給作業系統，Java 語言層級只需要提供對開發者有意義的抽象狀態。

**面試回答方式**：用「Java 執行緒模型是建立在 OS 執行緒之上的抽象，排程細節交給 OS，Java 層級不需要也不應該重複追蹤」這個設計哲學角度回答，會比單純說「因為 Java 沒有實作那麼細」更有說服力。

### Thread.sleep() 和 Object.wait() 有什麼本質差異？

**核心答案**：`Thread.sleep()` 不會釋放目前持有的任何鎖，純粹讓當前執行緒暫停執行一段時間；`Object.wait()` 必須在持有鎖的情況下呼叫，且呼叫後會**釋放**這個鎖，讓其他執行緒有機會取得鎖繼續執行，直到被 `notify`/`notifyAll` 喚醒或逾時才會嘗試重新取得鎖並恢復執行。

**詳細解析**：這個差異在實務上非常重要：如果在持有鎖的情況下呼叫 `Thread.sleep()`，這段睡眠時間內鎖仍然被目前執行緒佔用，其他所有需要這把鎖的執行緒都必須乾等，這在需要協調多執行緒的場景中往往是不合適的（甚至可能意外拉長臨界區的持有時間造成效能問題）；而 `wait()` 的設計目的正是為了在等待某個條件成立的期間，主動讓出鎖，避免長時間佔用資源卻無所作為。這也是為什麼生產者消費者模式要用 `wait()`/`notify()`（或 `Condition`）而不是用 `sleep()` 加輪詢來實作——用 `sleep()` 輪詢不僅效率低（要不斷喚醒檢查條件），還會在檢查條件時持續佔用鎖，阻礙其他執行緒的正常運作。

**面試回答方式**：用「`sleep` 不釋放鎖、`wait` 會釋放鎖」這個核心差異直接破題，再補一句「這也是為什麼協調多執行緒該用 `wait`/`notify` 而非 `sleep` 輪詢」的實務延伸，展現你不只知道 API 差異，還知道這個差異在設計選擇上的實際意義。

### 執行緒被 interrupt() 之後，狀態會如何變化？

**核心答案**：如果執行緒當時正處於 `WAITING`/`TIMED_WAITING` 狀態（例如在 `wait()`、`sleep()`、`join()` 中），`interrupt()` 會讓它立即從等待中甦醒並拋出 `InterruptedException`，狀態轉為 `RUNNABLE`（進入例外處理邏輯）；如果執行緒當時是 `RUNNABLE` 狀態正在執行普通程式碼，`interrupt()` 只會把該執行緒的「中斷旗標」設為 true，狀態本身不會立即改變，需要程式碼自行檢查 `Thread.isInterrupted()` 或呼叫會檢查中斷狀態的阻塞方法才會感知到；如果執行緒是 `BLOCKED` 狀態正在等待 `synchronized` 鎖，`interrupt()` 完全不會有作用，執行緒會繼續阻塞直到真正取得鎖為止。

**詳細解析**：這題延續了「`BLOCKED` 無法回應中斷」這個核心差異點的實務應用。理解這個機制對正確設計「可取消的任務」非常重要：如果任務內部大量使用普通迴圈進行 CPU 密集運算而完全不檢查中斷狀態，即使呼叫了 `interrupt()`，這個任務也會一直執行到自然結束，不會有任何反應；良好的可取消任務設計，應該在迴圈中定期檢查 `Thread.currentThread().isInterrupted()`，一旦偵測到中斷就主動清理資源並提前結束執行，這樣才能讓 `interrupt()` 真正發揮取消任務的作用。

**面試回答方式**：按執行緒當下所處的三種不同狀態（`WAITING`/`TIMED_WAITING`、普通 `RUNNABLE`、`BLOCKED`）分別說明 `interrupt()` 的效果，這種分情境討論的結構化答法，比籠統地說「會拋出中斷例外」更完整也更準確，能避免面試官追問「那如果執行緒在做別的事情呢」這類細節問題時措手不及。

## 相關

- [[020-wait-notify-and-condition.md]]
- [[017-deadlock-conditions-and-troubleshooting.md]]
