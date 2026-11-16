---
id: leetcode-patterns-029
category: leetcode-patterns
slug: top-k-elements
title: Top K Elements：反向堆、快速選擇與桶排序的 Java 範式
difficulty: medium
tags: [Top K, 堆積, 快速選擇, 桶排序, Java 範式, LeetCode, NeetCode 150]
source: original
---

# 題目

用 Java 寫出 Top K 問題的三種解法：大小為 k 的反向堆、平均 O(n) 的快速選擇、以及當值域有限時的桶排序，並說明各自的取捨與對應的 LeetCode 題目。

## 核心答案

Top K 有三種標準解法，選擇看資料規模與限制。**反向堆**：要最大的 k 個就用大小為 k 的**最小堆**，超過 k 就彈出最小的，O(n log k)，適合資料流或 k 遠小於 n。**快速選擇**：用快排的分區，只遞迴進答案所在的一邊，平均 O(n)、最壞 O(n²)，要隨機選基準。**桶排序**：頻率或值的範圍有限時，以頻率為索引建桶，從高頻往低頻收集，O(n)。實務上先給堆的寫法最穩，再根據追問優化。

## 詳細解析

**範式一，反向堆**：前 k 個高頻元素。先計數，再用以頻率排序的最小堆只保留 k 個。

```java
int[] topKFrequent(int[] nums, int k) {
    Map<Integer, Integer> freq = new HashMap<>();
    for (int x : nums) freq.merge(x, 1, Integer::sum);
    PriorityQueue<Integer> pq = new PriorityQueue<>((a, b) -> Integer.compare(freq.get(a), freq.get(b)));
    for (int x : freq.keySet()) {
        pq.offer(x);
        if (pq.size() > k) pq.poll();             // 踢掉頻率最低的
    }
    int[] res = new int[k];
    for (int i = k - 1; i >= 0; i--) res[i] = pq.poll();
    return res;
}
```

**反向堆的另一個例子**：離原點最近的 k 個點，要最小的 k 個，所以用**最大堆**，比較平方距離避免開根號。

```java
int[][] kClosest(int[][] points, int k) {
    PriorityQueue<int[]> pq = new PriorityQueue<>(
        (a, b) -> Long.compare((long) b[0] * b[0] + (long) b[1] * b[1], (long) a[0] * a[0] + (long) a[1] * a[1]));
    for (int[] p : points) {
        pq.offer(p);
        if (pq.size() > k) pq.poll();             // 踢掉最遠的
    }
    return pq.toArray(new int[0][]);
}
```

**範式二，快速選擇**：第 k 大等於排序後索引 `n - k` 的元素。分區後只往目標所在的一邊繼續。

```java
private final Random random = new Random();

int findKthLargest(int[] nums, int k) {
    int target = nums.length - k, lo = 0, hi = nums.length - 1;
    while (true) {
        int p = partition(nums, lo, hi);
        if (p == target) return nums[p];
        if (p < target) lo = p + 1;
        else hi = p - 1;
    }
}

private int partition(int[] a, int lo, int hi) {
    int r = lo + random.nextInt(hi - lo + 1);
    swapAt(a, r, hi);                             // 隨機基準放到最後
    int pivot = a[hi], store = lo;
    for (int i = lo; i < hi; i++)
        if (a[i] < pivot) swapAt(a, i, store++);
    swapAt(a, store, hi);
    return store;                                 // 基準的最終位置
}

private void swapAt(int[] a, int i, int j) { int t = a[i]; a[i] = a[j]; a[j] = t; }
```

**範式三，桶排序**：頻率不會超過 n，所以開 n+1 個桶，`bucket[f]` 放出現 f 次的數，從高頻往低頻收集到 k 個為止。

```java
int[] topKFrequentBucket(int[] nums, int k) {
    Map<Integer, Integer> freq = new HashMap<>();
    for (int x : nums) freq.merge(x, 1, Integer::sum);
    List<List<Integer>> bucket = new ArrayList<>();
    for (int i = 0; i <= nums.length; i++) bucket.add(new ArrayList<>());
    for (Map.Entry<Integer, Integer> e : freq.entrySet()) bucket.get(e.getValue()).add(e.getKey());
    int[] res = new int[k];
    int idx = 0;
    for (int f = nums.length; f >= 1 && idx < k; f--)
        for (int x : bucket.get(f)) {
            if (idx == k) break;
            res[idx++] = x;
        }
    return res;
}
```

