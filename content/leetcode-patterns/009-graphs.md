---
id: leetcode-patterns-009
category: leetcode-patterns
slug: graphs
title: Graphs：鄰接表建圖、網格當圖與 visited 的 Java 範式
difficulty: medium
tags: [圖, 鄰接表, 網格, Java 範式, LeetCode, NeetCode 150]
source: original
---

# 題目

用 Java 寫出圖的三個基礎範式：從邊列表建鄰接表、把二維網格當成圖來走、以及複製圖時用雜湊表兼做 visited 與新舊節點對應，並說明它們對應哪些 LeetCode 題目。

## 核心答案

圖的題目第一步永遠是**決定怎麼表示**。三個範式：一是**邊列表轉鄰接表**，用 `List<List<Integer>>`，無向圖要兩個方向都加；二是**網格當圖**，每個格子是節點、上下左右是邊，用方向陣列 `{{1,0},{-1,0},{0,1},{0,-1}}` 走鄰居；三是**用 `Map` 兼做 visited**，例如複製圖時「舊節點 → 新節點」的對應表本身就能判斷是否拜訪過。走訪本身（DFS、BFS）與更進階的演算法另有各自的頁面，見相關。

## 詳細解析

**範式一，邊列表轉鄰接表**：判斷一張無向圖是不是樹，條件是邊數等於 n−1 而且全部連通。

```java
boolean validTree(int n, int[][] edges) {
    if (edges.length != n - 1) return false;              // 樹剛好 n-1 條邊
    List<List<Integer>> g = new ArrayList<>();
    for (int i = 0; i < n; i++) g.add(new ArrayList<>());
    for (int[] e : edges) {
        g.get(e[0]).add(e[1]);
        g.get(e[1]).add(e[0]);                            // 無向圖兩邊都要加
    }
    boolean[] seen = new boolean[n];
    Deque<Integer> stack = new ArrayDeque<>();
    stack.push(0);
    seen[0] = true;
    int count = 1;
    while (!stack.isEmpty()) {
        for (int nb : g.get(stack.pop())) {
            if (!seen[nb]) { seen[nb] = true; count++; stack.push(nb); }
        }
    }
    return count == n;                                    // 全部連通
}
```

**範式二，網格當圖**：島嶼數量就是數連通塊。拜訪過的陸地直接改成 `'0'`，省掉 visited 陣列。

```java
private static final int[][] DIRS = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};

int numIslands(char[][] grid) {
    int count = 0;
    for (int i = 0; i < grid.length; i++)
        for (int j = 0; j < grid[0].length; j++)
            if (grid[i][j] == '1') { count++; sink(grid, i, j); }
    return count;
}

private void sink(char[][] grid, int i, int j) {
    if (i < 0 || j < 0 || i >= grid.length || j >= grid[0].length || grid[i][j] != '1') return;
    grid[i][j] = '0';                                     // 標記已拜訪
    for (int[] d : DIRS) sink(grid, i + d[0], j + d[1]);
}
```

**範式三，Map 兼做 visited**：複製圖時先建立新節點並放進對應表，再處理鄰居，這樣遇到環時能直接拿到已建好的新節點。

```java
private final Map<Node, Node> copies = new HashMap<>();

Node cloneGraph(Node node) {
    if (node == null) return null;
    if (copies.containsKey(node)) return copies.get(node);
    Node copy = new Node(node.val);
    copies.put(node, copy);                               // 先放進表，再處理鄰居
    for (Node nb : node.neighbors) copy.neighbors.add(cloneGraph(nb));
    return copy;
}
```

**複雜度**：三個範式都是 O(V + E)，網格是 O(m·n)。鄰接表的空間是 O(V + E)；若用鄰接矩陣則是 O(V²)，只適合節點少而邊很密的圖。

**常見錯誤**：一是無向圖只加了一個方向，從某些節點出發會走不到。二是網格題在呼叫遞迴之後才標記拜訪，同一格會被重複推入，甚至無限遞迴。三是複製圖時處理完鄰居才放進對應表，遇到環就會無限遞迴。

**對應 LeetCode 題目**：

| 題號 | 題目 | 難度 | NeetCode 150 | 用到的範式 |
|------|------|------|:---:|------|
| 200 | [Number of Islands](https://leetcode.com/problems/number-of-islands/) | Medium | ✅ | 網格當圖 |
| 133 | [Clone Graph](https://leetcode.com/problems/clone-graph/) | Medium | ✅ | Map 兼做 visited |
| 261 | [Graph Valid Tree](https://leetcode.com/problems/graph-valid-tree/) | Medium | ✅ | 鄰接表加連通判斷 |

## 面試回答方式

先說「我先把它建成鄰接表」或「我把網格當成圖」，讓面試官知道你看出了圖的結構。接著說明有向還是無向、要不要 visited、標記的時機。網格題主動提「拜訪時就標記，而不是彈出時才標記」，這是避免重複的關鍵。

## 講稿

圖的題目我第一步會先決定怎麼表示這張圖。

如果題目給的是邊的列表，我會轉成鄰接表，每個節點對應一個鄰居清單。無向圖要記得兩個方向都加。像判斷是不是一棵樹，條件就是邊數剛好比節點少一，而且從任一點出發能走到全部節點。

如果題目給的是二維網格，我就把每個格子當節點，上下左右當作邊，用一個方向陣列走鄰居。島嶼數量就是數有幾個連通塊，拜訪過的陸地我直接改成水，省掉額外的標記陣列。

複製圖的時候，我用一個雜湊表記錄舊節點對應的新節點，這個表同時也是拜訪紀錄。要注意先把新節點放進表裡再處理鄰居，不然遇到環就會無限遞迴。

## 常見追問

### 鄰接表和鄰接矩陣怎麼選？

**核心答案**：稀疏圖（邊數接近 V）用鄰接表，空間 O(V + E)；稠密圖或需要 O(1) 判斷兩點是否相連時用鄰接矩陣，空間 O(V²)。面試題絕大多數用鄰接表。

**詳細解析**：Floyd-Warshall 這類需要任兩點距離的演算法天然適合矩陣。鄰接表在 Java 裡也可以用 `Map<Integer, List<Integer>>`，當節點編號不連續（例如字串）時更方便。

**面試回答方式**：給出稀疏與稠密的判準，再說明節點不連續時改用 `Map`。

### 網格 DFS 會不會堆疊溢位？

**核心答案**：會。300×300 全是陸地的網格，遞迴深度可能到 9 萬層，超過 Java 預設堆疊。改用 BFS 或顯式堆疊就沒有這個問題。

**詳細解析**：LeetCode 的測資通常不會卡這點，但面試時提出來是加分。BFS 用 `ArrayDeque<int[]>` 存座標，入隊時就標記；顯式堆疊的寫法和 BFS 幾乎一樣，只是把佇列換成堆疊。

**面試回答方式**：說出風險與改寫方式，並強調入隊時就標記。

### 判斷圖是不是樹，還有什麼做法？

**核心答案**：用並查集：逐條加邊，若兩端已經在同一個集合就代表有環，回傳 `false`；最後檢查邊數是否為 n−1。

**詳細解析**：並查集版本不需要建鄰接表，程式更短，且近乎 O(E)。這題常被拿來比較 DFS 與並查集兩種思路，兩種都能說出來會很加分。

**面試回答方式**：先給 DFS 版，再提並查集版並說明「同集合就有環」。

## 相關

- [[../algorithms/016-graph-representation-traversal.md]]
- [[016-dfs-and-bfs.md]]
- [[011-union-find.md]]
- [[017-topological-sort.md]]
