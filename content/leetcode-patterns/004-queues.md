---
id: leetcode-patterns-004
category: leetcode-patterns
slug: queues
title: Queues：雙堆疊佇列、環形佇列與單調佇列的 Java 範式
difficulty: medium
tags: [佇列, 單調佇列, Deque, Java 範式, LeetCode, NeetCode 150]
source: original
---

# 題目

用 Java 寫出佇列的三個範式：用兩個堆疊實作佇列、固定容量的環形佇列、用單調佇列求滑動視窗最大值，並說明它們對應哪些 LeetCode 題目。

## 核心答案

佇列是**先進先出**，在演算法題裡最常以三種形態出現。一是**雙堆疊佇列**，一個負責進、一個負責出，出的那個空了才把進的整批倒過去，攤還 O(1)；二是**環形佇列**，用固定陣列加 `head` 與 `size`，索引對容量取餘數繞回來；三是**單調佇列**，用 `Deque` 維持遞減，隊頭永遠是視窗內的最大值。BFS 也是佇列的典型應用，另有一頁。Java 裡用 `Queue<Integer> q = new ArrayDeque<>()`，`offer`、`poll`、`peek` 在佇列為空時回傳 `null` 而不丟例外。

## 詳細解析

**範式一，雙堆疊佇列**：只有 `out` 空了才搬，每個元素最多被搬一次，所以攤還每次操作 O(1)。

```java
class MyQueue {
    private final Deque<Integer> in = new ArrayDeque<>();
    private final Deque<Integer> out = new ArrayDeque<>();

    public void push(int x) { in.push(x); }
    public int pop() { move(); return out.pop(); }
    public int peek() { move(); return out.peek(); }
    public boolean empty() { return in.isEmpty() && out.isEmpty(); }

    private void move() {
        if (out.isEmpty()) {
            while (!in.isEmpty()) out.push(in.pop());   // 整批倒過去，順序就反過來了
        }
    }
}
```

**範式二，環形佇列**：記錄 `head` 和 `size`，尾端位置用算的，避免「滿」和「空」都是 `head == tail` 的歧義。

```java
class MyCircularQueue {
    private final int[] data;
    private int head = 0, size = 0;

    public MyCircularQueue(int k) { data = new int[k]; }

    public boolean enQueue(int v) {
        if (isFull()) return false;
        data[(head + size) % data.length] = v;
        size++;
        return true;
    }
    public boolean deQueue() {
        if (isEmpty()) return false;
        head = (head + 1) % data.length;
        size--;
        return true;
    }
    public int Front() { return isEmpty() ? -1 : data[head]; }
    public int Rear() { return isEmpty() ? -1 : data[(head + size - 1) % data.length]; }
    public boolean isEmpty() { return size == 0; }
    public boolean isFull() { return size == data.length; }
}
```

**範式三，單調佇列**：`Deque` 存索引、值由頭到尾遞減。新元素進來前，把尾端比它小的都踢掉（它們不可能再當最大值）；隊頭若已滑出視窗就從頭端移除。

```java
int[] maxSlidingWindow(int[] nums, int k) {
    int[] ans = new int[nums.length - k + 1];
    Deque<Integer> dq = new ArrayDeque<>();
    for (int i = 0; i < nums.length; i++) {
        while (!dq.isEmpty() && nums[dq.peekLast()] <= nums[i]) dq.pollLast();
        dq.offerLast(i);
        if (dq.peekFirst() <= i - k) dq.pollFirst();      // 隊頭已不在視窗內
        if (i >= k - 1) ans[i - k + 1] = nums[dq.peekFirst()];
    }
    return ans;
}
```

**複雜度**：雙堆疊佇列每次操作攤還 O(1)；環形佇列每次 O(1)；單調佇列總共 O(n)，因為每個索引只進出一次，空間 O(k)。

**常見錯誤**：一是雙堆疊佇列在 `out` 還有元素時就把 `in` 倒過去，順序會亂掉。二是環形佇列只用 `head` 和 `tail` 兩個指標，結果分不出滿和空。三是單調佇列存值而不是索引，無法判斷隊頭是否已經滑出視窗。

