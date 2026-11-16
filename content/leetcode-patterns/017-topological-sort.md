---
id: leetcode-patterns-017
category: leetcode-patterns
slug: topological-sort
title: Topological Sort：Kahn 入度 BFS 與從字典序推圖的 Java 範式
difficulty: medium
tags: [拓樸排序, Kahn, 有向無環圖, Java 範式, LeetCode, NeetCode 150]
source: original
---

# 題目

用 Java 寫出拓樸排序的 Kahn 演算法（入度 BFS），用它判斷有向圖是否有環、輸出一組合法順序，並示範如何從題目條件推出圖再做拓樸排序，說明它們對應哪些 LeetCode 題目。

## 核心答案

拓樸排序把**有向無環圖（DAG）**的節點排成一列，讓每條邊 `u → v` 的 `u` 都在 `v` 前面。**Kahn 演算法**：先算每個節點的入度，把入度為 0 的放進佇列；每彈出一個就加入結果，並把它所有出邊的終點入度減一，減到 0 就入隊。最後若結果數量少於節點數，代表**有環**（環上的節點入度永遠不會歸零）。看到「先修課」「依賴關係」「先後順序」就要想到它。很多題目的難點不在排序，而在**從條件建出正確的邊**。

## 詳細解析

**範式，Kahn 演算法**：回傳順序，有環時回傳空陣列。判斷能否修完課只要看長度是否等於 n。

```java
int[] findOrder(int n, int[][] prerequisites) {
    List<List<Integer>> g = new ArrayList<>();
    for (int i = 0; i < n; i++) g.add(new ArrayList<>());
    int[] indeg = new int[n];
    for (int[] p : prerequisites) {        // [a, b] 表示要先修 b 才能修 a，所以邊是 b → a
        g.get(p[1]).add(p[0]);
        indeg[p[0]]++;
    }
    Queue<Integer> q = new ArrayDeque<>();
    for (int i = 0; i < n; i++) if (indeg[i] == 0) q.offer(i);
    int[] order = new int[n];
    int k = 0;
    while (!q.isEmpty()) {
        int u = q.poll();
        order[k++] = u;
        for (int v : g.get(u)) if (--indeg[v] == 0) q.offer(v);
    }
    return k == n ? order : new int[0];    // 少於 n 個代表有環
}

boolean canFinish(int n, int[][] prerequisites) {
    return findOrder(n, prerequisites).length == n;
}
```

**從條件推出圖**：外星文字典。相鄰兩個單字找第一個不同的字母，就得到一條「前者 → 後者」的邊。要注意 `"abc"` 排在 `"ab"` 前面是不合法的，直接回傳空字串。

```java
String alienOrder(String[] words) {
    Map<Character, Set<Character>> g = new HashMap<>();
    Map<Character, Integer> indeg = new HashMap<>();
    for (String w : words)
        for (char c : w.toCharArray()) { g.putIfAbsent(c, new HashSet<>()); indeg.putIfAbsent(c, 0); }
    for (int i = 0; i + 1 < words.length; i++) {
        String a = words[i], b = words[i + 1];
        if (a.length() > b.length() && a.startsWith(b)) return "";   // 前綴排在後面，不合法
        for (int j = 0; j < Math.min(a.length(), b.length()); j++) {
            char x = a.charAt(j), y = b.charAt(j);
            if (x != y) {
                if (g.get(x).add(y)) indeg.merge(y, 1, Integer::sum);   // 避免重複邊
                break;                                                  // 只有第一個不同的字母有資訊
            }
        }
    }
    Queue<Character> q = new ArrayDeque<>();
    for (char c : indeg.keySet()) if (indeg.get(c) == 0) q.offer(c);
    StringBuilder sb = new StringBuilder();
    while (!q.isEmpty()) {
        char c = q.poll();
        sb.append(c);
        for (char nb : g.get(c)) if (indeg.merge(nb, -1, Integer::sum) == 0) q.offer(nb);
    }
    return sb.length() == indeg.size() ? sb.toString() : "";
}
```

**複雜度**：Kahn 演算法是 O(V + E)；外星文字典建圖要掃過所有字母，O(C)，C 是所有單字的總長度，拓樸排序部分最多 26 個節點。

