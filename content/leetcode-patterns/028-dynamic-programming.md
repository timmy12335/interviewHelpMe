---
id: leetcode-patterns-028
category: leetcode-patterns
slug: dynamic-programming
title: Dynamic Programming：一維遞推、完全背包與二維序列 DP 的 Java 範式
difficulty: medium
tags: [動態規劃, 背包, 最長公共子序列, Java 範式, LeetCode, NeetCode 150]
source: original
---

# 題目

用 Java 寫出動態規劃的三個範式：一維遞推（並壓縮成兩個變數）、完全背包求最少數量、兩個序列的二維 DP，並說明定義狀態、轉移、初始值、計算順序的步驟，以及它們對應哪些 LeetCode 題目。

## 核心答案

DP 適用於**重疊子問題**加上**最優子結構**的問題。寫 DP 固定四步：一是**定義狀態**，`dp[i]` 代表什麼，要能用一句話說清楚；二是**轉移方程**，`dp[i]` 怎麼從更小的狀態算出來；三是**初始值**，最小的狀態是多少；四是**計算順序**，確保用到的狀態都已經算好。三個範式：**一維遞推**，`dp[i]` 只依賴前幾項，可以壓成幾個變數；**完全背包**，物品可以無限次使用，外層金額、內層物品（或反過來，求數量時兩者等價）；**二維序列 DP**，`dp[i][j]` 代表兩個字串前 i 個與前 j 個的答案，依「最後一個字元是否相等」分情況。

## 詳細解析

**範式一，一維遞推**：爬樓梯，`dp[i] = dp[i-1] + dp[i-2]`，只用到前兩項，壓成兩個變數。

```java
int climbStairs(int n) {
    int prev2 = 1, prev1 = 1;                  // dp[0], dp[1]
    for (int i = 2; i <= n; i++) {
        int cur = prev1 + prev2;
        prev2 = prev1;
        prev1 = cur;
    }
    return prev1;
}
```

**一維遞推的選或不選**：打家劫舍，`dp[i] = max(不搶第 i 家 = dp[i-1], 搶第 i 家 = dp[i-2] + nums[i])`，同樣壓成兩個變數。

```java
int rob(int[] nums) {
    int skip = 0, take = 0;                    // 到前一家為止：沒搶它的最佳、可能搶了它的最佳
    for (int x : nums) {
        int next = Math.max(take, skip + x);
        skip = take;
        take = next;
    }
    return take;
}
```

**範式二，完全背包求最少數量**：零錢兌換，`dp[a]` 是湊出金額 a 的最少硬幣數。每種硬幣可以用無限次，所以 `dp[a - c]` 可以已經用過 c。用 `amount + 1` 當無限大，避免 `Integer.MAX_VALUE + 1` 溢位。

```java
int coinChange(int[] coins, int amount) {
    int[] dp = new int[amount + 1];
    Arrays.fill(dp, amount + 1);               // 不可能達到的值當無限大
    dp[0] = 0;
    for (int a = 1; a <= amount; a++)
        for (int c : coins)
            if (c <= a) dp[a] = Math.min(dp[a], dp[a - c] + 1);
    return dp[amount] > amount ? -1 : dp[amount];
}
```

**範式三，二維序列 DP**：最長公共子序列，`dp[i][j]` 是 `a` 前 i 個字元與 `b` 前 j 個字元的 LCS 長度。多開一列一行，讓空字串的狀態自然為 0。

```java
int longestCommonSubsequence(String a, String b) {
    int m = a.length(), n = b.length();
    int[][] dp = new int[m + 1][n + 1];
    for (int i = 1; i <= m; i++)
        for (int j = 1; j <= n; j++)
            dp[i][j] = (a.charAt(i - 1) == b.charAt(j - 1))
                ? dp[i - 1][j - 1] + 1                         // 最後一個字元相同，一起用
                : Math.max(dp[i - 1][j], dp[i][j - 1]);        // 不同，丟掉其中一邊
    return dp[m][n];
}
```

**複雜度**：一維遞推 O(n) 時間、O(1) 空間；零錢兌換 O(amount · coins) 時間、O(amount) 空間；LCS 是 O(m·n) 時間，空間 O(m·n)，可壓到 O(min(m, n))。

