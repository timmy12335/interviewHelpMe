---
id: leetcode-patterns-023
category: leetcode-patterns
slug: fast-and-slow-pointers
title: Fast and Slow Pointers：判環、找環入口與找中點的 Java 範式
difficulty: medium
tags: [快慢指針, Floyd 判圈, 連結串列, Java 範式, LeetCode, NeetCode 150]
source: original
---

# 題目

用 Java 寫出快慢指針的三個範式：判斷連結串列有沒有環、找出環的入口（並延伸到把陣列值當指標的找重複數）、以及找連結串列中點，並說明它們對應哪些 LeetCode 題目。

## 核心答案

快慢指針讓兩個指標**同向但不同速**，通常快的一次兩步、慢的一次一步。三個範式：一是**判環**，有環時快指針一定會追上慢指針，因為進環後兩者距離每步縮小 1；二是**找環入口**（Floyd 演算法第二階段），相遇後把其中一個放回起點，兩個都改成一次一步，再次相遇處就是入口；三是**找中點**，快指針走到底時慢指針正好在中間。只要「下一個位置由目前位置唯一決定」，就能看成一條可能有環的串列，例如 `i → nums[i]`、或一個數字 → 它各位數的平方和。

## 詳細解析

**範式一，判環**：快指針要檢查 `fast` 與 `fast.next` 都不是 `null`。

```java
boolean hasCycle(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow == fast) return true;
    }
    return false;
}
```

**範式二，找環入口**：設起點到入口距離 a、入口到相遇點距離 b、環長 c。相遇時快指針走了慢指針的兩倍，推得 a 等於「從相遇點往前走到入口」的距離（再加上整數圈），所以兩個一次一步的指針會在入口相遇。

```java
ListNode detectCycle(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow == fast) {
            ListNode p = head;
            while (p != slow) { p = p.next; slow = slow.next; }
            return p;                         // 環的入口
        }
    }
    return null;
}
```

**範式二的延伸，把陣列當串列**：`n + 1` 個數、值域 1 到 n，把 `i → nums[i]` 當成邊，重複的數就是環的入口。不修改陣列、O(1) 空間。

```java
int findDuplicate(int[] nums) {
    int slow = nums[0], fast = nums[nums[0]];
    while (slow != fast) {
        slow = nums[slow];
        fast = nums[nums[fast]];
    }
    int p = 0;
    while (p != slow) { p = nums[p]; slow = nums[slow]; }
    return p;
}
```

**範式三，找中點**：偶數長度時，這個寫法停在**右中點**；要左中點就把條件改成 `fast.next != null && fast.next.next != null`。

```java
ListNode middleNode(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
    }
    return slow;
}
```

**複雜度**：三個範式都是時間 O(n)、空間 O(1)。用 `HashSet` 記錄拜訪過的節點也能判環，但空間是 O(n)，面試官通常會要求改成快慢指針。

**常見錯誤**：一是判環只檢查 `fast.next != null`，`fast` 本身是 `null` 時就丟出空指標例外。二是找重複數時兩個指針從同一個起點出發，卻把 `fast` 先走了兩步、`slow` 一步，迴圈條件和起點不一致導致第二階段算錯；上面的寫法讓第一步就在初始化完成。三是找中點的題目沒先確認要左中點還是右中點。

**對應 LeetCode 題目**：

| 題號 | 題目 | 難度 | NeetCode 150 | 用到的範式 |
|------|------|------|:---:|------|
| 141 | [Linked List Cycle](https://leetcode.com/problems/linked-list-cycle/) | Easy | ✅ | 判環 |
| 287 | [Find the Duplicate Number](https://leetcode.com/problems/find-the-duplicate-number/) | Medium | ✅ | 陣列當串列找入口 |
| 876 | [Middle of the Linked List](https://leetcode.com/problems/middle-of-the-linked-list/) | Easy | | 找中點 |

## 面試回答方式

判環題先給 `HashSet` 的 O(n) 空間解，再優化到快慢指針的 O(1)。找入口時要能講出「兩段距離相等」的推導結論。287 這題最大的亮點是說出「把 `i → nums[i]` 看成串列」的轉換，並說明為什麼重複值就是環的入口：兩個不同的索引指向同一個值。

## 講稿

快慢指針就是兩個指標往同一個方向走，速度不一樣，通常快的一次兩步，慢的一次一步。

最基本的是判斷有沒有環。如果有環，快指針一定會追上慢指針，因為進到環裡之後，兩者的距離每走一步就縮小一，不會跳過。

找環的入口要再多一步。相遇之後，我把其中一個指標放回起點，兩個都改成一次走一步，再次相遇的地方就是入口。原因是從起點到入口的距離，剛好等於從相遇點繼續走到入口的距離。

這個技巧不只用在連結串列。像找重複的數字，我把每個索引指向它的值，就變成一條有環的串列，重複的那個值就是環的入口，不用改陣列，也不用額外空間。

找中點也一樣，快指針走到底時，慢指針就在中間。

## 常見追問

### 為什麼快指針一次走兩步，不走三步？

**核心答案**：兩步保證進環後每步距離縮小 1，一定會相遇而不會跳過。走三步時距離每步縮小 2，若環長是偶數而初始距離是奇數，可能永遠錯開；而且入口推導的公式也會改變。

**詳細解析**：速度差為 d 時，環上的距離每步縮小 d，對環長取餘數後不一定會經過 0，是否相遇要另外論證；速度差為 1 時距離一定會依序變成 0，推導最簡潔，所以兩步是標準寫法。面試中說出「每步縮小 1 所以不會跳過」就足夠。

**面試回答方式**：講出「距離每步縮小 1」這個核心論點。

### 快樂數（Happy Number）怎麼用快慢指針？

**核心答案**：把「數字 → 各位數平方和」看成指標，數字序列不是走到 1 就是進入一個不含 1 的環。用快慢指針，相遇時檢查是不是 1。

**詳細解析**：這是 LeetCode 202，NeetCode 150 收錄在數學類。可以證明序列不會無限發散，因為大數的平方和會迅速變小，所以一定會進入環。用 `HashSet` 也可以，但快慢指針是 O(1) 空間。

**面試回答方式**：說出「把函數迭代看成串列」的轉換，與 287 是同一個思路。

### 回文連結串列怎麼在 O(1) 空間判斷？

**核心答案**：快慢指針找中點，反轉後半段，再從兩端往中間比較；比較完最好把後半段反轉回來，恢復原串列。這是 LeetCode 234。

**詳細解析**：這題組合了三個範式：快慢指針找中點、迭代反轉、雙指針比較。奇數長度時中間節點不用比，用右中點開始反轉剛好讓前半段多一個節點，比較時以後半段走完為止即可。

**面試回答方式**：說出三步驟，並提到恢復原串列是好習慣。

## 相關

- [[../algorithms/008-linked-list-patterns.md]]
- [[002-linked-lists.md]]
- [[020-two-pointers.md]]
