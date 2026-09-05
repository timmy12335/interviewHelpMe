---
id: java-036
category: java
slug: collectors
title: Collector 的組成與自訂收集器
difficulty: medium
tags: [Stream, Collector, collect, 平行處理]
source: original
---

# 題目

`Collector` 由哪些部分組成？什麼時候需要自訂收集器而不是用 `Collectors` 的現成方法？

## 核心答案

`Collector` 由**五個部件**組成：`supplier`（建立一個空的累積容器）、`accumulator`（把一個元素放進容器）、`combiner`（合併兩個容器，只在平行時用到）、`finisher`（把累積容器轉成最終結果）、`characteristics`（三個可選標記，宣告這個收集器的性質）。

理解它最好的方式是看它與 `reduce` 的差別：**`reduce` 是不可變歸約**（每一步產生新值），**`collect` 是可變歸約**（每一步修改同一個容器）。所以用 `reduce` 拼字串會產生 O(n²) 的中間字串，用 `collect` 到 `StringBuilder` 只有一個容器。`combiner` 的存在正是為了讓可變歸約也能平行——把資料切成幾段各自累積，最後兩兩合併。

三個特性標記各有用途：`CONCURRENT` 表示可以讓多執行緒共用同一個容器（省掉合併，但要求容器本身執行緒安全）、`UNORDERED` 表示結果與元素順序無關（讓框架自由排程）、`IDENTITY_FINISH` 表示累積容器就是最終結果（可以跳過 finisher 這一步）。

自訂的時機不多——現成的 `Collectors` 加上 `collectingAndThen`、`mapping`、`teeing` 這些組合器，已經覆蓋絕大多數需求。真正需要自訂的是「累積過程本身有特殊邏輯」的情況，例如邊累積邊維護一個有界的堆積（取 top-K）。

## 詳細解析

**combiner 是最容易寫錯的部件**，因為串行執行時它根本不會被呼叫——寫錯了測試也不會紅，直到有人加上 `parallel()` 才爆炸。而且它有一個嚴格的要求：**合併必須是結合律的**（associative），且與循序累積的結果一致。`Collectors.toList` 的 combiner 是 `(a, b) -> { a.addAll(b); return a; }`，看起來簡單，但如果自訂收集器裡放了「依插入順序編號」這種狀態，合併時編號就會亂掉。寫自訂收集器時一定要用 parallel 測一次，這是最容易被略過的驗證。

**groupingBy 與 toMap 的差異值得單獨記**：`toMap` 遇到重複鍵會拋 `IllegalStateException`（除非提供合併函式），而且**值為 null 時會拋 NPE**——因為它內部用 `Map.merge`，而 `merge` 不接受 null 值。`groupingBy` 則天然處理多值（分到同一組）。實務上「用 `toMap` 把清單轉成索引」是最常見的用法，也是最常在生產環境炸掉的地方，因為開發時的資料沒有重複鍵。**預設就提供合併函式**（哪怕是 `(a, b) -> a` 並記一行日誌）比事後除錯便宜得多。

下游收集器（downstream）是這組 API 的組合能力所在：`groupingBy(Order::getStatus, counting())`、`groupingBy(k, mapping(Order::getId, toList()))`、`groupingBy(k, filtering(pred, toList()))`——第二個參數可以是任何收集器，於是分組後的處理可以任意嵌套。`teeing`（JDK 12）更進一步，讓同一條串流**同時餵給兩個收集器**再合併結果（例如一次算出最大值與平均值），避免遍歷兩次。

收集器與平行的關係常被誤解：`Collectors.toList()` **不是** `CONCURRENT` 的，平行串流用它時每個執行緒各自累積再合併，這是安全的。`toConcurrentMap` 與 `groupingByConcurrent` 才是 `CONCURRENT`，它們讓所有執行緒寫入同一個 `ConcurrentHashMap`，省掉合併成本但**放棄了遭遇順序**。所以選 concurrent 版本的前提是不在乎順序且分組數量夠多（分組太少時所有執行緒擠在少數幾個鍵上，爭用反而更糟）。

## 面試回答方式

先給**五個部件**並用一句話說明各自職責，接著用最有解釋力的對照：**`reduce` 是不可變歸約、`collect` 是可變歸約**，並舉拼字串的 O(n²) 說明差別。`combiner` 的定位要講清楚——它是為了讓可變歸約能平行。然後主動提兩個實務上真的會出事的點：combiner 在串行時不會被呼叫，寫錯了要等到有人加 parallel 才爆，所以自訂收集器一定要用平行測一次；以及 **`toMap` 遇重複鍵拋例外、值為 null 拋 NPE**，開發資料沒有重複鍵所以常在生產環境才炸，預設就該提供合併函式。最後用下游收集器與 `teeing` 展示組合能力，並澄清 `toList` 不是 concurrent 的但平行安全。

## 講稿

Collector 由五個部件組成。建立空容器、把元素放進容器、合併兩個容器、把容器轉成最終結果、還有幾個宣告性質的標記。

理解它最好的方式是跟 reduce 對照。reduce 是不可變歸約，每一步產生新值。collect 是可變歸約，每一步修改同一個容器。所以用 reduce 拼字串會產生大量中間字串，用 collect 就只有一個容器。那個合併部件的存在，正是為了讓可變歸約也能平行。

