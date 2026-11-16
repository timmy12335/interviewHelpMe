---
id: leetcode-patterns-010
category: leetcode-patterns
slug: trie
title: Trie：前綴樹的插入查詢、萬用字元搜尋與網格回溯剪枝的 Java 範式
difficulty: medium
tags: [字典樹, Trie, 前綴, Java 範式, LeetCode, NeetCode 150]
source: original
---

# 題目

用 Java 寫出 Trie（前綴樹）的三個範式：基本的插入與查詢、支援 `.` 萬用字元的 DFS 搜尋、以及在網格回溯中用 Trie 同時比對多個單字並剪枝，並說明它們對應哪些 LeetCode 題目。

## 核心答案

Trie 把字串拆成一條從根往下的路徑，**共用前綴的字串共用同一段路徑**，所以查詢「有沒有以某前綴開頭的字」只要 O(L)，和字典大小無關。節點用 `TrieNode[] next = new TrieNode[26]` 加一個 `boolean end`。三個範式：一是**插入與查詢**，沿字元往下走，沒有就建立；二是**萬用字元搜尋**，遇到 `.` 就對 26 個子節點都試；三是**網格回溯配 Trie**，DFS 時沿著 Trie 一起往下走，Trie 上沒有路就立刻剪枝，找到字後把 `word` 清掉避免重複。

## 詳細解析

**範式一，插入與查詢**：`search` 要求走到底且 `end` 為真，`startsWith` 只要求走得到。

```java
class Trie {
    private static class TrieNode {
        TrieNode[] next = new TrieNode[26];
        boolean end;
    }
    private final TrieNode root = new TrieNode();

    public void insert(String word) {
        TrieNode cur = root;
        for (char c : word.toCharArray()) {
            int i = c - 'a';
            if (cur.next[i] == null) cur.next[i] = new TrieNode();
            cur = cur.next[i];
        }
        cur.end = true;
    }
    public boolean search(String word) {
        TrieNode n = walk(word);
        return n != null && n.end;
    }
    public boolean startsWith(String prefix) { return walk(prefix) != null; }

    private TrieNode walk(String s) {
        TrieNode cur = root;
        for (char c : s.toCharArray()) {
            cur = cur.next[c - 'a'];
            if (cur == null) return null;
        }
        return cur;
    }
}
```

**範式二，萬用字元搜尋**：用遞迴帶著「目前在第幾個字元、目前在哪個節點」，遇到 `.` 就展開所有子節點。

```java
class WordDictionary {
    private static class TrieNode {
        TrieNode[] next = new TrieNode[26];
        boolean end;
    }
    private final TrieNode root = new TrieNode();

    public void addWord(String word) {
        TrieNode cur = root;
        for (char c : word.toCharArray()) {
            if (cur.next[c - 'a'] == null) cur.next[c - 'a'] = new TrieNode();
            cur = cur.next[c - 'a'];
        }
        cur.end = true;
    }
    public boolean search(String word) { return dfs(word, 0, root); }

    private boolean dfs(String w, int i, TrieNode node) {
        if (node == null) return false;
        if (i == w.length()) return node.end;
        char c = w.charAt(i);
        if (c != '.') return dfs(w, i + 1, node.next[c - 'a']);
        for (TrieNode child : node.next) {
            if (dfs(w, i + 1, child)) return true;
        }
        return false;
    }
}
```

**範式三，網格回溯配 Trie**：把所有目標單字建成 Trie，節點上直接存完整單字。DFS 時字元對不上 Trie 就剪枝；找到後把 `word` 設成 `null`，同一個字就不會被加兩次。

```java
private static class WNode {
    WNode[] next = new WNode[26];
    String word;                                    // 走到這裡剛好是一個完整單字
}

List<String> findWords(char[][] board, String[] words) {
    WNode root = new WNode();
    for (String w : words) {
        WNode cur = root;
        for (char c : w.toCharArray()) {
            if (cur.next[c - 'a'] == null) cur.next[c - 'a'] = new WNode();
            cur = cur.next[c - 'a'];
        }
        cur.word = w;
    }
    List<String> res = new ArrayList<>();
    for (int i = 0; i < board.length; i++)
        for (int j = 0; j < board[0].length; j++)
            explore(board, i, j, root, res);
    return res;
}

private void explore(char[][] b, int i, int j, WNode parent, List<String> res) {
    if (i < 0 || j < 0 || i >= b.length || j >= b[0].length) return;
    char c = b[i][j];
    if (c == '#' || parent.next[c - 'a'] == null) return;    // Trie 上沒路就剪枝
    WNode node = parent.next[c - 'a'];
    if (node.word != null) { res.add(node.word); node.word = null; }
    b[i][j] = '#';                                            // 標記使用中
    explore(b, i + 1, j, node, res);
    explore(b, i - 1, j, node, res);
    explore(b, i, j + 1, node, res);
    explore(b, i, j - 1, node, res);
    b[i][j] = c;                                              // 回溯還原
}
```

