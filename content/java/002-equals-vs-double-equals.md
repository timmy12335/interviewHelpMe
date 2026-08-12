---
id: java-002
category: java
slug: equals-vs-double-equals
title: == 與 equals() 的差異
difficulty: easy
tags: [equals, ==, 引用比較]
source: original
---

# 題目

`==` 和 `equals()` 有什麼差異？對基本型別和物件分別是什麼行為？

## 核心答案

`==` 對基本型別（如 `int`、`double`）比較的是「值本身是否相等」；對物件（引用型別）比較的是「兩個引用是否指向記憶體中的同一個物件」（即位址是否相同）。`equals()` 是 `Object` 定義的方法，預設實作等同於 `==`（比較引用），但很多類別（如 `String`、`Integer`）覆寫了它，改為比較「邏輯內容是否相等」。

## 詳細解析

**對基本型別**：`==` 直接比較值，例如 `1 == 1` 為 true、`3.14 == 3.14` 為 true，這裡沒有物件、沒有引用的概念，就是單純的值比較。

**對物件（引用型別）**：`==` 比較的是兩個變數是否持有相同的引用（指向同一個堆記憶體位址）。例如 `new String("a") == new String("a")` 為 false，因為 `new` 產生了兩個不同的物件，兩個引用指向不同的記憶體位址，即使它們的內容都是 "a"。

**`equals()` 的預設與覆寫**：`Object.equals()` 的預設實作就是 `return this == other`，也就是比較引用。但 `String`、`Integer`、`Double` 等類別覆寫了 `equals()`，改為比較實際內容——`new String("a").equals(new String("a"))` 為 true，因為 `String` 的 `equals()` 逐字元比較內容。

**常見陷阱**：因此比較字串內容時應該用 `str1.equals(str2)`（或 `Objects.equals()` 避免 NPE），而不是 `str1 == str2`。用 `==` 比較字串有時「碰巧」為 true（例如兩個字面量因字串池而是同一物件），有時為 false（例如其中一個是 `new` 出來的），行為不一致且難以除錯。

## 面試回答方式

這是基礎題，回答的關鍵是把「基本型別」和「引用型別」兩種情況分開講清楚，不要混為一談。核心結論是「`==` 對物件比引用（位址）、`equals` 預設也比引用但常被覆寫成比內容」。務必主動舉一個經典陷阱例子——`new String("a") == new String("a")` 為 false 但 `.equals()` 為 true——用具體例子證明你真的理解差異，而不只是背定義。最後補一句實務建議（比較內容用 `equals`/`Objects.equals`），展現你知道正確用法。

## 常見追問

### 為什麼比較字串內容建議用 Objects.equals() 而不是直接呼叫 equals()？

**核心答案**：因為直接呼叫 `a.equals(b)` 時如果 `a` 為 null 會拋出 `NullPointerException`；而 `Objects.equals(a, b)` 內部做了 null 檢查（兩者都為 null 回傳 true、其中一個為 null 回傳 false、都不為 null 才呼叫 `equals()`），能安全地處理 null，避免空指標例外。

**詳細解析**：`Objects.equals(a, b)` 的實作邏輯大致是 `(a == b) || (a != null && a.equals(b))`——先用 `==` 快速判斷是否為同一引用（也順帶處理了兩者都為 null 的情況），再確認 `a` 不為 null 後才呼叫 `a.equals(b)`。這讓開發者不需要在每次比較前手動寫 null 檢查，程式碼更簡潔也更不容易因為疏忽而拋出 NPE。在處理可能為 null 的欄位比較（例如從資料庫或外部 API 拿到的可能為 null 的字串）時特別有用。

**面試回答方式**：直接點出「`Objects.equals` 幫你處理了 null，避免 `a` 為 null 時 `a.equals(b)` 拋 NPE」這個核心價值，並簡述它內部的 null 判斷邏輯，展現你在意程式碼的健壯性（防禦性程式設計），這是實務工程中很受重視的習慣。

### Integer 的 == 比較為什麼有時 true 有時 false？

**核心答案**：因為 Java 對 `Integer` 有「快取池」機制，`-128` 到 `127` 之間的值會被快取並重複使用同一個物件，所以這個範圍內用 `==` 比較兩個相同值的 `Integer` 會是 true（同一個物件）；超出這個範圍的值每次自動裝箱都會 `new` 一個新物件，`==` 比較就會是 false（不同物件）。

**詳細解析**：這是自動裝箱（autoboxing）與 `Integer` 快取共同造成的經典陷阱，例如 `Integer a = 127, b = 127; a == b` 為 true，但 `Integer c = 128, d = 128; c == d` 為 false。完整的原理在 [[010-autoboxing-integer-cache.md]] 有詳細說明。核心是：這說明了對 `Integer`（以及其他包裝類別）永遠不該用 `==` 比較值應該用 `.equals()` 或先拆箱成基本型別再比較，否則就會踩到這種「小數字碰巧相等、大數字卻不相等」的詭異 bug。

**面試回答方式**：直接點出「因為 -128~127 的 `Integer` 有快取池、超出範圍就是新物件」這個原因，並強調結論「包裝類別比較值一律用 `equals`」，這題是面試很愛考的陷阱題，能準確講出快取範圍（-128~127）會是明確的加分點。

### equals() 需要遵守哪些通用約定（自反、對稱、傳遞等）？

**核心答案**：`equals()` 必須滿足五個約定——自反性（`a.equals(a)` 為 true）、對稱性（`a.equals(b)` 與 `b.equals(a)` 結果一致）、傳遞性（a 等於 b、b 等於 c，則 a 等於 c）、一致性（多次呼叫結果不變，前提是物件未被修改）、以及與 null 比較必須回傳 false（`a.equals(null)` 為 false）。

**詳細解析**：這些約定看似理所當然，但在繼承場景中很容易被無意破壞——最常見的是「對稱性」與「傳遞性」在父類別與子類別混合比較時出問題。例如父類別 `Point` 和多了一個顏色欄位的子類別 `ColorPoint`如果 `ColorPoint.equals()` 要求顏色也相同，但 `Point.equals()` 只比較座標，就會出現 `point.equals(colorPoint)` 為 true（Point 只看座標）但 `colorPoint.equals(point)` 為 false（ColorPoint 還要看顏色）的對稱性破壞。這也是為什麼《Effective Java》建議「用組合（composition）取代繼承」來避免這類 equals 約定被破壞，或者對於值物件直接用 `record`（自動生成正確的 equals）。

**面試回答方式**：能列出「自反、對稱、傳遞、一致、非 null」五個約定是基本盤，若能進一步舉出「父類別與子類別混合比較時容易破壞對稱性/傳遞性」這個經典難點，並提到「用組合取代繼承」或「用 record」的解法，會明顯展現你讀過相關的深入資料（如《Effective Java》）而不只是背表面規則。

## 相關

- [[001-equals-hashcode-contract.md]]
- [[003-string-immutability-pool.md]]
- [[010-autoboxing-integer-cache.md]]