**對應 LeetCode 題目**：

| 題號 | 題目 | 難度 | NeetCode 150 | 用到的範式 |
|------|------|------|:---:|------|
| 232 | [Implement Queue using Stacks](https://leetcode.com/problems/implement-queue-using-stacks/) | Easy | | 雙堆疊佇列 |
| 622 | [Design Circular Queue](https://leetcode.com/problems/design-circular-queue/) | Medium | | 環形陣列 |
| 239 | [Sliding Window Maximum](https://leetcode.com/problems/sliding-window-maximum/) | Hard | ✅ | 單調佇列 |

## 面試回答方式

設計題先講介面與不變量，再寫程式。雙堆疊佇列要主動說出攤還分析：每個元素最多進出兩個堆疊各一次。單調佇列要說清楚「為什麼比新元素小的可以直接丟掉」：它們比新元素早離開視窗、值又比較小，之後不可能成為最大值。

## 講稿

佇列在題目裡最常見的有三種用法。

第一種是用兩個堆疊做佇列。一個專門負責進，一個專門負責出，出的那個空了，才把進的那個整批倒過去，順序剛好反轉成先進先出。每個元素最多被搬一次，所以平均下來每次操作都是常數時間。

第二種是固定容量的環形佇列。我會記錄隊頭位置和目前的數量，隊尾用算的，索引對容量取餘數繞回來，這樣就不會有滿和空分不清楚的問題。

第三種是單調佇列，用來求滑動視窗的最大值。佇列裡放索引，值從頭到尾遞減。新元素進來前，先把尾端比它小的都移掉，因為它們比較早離開又比較小，不可能再當最大值。隊頭如果滑出視窗就從前面移掉，隊頭就是答案。

## 常見追問

### Java 的 Queue 介面 add 和 offer 有什麼差別？

**核心答案**：`add`、`remove`、`element` 失敗時丟例外；`offer`、`poll`、`peek` 失敗時回傳 `false` 或 `null`。刷題時一律用後者，判斷空佇列比較直覺。

**詳細解析**：對 `ArrayDeque` 這類無界佇列，`add` 和 `offer` 實際上都不會失敗，差別主要在取出端：空佇列呼叫 `remove()` 會丟 `NoSuchElementException`，`poll()` 則回傳 `null`。要注意 `poll()` 回傳 `Integer`，直接指定給 `int` 時若為 `null` 會丟 `NullPointerException`。

**面試回答方式**：講清楚兩組方法的失敗行為，並提一下自動拆箱的空指標風險。

### 單調佇列和單調堆疊差在哪？

**核心答案**：單調堆疊只從一端進出，用來找「下一個更大或更小」；單調佇列兩端都要操作，尾端維持單調、頭端移除過期元素，用來求「滑動視窗內的最值」。

**詳細解析**：兩者的尾端邏輯完全一樣，差別只在單調佇列多了「隊頭過期就移除」這一步，所以它需要 `Deque` 而不是普通堆疊。理解這點後兩者可以看成同一個工具的兩種用法。

**面試回答方式**：用「多了頭端過期移除」一句話區分兩者。

### 用最大堆也能求滑動視窗最大值，為什麼要用單調佇列？

**核心答案**：最大堆的做法是 O(n log n)，而且要用延遲刪除處理滑出視窗的元素；單調佇列是 O(n)，寫起來也更短。

**詳細解析**：最大堆存 `{值, 索引}`，每次取堆頂時檢查索引是否還在視窗內，不在就彈掉再看下一個。這個做法正確，但每次進堆都是 O(log n)。單調佇列利用「比新元素小的舊元素永遠沒用」這個性質，把它們提前丟掉，所以能做到線性。

**面試回答方式**：可以先說堆的做法作為起點，再優化到單調佇列，展現從可行解到最佳解的推導。

## 相關

- [[../algorithms/009-monotonic-stack-queue.md]]
- [[003-stacks.md]]
- [[016-dfs-and-bfs.md]]
- [[021-sliding-window.md]]
