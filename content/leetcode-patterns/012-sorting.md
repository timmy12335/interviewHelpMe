---
id: leetcode-patterns-012
category: leetcode-patterns
slug: sorting
title: Sorting：合併排序、快速排序、三路分區與排序前處理的 Java 範式
difficulty: medium
tags: [排序, 合併排序, 快速排序, Java 範式, LeetCode, NeetCode 150]
source: original
---

# 題目

用 Java 手寫合併排序與隨機化快速排序，寫出荷蘭國旗的三路分區，並示範「先排序再處理」的區間合併，說明它們對應哪些 LeetCode 題目。

## 核心答案

面試要求手寫的排序主要是兩個：**合併排序**是穩定的、保證 O(n log n)，但需要 O(n) 額外空間；**快速排序**平均 O(n log n)、原地，但要**隨機選基準**才能避免已排序輸入退化成 O(n²)。**三路分區**把陣列分成小於、等於、大於三段，是快排處理大量重複值的關鍵，也直接解荷蘭國旗問題。實務上更常見的是**排序作為前處理**：區間題先依起點排序，問題就變成線性掃描。Java 的 `Arrays.sort` 對基本型別用雙基準快排（不穩定），對物件用 TimSort（穩定）。

## 詳細解析

**範式一，合併排序**：遞迴切兩半，各自排好後用暫存陣列合併。`<=` 讓相等元素維持原順序，這就是穩定性的來源。

```java
void mergeSort(int[] a, int l, int r, int[] tmp) {
    if (l >= r) return;
    int m = l + (r - l) / 2;
    mergeSort(a, l, m, tmp);
    mergeSort(a, m + 1, r, tmp);
    int i = l, j = m + 1, k = l;
    while (i <= m && j <= r) tmp[k++] = (a[i] <= a[j]) ? a[i++] : a[j++];
    while (i <= m) tmp[k++] = a[i++];
    while (j <= r) tmp[k++] = a[j++];
    for (k = l; k <= r; k++) a[k] = tmp[k];
}
```

**範式二，隨機化快速排序配三路分區**：隨機選基準後，`lt` 左邊都小於基準、`gt` 右邊都大於基準，中間是等於，之後只遞迴兩端。

```java
private final Random rnd = new Random();

void quickSort(int[] a, int l, int r) {
    if (l >= r) return;
    int pivot = a[l + rnd.nextInt(r - l + 1)];
    int lt = l, i = l, gt = r;
    while (i <= gt) {
        if (a[i] < pivot) swap(a, lt++, i++);
        else if (a[i] > pivot) swap(a, i, gt--);   // 換過來的還沒看過，i 不動
        else i++;
    }
    quickSort(a, l, lt - 1);
    quickSort(a, gt + 1, r);
}

private void swap(int[] a, int i, int j) { int t = a[i]; a[i] = a[j]; a[j] = t; }
```

**荷蘭國旗**：同一個三路分區，基準固定為 1，一趟完成。

```java
void sortColors(int[] nums) {
    int lt = 0, i = 0, gt = nums.length - 1;
    while (i <= gt) {
        if (nums[i] == 0) swap(nums, lt++, i++);
        else if (nums[i] == 2) swap(nums, i, gt--);
        else i++;
    }
}
```

**範式三，排序作為前處理**：區間依起點排序後，只需要和結果裡最後一個區間比較是否重疊。

```java
int[][] merge(int[][] intervals) {
    Arrays.sort(intervals, (x, y) -> Integer.compare(x[0], y[0]));
    List<int[]> res = new ArrayList<>();
    for (int[] cur : intervals) {
        if (res.isEmpty() || res.get(res.size() - 1)[1] < cur[0]) res.add(cur);
        else res.get(res.size() - 1)[1] = Math.max(res.get(res.size() - 1)[1], cur[1]);
    }
    return res.toArray(new int[0][]);
}
```

**複雜度**：合併排序時間 O(n log n)、空間 O(n)；快速排序平均 O(n log n)、最壞 O(n²)、空間 O(log n) 遞迴；三路分區一趟 O(n)、O(1) 空間；區間合併由排序主導，O(n log n)。

