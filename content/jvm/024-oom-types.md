---
id: jvm-024
category: jvm
slug: oom-types
title: OutOfMemoryError 的種類與成因
difficulty: medium
tags: [OOM, 記憶體溢位, 診斷]
source: original
---

# 題目

`OutOfMemoryError` 有哪些常見類型?各自的成因和排查方向是什麼?

## 核心答案

常見的 OOM 類型對應不同的記憶體區域耗盡:`Java heap space`(堆不足最常見，原因是記憶體洩漏（Memory Leak）或容量不足)、`GC overhead limit exceeded`(GC 花了大量時間卻回收很少，通常是堆快滿了的前兆)、`Metaspace`(元空間不足，類別載入過多或 classloader 洩漏)、`unable to create new native thread`(無法建立新執行緒，執行緒過多或系統限制)、`Direct buffer memory`(堆外直接記憶體不足，NIO 相關)。看到 OOM 的第一步永遠是「看清楚具體是哪種類型」，因為不同類型的成因和解法完全不同，盲目調大堆對非堆的 OOM 無效。

## 詳細解析

**1. `java.lang.OutOfMemoryError: Java heap space`**:

- 成因:堆記憶體不足以分配新物件。可能是——記憶體洩漏(物件只增不減，見 [[015-memory-leak-vs-overflow.md]])、堆設得太小(容量不足)、或一次性載入/建立超大物件(如一次查詢返回百萬筆資料)。
- 排查:配 `-XX:+HeapDumpOnOutOfMemoryError` 自動 dump，用 MAT 分析是洩漏還是容量問題(看 GC 後堆能不能降下來)。

**2. `GC overhead limit exceeded`**:

- 成因:JVM 花了超過 98% 的時間做 GC，卻只回收了不到 2% 的堆——通常是堆快滿了、大量 Full GC 卻收不回多少空間的前兆，往往緊接著就是 heap space OOM。
- 排查:和 heap space 類似，通常指向記憶體洩漏或堆太小。

**3. `Metaspace`(或 JDK 7 的 `PermGen space`)**:

- 成因:元空間(類別元資料)不足。原因是——載入了過多類別(動態代理（Dynamic Proxy）/CGLIB 大量生成類別、反射（Reflection）)、或 classloader 洩漏(舊載入器和類別卸載不掉，見 [[017-metaspace-vs-permgen.md]])。
- 排查:看類別數量是否異常增長、是否有大量重複的動態生成類別、是否有載入器洩漏。可調 `-XX:MaxMetaspaceSize`,但若是洩漏調大只是拖延。

**4. `unable to create new native thread`**:

- 成因:無法建立新的作業系統執行緒。原因是——執行緒建立太多(執行緒池（Thread Pool）配置不當、執行緒洩漏)、或系統的執行緒數/記憶體限制(ulimit)、或 `-Xss` 設太大導致每個執行緒佔用過多記憶體、湊不出空間建立新執行緒。
- 排查:用 jstack 看執行緒數和狀態，查是否有執行緒洩漏(大量同類執行緒);檢查系統 ulimit 和 `-Xss` 設定。

**5. `Direct buffer memory`**:

- 成因:堆外的直接記憶體(NIO 的 DirectByteBuffer 使用的、不受 `-Xmx` 控制的記憶體)不足。常見於大量使用 NIO、Netty 等直接記憶體的場景，或直接記憶體洩漏(DirectByteBuffer 沒被及時回收)。
- 排查:檢查 DirectByteBuffer 的使用，可調 `-XX:MaxDirectMemorySize`。

## 面試回答方式

這題的核心訊息是「OOM 不只一種、看到 OOM 先看類型」。列出幾種主要類型(heap space、Metaspace、unable to create native thread、Direct buffer memory)，每種講清楚成因方向和排查思路。最重要的是傳達那個關鍵原則——「不同 OOM 類型成因和解法完全不同、盲目調大堆對非堆的 OOM(元空間/執行緒/直接記憶體)完全無效」。能把每種 OOM 連結到前面的知識(heap space→洩漏/容量、Metaspace→類別載入、native thread→執行緒與 Xss)，展現你把 JVM 記憶體的各個面向串成了完整的排查體系。

## 常見追問

### 遇到 Java heap space OOM，怎麼判斷是洩漏還是容量不足?

**核心答案**:核心方法是觀察「Full GC 後堆記憶體(尤其老年代)能不能降下來」——如果每次 Full GC 後老年代使用率能明顯回落到一個穩定的低水位，說明只是「容量不足或瞬時負載大」(物件用完能被正常回收、只是一時裝不下)，解法是調大堆或優化瞬時分配;如果 Full GC 後老年代降不下來、呈現持續上漲趨勢(每次只回收一點點、最終逼近 100%)，就是「記憶體洩漏」(有物件本該回收卻被引用鎖住)，要 dump 堆用 MAT 找出洩漏物件和它的引用鏈。這個判斷在 [[015-memory-leak-vs-overflow.md]] 有完整說明。

**詳細解析**:這是排查 heap space OOM 的分水嶺，因為兩者解法南轅北轍。判斷依據是老年代使用率隨時間和 GC 的趨勢:健康(容量問題)的表現是「鋸齒波動但整體平穩」——漲上去、Full GC 降下來、再漲再降，維持在一個範圍;洩漏的表現是「鋸齒但整體持續攀升」——每次 Full GC 回收的越來越少(因為越來越多物件被洩漏引用鎖住)，最終逼近上限 OOM。實務上用 `jstat -gcutil` 持續觀察、或看 GC 日誌的老年代變化趨勢就能判斷。確認洩漏後，MAT 分析 heap dump 的關鍵是——用 Dominator Tree 找佔用最大的物件、用 Leak Suspects 報告看可疑點、用物件的 incoming references 追出「是誰引用著它導致回收不掉」(找到那個不該存在的強引用鏈)。把「先判斷洩漏 vs 容量、再用對應手段」這個流程講清楚，展現你有系統的 OOM 排查方法論。

