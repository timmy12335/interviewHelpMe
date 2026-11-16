---
id: leetcode-patterns-015
category: leetcode-patterns
slug: tree-traversal
title: Tree Traversal：前序、中序、後序的遞迴與迭代寫法，以及層序走訪的 Java 範式
difficulty: medium
tags: [樹的遍歷, 前序, 中序, 後序, 層序, Java 範式, LeetCode, NeetCode 150]
source: original
---

# 題目

用 Java 寫出二元樹的前序（pre-order）、中序（in-order）、後序（post-order）走訪的遞迴與迭代版本，以及按層的 BFS 走訪，並說明它們對應哪些 LeetCode 題目。

## 核心答案

三種深度優先的走訪差別只在**什麼時候處理節點**：前序是「根、左、右」，進入節點時處理；中序是「左、根、右」，左子樹處理完才處理自己，BST 的中序是遞增序列；後序是「左、右、根」，兩個子樹都處理完才處理自己，適合需要子樹結果的計算。遞迴版只是把一行 `res.add` 搬位置；迭代版用顯式堆疊，前序與中序各有固定寫法，後序可以用「根、右、左」的前序再反轉。**層序走訪**用佇列，每輪先記下佇列大小，就能把同一層的節點分在一起。

## 詳細解析

**遞迴版**：三種走訪只差 `res.add` 的位置。

```java
void preorder(TreeNode n, List<Integer> res) {
    if (n == null) return;
    res.add(n.val);                 // 前序：進來就處理
    preorder(n.left, res);
    preorder(n.right, res);
}

void inorder(TreeNode n, List<Integer> res) {
    if (n == null) return;
    inorder(n.left, res);
    res.add(n.val);                 // 中序：左邊處理完才處理自己
    inorder(n.right, res);
}

void postorder(TreeNode n, List<Integer> res) {
    if (n == null) return;
    postorder(n.left, res);
    postorder(n.right, res);
    res.add(n.val);                 // 後序：兩邊都處理完才處理自己
}
```

**迭代前序**：彈出就處理，先推右再推左，左邊才會先被彈出。

```java
List<Integer> preorderIter(TreeNode root) {
    List<Integer> res = new ArrayList<>();
    if (root == null) return res;
    Deque<TreeNode> stack = new ArrayDeque<>();
    stack.push(root);
    while (!stack.isEmpty()) {
        TreeNode n = stack.pop();
        res.add(n.val);
        if (n.right != null) stack.push(n.right);
        if (n.left != null) stack.push(n.left);
    }
    return res;
}
```

**迭代中序**：一路往左推到底，彈出時處理，再轉向右子樹。這個寫法也是 BST 第 k 小的骨架。

```java
List<Integer> inorderIter(TreeNode root) {
    List<Integer> res = new ArrayList<>();
    Deque<TreeNode> stack = new ArrayDeque<>();
    TreeNode cur = root;
    while (cur != null || !stack.isEmpty()) {
        while (cur != null) { stack.push(cur); cur = cur.left; }
        cur = stack.pop();
        res.add(cur.val);
        cur = cur.right;
    }
    return res;
}
```

**迭代後序**：做「根、右、左」的前序，每次插到結果最前面，等於把它反轉成「左、右、根」。

```java
List<Integer> postorderIter(TreeNode root) {
    LinkedList<Integer> res = new LinkedList<>();
    if (root == null) return res;
    Deque<TreeNode> stack = new ArrayDeque<>();
    stack.push(root);
    while (!stack.isEmpty()) {
        TreeNode n = stack.pop();
        res.addFirst(n.val);                       // 插到最前面
        if (n.left != null) stack.push(n.left);    // 先推左，右會先被彈出
        if (n.right != null) stack.push(n.right);
    }
    return res;
}
```

**層序走訪**：每輪開始時佇列裡剛好是同一層的節點，先記下 `size` 再處理這麼多個。

```java
List<List<Integer>> levelOrder(TreeNode root) {
    List<List<Integer>> res = new ArrayList<>();
    if (root == null) return res;
    Queue<TreeNode> q = new ArrayDeque<>();
    q.offer(root);
    while (!q.isEmpty()) {
        int size = q.size();                       // 這一層有幾個
        List<Integer> level = new ArrayList<>();
        for (int i = 0; i < size; i++) {
            TreeNode n = q.poll();
            level.add(n.val);
            if (n.left != null) q.offer(n.left);
            if (n.right != null) q.offer(n.right);
        }
        res.add(level);
    }
    return res;
}
```

