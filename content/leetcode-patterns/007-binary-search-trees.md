---
id: leetcode-patterns-007
category: leetcode-patterns
slug: binary-search-trees
title: Binary Search Trees：上下界驗證、中序第 k 小與沿性質下探的 Java 範式
difficulty: medium
tags: [二元搜尋樹, BST, 中序走訪, Java 範式, LeetCode, NeetCode 150]
source: original
---

# 題目

用 Java 寫出二元搜尋樹（BST）的三個範式：用上下界驗證 BST、用中序走訪找第 k 小、沿著 BST 性質往下走找最近公共祖先，並說明它們對應哪些 LeetCode 題目。

## 核心答案

BST 的性質是**左子樹全部小於根、右子樹全部大於根**，由此推出兩個最常用的事實：**中序走訪是遞增序列**，以及**每一步可以只往一邊走**。三個範式：一是**傳遞上下界驗證**，每個節點都要落在祖先們給的區間內，而不只是和父節點比；二是**中序走訪計數**，走到第 k 個就是第 k 小；三是**沿性質下探**，兩個目標都比當前小就往左、都比當前大就往右，否則當前就是分岔點。Java 裡 `TreeMap` 與 `TreeSet` 就是平衡 BST，`floorKey`、`ceilingKey` 等方法很好用。

## 詳細解析

**範式一，上下界驗證**：用 `long` 或 `Integer` 物件當邊界，避免節點值剛好是 `Integer.MIN_VALUE` 或 `MAX_VALUE` 時誤判。

```java
boolean isValidBST(TreeNode root) {
    return valid(root, Long.MIN_VALUE, Long.MAX_VALUE);
}

private boolean valid(TreeNode node, long lo, long hi) {
    if (node == null) return true;
    if (node.val <= lo || node.val >= hi) return false;
    return valid(node.left, lo, node.val) && valid(node.right, node.val, hi);
}
```

**範式二，中序走訪找第 k 小**：用迭代寫法，走到第 k 個就提早結束，不必走完整棵樹。

```java
int kthSmallest(TreeNode root, int k) {
    Deque<TreeNode> stack = new ArrayDeque<>();
    TreeNode cur = root;
    while (cur != null || !stack.isEmpty()) {
        while (cur != null) {            // 一路往左推到底
            stack.push(cur);
            cur = cur.left;
        }
        cur = stack.pop();
        if (--k == 0) return cur.val;    // 第 k 個彈出的就是第 k 小
        cur = cur.right;
    }
    return -1;
}
```

**範式三，沿性質下探**：最近公共祖先就是第一個讓 p、q 分到兩邊（或等於其中之一）的節點。

```java
TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
    TreeNode cur = root;
    while (cur != null) {
        if (p.val < cur.val && q.val < cur.val) cur = cur.left;
        else if (p.val > cur.val && q.val > cur.val) cur = cur.right;
        else return cur;                 // 分岔點
    }
    return null;
}
```

**複雜度**：驗證是 O(n)；第 k 小是 O(h + k)；最近公共祖先是 O(h)。h 是樹高，平衡時是 O(log n)，退化成鏈時是 O(n)。迭代寫法的空間是 O(h) 或 O(1)。

**常見錯誤**：一是驗證時只比父節點，像根是 5、右子樹裡出現 3 的情況就會漏掉。二是用 `int` 當邊界，節點值剛好是 `Integer.MIN_VALUE` 時被誤判為不合法。三是把 BST 的 LCA 寫成一般二元樹的版本，能過但浪費了 BST 性質，面試官會追問能不能更快。

**對應 LeetCode 題目**：

| 題號 | 題目 | 難度 | NeetCode 150 | 用到的範式 |
|------|------|------|:---:|------|
| 98 | [Validate Binary Search Tree](https://leetcode.com/problems/validate-binary-search-tree/) | Medium | ✅ | 上下界驗證 |
| 230 | [Kth Smallest Element in a BST](https://leetcode.com/problems/kth-smallest-element-in-a-bst/) | Medium | ✅ | 中序走訪計數 |
| 235 | [Lowest Common Ancestor of a Binary Search Tree](https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/) | Medium | ✅ | 沿性質下探 |

## 面試回答方式

先說出 BST 的兩個推論：中序遞增、每步只走一邊。接著根據題目選範式。驗證題要主動舉出「只比父節點會錯」的反例，這是面試官最想看你注意到的地方。最後可以補充 Java 的 `TreeMap` 就是紅黑樹實作，實務上很少需要自己寫 BST。

## 講稿

二元搜尋樹我會先抓住兩個性質，一是中序走訪會得到遞增序列，二是每一步只需要往一邊走。

驗證是不是合法的搜尋樹，常見的錯誤是只跟父節點比。其實每個節點都要落在所有祖先給的範圍內，所以我會往下傳一組上下界，往左走就更新上界，往右走就更新下界。邊界我用長整數，避免節點值剛好是整數極值時判斷錯。

找第 k 小就用中序走訪，我用迭代的寫法，一路往左推到底，每彈出一個就計數，數到第 k 個就直接回傳，不用走完整棵樹。

找最近公共祖先，就從根往下走，兩個目標都比較小就往左，都比較大就往右，否則現在這個節點就是它們分岔的地方，時間只跟樹高有關。

## 常見追問

### 如果 BST 經常插入刪除，又要頻繁查第 k 小怎麼辦？

**核心答案**：在每個節點多存「子樹大小」，查第 k 小時比較左子樹大小與 k，就能決定往哪邊走，做到 O(h)。插入刪除時沿路更新大小。

**詳細解析**：這叫順序統計樹（order statistic tree）。左子樹大小若是 `L`，`k <= L` 往左；`k == L + 1` 就是當前節點；否則往右並把 k 減去 `L + 1`。要保證 O(log n) 還需要樹本身是平衡的。

**面試回答方式**：說出「節點存子樹大小」這個增強方式與查找邏輯。

### 一般二元樹（不是 BST）的最近公共祖先怎麼找？

**核心答案**：後序遞迴：左右子樹各回傳找到的目標節點，兩邊都非空時當前節點就是答案，只有一邊非空就把那邊往上傳。這是 LeetCode 236。

**詳細解析**：終止條件是 `root == null || root == p || root == q` 時回傳 `root`。時間 O(n)，因為少了 BST 性質，必須走遍整棵樹。這題和 235 的對比很常被問到。

**面試回答方式**：寫出三行遞迴，並說明為什麼一般二元樹只能做到 O(n)。

### Java 的 TreeMap 有哪些方法在刷題時常用？

**核心答案**：`floorKey(x)`（小於等於 x 的最大鍵）、`ceilingKey(x)`（大於等於 x 的最小鍵）、`firstKey`、`lastKey`、`headMap`、`tailMap`，全部是 O(log n)。

**詳細解析**：例如 LeetCode 981 Time Based Key-Value Store 可以用 `TreeMap<Integer, String>` 的 `floorEntry(timestamp)` 一行解決。查不到時這些方法回傳 `null`，記得處理。`TreeSet` 也有對應的 `floor`、`ceiling`、`lower`、`higher`。

**面試回答方式**：列出 floor 與 ceiling 系列並舉一題用法，展現對 Java 標準庫的熟悉。

## 相關

- [[../algorithms/012-binary-search-tree.md]]
- [[006-trees.md]]
- [[015-tree-traversal.md]]
- [[013-searching.md]]
