---
id: leetcode-patterns-005
category: leetcode-patterns
slug: hash-tables
title: Hash Tables：查補數、分組與集合查找的 Java 範式
difficulty: easy
tags: [雜湊表, HashMap, HashSet, Java 範式, LeetCode, NeetCode 150]
source: original
---

# 題目

用 Java 寫出雜湊表的三個範式：一邊掃一邊查補數、用正規化的鍵分組、用集合做 O(1) 存在性查找，並說明它們對應哪些 LeetCode 題目。

## 核心答案

雜湊表的本質是**用空間換時間**，把「找某個值在不在」從 O(n) 降到平均 O(1)。三個範式：一是**一邊掃一邊查補數**，看到 `x` 就去查 `target - x` 是否出現過；二是**用正規化的鍵分組**，把「應該視為相同」的東西轉成同一個鍵，例如把字串排序後當鍵；三是**集合查找**，先把所有值放進 `HashSet`，再只從每段的起點開始往後數。Java 裡常用 `getOrDefault`、`merge`、`computeIfAbsent` 讓計數與分組只寫一行。

## 詳細解析

**範式一，一邊掃一邊查補數**：先查再放，這樣同一個元素不會和自己配對。

```java
int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> seen = new HashMap<>();       // 值 → 索引
    for (int i = 0; i < nums.length; i++) {
        Integer j = seen.get(target - nums[i]);
        if (j != null) return new int[]{j, i};
        seen.put(nums[i], i);                            // 先查再放
    }
    return new int[0];
}
```

**範式二，用正規化的鍵分組**：異位詞排序後完全相同，所以排序後的字串就是分組的鍵。`computeIfAbsent` 一行完成「沒有就建立、有就取出」。

```java
List<List<String>> groupAnagrams(String[] strs) {
    Map<String, List<String>> groups = new HashMap<>();
    for (String s : strs) {
        char[] cs = s.toCharArray();
        Arrays.sort(cs);
        groups.computeIfAbsent(new String(cs), k -> new ArrayList<>()).add(s);
    }
    return new ArrayList<>(groups.values());
}
```

**範式三，集合查找加起點判斷**：只有 `x - 1` 不在集合裡的 `x` 才是一段連續序列的起點，從起點往後數，每個數最多被數一次。

```java
int longestConsecutive(int[] nums) {
    Set<Integer> set = new HashSet<>();
    for (int x : nums) set.add(x);
    int best = 0;
    for (int x : set) {
        if (set.contains(x - 1)) continue;               // 不是起點就跳過
        int len = 1;
        while (set.contains(x + len)) len++;
        best = Math.max(best, len);
    }
    return best;
}
```

**計數的一行寫法**：`count.merge(c, 1, Integer::sum)` 或 `count.put(c, count.getOrDefault(c, 0) + 1)`。若鍵只有 26 個小寫字母，直接用 `int[26]` 更快也更省記憶體。

**複雜度**：三個範式都是平均時間 O(n)、空間 O(n)。分組題因為每個字串要排序，是 O(n · L log L)，L 是字串長度；改用 26 格計數當鍵可以降到 O(n · L)。

**常見錯誤**：一是兩數之和先放再查，`target` 是某數兩倍時會和自己配對。二是最長連續序列沒有判斷起點，每個數都往後數，退化成 O(n²)。三是用 `int[]` 當 `HashMap` 的鍵，陣列用的是參考相等，內容一樣也查不到，要轉成 `String` 或 `List<Integer>`。

**對應 LeetCode 題目**：

| 題號 | 題目 | 難度 | NeetCode 150 | 用到的範式 |
|------|------|------|:---:|------|
| 1 | [Two Sum](https://leetcode.com/problems/two-sum/) | Easy | ✅ | 查補數 |
| 49 | [Group Anagrams](https://leetcode.com/problems/group-anagrams/) | Medium | ✅ | 正規化鍵分組 |
| 128 | [Longest Consecutive Sequence](https://leetcode.com/problems/longest-consecutive-sequence/) | Medium | ✅ | 集合加起點判斷 |

## 面試回答方式

先說暴力解的複雜度，再說「我用雜湊表把查找降到 O(1)」，讓面試官看到優化的推導。寫分組題時要說出鍵是怎麼設計的，以及為什麼兩個應該同組的東西會得到相同的鍵。最後提一下雜湊表的最壞情況是 O(n)，以及 Java 8 之後碰撞過多時桶會轉成紅黑樹。

## 講稿

雜湊表的用途就是用空間換時間，把找某個值在不在，從線性時間降到平均常數時間。

最常見的是一邊掃一邊查補數。兩數之和就是看到一個數，先去表裡找目標減掉它的值有沒有出現過，沒有才把自己放進去。順序是先查再放，不然會跟自己配對。

第二種是分組。關鍵在設計鍵，讓應該分在同一組的東西算出一樣的鍵。像異位詞，把字串排序後就一模一樣，可以直接當鍵。

第三種是用集合做存在性查找。像最長連續序列，我先把數字都放進集合，只有前一個數不在集合裡的才是起點，從起點往後數。這樣每個數最多被數一次，整體還是線性時間。另外如果鍵只是二十六個小寫字母，我會直接用長度二十六的陣列計數，比雜湊表快很多。

## 常見追問

### HashMap 的平均 O(1) 在什麼情況下會失效？

**核心答案**：大量鍵雜湊到同一個桶時會退化。Java 8 之前桶是串列，最壞 O(n)；之後同一桶超過 8 個節點且表長至少 64 時會轉成紅黑樹，最壞 O(log n)。

**詳細解析**：刷題時很少遇到，但若自訂類別當鍵卻沒有正確覆寫 `hashCode` 與 `equals`，不是查不到就是全部擠在一起。另外擴容是 O(n) 的，所以已知大小時可以先給初始容量。

**面試回答方式**：講出碰撞退化與紅黑樹化即可，若有時間再補自訂鍵要覆寫兩個方法。

### 分組題除了排序當鍵，還有什麼鍵的設計？

**核心答案**：可以用 26 格字母計數轉成字串當鍵，例如 `"1#0#2#..."`，時間從 O(L log L) 降到 O(L)。

**詳細解析**：用 `Arrays.toString(count)` 最簡單，也可以自己用 `StringBuilder` 串。重點是鍵必須是值相等的型別，所以不能直接用 `int[]`。同樣的思路也用在「同構字串」「同一條直線上的點」這類題目，關鍵都是找到一個正規化的表示法。

**面試回答方式**：先講排序鍵，再說計數鍵能省掉排序，最後點出「正規化表示」這個共通思路。

### 什麼時候用陣列代替 HashMap？

**核心答案**：鍵的範圍小而且連續時，例如 26 個字母、ASCII 128 個字元、或值在 0 到 n 之間。陣列沒有雜湊計算與裝箱開銷，常數快很多。

**詳細解析**：`int[26]` 計數比 `HashMap<Character, Integer>` 快數倍，因為後者每次存取都要裝箱、算雜湊、處理碰撞。若值的範圍很大或是稀疏的，陣列會浪費大量空間，這時才用雜湊表。

**面試回答方式**：說出「範圍小而連續」這個判準，並舉字母計數為例。

## 相關

- [[../algorithms/005-hash-table-space-for-time.md]]
- [[001-arrays.md]]
- [[022-prefix-sum.md]]
- [[029-top-k-elements.md]]
