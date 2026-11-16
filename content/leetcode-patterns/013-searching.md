---
id: leetcode-patterns-013
category: leetcode-patterns
slug: searching
title: Searching：線性搜尋、二分搜尋邊界與二分答案的 Java 範式
difficulty: medium
tags: [二分搜尋, 線性搜尋, 二分答案, Java 範式, LeetCode, NeetCode 150]
source: original
---

# 題目

用 Java 寫出搜尋的範式：線性搜尋的適用時機、標準二分搜尋、找左邊界的二分、在旋轉排序陣列中二分，以及「對答案二分」，並說明它們對應哪些 LeetCode 題目。

## 核心答案

**線性搜尋**是 O(n)，資料無序或只查一次時就是最好的選擇。**二分搜尋**要求搜尋空間具有**單調性**：某個條件在左邊全為假、右邊全為真（或反過來），每次看中間就能丟掉一半。範式只需要記一個：**找第一個讓條件成立的位置**，用左閉右開 `[lo, hi)`、`while (lo < hi)`、成立就 `hi = mid`、不成立就 `lo = mid + 1`，迴圈結束時 `lo` 就是答案。找精確值、找左右邊界、在答案範圍上二分，都只是換掉「條件」而已。

## 詳細解析

**線性搜尋**：沒有排序、只查一次，就直接掃。為了查一次而先排序是 O(n log n)，反而更慢。多次查詢時才值得先排序或建雜湊表。

```java
int linearSearch(int[] a, int target) {
    for (int i = 0; i < a.length; i++) if (a[i] == target) return i;
    return -1;
}
```

**範式一，標準二分搜尋**：找精確值，閉區間 `[lo, hi]`。`mid` 用 `lo + (hi - lo) / 2` 避免溢位。

```java
int search(int[] nums, int target) {
    int lo = 0, hi = nums.length - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (nums[mid] == target) return mid;
        if (nums[mid] < target) lo = mid + 1;
        else hi = mid - 1;
    }
    return -1;
}
```

**範式二，找第一個讓條件成立的位置**：這是最通用的寫法。以「第一個大於等於 target 的位置」為例，若全部都比 target 小，回傳 `nums.length`。

```java
int lowerBound(int[] nums, int target) {
    int lo = 0, hi = nums.length;                 // 左閉右開
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (nums[mid] >= target) hi = mid;        // 條件成立，答案在 mid 或左邊
        else lo = mid + 1;
    }
    return lo;
}
```

**旋轉排序陣列**：每次切一刀，至少有一半是有序的。判斷 target 是否落在有序那半，在就往那邊找，不在就往另一邊。

```java
int searchRotated(int[] nums, int target) {
    int lo = 0, hi = nums.length - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (nums[mid] == target) return mid;
        if (nums[lo] <= nums[mid]) {                          // 左半有序
            if (nums[lo] <= target && target < nums[mid]) hi = mid - 1;
            else lo = mid + 1;
        } else {                                              // 右半有序
            if (nums[mid] < target && target <= nums[hi]) lo = mid + 1;
            else hi = mid - 1;
        }
    }
    return -1;
}
```

**範式三，對答案二分**：題目問「最小的速度使得能在 h 小時內吃完」，速度越快越容易成功，具有單調性，所以在速度的範圍上用範式二找第一個可行的值。

```java
int minEatingSpeed(int[] piles, int h) {
    int lo = 1, hi = 0;
    for (int p : piles) hi = Math.max(hi, p);
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        long hours = 0;
        for (int p : piles) hours += (p + mid - 1) / mid;   // 向上取整
        if (hours <= h) hi = mid;                            // 可行，試更慢
        else lo = mid + 1;
    }
    return lo;
}
```

**複雜度**：線性搜尋 O(n)；二分搜尋 O(log n)；對答案二分是 O(n · log M)，M 是答案範圍。空間皆為 O(1)。

