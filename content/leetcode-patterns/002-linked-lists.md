---
id: leetcode-patterns-002
category: leetcode-patterns
slug: linked-lists
title: Linked Lists：虛擬頭節點、反轉與合併的 Java 範式
difficulty: easy
tags: [連結串列, 虛擬頭節點, Java 範式, LeetCode, NeetCode 150]
source: original
---

# 題目

用 Java 寫出連結串列的三個基本範式：虛擬頭節點、迭代反轉、合併兩條已排序串列，並說明它們對應哪些 LeetCode 題目。

## 核心答案

連結串列題的難點不是演算法，而是**指標操作不出錯**。三個範式能處理大部分題目：一是**虛擬頭節點**（dummy），讓「頭節點可能被刪掉或換掉」的情況不必特別處理；二是**迭代反轉**，用 `prev`、`cur`、`next` 三個變數，每一步先存下一個、再改指向、最後往前走；三是**合併兩條已排序串列**，用 dummy 接一條新的尾巴，誰小接誰。快慢指針另有一頁，見相關。

## 詳細解析

**範式一，虛擬頭節點**：凡是可能改到頭節點的題目，先建一個 `dummy` 指向 `head`，最後回傳 `dummy.next`。以刪除倒數第 n 個節點為例：

```java
ListNode removeNthFromEnd(ListNode head, int n) {
    ListNode dummy = new ListNode(0, head);
    ListNode fast = dummy, slow = dummy;
    for (int i = 0; i <= n; i++) fast = fast.next;   // 讓 fast 先走 n+1 步
    while (fast != null) {
        fast = fast.next;
        slow = slow.next;
    }
    slow.next = slow.next.next;                       // slow 停在要刪節點的前一個
    return dummy.next;
}
```

**範式二，迭代反轉**：口訣是「存、改、移」，先存 `next`，再把 `cur.next` 指回 `prev`，最後兩個指標各往前一步。

```java
ListNode reverseList(ListNode head) {
    ListNode prev = null, cur = head;
    while (cur != null) {
        ListNode next = cur.next;   // 存
        cur.next = prev;            // 改
        prev = cur;                 // 移
        cur = next;
    }
    return prev;                    // 新的頭
}
```

**範式三，合併兩條已排序串列**：`tail` 永遠指向新串列的最後一個節點，最後把還沒走完的那條整段接上。

```java
ListNode mergeTwoLists(ListNode a, ListNode b) {
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

**複雜度**：三個範式都是時間 O(n)、空間 O(1)。反轉若用遞迴寫，空間會變成 O(n) 的呼叫堆疊，串列很長時有堆疊溢位的風險。

**常見錯誤**：一是反轉時先改了 `cur.next` 才去存下一個節點，串列就斷了。二是刪除倒數第 n 個時 fast 只先走 n 步，結果 slow 停在要刪的節點上而不是它前面。三是合併後忘了接上剩下的那一段。

**對應 LeetCode 題目**：

| 題號 | 題目 | 難度 | NeetCode 150 | 用到的範式 |
|------|------|------|:---:|------|
| 206 | [Reverse Linked List](https://leetcode.com/problems/reverse-linked-list/) | Easy | ✅ | 迭代反轉 |
| 21 | [Merge Two Sorted Lists](https://leetcode.com/problems/merge-two-sorted-lists/) | Easy | ✅ | dummy 加合併 |
| 19 | [Remove Nth Node From End of List](https://leetcode.com/problems/remove-nth-node-from-end-of-list/) | Medium | ✅ | dummy 加前後指針 |

## 面試回答方式

寫之前先畫三到四個節點的小圖，邊畫邊說每個指標指向哪裡，面試官最在意的是你不會把串列弄斷。用 dummy 時要說出理由：頭節點可能被刪或被換，dummy 讓所有節點都有前一個節點。寫完用「空串列」與「只有一個節點」兩個例子走一遍。

## 講稿

連結串列的題目，難的通常不是想法，而是指標不要寫錯，所以我會先畫一個三四個節點的小圖。

第一個習慣是用虛擬頭節點。只要頭節點有可能被刪掉或換掉，我就先建一個假的節點指向它，這樣每個真實節點都有前一個節點，不用另外寫判斷，最後回傳它的下一個就好。

第二個是反轉，我記成存、改、移三步。先把下一個節點存起來，再把當前節點指回前一個，最後兩個指標一起往前走。順序錯了串列就會斷。

第三個是合併兩條排序好的串列，用一個尾巴指標接上比較小的那個節點，迴圈結束後把剩下那段整個接上。這三個都是線性時間、常數空間。寫完我會用空串列和只有一個節點的情況各走一次，確認沒有空指標。

## 常見追問

### 反轉串列可以用遞迴寫嗎？差在哪？

**核心答案**：可以。遞迴先反轉 `head.next` 之後的部分，再讓 `head.next.next = head`、`head.next = null`。時間一樣是 O(n)，但空間是 O(n) 的呼叫堆疊。

**詳細解析**：遞迴版的關鍵是理解「回來時 `head.next` 已經是反轉後串列的尾巴」，所以把它的 `next` 指回 `head` 就接上了。串列長到上萬個節點時，Java 預設的堆疊可能不夠，實務上迭代版比較安全。

**面試回答方式**：先寫迭代版，被問到再寫遞迴版，並主動比較兩者的空間。

### 如果要反轉一段區間（第 left 到 right 個節點）怎麼做？

**核心答案**：用 dummy 找到區間前一個節點 `pre`，接著做 `right - left` 次「頭插法」：每次把 `cur.next` 拿出來插到 `pre` 後面。這是 LeetCode 92 的標準寫法。

**詳細解析**：頭插法的好處是不用先切斷再接回，`pre` 和 `cur` 都不動，只有被拿出來的節點在移動。dummy 在這題特別重要，因為 left 可能是 1，也就是頭節點要被換掉。

**面試回答方式**：說出頭插法的三行指標操作，並強調 dummy 處理 left 等於 1 的情況。

### 合併 k 條已排序串列怎麼做？

**核心答案**：用最小堆放每條串列的頭，每次取出最小的接到結果後面，再把它的下一個放回堆裡，時間 O(N log k)。也可以兩兩合併，同樣是 O(N log k)。

**詳細解析**：這是 LeetCode 23，NeetCode 150 收錄的 Hard 題。堆的寫法用 `PriorityQueue<ListNode>` 加上 `(x, y) -> Integer.compare(x.val, y.val)`；分治寫法則是對 k 條串列做合併排序式的兩兩合併，可以直接重用上面的 `mergeTwoLists`。

**面試回答方式**：先講堆的做法與複雜度，再提分治做法可以重用合併兩條的函式。

## 相關

- [[../algorithms/008-linked-list-patterns.md]]
- [[023-fast-and-slow-pointers.md]]
- [[024-divide-and-conquer.md]]
- [[026-recursion.md]]
