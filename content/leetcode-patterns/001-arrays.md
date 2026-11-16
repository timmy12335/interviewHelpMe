---
id: leetcode-patterns-001
category: leetcode-patterns
slug: arrays
title: Arrays：原地反轉、旋轉與矩陣走訪的 Java 範式
difficulty: easy
tags: [陣列, 矩陣, Java 範式, LeetCode, NeetCode 150]
source: original
---

# 題目

用 Java 寫出陣列題最常用的三個範式：原地反轉、用三次反轉做旋轉、以及矩陣的邊界走訪，並說明它們對應哪些 LeetCode 題目。

## 核心答案

陣列題的核心是**索引運算**與**原地操作**。三個最常用的範式：一是**雙端交換的原地反轉**，O(n) 時間、O(1) 空間；二是**三次反轉做旋轉**，整段反轉後再分段反轉，避免開新陣列；三是**矩陣用四條邊界走訪**，`top`、`bottom`、`left`、`right` 每走完一條就收縮一條。Java 上要熟悉 `Arrays.sort`、`Arrays.fill`、`Arrays.copyOfRange`，並記得 `int[]` 不能直接傳 `Comparator`，要排序物件或 `int[][]` 才行。

## 詳細解析

**範式一，原地反轉**：左右兩端交換，往中間收。這是後面旋轉與很多字串題的基本零件。

```java
void reverse(int[] a, int l, int r) {
    while (l < r) {
        int t = a[l]; a[l] = a[r]; a[r] = t;
        l++; r--;
    }
}
```

**範式二，三次反轉做旋轉**：向右旋轉 k 步，等於先整段反轉，再把前 k 個與後 n−k 個各自反轉回來。

```java
void rotate(int[] nums, int k) {
    int n = nums.length;
    k %= n;                              // k 可能大於 n
    reverse(nums, 0, n - 1);
    reverse(nums, 0, k - 1);
    reverse(nums, k, n - 1);
}
```

**範式三，矩陣邊界走訪**：螺旋、轉圈類的題目都用四條邊界控制，每走完一條就把那條邊界往內收。

```java
List<Integer> spiralOrder(int[][] m) {
    List<Integer> res = new ArrayList<>();
    int top = 0, bottom = m.length - 1, left = 0, right = m[0].length - 1;
    while (top <= bottom && left <= right) {
        for (int j = left; j <= right; j++) res.add(m[top][j]);
        top++;
        for (int i = top; i <= bottom; i++) res.add(m[i][right]);
        right--;
        if (top <= bottom) {             // 只剩一列時不能再往回走
            for (int j = right; j >= left; j--) res.add(m[bottom][j]);
            bottom--;
        }
        if (left <= right) {             // 只剩一行時不能再往上走
            for (int i = bottom; i >= top; i--) res.add(m[i][left]);
            left++;
        }
    }
    return res;
}
```

**矩陣原地旋轉 90 度**：先沿主對角線轉置，再把每一列左右反轉，兩步都是原地完成。

```java
void rotateImage(int[][] m) {
    int n = m.length;
    for (int i = 0; i < n; i++)
        for (int j = i + 1; j < n; j++) {
            int t = m[i][j]; m[i][j] = m[j][i]; m[j][i] = t;
        }
    for (int[] row : m) reverse(row, 0, n - 1);
}
```

**複雜度**：四個範式都是時間 O(n) 或 O(m·n)、額外空間 O(1)。如果用新陣列做旋轉，寫起來簡單但空間是 O(n)，面試官通常會追問能不能原地。

**常見錯誤**：一是旋轉忘了 `k %= n`，k 大於長度時會越界。二是螺旋走訪少了那兩個 `if`，遇到只剩一列或一行的矩陣會重複輸出。三是對 `int[]` 寫 `Arrays.sort(a, (x, y) -> y - x)` 想降序，這編譯不過，要改用 `Integer[]` 或排序後再反轉。

**對應 LeetCode 題目**：

