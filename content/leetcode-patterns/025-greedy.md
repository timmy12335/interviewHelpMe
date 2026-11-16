---
id: leetcode-patterns-025
category: leetcode-patterns
slug: greedy
title: Greedy：最遠可達、按層跳躍與區間切分的 Java 範式
difficulty: medium
tags: [貪心, 區間, 跳躍遊戲, Java 範式, LeetCode, NeetCode 150]
source: original
---

# 題目

用 Java 寫出貪心的三個範式：維護「目前最遠可達」、用「層」的概念求最少步數、以及用每個元素的最後出現位置切分區間，並說明它們對應哪些 LeetCode 題目。

## 核心答案

貪心是每一步都做**當下最好的選擇**，而且**永不回頭**。它比 DP 快，但只有在能證明「局部最優會導向全域最優」時才正確，所以寫貪心一定要附上論證，或至少試著找反例。三個範式：一是**維護最遠可達**，掃過每個位置時更新能到達的最遠處，若目前位置超過它就到不了；二是**按層跳躍**，把「一步能到的範圍」當作一層，跨出這層時步數加一，本質是隱式 BFS；三是**區間切分**，先記錄每個字元最後出現的位置，掃描時延伸當前區段的結尾，走到結尾就切一刀。

## 詳細解析

**範式一，維護最遠可達**：只要目前位置在可達範圍內，就用它更新最遠可達。

```java
boolean canJump(int[] nums) {
    int far = 0;
    for (int i = 0; i < nums.length; i++) {
        if (i > far) return false;              // 這一格就到不了
        far = Math.max(far, i + nums[i]);
    }
    return true;
}
```

**範式二，按層跳躍**：`end` 是目前這一步能到的最遠邊界，`far` 是下一步能到的最遠邊界。走到 `end` 時一定要再跳一次，並把邊界推進到 `far`。

```java
int jump(int[] nums) {
    int steps = 0, end = 0, far = 0;
    for (int i = 0; i < nums.length - 1; i++) {   // 不用處理最後一格
        far = Math.max(far, i + nums[i]);
        if (i == end) {                            // 走出這一層，必須再跳一次
            steps++;
            end = far;
        }
    }
    return steps;
}
```

**範式三，區間切分**：每個字母只能出現在一個區段，所以區段至少要延伸到裡面每個字母的最後出現位置。

```java
List<Integer> partitionLabels(String s) {
    int[] last = new int[26];
    for (int i = 0; i < s.length(); i++) last[s.charAt(i) - 'a'] = i;
    List<Integer> res = new ArrayList<>();
    int start = 0, end = 0;
    for (int i = 0; i < s.length(); i++) {
        end = Math.max(end, last[s.charAt(i) - 'a']);
        if (i == end) {                            // 這一段裡的字母都不會再出現了
            res.add(end - start + 1);
            start = i + 1;
        }
    }
    return res;
}
```

**區間排程的經典貪心**：要選最多不重疊的區間，依**結束時間**排序，每次選結束最早且不衝突的。LeetCode 435 要移除最少區間，答案就是總數減去能選的最多數量。

```java
int eraseOverlapIntervals(int[][] intervals) {
    Arrays.sort(intervals, (a, b) -> Integer.compare(a[1], b[1]));
    int kept = 0, lastEnd = Integer.MIN_VALUE;
    for (int[] iv : intervals) {
        if (iv[0] >= lastEnd) { kept++; lastEnd = iv[1]; }
    }
    return intervals.length - kept;
}
```

**複雜度**：前三個範式都是 O(n) 時間、O(1) 或 O(Σ) 空間；區間排程由排序主導，O(n log n)。

**常見錯誤**：一是跳躍遊戲 II 的迴圈跑到最後一格，剛好在最後一格觸發 `i == end` 時會多算一步。二是區間排程依起點排序，選了一個起點早但很長的區間，擋掉後面好幾個。三是沒有論證就套貪心，例如零錢兌換在面額 `[1, 3, 4]`、金額 6 時，先拿最大面額得到 3 枚，最佳解其實是 2 枚，必須用 DP。

