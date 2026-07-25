---
id: java-021
category: java
slug: record-class
title: Record 類別（JDK 16）
difficulty: medium
tags: [Record, 不可變, 資料類別]
source: original
---

# 題目

`record` 是什麼？它適合用在什麼場景？和普通類別有什麼差異？

## 核心答案

`record`（JDK 14 預覽、JDK 16 正式）是一種簡潔的「不可變資料載體」類別。你只需宣告它的組成欄位（如 `record Point(int x, int y) {}`），編譯器就會自動生成建構子、每個欄位的存取方法、以及符合契約的 `equals()`、`hashCode()`、`toString()`。它的欄位都是 `final`（不可變），適合用於「純粹承載資料、不需要可變狀態」的場景，如 DTO、值物件、方法回傳多個值的組合等。

## 詳細解析

**record 自動生成的東西**：對於 `record Point(int x, int y) {}`，編譯器自動生成：

1. **一個全參數建構子**（規範建構子，canonical constructor）：`Point(int x, int y)`。
2. **每個欄位的存取方法**：`x()` 和 `y()`（注意是 `x()` 不是 `getX()`）。
3. **`equals()` 和 `hashCode()`**：基於所有欄位、符合契約。
4. **`toString()`**：格式如 `Point[x=1, y=2]`。

**record 的特性與限制**：

- 所有欄位隱含為 `private final`——record 是不可變的，建立後欄位不能改。
- record 隱含為 `final` 類別——不能被繼承。
- 不能宣告額外的實例欄位（只能有宣告在頭部的那些「元件」），但可以有靜態欄位、靜態方法、實例方法。
- 可以實作介面，但不能繼承其他類別（因為它隱含繼承自 `java.lang.Record`）。
- 可以自訂建構子（如加入參數驗證的「緊湊建構子 compact constructor」）。

**適用場景**：

- **DTO / 資料傳輸物件**：在層與層之間傳遞的純資料。
- **值物件（Value Object）**：如座標、金額、日期範圍等以「值」定義相等性的物件。
- **方法回傳多個值**：用一個 record 打包多個回傳值，比回傳陣列或 Map 更型別安全、更清楚。
- **Map 的複合 key**：因為自動有正確的 equals/hashCode。

**不適用場景**：需要可變狀態的物件、需要繼承的類別、有複雜業務行為（而非單純資料）的類別。

## 面試回答方式

先講「record 是什麼」——簡潔的不可變資料載體，編譯器自動生成建構子/存取方法/equals/hashCode/toString。重點講「它消除了什麼樣板程式碼」——以前寫一個 DTO 要手寫一堆 getter、equals、hashCode、toString（或靠 Lombok），現在一行 record 搞定。適用場景要能舉出 DTO、值物件、多回傳值打包這些具體例子。如果能點出限制（不可變、不能繼承、不能有額外實例欄位）以及「存取方法是 `x()` 而非 `getX()`」這個細節，展現你真的用過而非只聽過。

## 常見追問

### record 的 equals 和 hashCode 是怎麼實作的？

**核心答案**：record 自動生成的 `equals()` 會比較「兩個 record 的所有元件欄位是否都相等」，`hashCode()` 則基於所有元件欄位計算，兩者都嚴格遵守 equals/hashCode 契約（欄位全相等則 equals 為 true 且 hashCode 相同）。這正是「值語意」——兩個 record 只要所有欄位的值相同，就被視為相等，不管是不是同一個物件實例。

**詳細解析**：這使得 record 天生適合當「值物件」和「Map 的 key」。例如 `record Point(int x, int y)`，`new Point(1, 2).equals(new Point(1, 2))` 為 true，且它們的 hashCode 相同——所以把 `Point(1,2)` 當作 HashMap 的 key 放入後，用另一個內容相同的 `Point(1,2)` 就能查到。這解決了普通類別「如果不手動覆寫 equals/hashCode，兩個內容相同的物件卻不相等、無法作為可靠的 key」的問題。而且因為 record 是不可變的（欄位 final），它作為 key 時雜湊碼恆定，不會有 [[001-equals-hashcode-contract.md]] 中提到的「可變 key 導致查不到」的風險——不可變性和自動正確的 equals/hashCode 讓 record 成為理想的 Map key。