我想強調兩個實務上真的會出事的地方。第一是合併函式，串行執行的時候它根本不會被呼叫，所以寫錯了測試也不會紅，直到有人加上平行才爆炸。寫自訂收集器一定要用平行測一次。

第二是把清單轉成索引的時候，遇到重複鍵會拋例外，值是 null 也會拋空指標。開發環境的資料通常沒有重複鍵，所以這件事常常在生產環境才炸。我的習慣是預設就提供合併函式，就算只是取前面那個並記一行日誌。

## 常見追問

### 什麼時候該用 reduce 而不是 collect？

**核心答案**：當結果是不可變的單一值、且合併操作天然滿足結合律時用 `reduce`——求和、求最大值、布林的且或。當**結果需要累積到一個容器**時用 `collect`。判斷方式很直接：如果用 `reduce` 會在每一步建立新物件（新字串、新清單），那就該用 `collect`。

**詳細解析**：`reduce` 有三個多載，容易混淆。單參數版回傳 `Optional`（因為串流可能是空的）；雙參數版要一個單位元素（identity）並回傳該型別；三參數版多一個 combiner，用於**元素型別與累積型別不同**的情況。第三個版本很少該用——它能做的事 `collect` 幾乎都做得更好，而且它同樣有「串行時 combiner 不被呼叫」的陷阱。另外雙參數版的 identity 必須真的是單位元素（`identity op x == x`），寫錯了在平行時會出現重複套用的錯誤結果——例如用 1 當加法的 identity，平行分成四段就會多加 3。

**面試回答方式**：給一個可操作的判準——用 `reduce` 會不會在每一步建立新物件，會就改用 `collect`。接著說明三個多載的差異，並指出三參數版很少該用。加分點是 identity 必須真的是單位元素，並舉「用 1 當加法 identity，平行分四段就多加 3」這個具體錯誤，說明它為什麼在串行下看不出來。

### groupingBy 回傳的 Map 有什麼要注意的？

**核心答案**：三點。**型別不保證**——預設回傳的是 `HashMap`，但這不是契約的一部分，需要特定實作（例如要有序）就用三參數版本傳入 map factory（`groupingBy(k, TreeMap::new, toList())`）。**空分組不存在**——沒有元素落入的鍵不會出現在結果裡，所以「所有狀態都要有一列」的報表需求得自己補上缺的鍵。**巢狀分組的可讀性**——`groupingBy(a, groupingBy(b, counting()))` 產生 `Map<A, Map<B, Long>>`，超過兩層之後型別會變得很難讀也很難傳遞。

**詳細解析**：第三點在實務上是重構的訊號：當分組層數超過兩層，通常該定義一個 record 當作複合鍵，把 `Map<A, Map<B, Long>>` 換成 `Map<GroupKey, Long>`，其中 `GroupKey` 是 `record GroupKey(A a, B b)`。這樣型別扁平、可以直接排序與序列化、也容易再加第三個維度。record 自動生成的 `equals` 與 `hashCode` 讓它可以直接當 Map 鍵，這正是 record 最實用的場景之一。另外要注意 `counting()` 回傳 `Long` 而不是 `Integer`，直接與 int 比較或塞進期待 Integer 的地方會有型別問題。

**面試回答方式**：給三點並各配一個具體後果（型別不保證、空分組不存在、巢狀難讀）。重點放在第三點的解法：**超過兩層就用 record 當複合鍵**，把巢狀 Map 攤平，並指出這正是 record 最實用的場景之一。最後補一個細節——`counting()` 回傳 `Long`，這種小地方常在整合時卡住。

### 自訂收集器要怎麼驗證它是正確的？

**核心答案**：三個檢查。**結合律**——任意切分點得到的結果都必須相同，可以用隨機切分的性質測試驗證。**與循序結果一致**——同一組資料分別用 `stream()` 與 `parallelStream()` 收集，結果必須相等。**特性標記與實作相符**——標了 `CONCURRENT` 就必須容器本身執行緒安全，標了 `IDENTITY_FINISH` 就必須累積型別與結果型別相同（否則會在執行期拋 `ClassCastException`）。

**詳細解析**：最有效的驗證方式是**性質測試（property-based testing）**：生成隨機資料，斷言「平行結果等於循序結果」與「任意分段合併等於整體累積」。這比逐個寫範例測試更能找到 combiner 的錯誤，因為問題往往只在特定的切分點才顯現。實務上還有一個省事的做法——先用 `Collector.of(...)` 把現成部件組起來，而不是實作 `Collector` 介面，這樣不容易漏掉方法。而且在動手之前先問一次：能不能用 `collectingAndThen`、`mapping`、`flatMapping`、`teeing` 組合出來？ 大多數看起來需要自訂的需求其實可以用組合器拼出，那既不會寫錯 combiner，也不需要維護。

**面試回答方式**：給三個檢查點並強調 combiner 的錯誤只在特定切分點顯現，所以**性質測試比範例測試有效**。接著給兩個實務建議：用 `Collector.of` 而不是實作介面；動手前先確認能不能用現成組合器拼出來。收在一句判斷：大多數看似需要自訂的需求都能組合出來，自訂是最後手段。

## 相關

- [[024-stream-api-lazy.md]]
- [[037-parallel-stream.md]]