**常見錯誤**：一是快排固定取第一個元素當基準，遇到已排序或全相同的輸入就退化。二是三路分區和右邊交換後把 `i` 也往前移，換過來的元素就沒被檢查。三是區間合併時直接把結束點設成 `cur[1]`，忘了取最大值，`[1,10]` 和 `[2,3]` 合併後會錯成 `[1,3]`。

**對應 LeetCode 題目**：

| 題號 | 題目 | 難度 | NeetCode 150 | 用到的範式 |
|------|------|------|:---:|------|
| 912 | [Sort an Array](https://leetcode.com/problems/sort-an-array/) | Medium | | 合併排序或隨機快排 |
| 75 | [Sort Colors](https://leetcode.com/problems/sort-colors/) | Medium | | 三路分區 |
| 56 | [Merge Intervals](https://leetcode.com/problems/merge-intervals/) | Medium | ✅ | 排序作為前處理 |

## 面試回答方式

被要求手寫排序時，先問是否需要穩定、是否限制額外空間，再選合併或快排。寫快排一定要說「隨機選基準」，並說明三路分區如何處理重複值。若題目不是要你寫排序，就把排序當工具：主動說出「排序後問題變成一次線性掃描」，再把總複雜度算成 O(n log n)。

## 講稿

手寫排序我會先問兩件事，需不需要穩定，以及能不能用額外空間。

合併排序是穩定的，保證是 n log n，但需要一個跟原陣列一樣大的暫存空間。寫法就是切兩半各自排好，再用兩個指標合併，相等的時候取左邊，這樣就保持穩定。

快速排序是原地的，平均也是 n log n，但我一定會隨機選基準，不然遇到已經排好的輸入會退化成平方。我習慣用三路分區，把陣列分成小於、等於、大於三段，重複值很多的時候也不會變慢，荷蘭國旗那題就是同一個寫法。

更多時候排序是當作前處理。像合併區間，先依起點排序，之後只要跟結果裡最後一個區間比較，有重疊就延長結束點，記得取兩者的最大值，沒重疊就新增一段。

## 常見追問

### Java 的 Arrays.sort 用的是什麼演算法？

**核心答案**：基本型別陣列用**雙基準快速排序**（Dual-Pivot Quicksort），不穩定；物件陣列與 `Collections.sort` 用 **TimSort**，穩定，是合併排序與插入排序的混合。

**詳細解析**：基本型別不需要穩定性，因為相等的值無法區分；物件可能依某個欄位排序，相等時保持原順序很重要，所以用穩定的 TimSort。TimSort 對部分有序的資料特別快，最好情況接近 O(n)。

**面試回答方式**：分別說出兩種情況的演算法與穩定性，並說明為什麼這樣設計。

### 什麼時候可以做到比 O(n log n) 更快的排序？

**核心答案**：值的範圍有限時可以用非比較排序：**計數排序** O(n + k)、**基數排序** O(d·(n + k))、**桶排序**平均 O(n)。比較排序的下界是 O(n log n)。

**詳細解析**：例如 LeetCode 274 H-Index 可以用計數排序做到 O(n)，因為答案不會超過 n；347 Top K Frequent 可以用以頻率為索引的桶排序做到 O(n)。前提是你能限制值的範圍。

**面試回答方式**：說出比較排序下界，再舉一個可以用計數或桶排序的題目。

### 快速選擇和快速排序有什麼關係？

**核心答案**：快速選擇用同一個分區步驟找第 k 小，但**只遞迴進答案所在的那一邊**，所以平均 O(n)、最壞 O(n²)。

**詳細解析**：LeetCode 215 Kth Largest Element 是標準應用。分區後若基準的位置剛好是 k 就結束；k 在左邊就只處理左邊，反之處理右邊。同樣要隨機選基準。Top K 頁面有完整寫法。

**面試回答方式**：說出「只遞迴一邊」這個差異與平均複雜度。

## 相關

- [[../algorithms/007-sorting-algorithm-tradeoffs.md]]
- [[../algorithms/025-sorting-as-preprocessing.md]]
- [[024-divide-and-conquer.md]]
- [[029-top-k-elements.md]]
