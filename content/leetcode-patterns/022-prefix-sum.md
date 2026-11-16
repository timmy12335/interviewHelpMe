---
id: leetcode-patterns-022
category: leetcode-patterns
slug: prefix-sum
title: Prefix Sum：區間和查詢、前綴和配雜湊表與前後綴乘積的 Java 範式
difficulty: medium
tags: [前綴和, 雜湊表, 區間查詢, Java 範式, LeetCode, NeetCode 150]
source: original
---

# 題目

用 Java 寫出前綴和的三個範式：一維前綴和做 O(1) 區間查詢、前綴和配雜湊表數子陣列、以及前綴與後綴乘積，並說明它們對應哪些 LeetCode 題目。

## 核心答案

前綴和把「任意區間的和」變成**兩個前綴的差**：定義 `pre[i]` 為前 i 個元素的和（`pre[0] = 0`），則區間 `[l, r]` 的和是 `pre[r + 1] - pre[l]`，預處理 O(n)、每次查詢 O(1)。三個範式：一是**區間和查詢**；二是**前綴和配雜湊表**，「和為 k 的子陣列」等於「找之前出現過多少個 `pre - k`」，可以處理負數，這是滑動視窗做不到的；三是**前後綴分解**，答案等於「左邊所有的」與「右邊所有的」組合，例如除了自己以外的乘積。長度多開一格、`pre[0] = 0` 能省掉所有邊界判斷。

## 詳細解析

**範式一，區間和查詢**：多開一格，讓 `pre[0] = 0`，區間公式就不用特判 `l == 0`。

```java
class NumArray {
    private final int[] pre;

    public NumArray(int[] nums) {
        pre = new int[nums.length + 1];
        for (int i = 0; i < nums.length; i++) pre[i + 1] = pre[i] + nums[i];
    }

    public int sumRange(int l, int r) { return pre[r + 1] - pre[l]; }
}
```

**範式二，前綴和配雜湊表**：掃到目前的前綴和 `sum` 時，以這裡結尾、和為 k 的子陣列數量，等於之前出現過幾次 `sum - k`。雜湊表初始放 `{0: 1}`，代表「空前綴」。

```java
int subarraySum(int[] nums, int k) {
    Map<Integer, Integer> seen = new HashMap<>();
    seen.put(0, 1);                                 // 空前綴，處理從頭開始的子陣列
    int sum = 0, count = 0;
    for (int x : nums) {
        sum += x;
        count += seen.getOrDefault(sum - k, 0);     // 先查
        seen.merge(sum, 1, Integer::sum);           // 再放
    }
    return count;
}
```

**範式三，前後綴分解**：除了自己以外的乘積，等於左邊所有數的乘積乘上右邊所有數的乘積。先從左算一遍前綴乘積放進答案，再從右邊用一個變數累乘後綴，空間 O(1)（不算輸出）。

```java
int[] productExceptSelf(int[] nums) {
    int n = nums.length;
    int[] ans = new int[n];
    ans[0] = 1;
    for (int i = 1; i < n; i++) ans[i] = ans[i - 1] * nums[i - 1];   // 左邊的乘積
    int right = 1;
    for (int i = n - 1; i >= 0; i--) {
        ans[i] *= right;                                            // 乘上右邊的乘積
        right *= nums[i];
    }
    return ans;
}
```

**二維前綴和**：矩形區域和用容斥：`pre[i+1][j+1] = pre[i][j+1] + pre[i+1][j] - pre[i][j] + m[i][j]`，查詢 `(r1,c1)` 到 `(r2,c2)` 是 `pre[r2+1][c2+1] - pre[r1][c2+1] - pre[r2+1][c1] + pre[r1][c1]`。

```java
int[][] buildPrefix2D(int[][] m) {
    int[][] pre = new int[m.length + 1][m[0].length + 1];
    for (int i = 0; i < m.length; i++)
        for (int j = 0; j < m[0].length; j++)
            pre[i + 1][j + 1] = pre[i][j + 1] + pre[i + 1][j] - pre[i][j] + m[i][j];
    return pre;
}
```

