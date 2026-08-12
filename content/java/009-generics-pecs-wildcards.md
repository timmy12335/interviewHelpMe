---
id: java-009
category: java
slug: generics-pecs-wildcards
title: 泛型通配符與 PECS 原則
difficulty: hard
tags: [泛型, 通配符, PECS]
source: original
---

# 題目

`? extends T` 和 `? super T` 有什麼差異？什麼是 PECS 原則？

## 核心答案

`? extends T` 是「上界通配符」，表示「T 或 T 的某個子型別」，只能讀取（取出的元素保證是 T）不能寫入；`? super T` 是「下界通配符」，表示「T 或 T 的某個父型別」，可以寫入 T（或 T 的子型別）但讀取只能當作 `Object`。PECS 原則（Producer Extends, Consumer Super）是選用準則：如果一個結構是「生產者」（你從中讀取資料）就用 `extends`，如果是「消費者」（你往裡面寫入資料）就用 `super`。

## 詳細解析

**為什麼需要通配符**：Java 泛型是「不變（invariant）」的——`List<Integer>` 不是 `List<Number>` 的子型別即使 `Integer` 是 `Number` 的子型別。這在需要「接受一個裝著某種 Number 子型別的 List」時很不方便，通配符就是用來放寬這種限制的。

**`? extends T`（上界生產者）**：`List<? extends Number>` 可以指向 `List<Integer>`、`List<Double>` 等。因為編譯器只知道「元素是某種 Number 的子型別，但不確定具體是哪一種」，所以：

- **可以讀取**：取出的元素一定是 `Number`（或其子型別），賦值給 `Number` 型別是安全的。
- **不能寫入**：你不知道這個 List 實際上是 `List<Integer>` 還是 `List<Double>`，往裡面塞任何具體型別都可能型別不符，所以除了 `null` 什麼都不能加。

**`? super T`（下界消費者）**：`List<? super Integer>` 可以指向 `List<Integer>`、`List<Number>`、`List<Object>`。因為編譯器知道「元素型別是 Integer 或其某個父型別」，所以：

- **可以寫入 Integer（或其子型別）**：不管實際是 `List<Number>` 還是 `List<Object>`塞一個 `Integer` 進去一定型別相容。
- **讀取只能當 Object**：取出的元素可能是 Integer 的任何父型別，唯一確定的共同上界是 `Object`。

**PECS 原則**：Producer-Extends, Consumer-Super。

- 如果參數是一個你要「從中取資料」的生產者（Producer），用 `? extends T`。
- 如果參數是一個你要「往中放資料」的消費者（Consumer），用 `? super T`。
- 經典例子是 `Collections.copy(List<? super T> dest, List<? extends T> src)`——來源是生產者（讀取）用 extends，目的地是消費者（寫入）用 super。

## 面試回答方式

先講「為什麼需要通配符」（泛型是不變的，`List<Integer>` 不是 `List<Number>` 的子型別），這是理解通配符動機的前提。接著把 `extends`（能讀不能寫）和 `super`（能寫、讀只能當 Object）的行為對比講清楚，並解釋「為什麼」——關鍵是「編譯器對實際型別的已知程度」。最後用 PECS 這個口訣收尾，並舉 `Collections.copy` 這個經典例子。能講出「為什麼 extends 不能寫、super 讀只能當 Object」的推理過程，比只背口訣強得多。

## 常見追問

### 為什麼 List<? extends Number> 不能 add 元素（除了 null）？

**核心答案**：因為 `List<? extends Number>` 只告訴編譯器「這是一個裝著某種 Number 子型別的 List，但不確定具體是哪一種」——它可能實際是 `List<Integer>`、`List<Double>` 或 `List<Number>`。如果允許 add，你想加一個 `Integer`，但這個 List 實際上可能是 `List<Double>`加入 `Integer` 就破壞了型別安全，所以編譯器保守地禁止加入任何具體型別的元素（只有 `null` 是安全的，因為 null 相容於任何型別）。