**面試回答方式**:講出核心判斷——「看 Full GC 後老年代能否降下來:能降是容量問題(調堆)、降不下來持續攀升是洩漏(dump + MAT 找引用鏈)」。能講出 MAT 的分析手段(Dominator Tree / Leak Suspects / incoming references)，展現你有從判斷到定位的完整排查能力。

### 為什麼調大 -Xmx 對 Metaspace OOM 無效?

**核心答案**:因為 `-Xmx` 控制的是「堆」記憶體的大小，而 Metaspace(元空間)是「本地記憶體」中的一塊獨立區域、存放類別元資料，和堆是完全不同的記憶體區域。Metaspace OOM 是「類別元資料的空間不夠」，與堆的大小毫無關係，所以調大 `-Xmx` 對它沒有任何幫助。正確的做法是——調大元空間的上限(`-XX:MaxMetaspaceSize`)，或者更根本地，排查「為什麼載入了這麼多類別」(是合理的動態生成還是 classloader 洩漏)。

**詳細解析**:這題直擊「看到 OOM 先看類型」這個原則的重要性——如果不看類型、以為所有 OOM 都是堆問題、無腦調 `-Xmx`,對 Metaspace OOM 就是完全做無用功。要理解——JVM 的記憶體分成多個獨立區域,`-Xmx` 只管堆，元空間有自己的參數(`-XX:MetaspaceSize` 初始/觸發 GC 閾值、`-XX:MaxMetaspaceSize` 上限)，直接記憶體有 `-XX:MaxDirectMemorySize`,執行緒棧有 `-Xss`。每種 OOM 要用對應區域的參數去調，調錯了區域的參數毫無作用。而且對 Metaspace OOM，調大 `MaxMetaspaceSize` 也只是治標——如果根因是 classloader 洩漏(類別只增不減)，調大只是延後 OOM 發生的時間，真正的解法是找到並修復類別無法卸載的原因。理解「不同區域用不同參數、且要區分治標(調參數)和治本(修根因)」，展現你有清晰的 JVM 記憶體管理和排查思路。

**面試回答方式**:講出「-Xmx 只管堆、Metaspace 是本地記憶體的獨立區域、兩者無關所以調 -Xmx 無效」，並給出正確做法「調 -XX:MaxMetaspaceSize、或排查類別為何載入這麼多」。能點出「調大只是治標、若是 classloader 洩漏要修根因」，展現你理解「不同區域用不同參數」以及「治標 vs 治本」的區別。

### 生產環境如何預先配置以便 OOM 時能快速排查?

**核心答案**:關鍵是提前配置「OOM 時自動保留現場」——加上 `-XX:+HeapDumpOnOutOfMemoryError` 和 `-XX:HeapDumpPath=<路徑>`,讓 JVM 在發生 OOM 的瞬間自動 dump 一份堆快照到指定路徑，這樣事後就能用 MAT 分析「OOM 那一刻堆裡到底是什麼物件在佔記憶體、它們為什麼沒被回收」。此外還應該——開啟 GC 日誌(記錄 GC 的頻率、耗時、各區使用趨勢，供分析)、配置監控告警(在記憶體使用率、GC 頻率異常時提前告警，而非等到 OOM)、以及考慮 `-XX:OnOutOfMemoryError` 執行自訂腳本(如自動告警或重啟)。

**詳細解析**:OOM 排查最怕的是「現場沒了」——OOM 發生時如果沒有 dump，事後只能靠猜。`HeapDumpOnOutOfMemoryError` 是生產環境的必備配置，它在 OOM 的那一刻自動抓一份完整的堆快照，這份快照包含了「導致 OOM 的那一刻堆的完整狀態」，是事後用 MAT 定位問題(找洩漏物件、看引用鏈)的關鍵依據。要注意 dump 檔可能很大(和堆一樣大)，要確保 `HeapDumpPath` 指向的磁碟有足夠空間、且不要 dump 到會影響服務的位置。配合 GC 日誌(現在用統一的 `-Xlog:gc*`)，能看到 OOM 之前的記憶體趨勢(是逐漸洩漏還是突然暴漲)。更主動的做法是監控告警——透過 APM 工具(如 Prometheus + Grafana、SkyWalking)監控堆使用率、GC 頻率、Full GC 次數等，在趨勢異常時就告警介入，避免真的等到 OOM 服務掛掉才發現。理解「提前配置好 dump 和監控、讓 OOM 時有據可查」，展現你有生產環境的實戰運維意識，而非只會事後救火。

**面試回答方式**:講出核心配置「-XX:+HeapDumpOnOutOfMemoryError + HeapDumpPath 自動保留現場、供事後 MAT 分析」，並補充「GC 日誌看趨勢、監控告警提前介入、注意 dump 檔大小和磁碟空間」。能點出「OOM 排查最怕現場沒了、所以要提前配置」，展現你有主動預防和快速排查的生產運維經驗。

## 相關

- [[015-memory-leak-vs-overflow.md]]
- [[014-gc-troubleshooting.md]]
- [[017-metaspace-vs-permgen.md]]