**複雜度**：預處理 O(n)，每次查詢 O(1)；範式二是 O(n) 時間、O(n) 空間；範式三是 O(n) 時間、O(1) 額外空間。

**常見錯誤**：一是範式二忘了放 `{0: 1}`，漏掉從索引 0 開始的子陣列。二是先放再查，k 等於 0 時會把空子陣列算進去。三是前綴和用 `int`，資料量大時溢位，必要時用 `long`。

**對應 LeetCode 題目**：

| 題號 | 題目 | 難度 | NeetCode 150 | 用到的範式 |
|------|------|------|:---:|------|
| 303 | [Range Sum Query - Immutable](https://leetcode.com/problems/range-sum-query-immutable/) | Easy | | 區間和查詢 |
| 560 | [Subarray Sum Equals K](https://leetcode.com/problems/subarray-sum-equals-k/) | Medium | | 前綴和配雜湊表 |
| 238 | [Product of Array Except Self](https://leetcode.com/problems/product-of-array-except-self/) | Medium | ✅ | 前後綴分解 |

## 面試回答方式

先寫出區間和等於兩個前綴之差的公式，再根據題目選範式。560 這類題要主動說明為什麼不能用滑動視窗：陣列有負數，視窗合法性沒有單調性。238 要說出前後綴的拆法，並把空間壓到 O(1)，這通常是面試官的追問點。

## 講稿

只要題目牽涉到區間的和，我會先想前綴和。區間的和就是兩個前綴和相減，預處理一次之後，每次查詢都是常數時間。我習慣多開一格，讓第零個前綴和是零，這樣從頭開始的區間不用特別處理。

前綴和最常跟雜湊表一起用。像和為 k 的子陣列，我一邊掃一邊累加，以目前位置結尾、和為 k 的子陣列數量，就等於之前出現過幾次目前的和減 k。雜湊表一開始要放一個零出現一次，代表空的前綴。這個做法可以處理負數，是滑動視窗做不到的。

另一種是前後綴分解，像除了自己以外的乘積，就是左邊全部的乘積乘上右邊全部的乘積。我先從左邊算一遍放進答案，再從右邊用一個變數累乘回去，不用額外的陣列。

## 常見追問

### 和為 k 的子陣列為什麼不能用滑動視窗？

**核心答案**：滑動視窗需要「視窗變大和就變大」的單調性，有負數時加入新元素和可能變小，收縮左邊和可能變大，無法決定該擴還是該縮。

**詳細解析**：若題目保證所有數都是正數，滑動視窗就可以用，而且空間是 O(1)。這是兩者的分界線：全正數用視窗、有負數用前綴和配雜湊表。LeetCode 209 Minimum Size Subarray Sum 就是全正數的版本。

**面試回答方式**：說出單調性被負數破壞，並給出兩者的分界條件。

### 差分陣列和前綴和是什麼關係？

**核心答案**：差分是前綴和的逆運算。要對很多區間做「整段加 v」，在差分陣列上只改兩個點：`diff[l] += v`、`diff[r + 1] -= v`，最後做一次前綴和就還原出結果，每次更新 O(1)。

**詳細解析**：LeetCode 1094 Car Pooling、370 Range Addition 都是差分的應用。前綴和適合「多次查詢、不修改」，差分適合「多次區間修改、最後查一次」。兩者都需要時要用樹狀陣列或線段樹。

**面試回答方式**：說出兩者的互逆關係與各自適用的情境。

### 子陣列和能被 k 整除的數量怎麼算？

**核心答案**：同樣用前綴和配雜湊表，但鍵改成**前綴和對 k 的餘數**：兩個前綴和餘數相同，它們之間的子陣列和就能被 k 整除。

**詳細解析**：Java 的 `%` 對負數會得到負的餘數，要寫成 `((sum % k) + k) % k` 正規化。這是 LeetCode 974，也是「把要找的關係轉成雜湊表的鍵」這個思路的好例子。

**面試回答方式**：說出餘數當鍵的想法，並主動提出 Java 負數取餘的陷阱。

## 相關

- [[../algorithms/004-prefix-sum-difference-array.md]]
- [[005-hash-tables.md]]
- [[021-sliding-window.md]]
- [[001-arrays.md]]