**詳細解析**：這個限制的本質是「編譯器基於它所知道的資訊做最保守的安全保證」。當你用 `? extends Number`，你放棄了「知道 List 確切元素型別」的能力，換取了「能接受多種 Number 子型別的 List」的靈活性；代價就是不能寫入——因為編譯器無法保證你寫入的型別和這個 List 的真實型別相容。這也正是 PECS 中「Producer Extends」的由來：`extends` 的 List 只適合當「生產者」（你從裡面讀 Number 出來，一定安全），不適合當「消費者」（往裡面寫，不安全）。

**面試回答方式**：用「List 的真實型別不確定，寫入可能型別不符」這個具體推理回答，最好舉「宣告成 `? extends Number` 但實際可能是 `List<Double>`，此時 add 一個 Integer 就錯了」的例子，展現你理解這個限制是編譯器為了型別安全做的必要保守決策，而不是隨意的規定。

### Collections.copy 的簽章為什麼一個用 extends 一個用 super？

**核心答案**：`Collections.copy(List<? super T> dest, List<? extends T> src)` 中`src`（來源）是「生產者」——你從它讀出元素，用 `? extends T` 保證讀出的一定是 T；`dest`（目的地）是「消費者」——你把元素寫進它，用 `? super T` 保證能安全寫入 T。這正是 PECS 原則的教科書級應用。

**詳細解析**：copy 的動作是「從 src 讀出元素，寫入 dest」。對 src，我們只需要「能讀出 T」，用 `? extends T` 讓它能接受「裝著 T 或 T 的子型別的 List」（例如 src 是 `List<Integer>`，T 是 Number，讀出來當 Number 用沒問題）。對 dest，我們需要「能寫入 T」，用 `? super T` 讓它能接受「裝著 T 或 T 的父型別的 List」（例如 dest 是 `List<Object>`，T 是 Number，把 Number 寫進去沒問題）。這樣的簽章讓 copy 能在最大範圍的型別組合下使用，同時保證型別安全——這就是為什麼理解 PECS 能讓你設計出既靈活又安全的泛型 API。

**面試回答方式**：把 copy 的動作拆成「從 src 讀（生產者用 extends）、往 dest 寫（消費者用 super）」，逐一對應到 PECS，這種用一個真實 API 印證原則的回答，比抽象背誦「Producer Extends Consumer Super」更能證明你真正理解並能應用。

### 無界通配符 List<?> 和 List<Object> 有什麼差異？

**核心答案**：`List<?>` 表示「某種未知型別的 List」（可以指向 `List<String>`、`List<Integer>` 等任何 List），但不能往裡面寫入任何元素（除了 null）；`List<Object>` 是「明確裝 Object 的 List」，可以寫入任何物件，但它只能指向 `List<Object>` 本身不能指向 `List<String>`（因為泛型不變）。兩者一個是「唯讀的、能接受任何 List」，一個是「可寫的、但只接受 Object 的 List」。

**詳細解析**：`List<?>` 常用於「我只想遍歷/讀取這個 List，不在乎也不需要知道它的元素型別」的場景，例如寫一個「印出任何 List 所有元素」的工具方法——用 `List<?>` 能接受任何 List，但因為不知道元素型別所以只能唯讀（取出的元素當 `Object`）。`List<Object>` 則是一個確切型別的 List，你可以自由讀寫 Object，但它不能接受 `List<String>` 作為引數（`List<String>` 不是 `List<Object>` 的子型別，這是泛型不變性）。理解這個差異的關鍵是：`List<?>` 是「型別未知所以只能唯讀」，`List<Object>` 是「型別確定為 Object 所以可讀寫但不通用」。

**面試回答方式**：用「`List<?>` 通用但唯讀、`List<Object>` 可寫但不通用（只接受 Object 的 List）」這組對比回答，並點出根源是「泛型不變性讓 `List<String>` 不是 `List<Object>` 的子型別」，展現你把通配符和泛型不變性這兩個概念串起來理解。

## 相關

- [[008-generics-type-erasure.md]]
