---
id: leetcode-patterns-001
category: leetcode-patterns
slug: two-pointers
title: Two Pointers：對撞與讀寫指針的 Java 範式
difficulty: easy
tags: [雙指針, 陣列, Java 範式, LeetCode, NeetCode 150]
source: original
---

# 題目

用 Java 寫出雙指針的兩種範式（對撞指針、讀寫指針），並說明看到什麼訊號該用它、對應哪些 LeetCode 題目。

## 核心答案

雙指針能把 O(n²) 降到 O(n)，靠的是**單調性**：每移動一次指針，就能證明被跳過的組合不可能是答案。看到「**已排序**」「**找一對或一組元素**」「**原地修改陣列**」這三個訊號就該想到它。Java 範式分兩種：**對撞指針**是 `l` 從頭、`r` 從尾往中間收，依比較結果決定動哪一邊；**讀寫指針**是 `read` 掃過全部元素，`write` 只在遇到要保留的元素時才寫入並前進。快慢指針另有一頁，見相關。

## 詳細解析

**範式一，對撞指針**：輸入必須已排序，迴圈條件是 `l < r`。

```java
int[] twoSumSorted(int[] nums, int target) {
    int l = 0, r = nums.length - 1;
    while (l < r) {  // l == r 時只剩一個元素，湊不成一對
        int sum = nums[l] + nums[r];
        if (sum == target) return new int[]{l, r};
        if (sum < target) l++;  // 含 l 的組合都太小，排除整列
        else r--;  // 含 r 的組合都太大，排除整行
    }
    return new int[]{-1, -1};
}
```

**範式二，讀寫指針**：`write` 永遠指向下一個該寫入的位置，因為它不會超過 `read`，覆蓋是安全的。

```java
int removeDuplicates(int[] nums) {
    int write = 0;
    for (int read = 0; read < nums.length; read++) {
        if (write == 0 || nums[read] != nums[write - 1]) {
            nums[write++] = nums[read];
        }
    }
    return write;  // 新長度
}
```

**三數之和的延伸寫法**：外層固定一個數，內層跑對撞指針，並在三個地方去重。

```java
List<List<Integer>> threeSum(int[] nums) {
    Arrays.sort(nums);
    List<List<Integer>> res = new ArrayList<>();
    for (int i = 0; i < nums.length - 2; i++) {
        if (nums[i] > 0) break;  // 最小的都 > 0，不可能湊到 0
        if (i > 0 && nums[i] == nums[i - 1]) continue;  // 去重一：固定的數
        int l = i + 1, r = nums.length - 1;
        while (l < r) {
            int sum = nums[i] + nums[l] + nums[r];
            if (sum < 0) l++;
            else if (sum > 0) r--;
            else {
                res.add(Arrays.asList(nums[i], nums[l], nums[r]));
                while (l < r && nums[l] == nums[l + 1]) l++;  // 去重二
                while (l < r && nums[r] == nums[r - 1]) r--;  // 去重三
                l++;
                r--;
            }
        }
    }
    return res;
}
```

**複雜度**：對撞指針與讀寫指針都是時間 O(n)、空間 O(1)。三數之和是排序 O(n log n) 加上 n 次對撞 O(n²)，整體 O(n²)。若輸入沒排序、又只問「是否存在一對」，用 `HashMap` 的 O(n) 會比先排序更好。

**常見錯誤**：一是迴圈寫成 `l <= r`，讓同一個元素和自己配對。二是三數之和找到答案後只做去重、忘了再 `l++` 和 `r--`，結果無限迴圈。三是用 `nums[l] + nums[r]` 時沒注意 `int` 溢位，數值範圍大時要先轉 `long`。

**對應 LeetCode 題目**：

| 題號 | 題目 | 難度 | NeetCode 150 | 用到的範式 |
|------|------|------|:---:|------|
| 167 | [Two Sum II - Input Array Is Sorted](https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/) | Medium | ✅ | 對撞指針 |
| 15 | [3Sum](https://leetcode.com/problems/3sum/) | Medium | ✅ | 排序加對撞指針、去重 |
| 26 | [Remove Duplicates from Sorted Array](https://leetcode.com/problems/remove-duplicates-from-sorted-array/) | Easy | | 讀寫指針 |

## 面試回答方式

先講訊號，再寫模板，最後補正確性。寫對撞指針時，一定要邊寫邊說「和太小就動左邊，因為含左邊的組合都被排除了」，這句話就是這個範式的技術含量。寫完主動提三數之和的三處去重，以及什麼時候改用 `HashMap` 比較好，展現你知道它的邊界。

## 講稿

看到題目給的是已排序陣列、要找一對元素，或是要求原地修改，我會先想到雙指針。

它分兩種寫法。對撞指針是左右各放一個，往中間收。以兩數之和為例，如果和太小就把左指針右移，因為左邊那個數配上任何右邊的數都不夠，含它的組合可以整批排除。每一步排掉一整排，所以是線性時間、常數空間。

另一種是讀寫指針，讀指針掃過每個元素，寫指針只在遇到要保留的元素時才寫入，用在原地去重或原地移除，因為寫指針不會超過讀指針，覆蓋是安全的。

延伸到三數之和，就是先排序，外層固定一個數，內層跑對撞指針，再在三個地方去重。要注意找到答案後兩個指針都要繼續移動，不然會卡在原地。

## 常見追問

### 輸入沒有排序，還要用雙指針嗎？

**核心答案**：看題目要什麼。只問「是否存在一對」或要回傳原始索引，用 `HashMap` 一次掃過是 O(n)，比先排序的 O(n log n) 好；要列出所有不重複的組合，排序後用雙指針去重最自然。

**詳細解析**：LeetCode 1 Two Sum 要回傳原始索引，排序會打亂索引，所以標準解是 `HashMap`。15 3Sum 要列出不重複的三元組，用雜湊表去重很麻煩，排序後跳過相同值就好。

**面試回答方式**：給出「存在性用雜湊、枚舉去重用排序」這條判準，再各舉一題。

### 為什麼對撞指針不會漏掉答案？

**核心答案**：因為每次移動排除的都是確定不可能的組合。和太小時，`nums[l]` 配上 `r` 以內任何數都只會更小，所以含 `l` 的整列都可以丟掉，答案不可能在裡面。

**詳細解析**：把所有 `(l, r)` 組合想成 n×n 矩陣，每一步排除一整列或一整行，路徑單調地走向答案所在的格子，所以最多 n 步，也不會跳過答案。

**面試回答方式**：用「排除整列」這個說法講清楚即可，這是面試官最想聽的論證。

### 讀寫指針和另開一個陣列有什麼差別？

**核心答案**：結果一樣，但讀寫指針是 O(1) 額外空間。它安全的原因是 `write` 永遠不超過 `read`，被覆蓋的位置都已經讀過了。

**詳細解析**：LeetCode 26、27、283 都要求原地修改，就是在考這個。寫法上只要記住 `write` 代表「下一個該放的位置」，迴圈結束時 `write` 就是新長度。

**面試回答方式**：說出空間差異與「寫不超過讀」這個安全條件，再提一題同骨架的變形，例如 283 Move Zeroes。

## 相關

- [[../algorithms/002-two-pointers.md]]
- [[../algorithms/003-sliding-window.md]]
- [[../algorithms/008-linked-list-patterns.md]]