**常見錯誤**：一是狀態定義含糊，例如沒說清楚 `dp[i]` 是「前 i 個」還是「以第 i 個結尾」，轉移就會寫錯。二是用 `Integer.MAX_VALUE` 當無限大再加一，溢位成負數變成最小值。三是二維 DP 的索引偏移：`dp[i][j]` 對應字元 `a.charAt(i - 1)`，少減一就越界或錯位。

**對應 LeetCode 題目**：

| 題號 | 題目 | 難度 | NeetCode 150 | 用到的範式 |
|------|------|------|:---:|------|
| 70 | [Climbing Stairs](https://leetcode.com/problems/climbing-stairs/) | Easy | ✅ | 一維遞推 |
| 322 | [Coin Change](https://leetcode.com/problems/coin-change/) | Medium | ✅ | 完全背包求最少 |
| 1143 | [Longest Common Subsequence](https://leetcode.com/problems/longest-common-subsequence/) | Medium | ✅ | 二維序列 DP |

## 面試回答方式

照四步說：狀態定義、轉移、初始值、計算順序，每一步都說出來再寫程式。若一時想不到轉移，可以先寫遞迴加記憶化，再改成遞推。寫完後主動提空間壓縮，並說明壓縮後的迴圈方向（例如 0/1 背包要倒序）。被問到為什麼不用貪心時，舉零錢兌換的反例。

## 講稿

動態規劃我會照四個步驟來。第一是定義狀態，用一句話講清楚 dp 的每一格代表什麼。第二是轉移，這一格怎麼從比較小的格子算出來。第三是初始值。第四是計算順序，確保要用的格子都已經算好。

最簡單的是一維遞推，像爬樓梯，第 i 階的走法等於前一階加前兩階，只用到前兩項，所以壓成兩個變數就好。

第二種是背包，像零錢兌換，dp 的每一格是湊出這個金額最少要幾枚硬幣，每種硬幣可以無限用，就從金額減掉這枚硬幣的格子加一。無限大我用金額加一，不用整數最大值，避免加一之後溢位。

第三種是兩個序列的二維 DP，像最長公共子序列，看兩邊最後一個字元，相同就一起用，從左上角加一；不同就丟掉其中一邊，取比較大的。

## 常見追問

### 0/1 背包和完全背包在程式上差在哪？

**核心答案**：壓成一維後，**0/1 背包的容量要倒序**走，確保 `dp[w - weight]` 還是「沒放這個物品」的舊值；**完全背包正序**走，讓 `dp[w - weight]` 可以已經放過同一個物品。

**詳細解析**：LeetCode 416 Partition Equal Subset Sum 是 0/1 背包，內層 `for (int w = target; w >= x; w--)`；518 Coin Change II 是完全背包求組合數，外層硬幣、內層金額正序。若要求排列數（順序不同算不同），外層改成金額、內層硬幣。

**面試回答方式**：說出倒序與正序的原因，再補充組合數與排列數的迴圈順序差異。

### 記憶化遞迴和遞推表格怎麼選？

**核心答案**：兩者時間複雜度相同。記憶化遞迴比較容易從題意直接寫出、只會算到需要的狀態；遞推表格沒有遞迴開銷、方便做空間壓縮。面試時先寫好想的那個。

**詳細解析**：狀態空間很大但實際只用到一小部分時，記憶化較省；需要壓縮空間或遞迴深度可能溢位時，用遞推。從記憶化改成遞推的方法是：把遞迴的依賴方向反過來，就是迴圈的順序。

**面試回答方式**：說出兩者的取捨，並說明你會怎麼互相轉換。

### 怎麼從 DP 表格還原出具體方案？

**核心答案**：從終點往回走，看目前格子的值是從哪個轉移來的，就往那個方向退。以 LCS 為例，字元相同就收進答案並往左上退，不同就往比較大的那邊退。

**詳細解析**：若壓縮了空間就無法還原，需要保留完整表格，或另外記錄每一格的「來源」。這也是為什麼面試官問完長度後，常常追問「請輸出這個子序列」，此時要說明需要 O(m·n) 空間。

**面試回答方式**：說出回溯表格的方法，並指出空間壓縮與還原方案之間的取捨。

## 相關

- [[../algorithms/020-dynamic-programming-thinking.md]]
- [[../algorithms/021-knapsack-problems.md]]
- [[../algorithms/034-memoization-vs-tabulation.md]]
- [[025-greedy.md]]
- [[017-topological-sort.md]]
