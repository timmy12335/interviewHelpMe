---
id: leetcode-patterns-024
category: leetcode-patterns
slug: divide-and-conquer
title: Divide and Conquer：兩兩合併、跨中點組合與快速冪的 Java 範式
difficulty: medium
tags: [分治, 合併, 遞迴, Java 範式, LeetCode, NeetCode 150]
source: original
---

# 題目

用 Java 寫出分治的三個範式：把 k 個子問題兩兩合併、處理「跨越中點」的答案、以及把問題規模減半的快速冪，並說明它們對應哪些 LeetCode 題目。

## 核心答案

分治有三步：**切分**成獨立的子問題、**遞迴**解決、**合併**子問題的答案。它和一般遞迴的差別在於子問題**互不重疊**（重疊的話就是動態規劃）。三個範式：一是**兩兩合併**，k 個東西分成兩半各自合併，再合併兩個結果，深度 log k；二是**跨中點組合**，答案要嘛完全在左半、要嘛完全在右半、要嘛跨過中點，前兩者遞迴，第三者線性算出；三是**規模減半**，例如 `x^n = (x^(n/2))²`，每層只做一個子問題。複雜度用主定理：`T(n) = 2T(n/2) + O(n)` 是 O(n log n)，`T(n) = T(n/2) + O(1)` 是 O(log n)。

## 詳細解析

**範式一，兩兩合併**：合併 k 條已排序串列，把串列陣列切兩半，各自合併後再合併兩條。每個節點在 log k 層裡各被處理一次。

```java
ListNode mergeKLists(ListNode[] lists) {
    if (lists.length == 0) return null;
    return mergeRange(lists, 0, lists.length - 1);
}

private ListNode mergeRange(ListNode[] lists, int l, int r) {
    if (l == r) return lists[l];
    int m = l + (r - l) / 2;
    return mergeTwo(mergeRange(lists, l, m), mergeRange(lists, m + 1, r));
}

private ListNode mergeTwo(ListNode a, ListNode b) {
    ListNode dummy = new ListNode(0), tail = dummy;
    while (a != null && b != null) {
        if (a.val <= b.val) { tail.next = a; a = a.next; }
        else { tail.next = b; b = b.next; }
        tail = tail.next;
    }
    tail.next = (a != null) ? a : b;
    return dummy.next;
}
```

**範式二，跨中點組合**：最大子陣列和。跨中點的那一段，一定是「從中點往左延伸的最大和」加上「從中點往右延伸的最大和」，線性算出。

```java
int maxSubArrayDC(int[] nums) { return best(nums, 0, nums.length - 1); }

private int best(int[] a, int l, int r) {
    if (l == r) return a[l];
    int m = l + (r - l) / 2;
    int leftMax = Integer.MIN_VALUE, sum = 0;
    for (int i = m; i >= l; i--) { sum += a[i]; leftMax = Math.max(leftMax, sum); }
    int rightMax = Integer.MIN_VALUE;
    sum = 0;
    for (int i = m + 1; i <= r; i++) { sum += a[i]; rightMax = Math.max(rightMax, sum); }
    int cross = leftMax + rightMax;                       // 跨中點的最佳
    return Math.max(cross, Math.max(best(a, l, m), best(a, m + 1, r)));
}
```

**範式三，規模減半**：快速冪。`n` 是奇數時多乘一個 `x`。`n` 可能是 `Integer.MIN_VALUE`，取負數會溢位，所以先轉成 `long`。

```java
double myPow(double x, int n) {
    long N = n;
    if (N < 0) { x = 1 / x; N = -N; }
    return pow(x, N);
}

private double pow(double x, long n) {
    if (n == 0) return 1.0;
    double half = pow(x, n / 2);
    return (n % 2 == 0) ? half * half : half * half * x;
}
```

**複雜度**：合併 k 條串列是 O(N log k)，N 是總節點數；最大子陣列分治版是 O(n log n)（Kadane 的 O(n) 更好，見常見追問）；快速冪是 O(log n)。遞迴空間分別是 O(log k)、O(log n)、O(log n)。