**常見錯誤**：一是邊的方向搞反，`[a, b]` 是「b 先於 a」，邊應該是 `b → a`。二是外星文字典比較到第一個不同字母後沒有 `break`，後面的字母其實不提供任何順序資訊。三是重複的邊讓入度多算，導致某些字母永遠減不到 0，用 `Set` 存鄰居並只在新增成功時加入度。

**對應 LeetCode 題目**：

| 題號 | 題目 | 難度 | NeetCode 150 | 用到的範式 |
|------|------|------|:---:|------|
| 207 | [Course Schedule](https://leetcode.com/problems/course-schedule/) | Medium | ✅ | Kahn 判斷有環 |
| 210 | [Course Schedule II](https://leetcode.com/problems/course-schedule-ii/) | Medium | ✅ | Kahn 輸出順序 |
| 269 | [Alien Dictionary](https://leetcode.com/problems/alien-dictionary/) | Hard | ✅ | 從字典序推圖 |

## 面試回答方式

先把題目翻譯成圖：「每門課是節點，先修關係是有向邊，問題變成有沒有環、或給出一個拓樸順序」。寫 Kahn 時說明為什麼「處理的節點數少於 n 代表有環」。外星文字典這類題目要花時間講清楚邊怎麼來，以及前綴不合法的邊界情況。

## 講稿

看到先修課、依賴關係、或要排出先後順序，我會想到拓樸排序。

我用的是 Kahn 演算法。先算每個節點的入度，也就是有幾個前置條件，把入度是零的放進佇列。每拿出一個節點就加進結果，再把它指向的節點入度減一，減到零就放進佇列。最後如果結果裡的節點數少於總數，就代表圖裡有環，因為環上的節點入度永遠不會歸零。

要特別注意邊的方向。先修 b 才能修 a，邊是從 b 指向 a。

比較難的題目是要自己建圖，像外星文字典。我比較相鄰的兩個單字，找到第一個不同的字母，就得到一條先後的邊，後面的字母沒有資訊。還要檢查一個單字排在自己的前綴後面，這種情況直接不合法。

## 常見追問

### 用 DFS 也能做拓樸排序嗎？

**核心答案**：可以。對每個未拜訪節點做 DFS，節點**所有後繼都處理完**後才加入結果，最後反轉。判斷環要用三種狀態：未拜訪、拜訪中、已完成，遇到「拜訪中」的節點就是有環。

**詳細解析**：DFS 版的結果是後序的反轉。三色標記是關鍵：只用 `boolean visited` 無法區分「在目前路徑上」和「之前的路徑已經處理過」，會把合法的菱形結構誤判成環。Kahn 版比較直觀，也不用擔心遞迴深度。

**面試回答方式**：說出後序反轉與三色標記，並比較兩者的優缺點。

### 拓樸順序唯一嗎？怎麼判斷？

**核心答案**：不一定唯一。Kahn 執行過程中若**任何時刻佇列裡有兩個以上的節點**，就代表順序不唯一。

**詳細解析**：佇列裡同時有兩個節點，代表它們之間沒有先後限制，可以互換。LeetCode 444 Sequence Reconstruction 就是在問這件事。若需要字典序最小的拓樸順序，把佇列換成 `PriorityQueue`。

**面試回答方式**：說出「佇列大小大於一」這個判斷法，並提到字典序最小的變形。

### 拓樸排序可以拿來做什麼計算？

**核心答案**：DAG 上的 DP。按拓樸順序處理節點，保證處理某個節點時，它所有前驅都已經算好，例如求最長路徑、最早完成時間、路徑數量。

**詳細解析**：LeetCode 1136 Parallel Courses 求最少學期數，就是在 Kahn 的層數上計數；329 Longest Increasing Path in a Matrix 也能用拓樸排序的層數來解。DAG 上的最長路徑是 O(V + E)，一般圖上卻是 NP 困難。

**面試回答方式**：說出「拓樸順序就是 DP 的計算順序」，並舉一個例子。

## 相關

- [[../algorithms/018-topological-sort.md]]
- [[009-graphs.md]]
- [[016-dfs-and-bfs.md]]
- [[028-dynamic-programming.md]]
