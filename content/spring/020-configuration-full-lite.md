---
id: spring-020
category: spring
slug: configuration-full-lite
title: "@Configuration 的 full 模式與 lite 模式"
difficulty: hard
tags: [Configuration, proxyBeanMethods, full模式, lite模式]
source: original
---

# 題目

`@Configuration` 有 full 模式和 lite 模式之分，它們有什麼區別？`proxyBeanMethods` 這個屬性是做什麼的？

## 核心答案

`@Configuration` 預設是「full 模式」——Spring 會用 CGLIB 為配置類別生成代理，攔截其中 `@Bean` 方法的呼叫，保證「即使在配置類別內部一個 @Bean 方法呼叫另一個 @Bean 方法，返回的也是容器裡的同一個單例 Bean，而不是每次都 new 新的」。「lite 模式」則是不做這個 CGLIB 代理——當 @Bean 方法定義在非 @Configuration 類別（如 @Component）中、或設定 `@Configuration(proxyBeanMethods = false)` 時，@Bean 方法之間的呼叫就是「普通 Java 方法呼叫」，每次呼叫都會執行方法體（可能建立新物件），不保證單例。`proxyBeanMethods` 屬性就是控制這個——true（預設）是 full 模式（代理、保證單例）、false 是 lite 模式（不代理、不保證、但省去代理開銷、啟動更快）。

## 詳細解析

**問題背景——配置類別內 @Bean 方法互相呼叫**：

```java
@Configuration
class AppConfig {
    @Bean A a() { return new A(b()); }  // a 依賴 b，內部呼叫了 b()
    @Bean B b() { return new B(); }
}
```

問題——`a()` 內部呼叫 `b()`，這個 `b()` 是返回容器裡的那個單例 B，還是每次呼叫都 new 一個新 B？

**full 模式（預設，proxyBeanMethods = true）**：

- Spring 用 CGLIB 為 `AppConfig` 生成代理子類別，攔截 @Bean 方法的呼叫。
- 當 `a()` 內部呼叫 `b()`，代理攔截這個呼叫——它不是真的執行 `b()` 方法體（new 一個 B），而是「去容器裡拿已建立的單例 B」返回。
- 所以保證了——`a` 裡用的 B 和容器裡的 B（以及其他地方注入的 B）是同一個單例。維護了單例語意。

**lite 模式（proxyBeanMethods = false，或 @Bean 定義在 @Component 等非 @Configuration 類別裡）**：

- 不做 CGLIB 代理。
- `a()` 內部呼叫 `b()` 就是「普通的 Java 方法呼叫」——真的執行 `b()` 方法體，每次都 `new B()`。
- 所以 `a` 裡用的 B 是一個「新 new 的 B」，和容器裡的單例 B「不是同一個」——破壞了單例語意（如果你依賴 a 裡的 B 和容器的 B 是同一個，就出 bug）。

**proxyBeanMethods 的權衡**：

- `true`（full）：保證單例語意正確，但有 CGLIB 代理的開銷（生成代理類別、方法呼叫要經過代理）。
- `false`（lite）：省去代理開銷，啟動更快、記憶體更省，但要求「@Bean 方法之間不互相呼叫」（或不依賴互相呼叫的單例語意）。Spring Boot 為了優化啟動效能，很多內部配置類別會用 `proxyBeanMethods = false`。

## 面試回答方式

先講清楚「問題背景」——配置類別內 @Bean 方法互相呼叫時，是拿容器單例還是每次 new？這是理解 full/lite 區別的前提。然後對比兩個模式：full（CGLIB 代理攔截、拿容器單例、保證單例語意）vs lite（不代理、普通方法呼叫、每次 new、不保證單例）。`proxyBeanMethods` 就是這個開關（true=full、false=lite）。務必講出權衡——「full 保證正確但有代理開銷、lite 省開銷但要求 @Bean 方法不互相依賴單例、Spring Boot 為優化啟動常用 false」。能用具體的 `a() 呼叫 b()` 例子說清兩種模式下 B 是不是同一個，展現你真正理解這個容易忽略的機制。