**複雜度**：插入與查詢是 O(L)；萬用字元最壞是 O(26^L)，但實際上受 Trie 實際分支數限制；網格題最壞是 O(m·n·4·3^(L−1))，靠 Trie 剪枝大幅降低。空間是所有單字總長度乘上 26 個指標。

**常見錯誤**：一是 `search` 只檢查走不走得到，沒檢查 `end`，`"app"` 在只插入過 `"apple"` 時被誤判存在。二是網格題找到單字後直接 `return`，結果漏掉以它為前綴的更長單字。三是回溯時忘了把 `'#'` 還原，影響其他起點的搜尋。

**對應 LeetCode 題目**：

| 題號 | 題目 | 難度 | NeetCode 150 | 用到的範式 |
|------|------|------|:---:|------|
| 208 | [Implement Trie (Prefix Tree)](https://leetcode.com/problems/implement-trie-prefix-tree/) | Medium | ✅ | 插入與查詢 |
| 211 | [Design Add and Search Words Data Structure](https://leetcode.com/problems/design-add-and-search-words-data-structure/) | Medium | ✅ | 萬用字元 DFS |
| 212 | [Word Search II](https://leetcode.com/problems/word-search-ii/) | Hard | ✅ | 網格回溯配 Trie |

## 面試回答方式

先說明為什麼雜湊表不夠：雜湊表能查完整單字，但查前綴要掃全部。接著寫出節點結構，說明 `end` 旗標的必要性。網格題要講清楚 Trie 帶來的兩個好處：多個單字一起比對，以及沒有前綴就剪枝。

## 講稿

看到題目跟前綴有關，或是要一次比對很多個單字，我會考慮前綴樹。

它的想法是把每個字串拆成一條從根往下的路徑，共用前綴的字串就共用同一段路徑，所以查一個前綴只跟前綴長度有關，跟字典有多大無關。節點我用長度二十六的子節點陣列，再加一個旗標標記這裡是不是一個完整單字。查完整單字一定要檢查這個旗標，不然只插過 apple 也會說 app 存在。

如果查詢可以有萬用字元，我就用遞迴，遇到萬用字元時把二十六個子節點都試一遍。

最經典的是在網格裡找很多個單字。我先把所有單字建成前綴樹，從每個格子開始回溯，同時沿著前綴樹往下走，樹上沒有路就馬上停止。找到單字後把它清掉，避免重複加入。

## 常見追問

### Trie 的節點用陣列還是 HashMap？

**核心答案**：字元集固定且小（26 個小寫字母）用陣列，存取快；字元集大或不固定（Unicode、大小寫混合）用 `HashMap<Character, TrieNode>`，省空間。

**詳細解析**：陣列版每個節點固定 26 個指標，空間浪費但沒有雜湊開銷；`HashMap` 版只存實際存在的子節點，但每次存取要雜湊與裝箱。面試題通常是小寫字母，用陣列最直接。

**面試回答方式**：給出字元集大小這個判準，並說明兩者的取捨。

### Word Search II 還能怎麼優化？

**核心答案**：找到單字後，若某個 Trie 節點已經沒有子節點也沒有單字，就把它從父節點刪掉，之後的搜尋不會再走進這條死路。

**詳細解析**：這個「剪掉 Trie 葉子」的技巧在單字很多、網格很大時效果明顯。實作上在回溯返回時檢查 `node` 的子節點是否全空且 `word == null`，是的話把 `parent.next[c - 'a']` 設為 `null`。

**面試回答方式**：先講基本的 Trie 剪枝，再提「刪除用完的葉子」作為進一步優化。

### 什麼時候不需要 Trie？

**核心答案**：只需要判斷完整單字是否存在時，`HashSet` 就夠了；只查一次前綴時，直接用 `startsWith` 掃一遍也行。Trie 的優勢在於大量前綴查詢或多字串同時比對。

**詳細解析**：Trie 的常數與記憶體開銷都不小，資料量小的時候反而比較慢。判斷依據是：查詢次數多、而且查的是前綴，才值得建 Trie。

**面試回答方式**：說出「大量前綴查詢」這個使用條件，展現你不是看到字串就套 Trie。

## 相關

- [[../algorithms/014-trie.md]]
- [[027-backtracking.md]]
- [[005-hash-tables.md]]
