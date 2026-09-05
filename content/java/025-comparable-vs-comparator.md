---
id: java-025
category: java
slug: comparable-vs-comparator
title: Comparable 與 Comparator：排序契約與常見陷阱
difficulty: medium
tags: [Comparable, Comparator, 排序, 集合框架]
source: original
---

# 題目

`Comparable` 與 `Comparator` 差在哪？為什麼比較器寫錯會拋出「Comparison method violates its general contract!」？

## 核心答案

`Comparable` 是**型別自己的天然排序**——實作 `compareTo`，寫在類別內部，一個類別只能有一種；`Comparator` 是**外部提供的排序策略**——寫在類別外部，同一個型別可以有任意多個。判斷標準是「這個順序是不是這個型別的本質屬性」：字串的字典序、金額的大小是本質的，用 `Comparable`；「依部門再依年資排」是使用情境決定的，用 `Comparator`。

排序契約有三條：**反對稱**（`compare(a,b)` 與 `compare(b,a)` 符號相反）、**遞移**（a>b 且 b>c 則 a>c）、**與 equals 一致**（建議但非強制）。JDK 7 之後 `Arrays.sort` 對物件改用 **TimSort**，它會假設契約成立而跳過某些比較；契約被違反時排序結果可能錯亂，或直接拋出 `IllegalArgumentException: Comparison method violates its general contract!`。最常見的成因是**用相減實作 compare**（`a.value - b.value` 在數值溢位時符號會翻轉），以及比較函式裡有非確定性的邏輯（例如比較時讀取會變動的欄位）。

## 詳細解析

**相減溢位是最經典的陷阱**：`(a, b) -> a.getScore() - b.getScore()` 在 score 都是小正整數時完全正確，但只要出現 `Integer.MIN_VALUE` 附近的值，相減就會溢位並回傳錯誤符號，反對稱性當場崩潰。正確寫法是 `Integer.compare(a, b)`——它內部用的是三路判斷而不是減法，永遠不會溢位。同樣的道理適用於 `Long.compare`、`Double.compare`（後者還額外處理了 NaN 與正負零，直接用 `<` 比較浮點數會在 NaN 上得到全部為 false 的怪結果）。

**TimSort 為什麼會偵測到違約**：它把陣列切成一段段已排序的 run，再合併。合併時它會用「galloping」策略跳過一大段元素——這個跳躍的正確性建立在遞移性上。如果比較器不遞移，跳躍會落在錯的位置，演算法內部的不變量被破壞，於是主動拋出例外。這個例外是保護機制而不是排序演算法的 bug——它在告訴你比較器有問題，而且是「在這批資料上剛好踩到」，換一批資料可能只是靜默地排錯。

與 equals 不一致的後果集中在有序集合：`TreeSet` 與 `TreeMap` 判斷「重複」用的是 `compareTo` 回傳 0，而不是 `equals`。如果一個 `Comparator` 只比較姓名，那兩個姓名相同但身分證不同的人放進 `TreeSet` 只會留下一個——即使 `equals` 認為它們不同。這不是 bug，是有序集合刻意選擇以比較結果定義相等；但它會讓 `Set` 的語意在不同實作間不一致，所以 JDK 文件建議（但不強制）兩者一致。

**組合式比較器是現代寫法**：`Comparator.comparing(Person::getDept).thenComparing(Person::getSeniority).reversed()` 比手寫 if-else 鏈可讀得多，也不容易寫錯符號。要注意 `reversed()` 作用在**整條鏈**而不是最後一個欄位——想只反轉某個欄位要寫成 `thenComparing(Person::getSeniority, Comparator.reverseOrder())`。另外 `comparing` 取值時若欄位可能為 null，要用 `Comparator.nullsFirst` 或 `nullsLast` 包起來，否則排序中途會拋 NPE。

## 面試回答方式

先給**歸屬的差別**：`Comparable` 是型別內建的天然順序、只能有一種；`Comparator` 是外部策略、可以有很多種。接著主動講**契約**——反對稱、遞移、建議與 equals 一致——並用「為什麼會拋 Comparison method violates its general contract」把話題拉到 TimSort：它假設契約成立而跳過比較，違約時不變量被破壞就拋例外，**這是保護而不是 bug**。最後給兩個可操作的結論：**不要用相減實作 compare**（改用 `Integer.compare`，避免溢位翻轉符號），以及 `TreeSet` 用比較結果而非 `equals` 判斷重複，所以比較器只看部分欄位時會吃掉資料。能講出「換一批資料可能只是靜默排錯」會很加分。

## 講稿

Comparable 是型別自己的天然排序，寫在類別裡面，一個類別只能有一種。Comparator 是外部提供的排序策略，同一個型別可以有很多個。我的判斷標準是這個順序是不是這個型別的本質，字串的字典序是本質的，依部門再依年資排就是使用情境決定的。

排序契約有三條，反對稱、遞移、還有建議跟 equals 一致。JDK 7 之後物件排序改用 TimSort，它會假設契約成立而跳過某些比較，所以契約被違反的時候，會直接拋出比較方法違反契約的例外。