## 常見追問

### 什麼時候可以安全地用 proxyBeanMethods = false？

**核心答案**：當「配置類別中的 @Bean 方法之間不互相呼叫」（或即使呼叫也不依賴『返回同一個單例』的語意）時，可以安全地用 `proxyBeanMethods = false`。也就是說——如果你的 @Bean 方法都是獨立的（各自 new 各自的物件、不在方法內部呼叫其他 @Bean 方法來獲取依賴），那麼有沒有 CGLIB 代理都無所謂（反正沒有互相呼叫），這時關掉代理（lite 模式）能省去代理開銷、加快啟動。反之，如果 @Bean 方法之間有互相呼叫且依賴「拿到的是容器單例」，就必須用 full 模式（proxyBeanMethods = true）。實務中，如果 @Bean 之間需要依賴，更推薦的寫法是「透過方法參數注入依賴」而非「內部呼叫另一個 @Bean 方法」——這樣天然不依賴代理。

**詳細解析**：判斷能否用 lite 模式的關鍵是「@Bean 方法之間有沒有『需要拿到單例的互相呼叫』」。如果沒有——每個 @Bean 方法獨立地建立自己的物件、不去呼叫其他 @Bean 方法——那麼 CGLIB 代理就沒有用武之地（它的作用就是攔截這種互相呼叫），關掉它純省開銷。如果有——一個 @Bean 方法內部呼叫另一個 @Bean 方法來獲取依賴、且依賴這個依賴是容器裡的單例——那就必須 full 模式。實務中有一個更好的做法能徹底避開這個問題——「透過方法參數注入依賴」而非「內部呼叫」：`@Bean A a(B b) { return new A(b); }`（B 作為方法參數，由 Spring 注入容器裡的單例 B）而不是 `@Bean A a() { return new A(b()); }`（內部呼叫 b()）。前者不管 full/lite 模式都能正確拿到單例 B（因為 B 是 Spring 注入的參數、必然是容器單例），所以用方法參數注入的寫法可以安全地開 lite 模式。這也是為什麼 Spring Boot 能大量使用 proxyBeanMethods = false——它的配置類別大多用參數注入依賴、不靠 @Bean 方法互相呼叫。理解這個判斷和「參數注入」的更優寫法，展現你理解如何安全地優化配置類別。

**面試回答方式**：講出「@Bean 方法之間不互相呼叫（或不依賴拿單例）時可安全用 lite 模式、省代理開銷」。給出更好的實踐——「用方法參數注入依賴（@Bean A a(B b)）而非內部呼叫 b()，這樣不管 full/lite 都能正確拿單例、可安全開 lite」。能點出「Spring Boot 大量用 proxyBeanMethods=false 就是因為它用參數注入」，展現你理解安全優化配置類別的方法。

### 為什麼 Spring Boot 的很多自動配置類別用 proxyBeanMethods = false？

**核心答案**：主要是為了「優化啟動效能」。`proxyBeanMethods = true`（full 模式）需要為每個 @Configuration 類別用 CGLIB 生成代理子類別，這個「生成代理」的過程在啟動時是有開銷的（尤其自動配置類別數量很多時，累積的代理生成開銷可觀）。Spring Boot 的自動配置類別數量龐大（幾百個），如果每個都做 CGLIB 代理，會拖慢啟動。而這些自動配置類別大多「不依賴 @Bean 方法之間的互相呼叫」（它們用方法參數注入依賴），所以可以安全地關掉代理（proxyBeanMethods = false）——省去大量代理生成的開銷，明顯加快應用啟動速度。這是 Spring Boot 為啟動效能做的優化之一。

