---
id: leetcode-patterns-016
category: leetcode-patterns
slug: dfs-and-bfs
title: DFS/BFS：多源 BFS、反向 DFS 與無權最短路的 Java 範式
difficulty: medium
tags: [DFS, BFS, 圖的遍歷, 多源 BFS, Java 範式, LeetCode, NeetCode 150]
source: original
---

# 題目

用 Java 寫出圖搜尋的三個範式：多源 BFS 按層擴散、從邊界反向 DFS、以及在隱式圖上用 BFS 求無權最短路，並說明它們對應哪些 LeetCode 題目。

## 核心答案

**DFS** 一路走到底再回頭，適合「能不能到達」「連通塊」「列出所有路徑」；**BFS** 一層一層往外擴，第一次到達某點時走的步數就是**無權圖的最短距離**。三個範式：一是**多源 BFS**，把所有起點一開始就放進佇列，等於從一個虛擬超級源點出發；二是**反向 DFS**，從終點（例如邊界）往回走，避免對每個格子各做一次搜尋；三是**隱式圖 BFS**，節點和邊不是題目直接給的，要自己產生鄰居（例如每次改一個字母）。兩者共通的鐵則：**入隊或進入時就標記 visited**，不要等到彈出才標記。

## 詳細解析

**範式一，多源 BFS**：所有腐爛的橘子同時開始擴散，按層處理，層數就是分鐘數。

```java
int orangesRotting(int[][] grid) {
    int m = grid.length, n = grid[0].length, fresh = 0;
    Queue<int[]> q = new ArrayDeque<>();
    for (int i = 0; i < m; i++)
        for (int j = 0; j < n; j++) {
            if (grid[i][j] == 2) q.offer(new int[]{i, j});   // 所有源點一起入隊
            else if (grid[i][j] == 1) fresh++;
        }
    int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
    int minutes = 0;
    while (!q.isEmpty() && fresh > 0) {
        for (int size = q.size(); size > 0; size--) {
            int[] c = q.poll();
            for (int[] d : dirs) {
                int x = c[0] + d[0], y = c[1] + d[1];
                if (x < 0 || y < 0 || x >= m || y >= n || grid[x][y] != 1) continue;
                grid[x][y] = 2;                                // 入隊時就標記
                fresh--;
                q.offer(new int[]{x, y});
            }
        }
        minutes++;
    }
    return fresh == 0 ? minutes : -1;
}
```

**範式二，反向 DFS**：與其問「每一格的水能不能流到海」，不如從海岸往內逆流走，只能往**更高或相等**的格子走。兩個海洋各做一次，交集就是答案。

```java
List<List<Integer>> pacificAtlantic(int[][] h) {
    int m = h.length, n = h[0].length;
    boolean[][] pac = new boolean[m][n], atl = new boolean[m][n];
    for (int i = 0; i < m; i++) { flow(h, pac, i, 0); flow(h, atl, i, n - 1); }
    for (int j = 0; j < n; j++) { flow(h, pac, 0, j); flow(h, atl, m - 1, j); }
    List<List<Integer>> res = new ArrayList<>();
    for (int i = 0; i < m; i++)
        for (int j = 0; j < n; j++)
            if (pac[i][j] && atl[i][j]) res.add(List.of(i, j));
    return res;
}

private void flow(int[][] h, boolean[][] seen, int i, int j) {
    if (seen[i][j]) return;
    seen[i][j] = true;
    int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
    for (int[] d : dirs) {
        int x = i + d[0], y = j + d[1];
        if (x < 0 || y < 0 || x >= h.length || y >= h[0].length) continue;
        if (h[x][y] >= h[i][j]) flow(h, seen, x, y);      // 逆流只能往高處走
    }
}
```

**範式三，隱式圖 BFS**：每個單字是節點，差一個字母就有邊。BFS 的層數就是轉換次數，用 `Set` 兼做字典與 visited，用過就移除。

```java
int ladderLength(String begin, String end, List<String> wordList) {
    Set<String> dict = new HashSet<>(wordList);
    if (!dict.contains(end)) return 0;
    Queue<String> q = new ArrayDeque<>();
    q.offer(begin);
    int steps = 1;
    while (!q.isEmpty()) {
        for (int size = q.size(); size > 0; size--) {
            char[] w = q.poll().toCharArray();
            for (int i = 0; i < w.length; i++) {
                char orig = w[i];
                for (char c = 'a'; c <= 'z'; c++) {
                    if (c == orig) continue;
                    w[i] = c;
                    String next = new String(w);
                    if (next.equals(end)) return steps + 1;
                    if (dict.remove(next)) q.offer(next);   // 移除即標記
                }
                w[i] = orig;
            }
        }
        steps++;
    }
    return 0;
}
```

