---
id: leetcode-patterns-018
category: leetcode-patterns
slug: shortest-path
title: Shortest Path：Dijkstra、限制邊數的 Bellman-Ford 與最小化最大值的 Java 範式
difficulty: medium
tags: [最短路徑, Dijkstra, Bellman-Ford, Java 範式, LeetCode, NeetCode 150]
source: original
---

# 題目

用 Java 寫出最短路徑的三個範式：用優先佇列實作 Dijkstra、限制邊數的 Bellman-Ford、以及把 Dijkstra 的「路徑總和」改成「路徑上的最大值」，並說明它們對應哪些 LeetCode 題目。

## 核心答案

選演算法看兩件事：**有沒有負權重**、**有沒有限制邊數**。邊權相同用 BFS；非負權重用 **Dijkstra**，每次從優先佇列取出目前距離最小的節點，它的距離就確定了，O(E log V)；有負權重或**限制最多 k 條邊**時用 **Bellman-Ford**，對所有邊做 k 輪鬆弛，O(k·E)。Dijkstra 的正確性只依賴「路徑成本不會因為多走一步而變小」，所以把成本從「總和」換成「最大值」也成立。Java 實作採用**延遲刪除**：同一節點可能多次入隊，彈出時若距離已過期就跳過。

## 詳細解析

**範式一，Dijkstra**：佇列存 `{距離, 節點}`，彈出時若比已知距離大就是過期的，直接跳過。

```java
int networkDelayTime(int[][] times, int n, int k) {
    List<List<int[]>> g = new ArrayList<>();
    for (int i = 0; i <= n; i++) g.add(new ArrayList<>());
    for (int[] t : times) g.get(t[0]).add(new int[]{t[1], t[2]});
    int[] dist = new int[n + 1];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[k] = 0;
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
    pq.offer(new int[]{0, k});
    while (!pq.isEmpty()) {
        int[] cur = pq.poll();
        int d = cur[0], u = cur[1];
        if (d > dist[u]) continue;                         // 過期的項目
        for (int[] e : g.get(u)) {
            int v = e[0], nd = d + e[1];
            if (nd < dist[v]) { dist[v] = nd; pq.offer(new int[]{nd, v}); }
        }
    }
    int ans = 0;
    for (int i = 1; i <= n; i++) {
        if (dist[i] == Integer.MAX_VALUE) return -1;
        ans = Math.max(ans, dist[i]);
    }
    return ans;
}
```

**範式二，限制邊數的 Bellman-Ford**：最多經過 k 個中轉站，就是最多 k+1 條邊。每輪必須用**上一輪的距離副本**做鬆弛，否則一輪裡可能連續走好幾條邊。

```java
int findCheapestPrice(int n, int[][] flights, int src, int dst, int k) {
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[src] = 0;
    for (int i = 0; i <= k; i++) {                         // k+1 輪，最多 k+1 條邊
        int[] prev = dist.clone();                         // 只用上一輪的結果
        for (int[] f : flights) {
            int u = f[0], v = f[1], w = f[2];
            if (prev[u] != Integer.MAX_VALUE && prev[u] + w < dist[v]) dist[v] = prev[u] + w;
        }
    }
    return dist[dst] == Integer.MAX_VALUE ? -1 : dist[dst];
}
```

**範式三，最小化路徑最大值**：游泳穿越上升的水域，路徑成本是經過格子的最高海拔。把 Dijkstra 的 `d + w` 換成 `max(d, h)`，其餘不變。

```java
int swimInWater(int[][] grid) {
    int n = grid.length;
    boolean[][] seen = new boolean[n][n];
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
    pq.offer(new int[]{grid[0][0], 0, 0});
    int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
    while (!pq.isEmpty()) {
        int[] c = pq.poll();
        int t = c[0], i = c[1], j = c[2];
        if (i == n - 1 && j == n - 1) return t;            // 第一次彈出終點就是答案
        if (seen[i][j]) continue;
        seen[i][j] = true;
        for (int[] d : dirs) {
            int x = i + d[0], y = j + d[1];
            if (x < 0 || y < 0 || x >= n || y >= n || seen[x][y]) continue;
            pq.offer(new int[]{Math.max(t, grid[x][y]), x, y});
        }
    }
    return -1;
}
```

**複雜度**：Dijkstra 用二元堆是 O(E log V)，延遲刪除版的堆裡最多 E 個項目，所以是 O(E log E)，兩者同階；Bellman-Ford 限制 k 輪是 O(k·E)；網格版 Dijkstra 是 O(n² log n)。

