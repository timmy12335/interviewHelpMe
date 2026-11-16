---
id: leetcode-patterns-019
category: leetcode-patterns
slug: minimum-spanning-tree
title: Minimum Spanning Tree：Kruskal 與 Prim 的 Java 範式
difficulty: medium
tags: [最小生成樹, Kruskal, Prim, Java 範式, LeetCode, NeetCode 150]
source: original
---

# 題目

用 Java 寫出最小生成樹（MST）的兩種演算法：排序邊加並查集的 Kruskal、以及從一點擴張的 Prim（稠密圖用陣列版），並說明它們對應哪些 LeetCode 題目。

## 核心答案

最小生成樹是把所有節點連起來、**總權重最小**的 n−1 條邊。兩個演算法都基於**切割性質**：跨越任一切割的最輕邊，一定可以出現在某棵 MST 裡。**Kruskal** 把所有邊由小到大排序，用並查集逐條加入，兩端已連通就跳過，O(E log E)，適合稀疏圖。**Prim** 從任一點開始，每次加入「離目前這棵樹最近」的點；稠密圖（例如任兩點都有邊）用陣列版 O(V²) 最快，不必真的建出 V² 條邊。

## 詳細解析

**範式一，Kruskal**：排序後逐條加入，`union` 失敗代表會成環，跳過。加滿 n−1 條就可以提早結束。

```java
int kruskal(int n, int[][] edges) {        // edges[i] = {u, v, w}
    Arrays.sort(edges, (a, b) -> Integer.compare(a[2], b[2]));
    int[] parent = new int[n];
    for (int i = 0; i < n; i++) parent[i] = i;
    int total = 0, used = 0;
    for (int[] e : edges) {
        int ru = find(parent, e[0]), rv = find(parent, e[1]);
        if (ru == rv) continue;                // 已連通，加了會成環
        parent[ru] = rv;
        total += e[2];
        if (++used == n - 1) break;
    }
    return used == n - 1 ? total : -1;         // 不連通就沒有生成樹
}

private int find(int[] p, int x) {
    while (p[x] != x) { p[x] = p[p[x]]; x = p[x]; }   // 路徑減半
    return x;
}
```

**範式二，陣列版 Prim**：連接所有點的最小成本，任兩點都有邊（曼哈頓距離），是稠密圖。`minDist[i]` 是點 i 到目前這棵樹的最短距離，每輪挑最小的加入，再用它更新其他點。

```java
int minCostConnectPoints(int[][] pts) {
    int n = pts.length, total = 0;
    int[] minDist = new int[n];
    boolean[] inTree = new boolean[n];
    Arrays.fill(minDist, Integer.MAX_VALUE);
    minDist[0] = 0;
    for (int round = 0; round < n; round++) {
        int u = -1;
        for (int i = 0; i < n; i++)                         // 找離樹最近的點
            if (!inTree[i] && (u == -1 || minDist[i] < minDist[u])) u = i;
        inTree[u] = true;
        total += minDist[u];
        for (int v = 0; v < n; v++) {                       // 用 u 更新其他點
            if (inTree[v]) continue;
            int d = Math.abs(pts[u][0] - pts[v][0]) + Math.abs(pts[u][1] - pts[v][1]);
            if (d < minDist[v]) minDist[v] = d;
        }
    }
    return total;
}
```

**判斷關鍵邊**：某條邊是否為「關鍵邊」（拿掉它 MST 權重就變大），可以**排除這條邊**重跑一次 Kruskal 比較總權重；「偽關鍵邊」則是**強制先加入它**再跑 Kruskal，總權重不變就代表它可以出現在某棵 MST 中。這是 LeetCode 1489 的標準解法，直接重用範式一。

```java
int kruskalWith(int n, int[][] sortedEdges, int skip, int force) {
    int[] parent = new int[n];
    for (int i = 0; i < n; i++) parent[i] = i;
    int total = 0, used = 0;
    if (force >= 0) {
        int[] e = sortedEdges[force];
        parent[find(parent, e[0])] = find(parent, e[1]);
        total += e[2];
        used++;
    }
    for (int i = 0; i < sortedEdges.length; i++) {
        if (i == skip) continue;
        int[] e = sortedEdges[i];
        int ru = find(parent, e[0]), rv = find(parent, e[1]);
        if (ru == rv) continue;
        parent[ru] = rv;
        total += e[2];
        used++;
    }
    return used == n - 1 ? total : Integer.MAX_VALUE;
}
```

