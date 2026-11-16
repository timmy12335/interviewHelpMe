---
id: leetcode-patterns-027
category: leetcode-patterns
slug: backtracking
title: Backtracking：子集、排列與組合總和的 Java 範式
difficulty: medium
tags: [回溯, 子集, 排列, 組合, Java 範式, LeetCode, NeetCode 150]
source: original
---

# 題目

用 Java 寫出回溯的通用骨架，並用它解子集、排列、組合總和三類問題，說明它們在「起點」「是否可重複選」「何時收集答案」上的差異，以及對應哪些 LeetCode 題目。

## 核心答案

回溯就是**在決策樹上做 DFS**，骨架固定為三步：**做選擇**（加入路徑）、**遞迴**、**撤銷選擇**（從路徑移除）。三類問題只差幾個參數：**子集**用 `start` 避免回頭選，**每個節點都收集**答案；**排列**每次從頭選，用 `used` 陣列標記已選的，**路徑長度等於 n 時收集**；**組合總和**用 `start` 但遞迴時傳 `i`（不是 `i + 1`）表示可以重複選同一個數，**剩餘目標為 0 時收集**。輸入有重複值時，先排序，再用 `i > start && nums[i] == nums[i - 1]` 跳過同一層的重複選擇。收集答案時一定要**複製路徑** `new ArrayList<>(path)`。

## 詳細解析

**範式一，子集**：每個節點代表一個子集，所以進入函式就收集。`start` 保證只往後選，不會產生 `[1,2]` 和 `[2,1]` 兩次。

```java
List<List<Integer>> subsets(int[] nums) {
    List<List<Integer>> res = new ArrayList<>();
    subsetsFrom(nums, 0, new ArrayList<>(), res);
    return res;
}

private void subsetsFrom(int[] nums, int start, List<Integer> path, List<List<Integer>> res) {
    res.add(new ArrayList<>(path));                 // 每個節點都是答案
    for (int i = start; i < nums.length; i++) {
        path.add(nums[i]);                          // 選擇
        subsetsFrom(nums, i + 1, path, res);        // 遞迴，只往後選
        path.remove(path.size() - 1);               // 撤銷
    }
}
```

**範式二，排列**：順序不同算不同答案，所以每層都從 0 開始，用 `used` 排除已在路徑上的元素。

```java
List<List<Integer>> permute(int[] nums) {
    List<List<Integer>> res = new ArrayList<>();
    permuteFrom(nums, new boolean[nums.length], new ArrayList<>(), res);
    return res;
}

private void permuteFrom(int[] nums, boolean[] used, List<Integer> path, List<List<Integer>> res) {
    if (path.size() == nums.length) { res.add(new ArrayList<>(path)); return; }
    for (int i = 0; i < nums.length; i++) {
        if (used[i]) continue;
        used[i] = true;
        path.add(nums[i]);
        permuteFrom(nums, used, path, res);
        path.remove(path.size() - 1);
        used[i] = false;
    }
}
```

**範式三，組合總和**：同一個數可以重複選，所以遞迴時傳 `i`。先排序，`nums[i] > remain` 時後面的數只會更大，可以直接 `break` 剪枝。

```java
List<List<Integer>> combinationSum(int[] candidates, int target) {
    Arrays.sort(candidates);
    List<List<Integer>> res = new ArrayList<>();
    combine(candidates, 0, target, new ArrayList<>(), res);
    return res;
}

private void combine(int[] c, int start, int remain, List<Integer> path, List<List<Integer>> res) {
    if (remain == 0) { res.add(new ArrayList<>(path)); return; }
    for (int i = start; i < c.length; i++) {
        if (c[i] > remain) break;                   // 排序後的剪枝
        path.add(c[i]);
        combine(c, i, remain - c[i], path, res);    // 傳 i：可以重複選
        path.remove(path.size() - 1);
    }
}
```

**有重複值的子集**：先排序，同一層裡跳過和前一個相同的值，`i > start` 確保只跳過「同一層」而不是「下一層」。

```java
List<List<Integer>> subsetsWithDup(int[] nums) {
    Arrays.sort(nums);
    List<List<Integer>> res = new ArrayList<>();
    dupFrom(nums, 0, new ArrayList<>(), res);
    return res;
}

private void dupFrom(int[] nums, int start, List<Integer> path, List<List<Integer>> res) {
    res.add(new ArrayList<>(path));
    for (int i = start; i < nums.length; i++) {
        if (i > start && nums[i] == nums[i - 1]) continue;   // 同層去重
        path.add(nums[i]);
        dupFrom(nums, i + 1, path, res);
        path.remove(path.size() - 1);
    }
}
```

