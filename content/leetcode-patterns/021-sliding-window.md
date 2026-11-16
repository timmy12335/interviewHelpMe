---
id: leetcode-patterns-021
category: leetcode-patterns
slug: sliding-window
title: Sliding Window：可變視窗求最長與最短的 Java 範式
difficulty: medium
tags: [滑動視窗, 雙指針, 字串, Java 範式, LeetCode, NeetCode 150]
source: original
---

# 題目

用 Java 寫出滑動視窗的範式：可變長度視窗求「最長」、求「最短」兩種骨架，以及固定長度視窗，並說明它們對應哪些 LeetCode 題目。

## 核心答案

滑動視窗處理的是**連續子陣列或子字串**，要求視窗的合法性具有**單調性**：視窗變大只會更難合法（或更容易）。骨架只有一個：`right` 每次往右擴一格、把新元素加進視窗狀態，接著用 `while` 收縮 `left` 直到視窗重新合法。兩種目標的差別在**什麼時候更新答案**：**求最長**時，收縮到合法後更新；**求最短**時，在視窗合法的 `while` 迴圈裡一邊更新一邊收縮。視窗狀態通常用 `int[128]` 或 `HashMap` 計數。

## 詳細解析

**範式一，求最長**：無重複字元的最長子字串。新字元讓視窗出現重複時，就收縮左邊直到沒有重複。

```java
int lengthOfLongestSubstring(String s) {
    int[] cnt = new int[128];
    int best = 0;
    for (int l = 0, r = 0; r < s.length(); r++) {
        char c = s.charAt(r);
        cnt[c]++;
        while (cnt[c] > 1) cnt[s.charAt(l++)]--;    // 收縮到合法
        best = Math.max(best, r - l + 1);           // 合法後更新最長
    }
    return best;
}
```

**求最長的變形**：替換後的最長重複字元。視窗合法的條件是「視窗長度減去出現最多的字元數」不超過 k。`maxFreq` 不需要在收縮時往下修正，因為只有它變大時答案才可能變大。

```java
int characterReplacement(String s, int k) {
    int[] cnt = new int[26];
    int maxFreq = 0, best = 0;
    for (int l = 0, r = 0; r < s.length(); r++) {
        maxFreq = Math.max(maxFreq, ++cnt[s.charAt(r) - 'A']);
        while (r - l + 1 - maxFreq > k) cnt[s.charAt(l++) - 'A']--;
        best = Math.max(best, r - l + 1);
    }
    return best;
}
```

**範式二，求最短**：最小覆蓋子字串。`need` 記錄還缺幾個字元，`missing` 為 0 時視窗合法，就在 `while` 裡一邊更新答案一邊收縮。

```java
String minWindow(String s, String t) {
    int[] need = new int[128];
    for (char c : t.toCharArray()) need[c]++;
    int missing = t.length(), start = 0, best = Integer.MAX_VALUE;
    for (int l = 0, r = 0; r < s.length(); r++) {
        if (need[s.charAt(r)]-- > 0) missing--;             // 這個字元是真的需要的
        while (missing == 0) {                              // 合法時收縮並更新最短
            if (r - l + 1 < best) { best = r - l + 1; start = l; }
            if (++need[s.charAt(l++)] > 0) missing++;       // 移出後又缺了
        }
    }
    return best == Integer.MAX_VALUE ? "" : s.substring(start, start + best);
}
```

**固定長度視窗**：長度為 k 的子陣列最大和。右邊加一個、左邊減一個，不需要 `while`。

```java
int maxSumOfK(int[] nums, int k) {
    int sum = 0, best = Integer.MIN_VALUE;
    for (int i = 0; i < nums.length; i++) {
        sum += nums[i];
        if (i >= k) sum -= nums[i - k];
        if (i >= k - 1) best = Math.max(best, sum);
    }
    return best;
}
```

**複雜度**：所有範式都是 O(n)，因為 `left` 和 `right` 都只往右走，每個元素最多進出視窗各一次。空間是字元集大小 O(Σ)。