**對應 LeetCode 題目**：

| 題號 | 題目 | 難度 | NeetCode 150 | 用到的範式 |
|------|------|------|:---:|------|
| 55 | [Jump Game](https://leetcode.com/problems/jump-game/) | Medium | ✅ | 最遠可達 |
| 45 | [Jump Game II](https://leetcode.com/problems/jump-game-ii/) | Medium | ✅ | 按層跳躍 |
| 763 | [Partition Labels](https://leetcode.com/problems/partition-labels/) | Medium | ✅ | 最後出現位置切分 |

## 面試回答方式

說出貪心策略後，立刻補一句為什麼它是對的，例如交換論證：「若最佳解第一個選的不是結束最早的區間，把它換成結束最早的，不會變差」。若說不出論證，就試著找反例，找不到再寫。被問到時能說出「零錢兌換為什麼不能貪心」，展現你知道貪心的邊界。

## 講稿

貪心就是每一步都做當下最好的選擇，而且不回頭。它比動態規劃快，但前提是局部最好會導向全局最好，所以我寫貪心之前，會先講一下為什麼它是對的，或至少試著找反例。

第一種是維護最遠可以到哪裡，像跳躍遊戲，一邊掃一邊更新最遠可達的位置，如果目前這格已經超過最遠可達，就代表到不了。

第二種是把一步能到的範圍看成一層，像跳躍遊戲二要最少步數，我記錄這一步的邊界和下一步能到的最遠處，走到邊界時就一定要再跳一次，其實就是不用佇列的廣度優先。

第三種是區間切分，像劃分字母區間，我先記下每個字母最後出現的位置，掃的時候把目前這段的結尾延伸到裡面字母的最後位置，走到結尾就切一刀。

## 常見追問

### 怎麼證明一個貪心策略是對的？

**核心答案**：最常用的是**交換論證**：假設最佳解在某一步和貪心不同，把那一步換成貪心的選擇，證明結果不會變差，反覆交換就得到貪心解也是最佳。另一種是**保持領先**：證明每一步貪心都不落後於任何解。

**詳細解析**：區間排程的證明：最佳解第一個區間的結束時間不會早於貪心選的那個，換成貪心的選擇後，剩下的空間只會更大。面試中不需要寫出嚴謹證明，但要能用一兩句話說出交換的想法。

**面試回答方式**：說出交換論證並用區間排程示範。

### 貪心和動態規劃怎麼選？

**核心答案**：先試貪心並找反例。找不到反例且能說出論證，就用貪心；找到反例，代表當下的選擇會影響之後的最佳性，需要 DP 記錄多種狀態。

**詳細解析**：零錢兌換是經典反例：美國硬幣面額下貪心正確，但任意面額不一定。跳躍遊戲 II 也可以用 DP 做到 O(n²)，貪心把它降到 O(n)。很多題目的最佳解法是「DP 的思路加上貪心的觀察」。

**面試回答方式**：說出「先找反例」這個流程，並舉零錢兌換為例。

### 加油站（Gas Station）的貪心怎麼想？

**核心答案**：總油量小於總消耗就無解；否則從 0 開始累積油量，一旦變成負數，代表從目前起點到這裡之間的任何站出發都不行，把起點設成下一站並歸零重來。

**詳細解析**：關鍵論證是：從 A 出發到 B 之前油量變負，A 到 B 之間任何一站出發，到 B 時的油量只會更少（少了前面累積的非負油量），所以都可以跳過。這是 LeetCode 134，NeetCode 150 收錄的貪心題。

**面試回答方式**：說出「中間站都可以跳過」的論證，這比程式碼本身重要。

## 相關

- [[../algorithms/022-greedy-vs-dp.md]]
- [[../algorithms/023-interval-problems-sweep-line.md]]
- [[028-dynamic-programming.md]]
- [[012-sorting.md]]
