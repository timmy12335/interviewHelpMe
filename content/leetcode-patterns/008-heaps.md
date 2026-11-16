---
id: leetcode-patterns-008
category: leetcode-patterns
slug: heaps
title: Heaps：PriorityQueue、固定大小堆與雙堆求中位數的 Java 範式
difficulty: medium
tags: [堆積, PriorityQueue, 雙堆, Java 範式, LeetCode, NeetCode 150]
source: original
---

# 題目

用 Java 寫出堆積的三個範式：用 `PriorityQueue` 反覆取最大值模擬、維持大小為 k 的最小堆、用一大一小兩個堆維護資料流中位數，並說明它們對應哪些 LeetCode 題目。

## 核心答案

堆積能在 O(log n) 內插入、在 O(1) 內看到最小（或最大）值。Java 的 `PriorityQueue` **預設是最小堆**，要最大堆就傳 `Collections.reverseOrder()` 或 `(a, b) -> b - a`。三個範式：一是**反覆取極值模擬**，每次拿出最大的兩個處理後放回；二是**固定大小為 k 的最小堆**，堆頂就是第 k 大；三是**雙堆**，最大堆放較小的一半、最小堆放較大的一半，兩堆頂就是中位數候選。Top K 的其他解法（快速選擇、桶排序）另有一頁，見相關。

## 詳細解析

**範式一，反覆取極值模擬**：最大堆每次彈出兩個最大的，相撞後把剩下的放回。

```java
int lastStoneWeight(int[] stones) {
    PriorityQueue<Integer> pq = new PriorityQueue<>(Collections.reverseOrder());
    for (int s : stones) pq.offer(s);
    while (pq.size() > 1) {
        int a = pq.poll(), b = pq.poll();
        if (a != b) pq.offer(a - b);
    }
    return pq.isEmpty() ? 0 : pq.peek();
}
```

**範式二，固定大小為 k 的最小堆**：堆裡只留最大的 k 個，超過就把最小的踢掉，堆頂就是第 k 大。

```java
class KthLargest {
    private final PriorityQueue<Integer> pq = new PriorityQueue<>();
    private final int k;

    public KthLargest(int k, int[] nums) {
        this.k = k;
        for (int x : nums) add(x);
    }

    public int add(int val) {
        pq.offer(val);
        if (pq.size() > k) pq.poll();     // 踢掉第 k+1 大
        return pq.peek();
    }
}
```

**範式三，雙堆求中位數**：`low` 是最大堆（較小的一半），`high` 是最小堆（較大的一半），保持 `low` 的大小等於 `high` 或多一個。

```java
class MedianFinder {
    private final PriorityQueue<Integer> low = new PriorityQueue<>(Collections.reverseOrder());
    private final PriorityQueue<Integer> high = new PriorityQueue<>();

    public void addNum(int num) {
        low.offer(num);
        high.offer(low.poll());           // 先過一次 low，確保 high 拿到的是較大的
        if (high.size() > low.size()) low.offer(high.poll());
    }

    public double findMedian() {
        return low.size() > high.size() ? low.peek() : (low.peek() + (long) high.peek()) / 2.0;
    }
}
```

**複雜度**：建堆逐一插入是 O(n log n)；範式二每次 `add` 是 O(log k)；範式三每次 `addNum` 是 O(log n)、`findMedian` 是 O(1)。空間分別是 O(n)、O(k)、O(n)。

**常見錯誤**：一是以為 `PriorityQueue` 預設是最大堆。二是比較器寫 `(a, b) -> b - a`，遇到極端值會溢位，安全寫法是 `Collections.reverseOrder()` 或 `Integer.compare(b, a)`。三是用 `for (int x : pq)` 走訪以為會照順序，其實迭代順序是陣列順序，只有 `poll` 才保證有序。

**對應 LeetCode 題目**：

| 題號 | 題目 | 難度 | NeetCode 150 | 用到的範式 |
|------|------|------|:---:|------|
| 1046 | [Last Stone Weight](https://leetcode.com/problems/last-stone-weight/) | Easy | ✅ | 最大堆模擬 |
| 703 | [Kth Largest Element in a Stream](https://leetcode.com/problems/kth-largest-element-in-a-stream/) | Easy | ✅ | 大小為 k 的最小堆 |
| 295 | [Find Median from Data Stream](https://leetcode.com/problems/find-median-from-data-stream/) | Hard | ✅ | 雙堆 |

## 面試回答方式

看到「反覆取最大或最小」「第 k 大」「資料流」這些字眼就提堆。寫 Java 時先說明 `PriorityQueue` 預設是最小堆，並選安全的比較器寫法。雙堆題要講出兩個不變量：`low` 的每個元素都小於等於 `high` 的每個元素，以及兩堆大小差不超過一。

## 講稿

看到題目要反覆拿最大或最小值，或是要第 k 大，或是資料一直流進來，我就會想到堆。

Java 的優先佇列預設是最小堆，要最大堆我會傳反向排序的比較器，不用減法，避免溢位。

第一種用法是模擬，像最後一顆石頭的重量，每次拿出最大的兩個相撞，剩下的再放回去。

第二種是維持大小為 k 的最小堆，堆裡只留最大的 k 個，超過就把最小的踢掉，這樣堆頂就是第 k 大，每次新增只要對數 k 的時間。

第三種是用兩個堆求中位數，最大堆放比較小的那一半，最小堆放比較大的那一半，大小差不超過一。新數字先進最大堆，再把它的堆頂移到最小堆，最後平衡大小，中位數就從兩個堆頂算出來。

## 常見追問

### 為什麼第 k 大要用最小堆而不是最大堆？

**核心答案**：最小堆大小固定為 k，堆頂是這 k 個裡最小的，也就是第 k 大，空間 O(k)、每次 O(log k)。最大堆要把全部 n 個放進去再彈 k 次，空間 O(n)。

**詳細解析**：資料流情境下 n 不斷成長，最大堆會無限變大，最小堆則固定在 k。這也是為什麼 Top K 題目的標準答案幾乎都是「大小為 k 的反向堆」：要最大的 k 個就用最小堆，要最小的 k 個就用最大堆。

**面試回答方式**：講出空間差異與「反向堆」這個口訣。

### 建堆一定是 O(n log n) 嗎？

**核心答案**：逐一插入是 O(n log n)，但由下往上的 heapify 是 O(n)。Java 的 `new PriorityQueue<>(collection)` 用的就是 O(n) 建堆。

**詳細解析**：heapify 從最後一個非葉節點往前做下沉，越底層的節點越多但下沉距離越短，加總起來是 O(n)。刷題時差別不大，但被問到堆排序或建堆複雜度時要能說出這點。

**面試回答方式**：區分兩種建堆方式，並說明 heapify 為什麼是線性。

### 雙堆求中位數，如果資料有 99% 落在 0 到 100 之間怎麼優化？

**核心答案**：用 101 個計數桶記錄 0 到 100 的出現次數，另外兩個計數器記錄小於 0 與大於 100 的數量，中位數幾乎一定落在桶裡，掃一次桶就找到。

**詳細解析**：這是 295 的經典追問。若所有數都在 0 到 100 之間，計數陣列就夠了，`findMedian` 是 O(101)。若有 1% 的離群值，就額外用兩個結構存它們，因為中位數不會落在那 1% 裡，只是計數時要算進去。

**面試回答方式**：說出計數桶的做法，並指出離群值只需要計數不需要排序。

## 相關

- [[../algorithms/013-heap-and-top-k.md]]
- [[029-top-k-elements.md]]
- [[018-shortest-path.md]]
- [[012-sorting.md]]