**複雜度**：所有走訪都是時間 O(n)。深度優先的空間是 O(h)；層序的空間是 O(w)，w 是最寬那一層的節點數，完全二元樹最底層約 n/2。

**常見錯誤**：一是迭代前序先推左再推右，結果變成「根、右、左」。二是層序走訪在迴圈裡用 `q.size()` 當上限，佇列一邊加一邊變大，層就分不開了。三是反轉法的後序只能拿到序列，不能在過程中「處理完兩個子樹後做事」，需要真正的後序計算時要用遞迴或記錄上次拜訪的節點。

**對應 LeetCode 題目**：

| 題號 | 題目 | 難度 | NeetCode 150 | 用到的範式 |
|------|------|------|:---:|------|
| 94 | [Binary Tree Inorder Traversal](https://leetcode.com/problems/binary-tree-inorder-traversal/) | Easy | | 迭代中序 |
| 145 | [Binary Tree Postorder Traversal](https://leetcode.com/problems/binary-tree-postorder-traversal/) | Easy | | 反轉法後序 |
| 102 | [Binary Tree Level Order Traversal](https://leetcode.com/problems/binary-tree-level-order-traversal/) | Medium | ✅ | 層序走訪 |

## 面試回答方式

先說「三種走訪只差處理節點的時機」，然後根據題目需要選：需要先知道父節點資訊用前序、BST 有序性用中序、需要子樹結果用後序、按層處理用層序。面試官要求迭代版時，前序與中序直接寫，後序說明反轉技巧並指出它的限制。

## 講稿

前序、中序、後序這三種走訪，差別只在什麼時候處理節點。前序是一進來就處理，中序是左子樹做完才處理自己，後序是兩個子樹都做完才處理自己。遞迴的寫法就是把加入結果那一行搬到不同位置。

迭代的寫法我用堆疊。前序是彈出就處理，先推右再推左，這樣左邊會先出來。中序是一路往左推到底，彈出時處理，再轉向右邊。後序比較麻煩，我會做根、右、左的前序，每次插到結果最前面，等於反轉成左、右、根。

層序走訪用佇列。重點是每一輪開始時，先記下佇列現在的大小，這些剛好就是同一層的節點，處理完這麼多個再進下一層，這樣就能把每一層分開。

## 常見追問

### 能不能用 O(1) 額外空間做中序走訪？

**核心答案**：可以，用 **Morris 走訪**：利用葉節點空著的右指標，暫時指回中序後繼，走完再還原，時間 O(n)、空間 O(1)。

**詳細解析**：對每個有左子樹的節點，找左子樹的最右節點；若它的右指標為空，就指向當前節點並往左走；若已經指向當前節點，代表左子樹走完了，還原指標、處理當前節點、往右走。面試中通常只需要說出想法。

**面試回答方式**：說出「借用空的右指標當回程線索」並強調會還原樹結構。

### 層序走訪怎麼改成鋸齒狀（Zigzag）？

**核心答案**：骨架不變，只是奇數層把 `level` 反轉，或用 `LinkedList` 依層數決定 `addLast` 還是 `addFirst`。這是 LeetCode 103。

**詳細解析**：不要試圖改變節點入隊的順序，那樣下一層會亂掉。只改「這一層的值怎麼放進 level」最安全。同理，右視圖（199）就是每層取最後一個。

**面試回答方式**：強調只改輸出順序、不改入隊順序，並提到右視圖是同一個骨架。

### 從前序與中序結果能還原二元樹嗎？

**核心答案**：可以（值不重複時）。前序第一個是根，在中序裡找到根的位置，左邊是左子樹、右邊是右子樹，遞迴下去。用 `HashMap` 存中序的索引，總時間 O(n)。這是 LeetCode 105。

**詳細解析**：前序加後序無法唯一還原，因為分不出只有一個子節點時是左還是右。中序是必要的，因為它把左右子樹分開。

**面試回答方式**：說出遞迴切分的方式，並指出為什麼前序加後序不夠。

## 相關

- [[../algorithms/011-tree-traversal.md]]
- [[006-trees.md]]
- [[007-binary-search-trees.md]]
- [[016-dfs-and-bfs.md]]
