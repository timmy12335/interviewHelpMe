---
id: java-concurrency-003
category: java-concurrency
slug: jmm-happens-before
title: Java 記憶體模型（JMM）與 happens-before 規則
difficulty: medium
tags: [JMM, happens-before, 記憶體模型]
source: original
---

# 題目

什麼是 Java 記憶體模型？happens-before 有哪些常見規則？它解決了什麼問題？

## 核心答案

JMM 定義了多執行緒程式中，一個執行緒對共享變數的寫入何時對另一個執行緒可見。happens-before 是 JMM 用來描述「操作 A 的結果對操作 B 可見」的偏序關係，只要兩個操作滿足 happens-before，前者的記憶體效果就保證對後者可見，即使兩者在不同執行緒上執行。

## 詳細解析

**為什麼需要 JMM**：現代 CPU 有多級快取，編譯器與處理器都可能為了效能對指令重排。在單執行緒中重排不影響最終結果（as-if-serial），但在多執行緒中，若沒有規範，一個執行緒的寫入何時、以何種順序被另一個執行緒看到將完全不確定。JMM 就是規範這件事的抽象模型。

**常見 happens-before 規則**：

1. **程式順序規則**：同一執行緒內，前面的操作 happens-before 後面的操作。
2. **監視器鎖規則**：對一個鎖的解鎖操作 happens-before 後續對這個鎖的加鎖操作（即 A 執行緒解鎖後，B 執行緒加鎖時能看到 A 在鎖內的所有寫入）。
3. **volatile 變數規則**：對一個 `volatile` 變數的寫操作 happens-before 後續對這個變數的讀操作。
4. **執行緒啟動規則**：`Thread.start()` 之前對變數的寫入，happens-before 該執行緒內的所有操作。
5. **執行緒終止規則**：執行緒內的所有操作 happens-before 其他執行緒偵測到該執行緒已終止（如透過 `Thread.join()` 返回或 `Thread.isAlive()` 返回 false）。
6. **傳遞性**：若 A happens-before B，且 B happens-before C，則 A happens-before C。
7. **中斷規則**：對執行緒 `interrupt()` 方法的呼叫 happens-before 被中斷執行緒偵測到中斷事件。

**與具體實作的關係**：`synchronized`、`volatile`、`java.util.concurrent` 中的鎖與工具類（如 `CountDownLatch`、執行緒池（Thread Pool）的任務提交與執行）背後都是靠建立 happens-before 關係來保證可見性，面試時最好能舉出「執行緒池任務提交 happens-before 任務內部執行」這種具體例子，而不只是背規則。

**常見誤區**：happens-before 不代表「時間上先發生」，而是一種可見性保證的偏序關係；兩個操作即使時間上 A 先於 B 執行，若沒有建立 happens-before 關係，B 依然可能看不到 A 的寫入結果。

## 面試回答方式

這題的標準結構是「為什麼需要 → 定義是什麼 → 舉規則例子 → 澄清誤區」。先用一句話講「為什麼需要 JMM」（CPU 快取與指令重排讓多執行緒可見性變得不確定），這能立刻讓面試官知道你理解問題的根源，而不是直接背名詞。接著給出 happens-before 的定義，然後只挑 3-4 條最常用的規則舉例（程式順序、鎖、volatile、執行緒啟動/終止），不需要把 7 條全部背出來，挑重點反而顯得掌握精準。最後務必補上「happens-before 不等於時間先後」這個誤區澄清，這是這題的加分關鍵，很多人只背規則卻答不出這個細節。

## 常見追問

### final 欄位的 happens-before 保證是什麼？

**核心答案**：`final` 欄位有特殊的「安全發布（safe publication）」保證——只要物件建構子執行完畢且沒有讓 `this` 引用在建構過程中逸出，其他執行緒透過正常方式取得這個物件引用後，就能看到 `final` 欄位的正確初始化值，即使沒有額外的同步機制。

**詳細解析**：JMM 對 `final` 欄位做了特別規定：建構子內對 `final` 欄位的寫入，與建構子外「透過該物件引用讀取這個 `final` 欄位」之間存在 happens-before 關係，前提是物件的引用沒有在建構子執行完成前就被其他執行緒拿到（即沒有 `this` 逸出，例如在建構子中把 `this` 註冊到全域監聽器列表）。這個保證讓「不可變物件（immutable object）」天生具備執行緒安全的發布特性，不需要額外加鎖或 `volatile` 就能安全地在多執行緒間共享，這也是為什麼強烈建議把不需要修改的欄位都宣告為 `final`。

**面試回答方式**：這題容易被問到是因為它連結到「不可變物件為什麼是執行緒安全」這個更大的主題，回答時可以主動延伸一句「這也是為什麼建議多用 `final` 與不可變物件設計」，展現你把知識點串聯起來的能力。

### 為什麼說 synchronized 的可見性保證比 volatile 更強？

**核心答案**：因為 `synchronized` 除了可見性，還額外提供**原子性**（臨界區內的整段程式碼互斥執行）；`volatile` 只保證單一變數讀寫的可見性與有序性，沒有互斥語意。

**詳細解析**：這題本質上是延續前一題（[[002-volatile-semantics.md]]）的比較，但要放在 happens-before 的框架下講：`synchronized` 的加解鎖建立的 happens-before 關係，涵蓋了整個臨界區內**所有**共享變數的寫入，且因為互斥，這些寫入不會與其他執行緒的寫入交錯；`volatile` 建立的 happens-before 只涵蓋這一個變數本身的單次讀寫，如果臨界區內有多個相關聯的變數需要一起被看到、一起被保護，`volatile` 無法勝任，必須用鎖。

**面試回答方式**：如果前一題已經回答過 `volatile` vs `synchronized` 的差異，這題可以直接說「延續剛剛的比較，這裡從 happens-before 的角度再確認一次」，展現你的回答是前後連貫的知識體系，而不是每題重新背一段。

### happens-before 和指令重排、記憶體屏障之間的關係？

**核心答案**：happens-before 是 JMM 對外承諾的「規則」（結果導向的保證），記憶體屏障是 JVM 底層為了**實現**這些規則所使用的「手段」（指令層級的具體機制）。

**詳細解析**：happens-before 規則是給開發者看的抽象契約——只要程式碼符合某種模式（例如用同一把鎖、用 `volatile` 變數），JMM 就保證可見性與順序性，開發者不需要知道底層怎麼做到。而 JVM 為了實際兌現這個承諾，會在編譯後的機器碼中插入適當的記憶體屏障指令（如 LoadLoad、StoreStore、LoadStore、StoreLoad），限制 CPU 與編譯器不能做特定的重排。可以理解為：happens-before 是「規格」，指令重排規則與記憶體屏障是「實作細節」，兩者是同一件事的不同抽象層級。

**面試回答方式**：這題適合用「規格 vs 實作」這個比喻來回答，能一句話講清楚兩者的關係層級，比分別解釋兩個概念再嘗試連結更簡潔有力。

## 相關

- [[002-volatile-semantics.md]]
- [[001-synchronized-lock-upgrade.md]]