| 題號 | 題目 | 難度 | NeetCode 150 | 用到的範式 |
|------|------|------|:---:|------|
| 189 | [Rotate Array](https://leetcode.com/problems/rotate-array/) | Medium | | 三次反轉 |
| 48 | [Rotate Image](https://leetcode.com/problems/rotate-image/) | Medium | ✅ | 轉置加反轉 |
| 54 | [Spiral Matrix](https://leetcode.com/problems/spiral-matrix/) | Medium | ✅ | 四條邊界走訪 |

## 面試回答方式

陣列題先問清楚能不能修改輸入、要不要原地完成，這決定了空間複雜度。寫旋轉時直接講「三次反轉」並舉一個小例子驗證；寫螺旋時主動指出只剩一列或一行的邊界情況，這是最常見的錯誤點。最後補一句 Java 的 `int[]` 與 `Integer[]` 在排序上的差異，展現語言熟悉度。

## 講稿

陣列題我會先確認能不能直接改輸入，因為這決定空間能不能壓到常數。

最基本的零件是原地反轉，左右兩端交換再往中間收。有了它，旋轉陣列就可以用三次反轉完成：整段先反轉，再把前 k 個和後面那段各自反轉回來。要記得先把 k 對長度取餘數，不然會越界。

矩陣題我用四條邊界來控制，像螺旋走訪就是上、右、下、左依序走，每走完一條就把那條邊界往內收。容易出錯的是只剩一列或一行的時候，所以往回走之前要再檢查一次邊界。

至於矩陣原地轉九十度，就是先轉置再把每一列反轉，兩步都不用額外空間。Java 這邊我也會注意一個細節，基本型別的整數陣列不能傳比較器，要自訂排序就得換成物件陣列。

## 常見追問

### 旋轉陣列除了三次反轉還有什麼做法？

**核心答案**：可以開新陣列把 `nums[i]` 放到 `(i + k) % n`，時間 O(n)、空間 O(n)；或用環狀替換，一個位置一個位置搬，空間 O(1) 但要處理 n 與 k 的最大公因數造成的多個環。

**詳細解析**：環狀替換的難點在於一圈不一定能走完所有元素，例如 n=6、k=2 會分成兩個環，所以要計數已搬動的元素個數，沒滿 n 就從下一個起點再開一圈。三次反轉在正確性與好寫程度上都更穩。

**面試回答方式**：先給三次反轉，被追問時再提新陣列與環狀替換，並說明環狀替換為什麼要處理多個環。

### 螺旋矩陣為什麼要在中途再檢查邊界？

**核心答案**：因為 `top++` 和 `right--` 之後，矩陣可能已經走完。像 3×1 的直條，往右、往下走完就結束了，若不檢查還會往左、往上重複輸出。

**詳細解析**：外層 `while` 只在每一圈開始時檢查，但一圈裡有四段，前兩段走完時狀態已經改變。最乾淨的寫法就是在第三、第四段前各補一次檢查，或者改用「方向陣列加已拜訪標記」的寫法。

**面試回答方式**：直接用 3×1 或 1×3 的例子說明，再指出檢查放在哪兩段之前。

### Java 怎麼對二維陣列依某一欄排序？

**核心答案**：`int[][]` 的每一列是物件，可以傳 `Comparator`：`Arrays.sort(a, (x, y) -> Integer.compare(x[0], y[0]))`。不要寫 `x[0] - y[0]`，數值很大或有負數時會溢位。

**詳細解析**：區間題幾乎都要先依起點排序，所以這行寫法要熟。`Integer.compare` 或 `Comparator.comparingInt(x -> x[0])` 都安全；減法比較在值接近 `Integer.MIN_VALUE` 時會得到錯的符號。

**面試回答方式**：寫出 `Integer.compare` 版本，並順口說明為什麼不用減法，這是很常被注意到的細節。

## 相關

- [[../algorithms/026-in-place-array-manipulation.md]]
- [[../algorithms/027-matrix-problems.md]]
- [[005-hash-tables.md]]
- [[022-prefix-sum.md]]