**常見錯誤**：一是 `mid = (lo + hi) / 2` 在大數時溢位。二是左閉右開與閉區間混用，造成死循環或漏掉最後一個元素，最好固定只用一種。三是對答案二分時累加時數用 `int`，總和可能溢位，要用 `long`。

**對應 LeetCode 題目**：

| 題號 | 題目 | 難度 | NeetCode 150 | 用到的範式 |
|------|------|------|:---:|------|
| 704 | [Binary Search](https://leetcode.com/problems/binary-search/) | Easy | ✅ | 標準二分 |
| 33 | [Search in Rotated Sorted Array](https://leetcode.com/problems/search-in-rotated-sorted-array/) | Medium | ✅ | 判斷有序的一半 |
| 875 | [Koko Eating Bananas](https://leetcode.com/problems/koko-eating-bananas/) | Medium | ✅ | 對答案二分 |

## 面試回答方式

先說出單調性在哪裡：「速度越快越容易在時限內吃完，所以可以二分」。接著明確宣告你用的區間寫法（左閉右開）與迴圈結束時 `lo` 的意義，面試官就知道你不是靠背模板。最後用長度為 1 和 2 的陣列走一遍，確認不會死循環。

## 講稿

搜尋的第一個判斷是，資料有沒有序，要查幾次。沒排序又只查一次，直接線性掃過就好，為了一次查詢先排序反而比較慢。

能用二分搜尋的條件是單調性，也就是某個條件在左邊全部不成立、右邊全部成立。我只記一個範式，就是找第一個讓條件成立的位置。我用左閉右開，條件成立就把右界移到中間，不成立就把左界移到中間的下一個，迴圈結束時左界就是答案。

旋轉排序陣列的關鍵是，切一刀之後至少有一半是有序的，我先判斷目標在不在有序的那半，再決定往哪邊走。

還有一種很常見的是對答案二分，像珂珂吃香蕉，速度越快越容易吃完，所以在速度的範圍上找第一個可行的值。累加時間要用長整數，避免溢位。

## 常見追問

### 怎麼找最後一個等於 target 的位置？

**核心答案**：找「第一個大於 target 的位置」再減一。也就是把範式二的條件從 `>=` 換成 `>`，回傳 `lo - 1`，再檢查該位置是否等於 target。

**詳細解析**：這樣所有邊界問題都歸結到同一個「找第一個成立」的模板，只需要換條件。LeetCode 34 Find First and Last Position 就是左右各呼叫一次。Java 的 `Arrays.binarySearch` 在有重複值時不保證回傳哪一個，所以不能拿來找邊界。

**面試回答方式**：說出「第一個大於減一」的轉換，展現你只用一套模板。

### 旋轉陣列有重複值時怎麼辦？

**核心答案**：`nums[lo] == nums[mid]` 時無法判斷哪半有序，只能 `lo++` 縮小一格。最壞情況退化成 O(n)，例如 `[1,1,1,1,0,1,1]`。

**詳細解析**：這是 LeetCode 81。重複值破壞了「比較端點就能判斷有序」的前提。面試時說出退化的原因和最壞例子，比寫出程式更重要。

**面試回答方式**：說明為什麼無法判斷、怎麼處理，以及最壞複雜度。

### 怎麼判斷一題能不能「對答案二分」？

**核心答案**：題目問「最小的 X 使得某條件成立」或「最大的 X 使得某條件成立」，而且**驗證一個 X 是否可行**比直接求 X 容易，又有單調性，就可以對答案二分。

**詳細解析**：典型題目還有 1011 運送包裹的最低載重、410 分割陣列的最大值最小化。寫法都是：決定答案的上下界、寫一個 `feasible(x)`、套範式二。關鍵在於確認「x 可行則 x+1 也可行」。

**面試回答方式**：說出「最小化最大值」這類關鍵字，並強調要先確認單調性。

## 相關

- [[../algorithms/006-binary-search-boundaries.md]]
- [[007-binary-search-trees.md]]
- [[012-sorting.md]]