**常見錯誤**：一是把求最長與求最短的更新位置寫反。二是陣列有負數時使用滑動視窗，例如「和至少為 k 的最短子陣列」，負數破壞了單調性，要改用前綴和加單調佇列。三是最小覆蓋子字串用 `need` 判斷時沒有區分「需要的字元」與「多出來的字元」，`missing` 會被算錯；上面用 `need[c]-- > 0` 只在真正需要時才遞減 `missing`。

**對應 LeetCode 題目**：

| 題號 | 題目 | 難度 | NeetCode 150 | 用到的範式 |
|------|------|------|:---:|------|
| 3 | [Longest Substring Without Repeating Characters](https://leetcode.com/problems/longest-substring-without-repeating-characters/) | Medium | ✅ | 求最長 |
| 424 | [Longest Repeating Character Replacement](https://leetcode.com/problems/longest-repeating-character-replacement/) | Medium | ✅ | 求最長加頻率 |
| 76 | [Minimum Window Substring](https://leetcode.com/problems/minimum-window-substring/) | Hard | ✅ | 求最短 |

## 面試回答方式

先確認題目問的是「連續」子陣列或子字串，再說明合法性的單調性在哪裡。接著宣告你要求最長還是最短，並說出答案在哪裡更新。寫完說明為什麼是 O(n)：兩個指針都只往右走。遇到有負數的陣列，主動指出滑動視窗不適用，展現你知道它的前提。

## 講稿

題目問的是連續的子陣列或子字串，而且要最長或最短，我會先想滑動視窗。

它能用的前提是合法性有單調性，比如視窗越大越容易出現重複字元。骨架只有一個：右指針每次往右擴一格，把新元素加進計數，然後用一個迴圈收縮左指針，直到視窗重新合法。

差別在什麼時候更新答案。求最長的話，收縮完、視窗合法了才更新。求最短的話，是在視窗合法的那個迴圈裡，一邊更新答案一邊收縮。像最小覆蓋子字串，我用一個計數器記還缺幾個字元，缺的數量變成零就開始收縮。

兩個指針都只往右走，每個元素最多進出一次，所以是線性時間。但如果陣列有負數，單調性就沒了，要改用前綴和。

## 常見追問

### 「恰好包含 k 個不同字元」的子陣列數量怎麼算？

**核心答案**：轉換成「至多 k 個」減「至多 k−1 個」。「至多 k 個」可以用滑動視窗算，每次 `right` 移動後，以 `right` 結尾的合法子陣列有 `r - l + 1` 個。

**詳細解析**：「恰好」不具單調性，視窗變大可能從不合法變合法再變不合法，所以不能直接套。「至多」有單調性。LeetCode 992 Subarrays with K Different Integers 就是這個技巧。

**面試回答方式**：說出「恰好等於至多減至多」這個轉換，並說明為什麼「恰好」不能直接用視窗。

### 為什麼 424 題的 maxFreq 收縮時不用更新？

**核心答案**：答案只有在 `maxFreq` 變大時才可能變大。收縮時 `maxFreq` 偏大只會讓視窗「不夠緊」，但視窗長度不會超過歷史最佳，所以不影響答案。

**詳細解析**：嚴格來說收縮後的 `maxFreq` 可能已經過期，視窗暫時不合法，但那時的視窗長度等於之前某個合法視窗的長度，`best` 不會被錯誤地放大。這是一個常被追問的細節，也可以改成每次重算 26 格的最大值，時間 O(26n)。

**面試回答方式**：說出「只有 maxFreq 變大才可能更新答案」這個論點。

### 滑動視窗和雙指針是什麼關係？

**核心答案**：滑動視窗是同向雙指針的一種，關心的是**兩個指針之間的區間**；對撞指針關心的是**兩端的組合**。兩者的共同點是都靠單調性避免回頭。

**詳細解析**：讀寫指針也是同向的，但它不關心區間內容，只關心寫入位置。把這三種放在同一個家族裡理解，比各自背模板更能應付變形題。

**面試回答方式**：用「區間」和「兩端組合」一句話區分。

## 相關

- [[../algorithms/003-sliding-window.md]]
- [[020-two-pointers.md]]
- [[022-prefix-sum.md]]
- [[004-queues.md]]