**常見錯誤**：一是快速冪寫成 `pow(x, n/2) * pow(x, n/2)`，同一個子問題算兩次，退化成 O(n)。二是 `n = Integer.MIN_VALUE` 直接取 `-n`，溢位後還是負數。三是合併 k 條串列時依序一條一條合併，總時間變成 O(N·k)。

**對應 LeetCode 題目**：

| 題號 | 題目 | 難度 | NeetCode 150 | 用到的範式 |
|------|------|------|:---:|------|
| 23 | [Merge k Sorted Lists](https://leetcode.com/problems/merge-k-sorted-lists/) | Hard | ✅ | 兩兩合併 |
| 53 | [Maximum Subarray](https://leetcode.com/problems/maximum-subarray/) | Medium | ✅ | 跨中點組合 |
| 50 | [Pow(x, n)](https://leetcode.com/problems/powx-n/) | Medium | ✅ | 規模減半 |

## 面試回答方式

先說明怎麼切、子問題之間為什麼互不影響、怎麼合併，然後用主定理說出複雜度。53 題若用分治寫，一定要主動提 Kadane 的 O(n) 解法，並說明分治版在這題的價值是可以擴展到線段樹做區間查詢。快速冪要主動處理負指數與 `MIN_VALUE`。

## 講稿

分治就是三步，先把問題切成互相獨立的子問題，遞迴解決它們，再把答案合併起來。如果子問題會重疊，那就該用動態規劃了。

我常用三種形態。第一種是兩兩合併，像合併 k 條排序好的串列，把它們分成兩半各自合併，再把兩個結果合併，每個節點只會經過對數 k 層，比一條一條合併快很多。

第二種是處理跨過中點的答案，像最大子陣列和，答案要嘛在左半，要嘛在右半，要嘛跨過中點。前兩種遞迴處理，跨中點的那段就是從中點往左的最大和，加上往右的最大和。

第三種是每次把規模減半，像快速冪，先算一半的次方，再平方，奇數就多乘一次。要注意同一個子問題只算一次，還有負的最小整數取負號會溢位，我會先轉成長整數。

## 常見追問

### 最大子陣列和的 O(n) 解法是什麼？

**核心答案**：**Kadane 演算法**：`cur = max(x, cur + x)`，也就是「前面累積的和是負的就丟掉，從自己重新開始」，同時記錄最大的 `cur`。

**詳細解析**：它其實是 DP：`dp[i]` 是以 i 結尾的最大子陣列和，`dp[i] = max(nums[i], dp[i-1] + nums[i])`，只用到前一項所以壓成一個變數。分治版的價值在於它的「合併資訊」（左最大、右最大、總和、答案）可以放進線段樹，支援帶修改的區間最大子陣列查詢。

**面試回答方式**：先寫 Kadane，再說明分治版在線段樹上的延伸價值。

### 分治和動態規劃怎麼區分？

**核心答案**：看子問題是否**重疊**。合併排序的左右兩半完全不重疊，是分治；費氏數列的 `f(n-1)` 與 `f(n-2)` 會重複計算同一個子問題，用記憶化或遞推才有效率，是 DP。

**詳細解析**：兩者都是「把大問題拆成小問題」，差別在於 DP 需要儲存子問題的答案以避免重算。把分治的遞迴樹畫出來，看有沒有重複的節點，就能判斷。

**面試回答方式**：給出「重疊子問題」這個判準，並各舉一例。

### 怎麼用主定理算分治的複雜度？

**核心答案**：`T(n) = a·T(n/b) + O(n^d)`。比較 `d` 和 `log_b a`：`d` 較大是 O(n^d)，相等是 O(n^d log n)，較小是 O(n^(log_b a))。

**詳細解析**：合併排序 a=2、b=2、d=1，相等所以是 O(n log n)；二分搜尋 a=1、b=2、d=0，相等所以是 O(log n)；快速冪若寫錯成算兩次，a=2、b=2、d=0，變成 O(n)。

**面試回答方式**：寫出公式，再用兩個熟悉的演算法驗證。

## 相關

- [[../algorithms/033-divide-and-conquer.md]]
- [[012-sorting.md]]
- [[002-linked-lists.md]]
- [[026-recursion.md]]