**複雜度**：子集是 O(n · 2^n)，共 2^n 個子集、每個複製 O(n)；排列是 O(n · n!)；組合總和的上界是指數級，與目標值和最小候選數的比值有關。空間是遞迴深度加上路徑，O(n) 或 O(target / min)。

**常見錯誤**：一是收集答案時直接 `res.add(path)`，之後路徑被修改，所有答案都變成同一個空串列。二是組合總和遞迴時傳 `i + 1`，結果不能重複選；或傳 `0`，結果產生 `[2,3]` 和 `[3,2]` 這種重複組合。三是去重條件寫成 `i > 0`，會把下一層合法的重複選擇也跳過，例如 `[1,2,2]` 選不出 `[2,2]`。

**對應 LeetCode 題目**：

| 題號 | 題目 | 難度 | NeetCode 150 | 用到的範式 |
|------|------|------|:---:|------|
| 78 | [Subsets](https://leetcode.com/problems/subsets/) | Medium | ✅ | 子集，每個節點收集 |
| 46 | [Permutations](https://leetcode.com/problems/permutations/) | Medium | ✅ | 排列，used 陣列 |
| 39 | [Combination Sum](https://leetcode.com/problems/combination-sum/) | Medium | ✅ | 可重複選的組合 |

## 面試回答方式

先畫出決策樹的前兩層，說明每一層在做什麼選擇，再寫骨架。接著明確說出這題的三個參數：從哪裡開始選、可不可以重複、何時收集答案。最後主動提剪枝（排序後 `break`）與去重（同層跳過），並給出指數級的複雜度，讓面試官知道你清楚這是窮舉。

## 講稿

回溯其實就是在一棵決策樹上做深度優先搜尋，骨架永遠是三步：做選擇、遞迴下去、再把選擇撤銷。

不同題目只差幾個地方。子集的話，我用一個起點參數，只往後面選，這樣不會出現順序不同的重複；而且每個節點都是一個子集，所以一進函式就收集。

排列的話，順序不同算不同答案，所以每一層都從頭選，用一個布林陣列標記哪些已經在路徑上，路徑長度等於全部時才收集。

組合總和的數字可以重複選，所以遞迴時傳目前的索引而不是下一個。我會先排序，候選數大於剩下的目標時就直接跳出迴圈，後面只會更大。

如果輸入有重複值，就先排序，在同一層跳過跟前一個一樣的。收集答案時一定要複製路徑，不然之後撤銷選擇會把它改掉。

## 常見追問

### 回溯和 DFS 有什麼差別？

**核心答案**：回溯是 DFS 的一種，差別在於回溯**明確地撤銷狀態**，讓同一份路徑物件在不同分支間重複使用；一般圖的 DFS 通常只標記拜訪、不撤銷。

**詳細解析**：網格找單字（LeetCode 79）是兩者的混合：用 DFS 走格子，但走完要把標記還原，因為同一格在其他路徑上可能還需要用。判斷要不要撤銷的標準是：這個狀態是「全域的拜訪紀錄」還是「目前這條路徑的狀態」。

**面試回答方式**：說出「撤銷選擇」這個差別，並用網格找單字舉例。

### N 皇后要怎麼剪枝？

**核心答案**：一列一列放皇后，用三個布林陣列記錄被佔用的**行**、**主對角線**（`r - c + n - 1`）、**副對角線**（`r + c`），每格檢查 O(1)，衝突就不放。

**詳細解析**：這是 LeetCode 51，NeetCode 150 收錄。一列只放一個，所以列不用檢查；兩條對角線用索引運算壓成一維。也可以用位元遮罩記錄三種佔用，速度更快。

**面試回答方式**：說出三個陣列與對角線的索引公式。

### 回溯和動態規劃怎麼選？

**核心答案**：要**列出所有方案**時用回溯，因為輸出本身就是指數級；只要**方案數量或最佳值**時通常可以用 DP，避免重複走相同的子問題。

**詳細解析**：組合總和要列出所有組合，用回溯；如果只問有幾種組合（LeetCode 518 Coin Change II），就是完全背包 DP，O(n · target)。看題目要的是「所有方案」還是「一個數字」，是最快的判斷法。

**面試回答方式**：給出「要列舉還是要計數」這個判準，並舉 39 與 518 對比。

## 相關

- [[../algorithms/010-recursion-and-backtracking.md]]
- [[026-recursion.md]]
- [[010-trie.md]]
- [[014-bit-manipulation.md]]