**複雜度**：反向堆 O(n log k) 時間、O(k) 空間；快速選擇平均 O(n)、最壞 O(n²)，原地；桶排序 O(n) 時間、O(n) 空間。直接全部排序是 O(n log n)，作為基準線可以先提。

**常見錯誤**：一是要最大的 k 個卻用最大堆，必須把全部元素放進去，空間變成 O(n)。二是快速選擇用固定基準，已排序的輸入會退化成 O(n²)。三是距離比較用 `int` 相乘，座標到 10^4 時平方和還在範圍內，但習慣上轉成 `long` 更安全；用減法寫比較器則可能溢位。

**對應 LeetCode 題目**：

| 題號 | 題目 | 難度 | NeetCode 150 | 用到的範式 |
|------|------|------|:---:|------|
| 347 | [Top K Frequent Elements](https://leetcode.com/problems/top-k-frequent-elements/) | Medium | ✅ | 反向堆或桶排序 |
| 215 | [Kth Largest Element in an Array](https://leetcode.com/problems/kth-largest-element-in-an-array/) | Medium | ✅ | 快速選擇 |
| 973 | [K Closest Points to Origin](https://leetcode.com/problems/k-closest-points-to-origin/) | Medium | ✅ | 反向堆（最大堆） |

## 面試回答方式

先說排序的 O(n log n) 基準，再提反向堆的 O(n log k)，並說明「要最大的用最小堆」的理由。面試官追問能否更快時，提快速選擇的平均 O(n) 與隨機基準；若是頻率類題目，提桶排序的 O(n)。最後比較三者：資料流只能用堆，一次性資料且允許修改陣列可以用快速選擇。

## 講稿

Top K 的題目我會先說最直接的做法，全部排序再取前 k 個，是 n log n。

接著優化成反向堆。要最大的 k 個，我用大小為 k 的最小堆，超過 k 個就把最小的彈出去，堆裡留下的就是最大的 k 個。每次操作只要對數 k 的時間，空間也只要 k，而且資料一直流進來也能用。反過來，要最近的 k 個點，就用最大堆把最遠的踢掉。

如果要更快，可以用快速選擇。它用快速排序的分區，但只往答案所在的那一邊繼續，平均是線性時間。基準一定要隨機選，不然遇到排好的資料會退化成平方。

如果是頻率類的題目，因為頻率不會超過陣列長度，我可以用頻率當索引開桶，從高頻往低頻收集到 k 個，也是線性時間。

## 常見追問

### 三種解法各自適合什麼情境？

**核心答案**：**資料流或記憶體有限**用堆，因為只需要 O(k) 空間且可以邊讀邊處理；**一次性資料、允許修改陣列**用快速選擇，平均最快；**值或頻率範圍有限**用桶排序，穩定的 O(n)。

**詳細解析**：快速選擇會打亂原陣列順序，若不允許修改就要先複製。桶排序在值域很大（例如任意整數）時不可行。分散式 Top K（資料分散在多台機器）則是每台先算局部 Top K 再合併，要注意某元素在各機器上都排第 k+1 名的邊界情況。

**面試回答方式**：用三個情境一句話各配一種解法。

### 快速選擇的最壞情況怎麼避免？

**核心答案**：**隨機選基準**讓最壞情況的機率極低，期望仍是 O(n)。要保證最壞 O(n) 可以用**中位數的中位數**（BFPRT）選基準，但常數很大，實務上很少用。

**詳細解析**：另一個問題是大量重複值，雙路分區在全部相同時會退化，改用三路分區（小於、等於、大於）就能處理：目標落在等於區間就直接回傳。

**面試回答方式**：說出隨機基準與三路分區兩個改進，BFPRT 只需提名字與取捨。

### 如果要求 Top K 的結果依頻率排好序呢？

**核心答案**：堆的做法最後依序彈出再反轉，就是由高到低；桶排序從高頻往低頻收集，天然有序；快速選擇只保證前 k 個在一起，需要再對這 k 個排序，多 O(k log k)。

**詳細解析**：頻率相同時的順序（例如 LeetCode 692 要求字典序）要寫進比較器：頻率不同比頻率，相同比字串。這時反向堆的比較器要同時反轉兩個條件，是常見的出錯點。

**面試回答方式**：說明三種做法的有序性差異，並提醒同頻率時比較器的寫法。

## 相關

- [[../algorithms/013-heap-and-top-k.md]]
- [[008-heaps.md]]
- [[012-sorting.md]]
- [[005-hash-tables.md]]
