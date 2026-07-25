---
id: java-023
category: java
slug: optional-usage
title: Optional 的正確使用
difficulty: medium
tags: [Optional, null, NPE]
source: original
---

# 題目

`Optional` 是什麼？它解決了什麼問題？有哪些正確與錯誤的使用方式？

## 核心答案

`Optional`（JDK 8）是一個「可能包含值、也可能為空」的容器，用來明確表達「這個值可能不存在」的語意，取代直接回傳 null。它的主要價值是——在方法簽章上明確告訴呼叫方「這裡可能沒有值，你必須處理空的情況」，把「可能為 null」這件事從隱藏的執行期陷阱變成編譯期可見的契約，減少 `NullPointerException`。但它有正確用法（作為方法回傳值、用 `map`/`filter`/`orElse` 鏈式處理）和錯誤用法（當欄位、當方法參數、或用 `get()` 不檢查就取值）。

## 詳細解析

**解決的問題**：傳統上一個方法回傳 null 表示「沒有結果」，但呼叫方很容易忘記檢查 null 就直接使用，導致 NPE；而且從方法簽章上看不出「這個方法可能回傳 null」。`Optional<T>` 作為回傳型別，明確地在型別層面宣告「結果可能不存在」，強制呼叫方意識到並處理空的情況。

**正確用法**：

- **作為方法回傳值**：表達「這個查詢/計算可能沒有結果」，如 `Optional<User> findById(Long id)`。
- **鏈式處理**：用 `map()` 轉換值、`filter()` 過濾、`flatMap()` 串接另一個 Optional、`orElse()`/`orElseGet()` 提供預設值、`orElseThrow()` 沒值就拋例外、`ifPresent()` 有值才執行。
- 這些方法讓你優雅地處理「可能為空」的值，避免手寫 null 檢查。

**錯誤用法**：

1. **當作類別欄位**：`Optional` 沒有實作 `Serializable`、且會增加記憶體開銷，不該當欄位（欄位為空直接用 null 或設計上避免）。
2. **當作方法參數**：讓呼叫方為了傳參還要包一層 `Optional.of(...)`，很彆扭；方法參數的可選性應該用方法多載或明確的 null 處理。
3. **用 `get()` 不先檢查**：`optional.get()` 在為空時會拋 `NoSuchElementException`，直接 `get()` 而不先 `isPresent()` 檢查（或改用 `orElse`），等於把 NPE 換成另一種例外，失去了 Optional 的意義。
4. **`Optional.of(可能為 null 的值)`**：`of()` 遇到 null 會立刻拋 NPE，應該用 `Optional.ofNullable()` 處理可能為 null 的值。

## 面試回答方式

先講「Optional 解決什麼問題」——把「可能為 null」從隱藏的執行期陷阱變成型別簽章上明確的契約，強制呼叫方處理空的情況。這個「讓可能為空變得顯式」的核心價值是回答的關鍵。接著講正確用法（作回傳值、用 map/orElse 鏈式處理）和錯誤用法（當欄位、當參數、無腦 get），能列出這些「反模式」特別能展現你真的在專案中用過、踩過坑，而不只是知道有這個類別。

## 常見追問

### orElse 和 orElseGet 有什麼差異？

**核心答案**：`orElse(value)` 的參數是一個「已經計算好的值」——不管 Optional 是否有值，這個參數運算式都會被求值；`orElseGet(supplier)` 的參數是一個「延遲執行的函式（Supplier）」——只有當 Optional 為空、真的需要預設值時，這個函式才會被呼叫。所以如果預設值的計算有成本（如查資料庫、new 一個重物件），應該用 `orElseGet` 避免「即使 Optional 有值也白白計算了預設值」的浪費。

**詳細解析**：這是一個容易被忽略但影響效能的細節。考慮 `optional.orElse(createExpensiveDefault())`——不管 optional 有沒有值，`createExpensiveDefault()` 都會先被執行（因為它是方法參數，Java 是即時求值的），如果 optional 其實有值，這次昂貴的計算就完全浪費了。而 `optional.orElseGet(() -> createExpensiveDefault())` 傳入的是一個 lambda，只有當 optional 為空時才會真正呼叫這個 lambda，optional 有值時完全不執行。所以判斷準則是：如果預設值是一個已存在的常數或廉價的值，用 `orElse` 簡潔即可；如果預設值需要昂貴的計算或有副作用（如記錄日誌、發請求），一定要用 `orElseGet` 避免不必要的執行。