**詳細解析**：這是一個「大規模場景下的效能優化」的好例子。單個 @Configuration 類別的 CGLIB 代理開銷不大，但 Spring Boot 有幾百個自動配置類別——如果每個都全模式代理，累積的「掃描、生成代理子類別」的啟動開銷就變得可觀了。Spring Boot 團隊意識到——這些自動配置類別的 @Bean 方法幾乎都是用「方法參數注入依賴」的寫法（`@Bean X x(Y y, Z z) {...}`），本來就不依賴 @Bean 方法之間的互相呼叫，所以 full 模式的代理對它們毫無必要。於是把它們統一設為 `proxyBeanMethods = false`（lite 模式），省掉所有這些不必要的代理生成，明顯縮短了啟動時間（Spring Boot 一直在優化啟動速度，這是其中一項）。這也給我們一個啟示——寫自己的配置類別時，如果用方法參數注入依賴（好習慣），也可以放心地用 proxyBeanMethods = false 來優化啟動。理解這個優化，展現你既懂 full/lite 機制、又了解 Spring Boot 如何在大規模場景下運用它做效能優化。

**面試回答方式**：講出「為了優化啟動效能——full 模式要 CGLIB 生成代理、Spring Boot 幾百個自動配置類別累積的代理開銷可觀、而它們用參數注入依賴不需要代理、所以設 proxyBeanMethods=false 省開銷加快啟動」。能點出「這給我們的啟示是自己的配置類別用參數注入時也可以開 lite 優化」，展現你理解這個優化的動機和可借鑑之處。

### full 模式的 CGLIB 代理和 AOP 的 CGLIB 代理是一回事嗎？

**核心答案**：不是同一個代理，但都用了 CGLIB 這個技術。它們是「為了不同目的、在不同時機、對不同對象」生成的代理——full 模式的 CGLIB 代理是「為 @Configuration 配置類別生成的」，目的是「攔截 @Bean 方法的呼叫、保證返回容器單例」；AOP 的 CGLIB 代理是「為業務 Bean（如 Service）生成的」，目的是「在業務方法前後織入橫切邏輯（交易、日誌）」。兩者都借用 CGLIB「生成子類別作為代理」的能力，但代理的對象（配置類別 vs 業務 Bean）、攔截的目的（維護單例 vs 織入切面）完全不同，是兩套獨立的機制。

**詳細解析**：這題容易混淆是因為「都是 CGLIB 代理」，但它們解決的是完全不同的問題。CGLIB 只是一個「動態生成子類別作為代理」的底層工具，Spring 在不同地方為不同目的都用到了它——一處是 @Configuration 的 full 模式（代理配置類別、攔截 @Bean 方法、讓內部呼叫返回容器單例而非 new），另一處是 AOP（代理業務 Bean、攔截業務方法、織入交易/日誌等橫切邏輯）。可以類比——CGLIB 像一種「通用的攔截技術」，Spring 在「維護配置類別的單例語意」和「實現 AOP 織入」這兩個不同的需求上，都用了這個技術，但生成的是不同的代理、服務不同的目的。理解「同一個底層技術（CGLIB）被用於不同的機制（配置代理 vs AOP 代理）」，能避免把兩者混為一談，也展現你對 Spring 內部機制的清晰區分——它們碰巧用了同樣的底層工具，但是兩件不同的事。

**面試回答方式**：講出「不是同一個代理、但都用 CGLIB 技術——full 模式代理配置類別（攔截 @Bean 方法保證單例）、AOP 代理業務 Bean（織入橫切邏輯）、目的和對象都不同、是兩套獨立機制」。能用「CGLIB 是通用攔截技術、被用於兩個不同需求」的類比說明，展現你能清晰區分這兩個都用 CGLIB 但完全不同的機制。

## 相關

- [[014-springbootapplication-annotation.md]]
- [[006-aop-concept.md]]
- [[../java/014-dynamic-proxy-jdk-vs-cglib.md]]
