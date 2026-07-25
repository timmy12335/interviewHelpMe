---
id: java-004
category: java
slug: string-stringbuilder-stringbuffer
title: String、StringBuilder、StringBuffer 的差異
difficulty: easy
tags: [String, StringBuilder, StringBuffer]
source: original
---

# 題目

`String`、`StringBuilder`、`StringBuffer` 有什麼差異？各自適合什麼場景？

## 核心答案

`String` 不可變，每次「修改」都產生新物件；`StringBuilder` 和 `StringBuffer` 都是可變的字元序列，適合頻繁修改字串的場景。`StringBuilder` 非執行緒安全但效能較好，`StringBuffer` 的方法用 `synchronized` 修飾所以執行緒安全但效能較差。單執行緒下優先用 `StringBuilder`。

## 詳細解析

**三者對比**：

| 類別 | 可變性 | 執行緒安全 | 效能 | 適用場景 |
|------|--------|-----------|------|---------|
| `String` | 不可變 | 安全（因不可變） | 頻繁修改時差 | 固定內容、作為 key、常數 |
| `StringBuilder` | 可變 | 不安全 | 最好 | 單執行緒下頻繁拼接/修改 |
| `StringBuffer` | 可變 | 安全（synchronized） | 較差（有鎖開銷） | 多執行緒共享同一個可變字串（實務少見） |

**為什麼頻繁修改不該用 String**：因為 `String` 不可變，每次 `+=` 或 `concat` 都會產生新物件，在迴圈中拼接大量字串會產生大量臨時物件，造成記憶體與 GC 壓力，效能很差。

**StringBuilder vs StringBuffer**：兩者 API 幾乎完全相同（都繼承自 `AbstractStringBuilder`），差別只在 `StringBuffer` 的公開方法都加了 `synchronized`。在單執行緒場景下，`StringBuffer` 的同步是完全沒必要的開銷，所以應該用 `StringBuilder`。實務上真正需要「多執行緒共享同一個可變字串緩衝區」的場景非常罕見（通常會用其他更好的設計），所以 `StringBuffer` 現在很少被用到。

**經典建議**：在迴圈中拼接字串，一定要在迴圈外建立一個 `StringBuilder`，迴圈內 `append`，最後 `toString()`，而不是在迴圈內用 `String +=`。

## 面試回答方式

這是基礎題，用一個對比表的結構回答最清楚——沿著「可變性、執行緒安全、效能」三個維度比較三者。核心結論是「單執行緒頻繁修改用 `StringBuilder`，`StringBuffer` 只是加了鎖的版本、實務少用，`String` 適合固定內容」。務必補上那個最經典的實務建議——「迴圈中拼接字串要用 `StringBuilder` 而非 `+=`」，這是面試官常會延伸追問的實戰點，主動講出來能展現你有實際的效能意識。

## 常見追問

### 為什麼迴圈中用 String += 拼接效能會很差？

**核心答案**：因為 `String` 不可變，迴圈中每次 `str += x` 實際上都會建立一個新的 `StringBuilder`、把現有內容和新內容 append 進去、再 `toString()` 產生一個新的 `String` 物件，於是 n 次迴圈會產生大量的臨時 `StringBuilder` 和中間 `String` 物件，時間複雜度接近 O(n²)（每次都要複製已累積的全部內容），並造成沉重的 GC 壓力。

**詳細解析**：編譯器會把單一的 `str += x` 轉換成 `str = new StringBuilder().append(str).append(x).toString()`，這在單獨一行時沒問題；但放在迴圈裡，每一輪迭代都重新 new 一個 `StringBuilder`、把「到目前為止累積的整個字串」複製進去再加上新內容——隨著累積字串越來越長，每次複製的成本也越來越高，總體達到 O(n²)。正確做法是在迴圈外建立「一個」`StringBuilder`，迴圈內只做 `append`（攤銷後是 O(1)），迴圈結束後才 `toString()`，整體降到 O(n)。

**面試回答方式**：講清楚「每次 += 都會 new 一個 StringBuilder 並複製全部已累積內容，導致 O(n²)」這個關鍵，再給出正確做法（迴圈外建一個 StringBuilder），這種能講出時間複雜度並給出改進方案的回答，比只說「會很慢」更有說服力。

### StringBuilder 的預設容量與擴容機制是什麼？

**核心答案**：`StringBuilder` 預設初始容量是 16 個字元，當 `append` 導致內容超過目前容量時會自動擴容，擴容策略通常是「新容量 = 舊容量 × 2 + 2」，若還不夠則直接用所需的長度；擴容需要建立一個更大的新陣列並把舊內容複製過去，因此如果能預估最終大小，用建構子指定初始容量可以避免多次擴容複製的開銷。

**詳細解析**：`StringBuilder` 底層是一個 `char[]`（JDK 9 後在某些情況下用 `byte[]` 配合編碼標記以節省記憶體），初始 16 的容量對短字串足夠，但若要拼接一個已知很長的字串（例如組一個大 JSON 或 SQL），從 16 開始會經歷多次「翻倍擴容 + 複製」。如果事先知道大概的長度，用 `new StringBuilder(預估容量)` 一次性分配足夠空間，就能避免這些中間的擴容複製，這在效能敏感的場景（如高頻呼叫的序列化邏輯）是有意義的微優化。

**面試回答方式**：能講出「預設 16、擴容約為 2 倍 + 2、擴容要複製」這些具體細節，並延伸到「已知大小時用建構子預設容量避免多次擴容」的實務優化，展現你對這個常用類別的底層有實際了解，而不只是會呼叫 `append`。

### 有了 StringBuilder，StringBuffer 還有存在的必要嗎？

**核心答案**：實務上必要性很低。`StringBuffer` 的唯一價值是「多執行緒共享同一個可變字串緩衝區時保證執行緒安全」，但這種場景本身就很罕見且通常有更好的設計（例如每個執行緒用自己的 `StringBuilder`，最後再合併），所以現代開發中幾乎都用 `StringBuilder`，`StringBuffer` 主要是歷史遺留（它比 `StringBuilder` 更早出現，JDK 5 才引入 `StringBuilder`）。

**詳細解析**：`StringBuffer` 的執行緒安全是「方法級別」的——每個 `append` 等方法都是同步的，但這種細粒度的同步其實很少真正有用，因為多執行緒操作字串通常需要的是「一連串操作的整體原子性」（例如連續 append 多段內容不被打斷），而方法級同步保證不了這種複合操作的原子性，仍然需要外層自己加鎖。既然單一方法的同步既有效能開銷又解決不了真正的複合原子性需求，實務上更常見的做法是讓每個執行緒各自用 `StringBuilder` 處理、最後匯總，完全避開共享可變狀態。因此 `StringBuffer` 現在基本上是一個「知道它存在、知道為什麼不用它」的知識點。

**面試回答方式**：直接回答「必要性很低」，並點出關鍵——「方法級同步解決不了複合操作的原子性，所以它的執行緒安全在實務上價值有限」，這種能批判性看待一個 API「為什麼看似有用其實少用」的回答，比單純比較兩者效能更能展現獨立思考。

## 相關

- [[003-string-immutability-pool.md]]