**複雜度**：網格上的 DFS 與 BFS 都是 O(m·n)；一般圖是 O(V + E)；單字接龍是 O(N · L · 26)，N 是單字數、L 是長度。BFS 空間是最寬一層，DFS 空間是遞迴深度。

**常見錯誤**：一是 BFS 在彈出時才標記，同一個節點會被不同鄰居重複入隊，最壞變成指數級。二是多源 BFS 一個一個源點分開做，時間乘上源點數。三是腐爛橘子沒有先處理「一開始就沒有新鮮橘子」的情況，應該回傳 0 而不是多算一分鐘；上面的寫法用 `fresh > 0` 當迴圈條件處理了這點。

**對應 LeetCode 題目**：

| 題號 | 題目 | 難度 | NeetCode 150 | 用到的範式 |
|------|------|------|:---:|------|
| 994 | [Rotting Oranges](https://leetcode.com/problems/rotting-oranges/) | Medium | ✅ | 多源 BFS |
| 417 | [Pacific Atlantic Water Flow](https://leetcode.com/problems/pacific-atlantic-water-flow/) | Medium | ✅ | 反向 DFS |
| 127 | [Word Ladder](https://leetcode.com/problems/word-ladder/) | Hard | ✅ | 隱式圖 BFS |

## 面試回答方式

先說明選 DFS 還是 BFS 的理由：要最短步數就用 BFS，只問能否到達或要列舉就用 DFS。接著點出這題的特殊之處，是多個起點、要反向走、還是鄰居要自己產生。最後強調「入隊時就標記」，並說出時間與空間。

## 講稿

選深度優先還是廣度優先，我看的是題目要什麼。要最少步數，我用廣度優先，因為它一層一層往外擴，第一次碰到某個點時的層數就是最短距離。只問能不能到，或是要找連通塊，深度優先通常比較好寫。

有三種變化很常見。第一種是多個起點，像腐爛的橘子，我會把所有腐爛的橘子一開始就全部放進佇列，同時往外擴散，層數就是分鐘數。

第二種是反過來走，像太平洋大西洋水流，與其從每一格出發看水能不能流到海，不如從海岸往內逆流，只往更高的格子走，兩個海洋各做一次再取交集。

第三種是圖要自己產生，像單字接龍，每次改一個字母就是一條邊。不管哪一種，我都會在放進佇列時就標記拜訪過，避免重複。

## 常見追問

### 單字接龍怎麼再加速？

**核心答案**：用**雙向 BFS**：從起點和終點同時擴散，每次擴展比較小的那一端，兩邊相遇就結束。搜尋範圍從 b^d 降到約 2·b^(d/2)。

**詳細解析**：實作上維護兩個 `Set` 當作前沿，每輪選小的那個展開，產生的鄰居若出現在另一個前沿裡就回傳步數。這在分支因子大、路徑長的題目效果顯著，是 127 的經典優化。

**面試回答方式**：說出雙向 BFS 與「每次擴展較小的一端」這個細節。

### BFS 能處理有權重的最短路嗎？

**核心答案**：一般不行，BFS 只保證「邊數最少」。權重只有 0 和 1 時可以用 **0-1 BFS**（`Deque`，權重 0 放前面、1 放後面）；一般非負權重要用 Dijkstra。

**詳細解析**：0-1 BFS 的正確性來自佇列始終保持「距離只有 d 和 d+1 兩種值」的性質，所以仍然是 O(V + E)。Dijkstra 則用優先佇列，O(E log V)，見最短路徑頁面。

**面試回答方式**：說出 BFS 的適用前提，並提 0-1 BFS 作為中間情況。

### 遞迴 DFS 和用堆疊的迭代 DFS 結果一樣嗎？

**核心答案**：拜訪的節點集合一樣，但**順序可能不同**，而且迭代版若在入堆疊時標記，行為會和遞迴版有細微差異。只關心連通性時沒有影響。

**詳細解析**：需要嚴格模擬遞迴順序（例如求 DFS 序或做後序計算）時，迭代版要記錄每個節點下一個要處理的鄰居索引。只做「能否到達」時，迭代版入堆疊就標記即可，也避免了深度過大的堆疊溢位。

**面試回答方式**：說明集合相同、順序不同，並指出何時順序重要。

## 相關

- [[../algorithms/016-graph-representation-traversal.md]]
- [[009-graphs.md]]
- [[015-tree-traversal.md]]
- [[018-shortest-path.md]]