**面試回答方式**：講清楚「orElse 的參數總是被求值、orElseGet 的函式只在為空時才執行」，並用「昂貴的預設值計算」這個場景說明為什麼要用 orElseGet。這種能指出「一個看似等價的 API 選擇背後有效能差異」的回答，很能展現你對細節的敏感度和實務經驗。

### 為什麼不建議把 Optional 當作類別的欄位或方法參數？

**核心答案**：不建議當「欄位」是因為——`Optional` 沒有實作 `Serializable`（會讓包含它的類別無法序列化）、且每個 Optional 包裝都有額外的記憶體開銷（一個物件包一個值），欄位為空直接用 null 或在設計上避免更合適。不建議當「方法參數」是因為——這會逼呼叫方為了呼叫這個方法而把引數包成 `Optional.of(...)`，非常彆扭，可選參數應該用方法多載或直接接受可能為 null 的參數並在內部處理。`Optional` 的設計初衷就是「作為回傳值」表達可能的空結果。

**詳細解析**：`Optional` 的設計者（Brian Goetz）明確說過它的定位是「作為方法回傳值，表達『沒有結果』的情況」，而不是一個通用的「可能為 null」的包裝工具。當欄位——除了序列化和記憶體問題，還會讓類別的內部狀態管理變複雜（每次存取欄位都要處理 Optional）。當參數——考慮 `void setName(Optional<String> name)`，呼叫方要寫 `setName(Optional.of("x"))` 或 `setName(Optional.empty())`，遠不如 `setName(String name)` 直接接受 null 或提供多載清晰，而且參數是 Optional 也不能阻止呼叫方傳 null 進來（`setName(null)` 仍然合法，反而多了一種空的表達方式造成混亂）。所以 Optional 應該專注在它擅長的地方——作為回傳值，讓呼叫方明確處理「可能沒有結果」。

**面試回答方式**：分別講欄位（不可序列化、記憶體開銷）和參數（逼呼叫方彆扭包裝、擋不住 null、不如多載清晰）的問題，並點出「Optional 的設計定位就是作為回傳值」。能引用「設計者明確說過它是給回傳值用的」展現你了解這個 API 的設計意圖，這種對「工具該用在哪」有清晰認識的回答很專業。

### Optional 能完全消除 NullPointerException 嗎？

**核心答案**：不能。`Optional` 減少了 NPE 的機會（透過在簽章上明確可能為空、鼓勵用 orElse 等安全方法處理），但它本身也可能引發例外——例如對一個空的 Optional 呼叫 `get()` 會拋 `NoSuchElementException`、用 `Optional.of(null)` 會拋 NPE、Optional 變數本身也可能是 null（雖然這是嚴重的誤用）。Optional 是一個「幫助你更好地處理可能為空的值」的工具，而不是「自動消除所有空值問題」的銀彈——正確使用它才能發揮減少 NPE 的價值。

**詳細解析**：Optional 的價值在於「改變處理空值的方式」，而不是「魔法般地讓空值問題消失」。它把「隱藏的、容易被忘記檢查的 null」變成「型別簽章上明確的、鼓勵你用安全方式處理的 Optional」，但如果你錯誤地使用它（無腦 `get()`、用 `of()` 包 null、或讓 Optional 變數為 null），仍然會有例外。真正減少 NPE 靠的是——把 Optional 作為回傳值讓呼叫方意識到空的可能、並用 `map`/`orElse`/`ifPresent` 這些安全的方法處理，而不是繞過 Optional 的保護硬取值。所以 Optional 是「引導良好習慣的工具」，減少 NPE 的效果取決於你是否正確使用它。理解「工具本身不是銀彈、正確使用才有價值」是成熟的技術認知。

**面試回答方式**：明確回答「不能完全消除」，並舉出 Optional 自身可能引發的例外（空 Optional 的 get、of(null)、Optional 變數為 null），強調「它是引導良好習慣的工具、效果取決於正確使用」。這種不把新工具當銀彈、能看到它的邊界的回答，展現你有清醒務實的技術判斷，比盲目吹捧 Optional 更成熟。

## 相關

- [[024-stream-api-lazy.md]]