**常見錯誤**：一是 Dijkstra 用在有負權重的圖，已確定的距離可能被後來的負邊改小，答案就錯了。二是 Bellman-Ford 沒有複製上一輪的距離，一輪裡就走了多條邊，違反 k 的限制。三是用 `Integer.MAX_VALUE` 當無限大後直接相加，溢位成負數，要先檢查是否可達。

**對應 LeetCode 題目**：

| 題號 | 題目 | 難度 | NeetCode 150 | 用到的範式 |
|------|------|------|:---:|------|
| 743 | [Network Delay Time](https://leetcode.com/problems/network-delay-time/) | Medium | ✅ | Dijkstra |
| 787 | [Cheapest Flights Within K Stops](https://leetcode.com/problems/cheapest-flights-within-k-stops/) | Medium | ✅ | 限制邊數的 Bellman-Ford |
| 778 | [Swim in Rising Water](https://leetcode.com/problems/swim-in-rising-water/) | Hard | ✅ | 最小化最大值的 Dijkstra |

## 面試回答方式

先根據權重與限制選演算法，並說出理由：「權重非負，所以用 Dijkstra」「有 k 站限制，Dijkstra 的貪心不再成立，改用 Bellman-Ford」。寫 Dijkstra 時說明延遲刪除的意義。最後提一句 Dijkstra 的正確性前提，展現你知道它為什麼能延伸到「最小化最大值」。

## 講稿

最短路徑我會先看兩件事，有沒有負的權重，還有有沒有限制最多走幾條邊。

權重都一樣的話，廣度優先就夠了。權重非負，我用迪克斯特拉。它用優先佇列，每次拿出目前距離最小的節點，這個距離就確定了，再用它去更新鄰居。Java 裡我用延遲刪除，同一個節點可能被放進去好幾次，拿出來時如果比已知距離大，就是過期的，直接跳過。

如果限制最多經過 k 個中轉站，迪克斯特拉的貪心就不成立了，我改用貝爾曼福特，做 k 加一輪鬆弛。每一輪要用上一輪的距離副本，不然一輪裡可能走了好幾條邊。

還有一種變形是路徑成本取最大值而不是總和，像在上升的水裡游泳，把相加換成取最大值就好，邏輯完全一樣。

## 常見追問

### 為什麼 Dijkstra 不能處理負權重？

**核心答案**：Dijkstra 假設「從佇列取出的最小距離不會再被改小」，因為之後的路徑只會更長。有負邊時，繞一段路再走負邊可能更短，已經確定的距離就錯了。

**詳細解析**：反例：A→B 權重 2，A→C 權重 3，C→B 權重 −2。Dijkstra 先確定 B 的距離是 2，但實際最短是 1。有負權重用 Bellman-Ford，它也能偵測負環：第 V 輪還能鬆弛就代表有負環。

**面試回答方式**：說出貪心的前提並給一個三節點反例。

### Cheapest Flights 能用 Dijkstra 嗎？

**核心答案**：可以，但狀態要變成 `(節點, 已用站數)`，不能只用節點判斷是否處理過，因為成本較高但站數較少的路徑可能之後更有用。

**詳細解析**：做法是佇列存 `{成本, 節點, 站數}`，另外記錄每個節點「到達時的最少站數」，只有站數更少時才繼續擴展。這比 Bellman-Ford 難寫對，面試時用 Bellman-Ford 通常更穩。

**面試回答方式**：說明狀態需要多一維，並說出你選擇 Bellman-Ford 的理由。

### 需要任兩點之間的最短距離怎麼辦？

**核心答案**：用 **Floyd-Warshall**，三層迴圈 `dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j])`，最外層一定是中轉點 k。時間 O(V³)，適合 V 在幾百以內。

**詳細解析**：V 很大但邊稀疏時，對每個點跑一次 Dijkstra 是 O(V · E log V)，通常更快。LeetCode 1334 Find the City 就是 Floyd-Warshall 的標準題。

**面試回答方式**：說出三層迴圈與 k 必須在最外層，再比較與多次 Dijkstra 的取捨。

## 相關

- [[../algorithms/017-shortest-path.md]]
- [[016-dfs-and-bfs.md]]
- [[008-heaps.md]]
- [[019-minimum-spanning-tree.md]]
