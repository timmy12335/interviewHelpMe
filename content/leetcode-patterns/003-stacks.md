---
id: leetcode-patterns-003
category: leetcode-patterns
slug: stacks
title: Stacks：括號配對、最小堆疊與單調堆疊的 Java 範式
difficulty: medium
tags: [堆疊, 單調堆疊, Java 範式, LeetCode, NeetCode 150]
source: original
---

# 題目

用 Java 寫出堆疊的三個範式：括號配對、O(1) 取最小值的堆疊、單調堆疊找下一個更大元素，並說明它們對應哪些 LeetCode 題目。

## 核心答案

堆疊適合處理**後進先出**與**最近一個還沒配對的東西**。三個範式：一是**括號配對**，遇到左括號推入、遇到右括號就和堆頂比對；二是**最小堆疊**，用第二個堆疊同步記錄「到目前為止的最小值」；三是**單調堆疊**，堆疊裡保持遞減，新元素比堆頂大時，堆頂就找到了它的「下一個更大元素」。Java 裡用 `Deque<Integer> stack = new ArrayDeque<>()`，不要用舊的 `Stack` 類別，它繼承自 `Vector`，每個方法都有同步開銷。

## 詳細解析

**範式一，括號配對**：用 `Map` 存右括號對應的左括號，遇到右括號時堆疊為空或對不上就失敗。

```java
boolean isValid(String s) {
    Map<Character, Character> pair = Map.of(')', '(', ']', '[', '}', '{');
    Deque<Character> stack = new ArrayDeque<>();
    for (char c : s.toCharArray()) {
        if (pair.containsKey(c)) {
            char open = pair.get(c);                       // 拆箱成 char，避免比較物件參考
            if (stack.isEmpty() || stack.pop() != open) return false;
        } else {
            stack.push(c);
        }
    }
    return stack.isEmpty();                // 還有左括號沒配對也算失敗
}
```

**範式二，最小堆疊**：第二個堆疊的堆頂永遠是目前的最小值，`push` 和 `pop` 兩個堆疊同步進行。

```java
class MinStack {
    private final Deque<Integer> stack = new ArrayDeque<>();
    private final Deque<Integer> mins = new ArrayDeque<>();

    public void push(int x) {
        stack.push(x);
        mins.push(mins.isEmpty() ? x : Math.min(x, mins.peek()));
    }
    public void pop() { stack.pop(); mins.pop(); }
    public int top() { return stack.peek(); }
    public int getMin() { return mins.peek(); }
}
```

**範式三，單調堆疊**：堆疊存的是**索引**，裡面的值由底到頂遞減。新的值比堆頂大，堆頂就等到了答案，彈出並記錄距離。

```java
int[] dailyTemperatures(int[] t) {
    int[] ans = new int[t.length];
    Deque<Integer> stack = new ArrayDeque<>();           // 存索引，值遞減
    for (int i = 0; i < t.length; i++) {
        while (!stack.isEmpty() && t[i] > t[stack.peek()]) {
            int j = stack.pop();
            ans[j] = i - j;                               // j 的下一個更高溫在 i
        }
        stack.push(i);
    }
    return ans;                                           // 留在堆疊裡的都是 0
}
```

**複雜度**：三個範式都是時間 O(n)。單調堆疊雖然有兩層迴圈，但每個索引最多被推入、彈出各一次，所以是攤還 O(n)。空間都是 O(n)。

**常見錯誤**：一是括號題結束時忘了檢查堆疊是否為空，`"(("` 會被誤判為合法。二是單調堆疊存了值而不是索引，結果算不出距離。三是用 `Integer` 物件比較時寫 `==`，超過 -128 到 127 的快取範圍就會比對失敗，要用 `equals` 或先拆箱。

**對應 LeetCode 題目**：

| 題號 | 題目 | 難度 | NeetCode 150 | 用到的範式 |
|------|------|------|:---:|------|
| 20 | [Valid Parentheses](https://leetcode.com/problems/valid-parentheses/) | Easy | ✅ | 括號配對 |
| 155 | [Min Stack](https://leetcode.com/problems/min-stack/) | Medium | ✅ | 輔助堆疊 |
| 739 | [Daily Temperatures](https://leetcode.com/problems/daily-temperatures/) | Medium | ✅ | 單調堆疊 |

## 面試回答方式

先說明為什麼這題是堆疊：需要找「最近一個還沒處理完的東西」。寫單調堆疊時要講清楚堆疊裡的不變量（由底到頂遞減），以及為什麼是攤還 O(n)。Java 部分主動說用 `ArrayDeque` 而不是 `Stack`，這是很常被問到的細節。

## 講稿

我判斷要不要用堆疊，看的是題目是不是在找最近一個還沒處理完的東西。

括號配對就是最典型的例子，左括號推進去，遇到右括號就跟堆頂比，對不上或堆疊是空的就失敗，最後堆疊還有東西也算失敗。

如果要隨時拿到最小值，我會再開一個輔助堆疊，每次推入時記下到目前為止的最小值，兩個堆疊一起推一起彈，取最小值就是常數時間。

單調堆疊用在找下一個更大的元素。我在堆疊裡放索引，讓對應的值由底到頂遞減。新的值比堆頂大，就代表堆頂等到答案了，把它彈出來記錄距離。每個索引只進出一次，所以整體是線性時間。Java 我會用 ArrayDeque，不用舊的 Stack 類別。

## 常見追問

### 為什麼 Java 不建議用 Stack 類別？

**核心答案**：`Stack` 繼承自 `Vector`，所有方法都是 `synchronized`，單執行緒下有不必要的鎖開銷；它還繼承了 `Vector` 的隨機存取方法，破壞了堆疊的封裝。`ArrayDeque` 沒有這些問題，官方文件也建議用它。

**詳細解析**：另一個小差異是迭代順序。`Stack` 迭代時從底到頂，`ArrayDeque` 當堆疊用時從頂到底，若程式依賴迭代順序要特別注意。`ArrayDeque` 不允許放 `null`，這通常不是問題。

**面試回答方式**：講出 `synchronized` 與繼承 `Vector` 兩個理由即可。

### 單調堆疊什麼時候用遞增、什麼時候用遞減？

**核心答案**：找「下一個更大」用遞減堆疊，找「下一個更小」用遞增堆疊。判斷方法是：堆疊裡留著的元素都在等某個條件，新元素滿足那個條件時才會把它們彈出。

**詳細解析**：LeetCode 84 柱狀圖最大矩形要找每根柱子左右第一個更矮的，所以用遞增堆疊；739 每日溫度找下一個更高的，所以用遞減堆疊。記住「等什麼就彈什麼」比背方向可靠。

**面試回答方式**：給出「等什麼就彈什麼」這個判斷法，再各舉一題。

### 最小堆疊可以只用一個堆疊做到嗎？

**核心答案**：可以。把「推入值與當前最小值的差」存進堆疊，用一個變數記錄最小值；彈出時若差是負的，代表這個元素曾經更新過最小值，要把最小值還原回去。

**詳細解析**：這個寫法省下一個堆疊，但差值可能超出 `int` 範圍，要用 `long` 存。另一種做法是每個元素存成 `int[]{值, 當時最小值}`，空間其實和兩個堆疊相同，只是寫起來更集中。

**面試回答方式**：先給兩個堆疊的版本，追問時再提差值法，並主動指出溢位問題。

## 相關

- [[../algorithms/009-monotonic-stack-queue.md]]
- [[004-queues.md]]
- [[015-tree-traversal.md]]
