# LeetCode 範式（Java）

InterviewHelpMe 第 19 個內容類別，共 29 題。把資料結構、演算法與解題技巧整理成**可以直接默寫的 Java 範式**，每項附 1 到 3 題對應的 LeetCode 題目，並標出是否收錄在 NeetCode 150。

## 和「演算法與資料結構」類別的分工

[演算法與資料結構](../algorithms/README.md) 類別講的是**觀念與正確性論證**：什麼訊號讓你想到這個工具、它為什麼是對的。這個類別講的是**手要會寫的部分**：模板長什麼樣子、邊界條件怎麼寫、拿哪幾題練。兩邊對應的頁面互相連結，建議先讀觀念再練範式。

## 每一頁的結構

沿用全站的題目格式，「詳細解析」固定包含：

- **範式**：一到四段 Java 程式碼，每段都實際編譯並跑過測資。
- **複雜度**：時間與空間。
- **常見錯誤**：寫模板時最容易出錯的邊界。
- **對應 LeetCode 題目**：表格列出題號、題名與連結、難度、是否在 NeetCode 150，以及用到哪一種範式。

程式碼假設 LeetCode 的標準節點定義：`ListNode(int val, ListNode next)`、`TreeNode(int val)` 帶 `left` 與 `right`，以及圖題的 `Node(int val)` 帶 `neighbors`。

## 題目清單

編號依三個欄位排列：001 到 011 是資料結構，012 到 019 是演算法，020 到 029 是解題技巧。

### 資料結構

| # | 題目 | 難度 |
|---|------|------|
| 001 | Arrays：原地反轉、旋轉與矩陣走訪的 Java 範式 | easy |
| 002 | Linked Lists：虛擬頭節點、反轉與合併的 Java 範式 | easy |
| 003 | Stacks：括號配對、最小堆疊與單調堆疊的 Java 範式 | medium |
| 004 | Queues：雙堆疊佇列、環形佇列與單調佇列的 Java 範式 | medium |
| 005 | Hash Tables：查補數、分組與集合查找的 Java 範式 | easy |
| 006 | Trees：遞迴回傳值與自底向上計算的 Java 範式 | easy |
| 007 | Binary Search Trees：上下界驗證、中序第 k 小與沿性質下探的 Java 範式 | medium |
| 008 | Heaps：PriorityQueue、固定大小堆與雙堆求中位數的 Java 範式 | medium |
| 009 | Graphs：鄰接表建圖、網格當圖與 visited 的 Java 範式 | medium |
| 010 | Trie：前綴樹的插入查詢、萬用字元搜尋與網格回溯剪枝的 Java 範式 | medium |
| 011 | Union Find：路徑壓縮、按秩合併與動態連通性的 Java 範式 | medium |

### 演算法

| # | 題目 | 難度 |
|---|------|------|
| 012 | Sorting：合併排序、快速排序、三路分區與排序前處理的 Java 範式 | medium |
| 013 | Searching：線性搜尋、二分搜尋邊界與二分答案的 Java 範式 | medium |
| 014 | Bit Manipulation：XOR 抵消、消去最低位與位元 DP 的 Java 範式 | easy |
| 015 | Tree Traversal：前序、中序、後序的遞迴與迭代寫法，以及層序走訪的 Java 範式 | medium |
| 016 | DFS/BFS：多源 BFS、反向 DFS 與無權最短路的 Java 範式 | medium |
| 017 | Topological Sort：Kahn 入度 BFS 與從字典序推圖的 Java 範式 | medium |
| 018 | Shortest Path：Dijkstra、限制邊數的 Bellman-Ford 與最小化最大值的 Java 範式 | medium |
| 019 | Minimum Spanning Tree：Kruskal 與 Prim 的 Java 範式 | medium |

### 解題技巧

| # | 題目 | 難度 |
|---|------|------|
| 020 | Two Pointers：對撞與讀寫指針的 Java 範式 | easy |
| 021 | Sliding Window：可變視窗求最長與最短的 Java 範式 | medium |
| 022 | Prefix Sum：區間和查詢、前綴和配雜湊表與前後綴乘積的 Java 範式 | medium |
| 023 | Fast and Slow Pointers：判環、找環入口與找中點的 Java 範式 | medium |
| 024 | Divide and Conquer：兩兩合併、跨中點組合與快速冪的 Java 範式 | medium |
| 025 | Greedy：最遠可達、按層跳躍與區間切分的 Java 範式 | medium |
| 026 | Recursion：三要素、哨兵回傳值與遞迴改寫串列的 Java 範式 | medium |
| 027 | Backtracking：子集、排列與組合總和的 Java 範式 | medium |
| 028 | Dynamic Programming：一維遞推、完全背包與二維序列 DP 的 Java 範式 | medium |
| 029 | Top K Elements：反向堆、快速選擇與桶排序的 Java 範式 | medium |
