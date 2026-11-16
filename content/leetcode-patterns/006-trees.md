---
id: leetcode-patterns-006
category: leetcode-patterns
slug: trees
title: Trees：遞迴回傳值與自底向上計算的 Java 範式
difficulty: easy
tags: [二元樹, 遞迴, Java 範式, LeetCode, NeetCode 150]
source: original
---

# 題目

用 Java 寫出二元樹題的遞迴範式：「信任子問題」的回傳值寫法、原地修改樹的寫法、以及回傳一個值但同時更新全域答案的寫法，並說明它們對應哪些 LeetCode 題目。

## 核心答案

樹的題目幾乎都是遞迴，關鍵是**定義清楚函式回傳什麼**，然後**相信左右子樹已經算好**。三個範式：一是**自底向上回傳值**，例如深度等於 `1 + max(左深度, 右深度)`；二是**原地修改**，例如翻轉樹就是交換左右後遞迴；三是**回傳值和答案不同**，函式回傳「往下走的單邊最長」，但在每個節點順便用「左加右」更新全域答案，直徑、最大路徑和都是這個形態。走訪順序（前序、中序、後序、層序）另有一頁，見相關。

## 詳細解析

**範式一，自底向上回傳值**：先寫終止條件（空節點），再用左右子樹的結果組出自己的答案。

```java
int maxDepth(TreeNode root) {
    if (root == null) return 0;
    return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}
```

**範式二，原地修改**：處理自己（交換左右），再交給子樹處理，最後回傳自己。

```java
TreeNode invertTree(TreeNode root) {
    if (root == null) return null;
    TreeNode t = root.left;
    root.left = invertTree(root.right);
    root.right = invertTree(t);
    return root;
}
```

**範式三，回傳值和答案不同**：`depth` 回傳「從這個節點往下的最長單邊」，但經過這個節點的最長路徑是「左單邊加右單邊」，用它更新全域答案。

```java
private int diameter;

int diameterOfBinaryTree(TreeNode root) {
    diameter = 0;
    depth(root);
    return diameter;
}

private int depth(TreeNode node) {
    if (node == null) return 0;
    int l = depth(node.left), r = depth(node.right);
    diameter = Math.max(diameter, l + r);       // 經過 node 的路徑長（邊數）
    return 1 + Math.max(l, r);                   // 往上只能帶一邊
}
```

**複雜度**：三個範式都是時間 O(n)，每個節點拜訪一次；空間是遞迴深度 O(h)，平衡樹是 O(log n)，退化成一條鏈時是 O(n)。

**常見錯誤**：一是翻轉樹時沒有先存 `root.left`，覆蓋後就找不回原本的左子樹。二是範式三把「回傳值」和「答案」混在一起，直接回傳 `l + r`，結果上層把兩邊都接上，算出不合法的路徑。三是全域變數沒在每次呼叫入口重設，LeetCode 同一個物件跑多筆測資時會殘留上一次的答案。

**對應 LeetCode 題目**：

| 題號 | 題目 | 難度 | NeetCode 150 | 用到的範式 |
|------|------|------|:---:|------|
| 104 | [Maximum Depth of Binary Tree](https://leetcode.com/problems/maximum-depth-of-binary-tree/) | Easy | ✅ | 自底向上回傳值 |
| 226 | [Invert Binary Tree](https://leetcode.com/problems/invert-binary-tree/) | Easy | ✅ | 原地修改 |
| 543 | [Diameter of Binary Tree](https://leetcode.com/problems/diameter-of-binary-tree/) | Easy | ✅ | 回傳單邊、更新答案 |

## 面試回答方式

開始寫之前，用一句話說出遞迴函式的定義，例如「`depth(node)` 回傳從 node 往下的最長單邊節點數」。這句話講清楚，程式幾乎就寫完了。遇到路徑類題目時，主動指出「往上只能帶一邊，但答案可以兩邊都用」，這是範式三的關鍵。

## 講稿

樹的題目我幾乎都用遞迴，最重要的是先講清楚函式要回傳什麼，然後相信左右子樹已經幫我算好了。

最簡單的是自底向上回傳值，像最大深度，就是空節點回傳零，其他節點回傳一加上左右兩邊比較深的那個。

第二種是原地修改，像翻轉二元樹，就是把左右交換，再交給子樹各自翻轉。要注意先把原本的左子樹存起來，不然覆蓋掉就找不回來了。

第三種比較容易錯，是回傳值跟答案不一樣。像二元樹的直徑，函式回傳的是往下的單邊最長，因為往上只能帶一邊。但在每個節點，我會用左邊加右邊去更新全域答案，因為最長路徑可能就在這裡轉彎。這三種都是線性時間，空間取決於樹的高度。

## 常見追問

### 遞迴太深會堆疊溢位，怎麼改寫？

**核心答案**：改成迭代，用顯式的 `Deque` 模擬呼叫堆疊。最大深度也可以用層序走訪，數有幾層就是深度。

**詳細解析**：Java 預設執行緒堆疊約 512KB 到 1MB，一條十萬個節點的鏈狀樹會溢位。後序類的計算改迭代比較麻煩，需要記錄節點是否已處理過子節點；前序與層序改迭代就很直接。面試時通常說明風險並給出思路即可。

**面試回答方式**：點出退化樹的深度風險，再說明層序或顯式堆疊的改法。

### 二元樹最大路徑和（LeetCode 124）跟直徑有什麼差別？

**核心答案**：骨架完全一樣，差別在節點值可能是負的，所以子樹貢獻要和 0 取最大值，負的就乾脆不接。

**詳細解析**：函式回傳 `node.val + max(0, max(l, r))`，答案更新為 `node.val + max(0, l) + max(0, r)`。全域答案初始值要設成 `Integer.MIN_VALUE`，因為整棵樹可能全是負數。這題是 NeetCode 150 的 Hard，本質就是範式三。

**面試回答方式**：說出「與 0 取最大」與「初始值用最小整數」兩個差異。

### 判斷兩棵樹是否相同要怎麼寫？

**核心答案**：兩個都空回傳 `true`，只有一個空或值不同回傳 `false`，否則遞迴比較左對左、右對右。這是 LeetCode 100，也是 572 子樹判斷的零件。

**詳細解析**：572 Subtree of Another Tree 就是對主樹每個節點呼叫一次 `isSameTree`，最壞 O(m·n)。要更快可以把兩棵樹序列化成字串後做字串匹配，但面試多半接受 O(m·n) 的寫法。

**面試回答方式**：先寫出三個終止條件，再說明它如何被 572 重用。

## 相關

- [[../algorithms/011-tree-traversal.md]]
- [[007-binary-search-trees.md]]
- [[015-tree-traversal.md]]
- [[026-recursion.md]]