**面試回答方式**：講清楚「基於所有欄位、遵守契約、實現值語意」，並連結到「所以 record 天生適合當值物件和 Map key」，能進一步點出「不可變性讓它作為 key 時雜湊碼恆定、沒有可變 key 的風險」，展現你把 record、equals 契約、不可變性這幾個知識點串起來理解。

### record 可以做參數驗證嗎？緊湊建構子是什麼？

**核心答案**：可以。record 支援「緊湊建構子（compact constructor）」——一種特殊的建構子語法，不需要寫參數列表和欄位賦值（那些由編譯器自動處理），你只需在其中寫驗證或正規化邏輯。例如在 `record Range(int start, int end)` 中寫一個緊湊建構子，檢查 `start <= end`，不合法就拋例外，這樣就能保證每個建立出來的 Range 都是合法的。

**詳細解析**：緊湊建構子的語法是 `Range { if (start > end) throw new IllegalArgumentException(...); }`——注意它沒有參數列表（直接 `Range {` 而非 `Range(int start, int end) {`），也不需要手動寫 `this.start = start`（編譯器會在你的驗證邏輯之後自動加上欄位賦值）。這讓 record 不只是「無腦的資料容器」，還能維護自己的不變性（invariant）——確保不會存在「非法狀態」的 record 實例（例如 end 小於 start 的 Range）。你也可以在緊湊建構子中做正規化（例如把字串欄位 trim、把負數修正為 0），這些調整會反映到最終賦值的欄位上。這個能力讓 record 能安全地用於需要驗證的值物件，而不失其簡潔性。

**面試回答方式**：回答「可以，用緊湊建構子」，並說明它的特點——「不用寫參數列表和賦值，只寫驗證/正規化邏輯，編譯器自動補上賦值」。舉一個 Range 驗證 start<=end 的例子，展現你知道 record 不只是死板的資料容器，還能維護不變性，這種了解進階用法的回答比只知道「record 能自動生成 getter」更深入。

### 什麼情況不該用 record？

**核心答案**：不該用 record 的情況包括——需要「可變狀態」的物件（record 欄位都是 final 不可變）、需要「被繼承」的類別（record 隱含 final、且已繼承 java.lang.Record 無法再繼承別的類別）、以及「主要承載複雜業務行為而非單純資料」的類別（record 的定位是資料載體，把大量業務邏輯塞進 record 是誤用）。這些場景應該用普通類別。

**詳細解析**：record 的設計定位非常明確——「不可變的、以值定義相等性的、純粹的資料載體」。它的三個核心限制正好界定了不適用的場景：一是不可變性，如果你的物件需要在生命週期中改變狀態（例如一個有 setter 的實體、一個累積狀態的物件），record 就不適合；二是不能被繼承（自己是 final、又已經繼承了 Record），如果你需要一個可以被子類別擴展的基礎類別，用不了 record；三是它本質是資料而非行為的載體，雖然 record 可以有方法，但如果一個類別的重點是複雜的業務行為（例如一個 Service），把它做成 record 是概念上的誤用。判斷準則很簡單——「這個東西主要是『一組值』，還是『一個有行為、有狀態變化、可能被繼承的物件』？」前者用 record，後者用普通類別。

**面試回答方式**：列出三個不適用場景（需要可變狀態、需要被繼承、主要是業務行為），並對應到 record 的三個限制（final 欄位、final 類別、資料載體定位）。用「這東西主要是一組值還是一個有行為的物件」這個判斷準則收尾，展現你理解 record 的適用邊界，能做出正確的設計選擇而不是濫用新特性。

## 相關

- [[001-equals-hashcode-contract.md]]
- [[022-sealed-class.md]]
