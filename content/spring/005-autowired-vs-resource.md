---
id: spring-005
category: spring
slug: autowired-vs-resource
title: "@Autowired 與 @Resource 的差異"
difficulty: easy
tags: [Autowired, Resource, 注入]
source: original
---

# 題目

`@Autowired` 和 `@Resource` 有什麼差異？當一個介面有多個實作時，如何指定注入哪一個？

## 核心答案

`@Autowired` 是 Spring 提供的註解，預設「按型別（byType）」注入；`@Resource` 是 JSR-250 標準註解（不綁定 Spring），預設「按名稱（byName）」注入。當一個介面有多個實作時，型別注入會有歧義（Spring 不知道注入哪個），此時可以——用 `@Autowired` 搭配 `@Qualifier("beanName")` 指定名稱、或搭配 `@Primary` 標記首選實作、或直接用 `@Resource(name="beanName")` 按名稱指定，來消除歧義。

## 詳細解析

**`@Autowired`（Spring）**：

- 預設按「型別」注入——找容器中型別匹配的 Bean。
- 如果型別匹配到多個，會退化為按「名稱」匹配（用欄位名/參數名去匹配 Bean 名稱）。
- 如果還是無法確定唯一，拋 `NoUniqueBeanDefinitionException`。
- 預設要求依賴必須存在（找不到會報錯），可用 `@Autowired(required=false)` 允許不存在。
- 可搭配 `@Qualifier` 指定具體 Bean 名稱。

**`@Resource`（JSR-250 標準）**：

- 是 Java 標準註解（`javax.annotation`/`jakarta.annotation`），不綁定 Spring（換框架也能用）。
- 預設按「名稱」注入——用 `@Resource(name="xxx")` 指定的名稱、或欄位名去匹配 Bean。
- 如果按名稱找不到，會退化為按型別匹配。

**多實作時如何消除歧義**：

假設 `PaymentService` 介面有 `AlipayService` 和 `WechatPayService` 兩個實作直接 `@Autowired PaymentService` 會歧義。解法：

1. **`@Qualifier`**：`@Autowired @Qualifier("alipayService") PaymentService service;` 明確指定名稱。
2. **`@Primary`**：在某個實作類別上標 `@Primary`，把它設為「預設首選」，`@Autowired` 歧義時優先選它。
3. **`@Resource(name=...)`**：`@Resource(name="alipayService")` 直接按名稱注入。
4. **欄位名匹配**：`@Autowired PaymentService alipayService;`（欄位名叫 alipayService）——利用型別歧義時退化為名稱匹配。

## 面試回答方式

先講兩者的核心差異——`@Autowired` 是 Spring 的、預設按型別；`@Resource` 是 JSR-250 標準的、預設按名稱。這是這題的主軸。多實作消歧義是必考的延伸，要能列出幾種解法（@Qualifier、@Primary、@Resource 按名稱），並理解它們的差異——@Primary 是「設一個預設首選」、@Qualifier 是「明確指定這一次要哪個」。能點出「@Resource 是標準註解、不綁 Spring」這個區別，展現你理解兩者不只是用法差異還有「標準 vs 框架」的定位差異。

## 常見追問

### @Autowired 按型別注入時，如果匹配到多個 Bean，Spring 怎麼處理？

**核心答案**：`@Autowired` 按型別匹配到多個 Bean 時，會依序嘗試消除歧義——先看有沒有某個 Bean 被 `@Primary` 標記（有就選它）；如果沒有 @Primary，再嘗試按「名稱」匹配（用欄位名或參數名去和 Bean 名稱比對，比對上就選那個）；如果 @Primary 和名稱匹配都無法確定唯一，就拋出 `NoUniqueBeanDefinitionException`，提示存在多個候選、無法確定注入哪一個。

**詳細解析**：這是 `@Autowired` 的完整解析邏輯，理解它能解釋很多「為什麼有時多實作也能注入成功、有時報錯」的現象。順序是——型別匹配（找到候選集）→ 如果唯一直接用 → 如果多個，看 @Primary → 沒 @Primary 看名稱匹配（欄位名/參數名 == Bean 名）→ 都不行就報錯。這也解釋了一個常見的「巧合成功」——如果你的欄位名剛好等於某個實作的 Bean 名（如欄位叫 `alipayService`、正好有個 Bean 叫 alipayService），即使有多個實作，@Autowired 也能透過名稱匹配成功注入，不會報錯。這種「靠欄位名匹配」雖然能用，但不夠明確（依賴命名巧合），更推薦顯式用 @Qualifier 或 @Primary 表達意圖。理解這個解析順序，展現你對 @Autowired 的行為有精確掌握，能解釋各種注入成功/失敗的情況。

