---
id: leetcode-patterns-011
category: leetcode-patterns
slug: union-find
title: Union Find：路徑壓縮、按秩合併與動態連通性的 Java 範式
difficulty: medium
tags: [並查集, Union Find, 連通分量, Java 範式, LeetCode, NeetCode 150]
source: original
---

# 題目

用 Java 寫出並查集（Union Find）的標準範式，包含路徑壓縮與按秩合併，並用它解決「找出多餘的邊」與「計算連通分量數量」兩類問題，說明它們對應哪些 LeetCode 題目。

## 核心答案

並查集處理的是**動態連通性**：不斷加入邊，隨時問「兩點是否相連」或「現在有幾個連通塊」。它只有兩個操作：`find` 找到所屬集合的代表（根），`union` 把兩個集合合併。兩個優化缺一不可：**路徑壓縮**讓 `find` 時沿路的節點直接指向根；**按秩合併**讓矮的樹接到高的樹下。兩者合用後每次操作攤還接近 O(1)（反阿克曼函數）。範式的關鍵用法：`union` 回傳是否真的合併了，若兩點**本來就在同一集合**，代表這條邊會形成環。

## 詳細解析

**範式，並查集類別**：`count` 記錄目前的連通塊數量，每次成功合併就減一。

```java
class UnionFind {
    private final int[] parent, rank;
    private int count;

    UnionFind(int n) {
        parent = new int[n];
        rank = new int[n];
        count = n;
        for (int i = 0; i < n; i++) parent[i] = i;
    }

    int find(int x) {
        if (parent[x] != x) parent[x] = find(parent[x]);   // 路徑壓縮
        return parent[x];
    }

    boolean union(int a, int b) {
        int ra = find(a), rb = find(b);
        if (ra == rb) return false;                         // 已經連通，這條邊會成環
        if (rank[ra] < rank[rb]) { int t = ra; ra = rb; rb = t; }
        parent[rb] = ra;                                    // 矮的接到高的下面
        if (rank[ra] == rank[rb]) rank[ra]++;
        count--;
        return true;
    }

    int count() { return count; }
}
```

**應用一，找出多餘的邊**：依序加邊，第一條讓 `union` 回傳 `false` 的邊就是形成環的那條。題目的節點從 1 開始，所以開 n+1 的大小。

```java
int[] findRedundantConnection(int[][] edges) {
    UnionFind uf = new UnionFind(edges.length + 1);
    for (int[] e : edges) {
        if (!uf.union(e[0], e[1])) return e;
    }
    return new int[0];
}
```

**應用二，計算連通分量**：鄰接矩陣表示的省份數量，把有連線的兩城合併，最後的 `count` 就是答案。

```java
int findCircleNum(int[][] isConnected) {
    int n = isConnected.length;
    UnionFind uf = new UnionFind(n);
    for (int i = 0; i < n; i++)
        for (int j = i + 1; j < n; j++)
            if (isConnected[i][j] == 1) uf.union(i, j);
    return uf.count();
}
```

**複雜度**：兩個優化同時使用時，每次 `find` 與 `union` 攤還 O(α(n))，α 是反阿克曼函數，實務上不超過 4。整體是 O(E · α(n))，空間 O(n)。只用路徑壓縮也有攤還 O(log n)，面試時通常可以接受。

**常見錯誤**：一是 `union` 時直接寫 `parent[a] = b`，接的是節點而不是根，集合會被拆散。二是節點編號從 1 開始卻只開 n 的陣列，造成越界。三是遞迴版 `find` 在沒有按秩合併、又遇到極長鏈時可能堆疊溢位，可改成迭代的路徑減半寫法 `parent[x] = parent[parent[x]]`。

**對應 LeetCode 題目**：

| 題號 | 題目 | 難度 | NeetCode 150 | 用到的範式 |
|------|------|------|:---:|------|
| 684 | [Redundant Connection](https://leetcode.com/problems/redundant-connection/) | Medium | ✅ | union 失敗代表成環 |
| 323 | [Number of Connected Components in an Undirected Graph](https://leetcode.com/problems/number-of-connected-components-in-an-undirected-graph/) | Medium | ✅ | 計算連通塊 |
| 547 | [Number of Provinces](https://leetcode.com/problems/number-of-provinces/) | Medium | | 計算連通塊 |

## 面試回答方式

先說明為什麼用並查集而不是 DFS：邊是一條一條加進來的，或需要在過程中判斷是否成環。寫範式時兩個優化都要寫出來並講名字，然後說出攤還複雜度。用 `union` 的回傳值判斷成環，是讓程式最精簡的關鍵。

## 講稿

當題目是在不斷加邊的過程中，問兩個點有沒有連通、或現在有幾個連通塊，我會用並查集。

它只有兩個操作。查找是找到一個點所屬集合的根，合併是把兩個集合的根接在一起。我會加兩個優化，一個是路徑壓縮，查找的時候讓沿路的點直接指向根；另一個是按秩合併，讓比較矮的樹接到比較高的樹下面。兩個一起用，每次操作平均下來幾乎是常數時間。

我會讓合併函式回傳有沒有真的合併。如果兩個點本來就在同一個集合，代表再加這條邊就會形成環，像找出多餘的邊那題，第一條合併失敗的邊就是答案。另外我會維護一個計數，每次成功合併就減一，最後剩下的數字就是連通塊的數量。

## 常見追問

### 並查集和 DFS 求連通分量，各自適合什麼情況？

**核心答案**：圖是靜態的、一次給完時兩者都行，DFS 可能更直覺；邊是動態加入、要在過程中隨時查詢連通性時，並查集明顯更好，因為 DFS 每次都要重新走。

**詳細解析**：並查集的弱點是**不支援刪邊**。若題目有刪邊操作，常見技巧是把操作倒過來處理，變成加邊。另外並查集無法直接給出路徑，只能回答是否連通。

**面試回答方式**：說出「動態加邊」這個使用條件，並主動提到不支援刪邊。

### 只寫路徑壓縮、不寫按秩合併可以嗎？

**核心答案**：可以，攤還複雜度是 O(log n)，大部分題目都能過。但面試時最好兩個都寫，並說明兩者合用才是 O(α(n))。

**詳細解析**：按秩合併也可以用「按大小合併」取代，維護每個集合的元素數，小的接到大的下面，效果一樣，而且集合大小在某些題目（例如求最大連通塊）本身就是答案。

**面試回答方式**：說出兩種情況下的複雜度，並提按大小合併的變形。

### 如果節點不是整數（例如字串或座標）怎麼辦？

**核心答案**：先用 `HashMap<String, Integer>` 把每個節點對應到一個整數編號，再用陣列版的並查集；或者直接用 `HashMap<T, T>` 存 parent。

**詳細解析**：LeetCode 721 Accounts Merge 就是把 email 映射成編號後做並查集。座標類題目可以用 `r * cols + c` 把二維座標壓成一維編號，比雜湊表快。

**面試回答方式**：說出「先映射成整數編號」，並舉二維座標壓成一維的技巧。

## 相關

- [[../algorithms/019-union-find.md]]
- [[009-graphs.md]]
- [[019-minimum-spanning-tree.md]]