最常見的成因是用相減來實作比較。分數相減在正常資料上完全正確，但只要出現極端值就會溢位，符號整個翻過來。正確的寫法是用 Integer 的 compare 方法，它內部是三路判斷不會溢位。

我想強調的是，那個例外其實是保護機制。它在告訴你比較器有問題，而且只是剛好在這批資料上踩到，換一批資料可能只是靜默地排錯，那更難查。

## 常見追問

### 為什麼 TreeSet 判斷重複不用 equals？

**核心答案**：因為有序集合的一切操作都建立在比較之上。`TreeSet` 內部是紅黑樹，查找、插入、刪除都靠 `compareTo` 決定往左還是往右走；走到某個節點時比較結果為 0，就代表「找到了」。如果這時再去問 `equals`，樹的定位邏輯與相等判斷就會用兩套標準，可能出現「明明比較結果相同、卻被判定為不同元素」的狀況，而樹裡沒有地方可以再放第二個。

**詳細解析**：這個設計的後果是實際的。用 `Comparator.comparing(Person::getName)` 建一個 `TreeSet`，兩個同名不同人的物件放進去只會留下一個，`HashSet` 則會留兩個——同樣是 `Set` 介面，行為卻不同。JDK 文件把這件事寫成「與 equals 不一致的有序集合行為良好但違反 Set 的一般約定」，也就是**它承認這是刻意的取捨**。實務上的做法是讓比較器**最後補一個唯一鍵**：`thenComparing(Person::getId)`，這樣比較結果為 0 就真的等價於同一個人。

**面試回答方式**：從「紅黑樹的定位靠比較」講原理，再給具體後果——同名不同人在 `TreeSet` 只留一個、在 `HashSet` 留兩個。收在可操作的建議：比較器鏈最後補一個唯一鍵，讓比較為 0 等價於真正相同。

### Comparator.comparing 有哪些效能上要注意的地方？

**核心答案**：`comparing` 每次比較都會呼叫一次 keyExtractor，排序過程中同一個元素的 key 會被重複取出很多次（TimSort 大約是 n log n 次比較，每次兩個取值）。如果 key 的計算很貴（例如字串拼接、反射取值、或走一次資料庫關聯），排序成本會被放大。另外 `comparing` 對基本型別會裝箱，大量資料時用 `comparingInt`、`comparingLong`、`comparingDouble` 可以省掉裝箱。

**詳細解析**：解法是 **Schwartzian transform**（也叫 decorate-sort-undecorate）：先把每個元素映射成「key 與元素」的配對，排序這些配對，最後再取回元素。這樣每個元素的 key 只算一次，總成本從 O(n log n) 次取值降到 O(n) 次。在 Java 裡可以寫成先 `map` 成一個小的 record、排序後再 `map` 回來。要不要這樣做取決於 key 的成本——如果只是取一個欄位，多算幾次遠比多配置 n 個暫時物件便宜，直接用 `comparing` 就好。**這是典型的「先量再改」情境**，不要預設就上複雜寫法。

**面試回答方式**：先指出 keyExtractor 會被重複呼叫大約 n log n 次這個容易被忽略的事實，再給兩個層次的處理：便宜的 key 直接用 `comparingInt` 系列省掉裝箱；昂貴的 key 用 decorate-sort-undecorate 讓每個元素只算一次。最後強調要先量測，因為多配置 n 個暫時物件本身也有成本。

### 排序穩定性（stable sort）在什麼情況下會影響正確性？

**核心答案**：穩定排序保證比較結果相同的元素維持原本的相對順序。它在**多輪排序**時是正確性的基礎：先依年資排、再依部門排，只有在第二次排序是穩定的情況下，同部門內才會維持年資順序。Java 對物件排序（`Arrays.sort(Object[])`、`Collections.sort`、`List.sort`）用 TimSort，**是穩定的**；對基本型別陣列用的是雙軸快排，**不穩定**，但基本型別沒有「相同但可區分」的元素，所以看不出差別。

**詳細解析**：`Stream.sorted()` 在**循序流**上保證穩定；平行流則要看流是否有定義的遭遇順序（encounter order），來源是 `List` 時仍然穩定，來源是 `HashSet` 時本來就沒有順序可談。實務上更穩健的做法是**不要依賴多輪排序**，直接把所有排序鍵寫進一個比較器鏈——這樣意圖寫在程式碼裡而不是藏在「前一次排序的殘留順序」中，換人維護時也不會因為調換兩行而悄悄改變結果。

**面試回答方式**：用「多輪排序」這個具體場景說明穩定性為什麼是正確性問題而不只是細節，並準確區分 Java 的兩種情況——物件用 TimSort 穩定、基本型別用雙軸快排不穩定但無從觀察。加分點是指出依賴多輪排序讓意圖藏在程式碼之外，建議直接用比較器鏈表達完整的排序意圖。

## 相關

- [[001-equals-hashcode-contract.md]]
- [[026-treemap-sorted-collections.md]]