**複雜度**：Kruskal 是 O(E log E)，排序主導；陣列版 Prim 是 O(V²)；堆版 Prim 是 O(E log V)。對完全圖（E ≈ V²/2），陣列版 Prim 比 Kruskal 的 O(V² log V) 更快。

**常見錯誤**：一是把 MST 和最短路徑混淆：MST 最小化的是**總權重**，不保證任兩點之間的路徑最短。二是點對點的題目先建出全部 V² 條邊再跑 Kruskal，記憶體與時間都吃緊。三是排序後沒有保留原始邊的索引，1489 這類需要回報邊編號的題目就答不出來。

**對應 LeetCode 題目**：

| 題號 | 題目 | 難度 | NeetCode 150 | 用到的範式 |
|------|------|------|:---:|------|
| 1584 | [Min Cost to Connect All Points](https://leetcode.com/problems/min-cost-to-connect-all-points/) | Medium | ✅ | 陣列版 Prim 或 Kruskal |
| 1489 | [Find Critical and Pseudo-Critical Edges in Minimum Spanning Tree](https://leetcode.com/problems/find-critical-and-pseudo-critical-edges-in-minimum-spanning-tree/) | Hard | | 排除或強制加入後重跑 Kruskal |

## 面試回答方式

先確認題目是「把全部連起來的最小總成本」，而不是「兩點間最短路」。接著根據圖的密度選 Kruskal 或 Prim，並說出理由。Kruskal 要說明並查集用來判斷成環；Prim 要說明 `minDist` 的意義。最後提一句切割性質，展現你知道為什麼貪心是對的。

## 講稿

題目如果是要把所有點都連起來，而且總成本最小，那就是最小生成樹，不是最短路徑。

我常用的有兩個做法。第一個是克魯斯卡，把所有邊依權重從小排到大，一條一條加進來，用並查集判斷兩端是不是已經連通，已經連通就跳過，因為加了會形成環。加滿節點數減一條邊就完成了，複雜度主要是排序。

第二個是普林，從任一個點開始，每次把離目前這棵樹最近的點加進來，再用它更新其他點到樹的距離。像連接所有點這題，任兩點之間都有邊，是很稠密的圖，用陣列版的普林是平方時間，不用真的把所有邊建出來，比排序所有邊還快。

這兩個貪心都成立，是因為跨過任何一個切割的最輕的邊，一定可以出現在某棵最小生成樹裡。

## 常見追問

### Kruskal 和 Prim 怎麼選？

**核心答案**：稀疏圖（E 接近 V）選 Kruskal，O(E log E) 而且寫起來短；稠密圖（E 接近 V²）選陣列版 Prim，O(V²)。邊是隱式產生的（例如任兩點的距離）也偏向 Prim。

**詳細解析**：堆版 Prim 是 O(E log V)，和 Kruskal 同階，選哪個主要看實作方便。Kruskal 的優點是邊可以邊讀邊處理，且天然支援「找出第 k 小的生成樹」這類延伸。

**面試回答方式**：給出密度這個判準，再補充隱式邊的情況。

### 最小生成樹唯一嗎？

**核心答案**：所有邊權重都不同時唯一；有相同權重時可能有多棵，但**總權重一定相同**。

**詳細解析**：1489 的偽關鍵邊就是在處理「多棵 MST」的情況：某條邊不在所有 MST 裡，但在至少一棵裡。判斷 MST 是否唯一，可以檢查每條非樹邊是否和它在樹上形成的環中某條邊等權。

**面試回答方式**：說出唯一性的條件與「總權重相同」這個結論。

### 最小生成樹上兩點之間的路徑有什麼性質？

**核心答案**：它是**瓶頸路徑**：在所有連接兩點的路徑中，MST 上的路徑使「路徑上最大的邊」最小。但它不一定是總和最短的路徑。

**詳細解析**：這個性質讓 MST 能解「最小化最大邊」的問題，例如判斷兩點能否在權重上限 w 內連通，可以把邊排序後用並查集逐步加入（就是 Kruskal 的過程），LeetCode 1697 就是離線查詢的應用。

**面試回答方式**：說出瓶頸路徑的性質，並和最短路徑做區分。

## 相關

- [[../algorithms/041-minimum-spanning-tree.md]]
- [[011-union-find.md]]
- [[018-shortest-path.md]]
- [[025-greedy.md]]