**面試回答方式**：講出完整解析順序——「型別匹配多個時，先看 @Primary、再按名稱（欄位名/參數名）匹配、都不行才拋 NoUniqueBeanDefinitionException」。能點出「欄位名剛好等於某 Bean 名會巧合注入成功、但更推薦顯式 @Qualifier/@Primary」，展現你理解 @Autowired 的完整行為和最佳實踐。

### @Qualifier 和 @Primary 有什麼區別？什麼時候用哪個？

**核心答案**：`@Primary` 是「在候選 Bean 上標記一個預設首選」——當發生型別歧義時，優先選這個被標記的，它是「全域的、被動的預設值」。`@Qualifier` 是「在注入點指定這一次要哪個具體 Bean」——它是「局部的、主動的指定」。用法上：如果多個實作中有一個是「大多數情況下的預設選擇」，用 `@Primary` 標記它（省得每處注入都指定）；如果不同的注入點需要注入不同的實作，就在各個注入點用 `@Qualifier` 分別明確指定。兩者可以並存——用 @Primary 定預設，個別需要例外的注入點用 @Qualifier 覆蓋。

**詳細解析**：兩者的定位差異是「預設 vs 指定」「全域 vs 局部」。`@Primary` 標在 Bean 定義上，影響的是「所有沒有明確指定的型別注入」——它說「如果沒人特別指定要哪個，就用我」。適合有一個明顯的主要實作的場景（例如系統主要用 Alipay，就把 AlipayService 標 @Primary，大部分注入自動用它）。`@Qualifier` 標在注入點上，影響的是「這一個具體的注入」——它說「這裡我就要這個名字的 Bean」。適合不同地方要注入不同實作的場景。當兩者衝突時，`@Qualifier` 優先（局部的明確指定勝過全域的預設），所以典型用法是「@Primary 定一個大眾預設、少數特殊注入點用 @Qualifier 精確指定」。理解這個「全域預設 vs 局部指定」的區別和它們的優先關係，展現你不只會用還理解它們的設計定位。

**面試回答方式**：講出「@Primary 是全域預設首選（標在 Bean 上）、@Qualifier 是局部精確指定（標在注入點）、衝突時 @Qualifier 優先」。給出使用建議——「有主要實作用 @Primary 定預設、不同注入點要不同實作用 @Qualifier」。這種能區分「預設 vs 指定、全域 vs 局部」並說明配合用法的回答，展現你對這兩個註解的理解到位。

### @Autowired 可以標在哪些地方？欄位注入為什麼不被推薦？

**核心答案**：`@Autowired` 可以標在——欄位、建構子、setter 方法、以及普通方法（參數會被注入）上。欄位注入（直接標在欄位上）雖然最簡潔，但不被推薦，因為——它讓依賴變成「隱藏的」（從類別的公開 API/建構子看不出這個類別依賴什麼）、無法把欄位宣告為 `final`（不能保證依賴不可變）、且脫離 Spring 容器就無法注入（測試時要靠反射（Reflection）或啟動容器，不能簡單地 new 出來傳 mock）。相比之下建構子注入沒有這些問題，是現在推薦的方式。

**詳細解析**：這題和依賴注入方式的選擇（見 [[001-ioc-di-concept.md]]）高度相關。欄位注入的三個主要問題——**隱藏依賴**：一個類別依賴什麼，理想情況應該從它的建構子一目了然（「要建立我，你必須給我這些」），但欄位注入把依賴藏在了類別內部的欄位上，從外部看不出來，不利於理解和維護。**無法 final**：欄位注入是在物件建立「之後」透過反射設值的，所以欄位不能是 final（final 欄位必須在建構時賦值），失去了「依賴不可變」的保證。**難以測試**：欄位注入依賴 Spring 容器來設值，脫離容器（如單元測試中直接 new 這個類別）時欄位會是 null，要注入 mock 只能用反射或啟動容器，很麻煩；而建構子注入的類別，測試時直接 `new XxxService(mockDao)` 就好。正因這些問題，Spring 官方和主流社群都推薦建構子注入。理解「欄位注入簡潔但有隱藏成本」，展現你有超越「能用就好」的程式碼品質意識。

**面試回答方式**：講出 @Autowired 能標的位置（欄位、建構子、setter、方法），並重點論述欄位注入不被推薦的三個原因（隱藏依賴、不可 final、難測試），對比建構子注入的優勢。能連結到「這也是為什麼推薦建構子注入」，展現你對依賴注入最佳實踐的理解是一致和成體系的。

## 相關

- [[001-ioc-di-concept.md]]
- [[019-stereotype-annotations.md]]
