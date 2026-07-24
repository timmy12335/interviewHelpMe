---
id: java-concurrency-022
category: java-concurrency
slug: double-checked-locking-singleton
title: 雙重檢查鎖定（DCL）單例為什麼必須加 volatile
difficulty: hard
tags: [單例模式, DCL, volatile, 指令重排]
source: original
---

# 題目

實作執行緒安全的單例模式時，雙重檢查鎖定（Double-Checked Locking）寫法為什麼實例變數必須加 `volatile`？不加會有什麼問題？

## 核心答案

物件的建立在 JVM 層面並非單一原子操作，而是可以拆解成「分配記憶體」「初始化物件」「把引用指向記憶體位址」三個步驟，這三步在沒有 `volatile` 的情況下可能被指令重排（先把引用指向記憶體、再初始化物件）。如果不加 `volatile`，另一個執行緒可能拿到一個「引用不為 null，但物件尚未初始化完成」的半成品物件，導致難以重現的偶發性 bug。

## 詳細解析

**典型的雙重檢查鎖定寫法**：

```java
public class Singleton {
    private static volatile Singleton instance;

    public static Singleton getInstance() {
        if (instance == null) {                  // 第一次檢查（無鎖，避免每次都進 synchronized）
            synchronized (Singleton.class) {
                if (instance == null) {           // 第二次檢查（防止多執行緒都通過第一次檢查後重複建立）
                    instance = new Singleton();
                }
            }
        }
        return instance;
    }
}
```

**為什麼要「雙重檢查」**：第一次檢查是為了避免每次呼叫 `getInstance()` 都要進入 `synchronized` 區塊（大部分呼叫發生在實例已經建立之後，直接返回即可，不需要加鎖付出效能代價）；第二次檢查是為了防止多個執行緒同時通過第一次檢查（此時 `instance` 還是 `null`）後，都嘗試進入同步區塊，若不做第二次檢查，會導致實例被重複建立多次。

**`new Singleton()` 為什麼不是原子操作**：JVM 建立一個物件大致包含三個步驟：

1. 分配一塊記憶體空間。
2. 在這塊記憶體上執行建構子，初始化物件的欄位。
3. 把 `instance` 這個引用指向剛才分配的記憶體位址。

在沒有 `volatile` 限制的情況下，編譯器或處理器可能為了效能，把步驟 2 和步驟 3 重排——先把 `instance` 指向記憶體位址（此時 `instance != null`），稍後才真正執行建構子完成初始化。

**不加 `volatile` 的實際風險**：假設執行緒 A 正在建立實例，剛好發生了上述重排：`instance` 已經指向記憶體位址但建構子還沒執行完；此時執行緒 B 呼叫 `getInstance()`，第一次檢查發現 `instance != null`，直接返回這個「還沒初始化完成」的半成品物件引用，B 後續使用這個物件的欄位時，可能讀到欄位的預設值（如 `0`、`null`）而非建構子應該設定的值，產生極難重現、只在特定時序下才出現的詭異 bug。

**`volatile` 如何解決這個問題**：`volatile` 會在寫入時插入 StoreStore 記憶體屏障，禁止「物件初始化」與「引用賦值」這兩個寫操作被重排；同時保證寫入對其他執行緒立即可見。這樣一來，只要其他執行緒透過第一次檢查看到 `instance != null`，就能保證此時建構子已經完整執行完畢，不會拿到半成品物件。

**替代方案**：如果不想處理這麼多細節，也可以用「靜態內部類別持有者模式（Initialization-on-demand Holder）」，利用 JVM 保證類別初始化過程本身的執行緒安全（類別載入鎖）來實現延遲初始化的單例，程式碼更簡潔且不需要顯式加鎖或 `volatile`；或者直接用 `enum` 實作單例，由 JVM 保證列舉常數只會被建立一次。

## 常見追問

- 「靜態內部類別持有者模式」是怎麼利用類別載入機制保證執行緒安全的？
- 為什麼用 `enum` 實作單例能天然防止反序列化、反射攻擊破壞單例（`enum` 的這些機制由 JVM 層級保證）？
- 如果單例類別本身很「重」（建立成本高），餓漢式（類別載入時就建立）和懶漢式（延遲到第一次使用才建立）該怎麼取捨？

## 相關

- [[002-volatile-semantics.md]]
- [[003-jmm-happens-before.md]]
