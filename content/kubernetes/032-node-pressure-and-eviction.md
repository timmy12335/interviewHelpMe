---
id: kubernetes-032
category: kubernetes
slug: node-pressure-and-eviction
title: 節點資源壓力與 kubelet 驅逐
difficulty: hard
tags: [驅逐, 節點壓力, OOM, kubelet]
source: original
---

# 題目

節點資源不足時 kubelet 會做什麼？驅逐的順序是怎麼決定的？

## 核心答案

kubelet 有自己的驅逐機制，它獨立於排程器與 API server——**這是理解這題的關鍵**。當節點的資源低於閾值時，**kubelet 主動殺掉一些 Pod 來回收資源**，**而這不走 Eviction API，所以 PDB 攔不住**。

**監控的資源**：`memory.available`、`nodefs.available`（磁碟）、`imagefs.available`（映像儲存）、`pid.available`。每種都有軟驅逐（帶寬限期，會先發 SIGTERM）與硬驅逐（立即殺）兩個閾值。

驅逐順序由三個因素依序決定：先看 Pod 的實際用量是否超過它的 requests（超過的優先被驅逐）、**再看 Pod 優先級**（低的先）、**最後看超出 requests 的幅度**（超得多的先）。實務上的結果就是：BestEffort 最先死、Burstable 其次、Guaranteed 最後。

**而記憶體還有另一條路徑**：容器超過 limits 時是被核心的 OOM killer 殺掉（OOMKilled），那與 kubelet 驅逐是兩回事。

## 詳細解析

區分「OOMKilled」與「Evicted」是這題最有價值的部分。**OOMKilled** 是**單一容器超過自己的 limits**——核心的 cgroup 機制直接殺掉那個容器，Pod 通常會原地重啟（restartPolicy 決定）。**Evicted** 是**整個節點的記憶體吃緊**——kubelet 挑選 Pod 驅逐，Pod 被標記為 Evicted 並在別的節點重建。**兩者的排查方向完全不同**：前者要調高 limits 或修記憶體洩漏，後者要看節點上有沒有其他 Pod 在超用資源。

「一個 Pod 超用會害死鄰居」是最需要防範的情況。一個沒設 limits 的 Pod 可以無限吃記憶體——它自己不會被 OOMKilled（沒有 limits 就沒有上限），卻會把節點吃到觸發驅逐，而被驅逐的可能是其他規矩的 Pod。防範的方式是用 LimitRange 強制每個容器都有 limits——這是叢集治理裡收益最高的一條規則之一。

**kubelet 的資源預留必須設對**。`--kube-reserved` 與 `--system-reserved` 預留給 kubelet 與作業系統，**`--eviction-hard` 設定觸發驅逐的閾值**。如果這些沒設或設太小，節點會在 kubelet 有機會驅逐之前就被核心的 OOM killer 攻擊——而那可能殺掉 kubelet 本身，讓整個節點失聯。這是「節點突然 NotReady」的一個常見原因。

磁碟壓力常被忽略但很常發生。容器日誌、映像快取、emptyDir 都佔節點磁碟——一個瘋狂輸出日誌的 Pod 可以在幾小時內填滿節點。kubelet 的回應是先嘗試清理未使用的映像，不夠才驅逐 Pod。**防範靠日誌輪替設定與 `sizeLimit` 的 emptyDir。**

## 面試回答方式

先建立關鍵認知——kubelet 有自己的驅逐機制，獨立於排程器與 API server，不走 Eviction API 所以 PDB 攔不住。列出監控的資源與軟硬驅逐兩個閾值，給驅逐順序的三個因素與實務結果。加分點有四個：**區分 OOMKilled 與 Evicted**——前者是單一容器超過自己的 limits 被核心殺掉且通常原地重啟，後者是整個節點吃緊由 kubelet 挑選驅逐並在別處重建，**排查方向完全不同**；**一個沒設 limits 的 Pod 會害死鄰居**——它自己不會被 OOMKilled，卻會把節點吃到觸發驅逐而被驅逐的是別人，所以用 LimitRange 強制 limits 是收益最高的治理規則之一；資源預留設太小會讓核心的 OOM killer 在 kubelet 之前動手，可能殺掉 kubelet 讓節點失聯，這是**節點突然 NotReady 的常見原因**；以及**磁碟壓力常被忽略**，日誌與映像快取都會觸發驅逐。

## 講稿

關鍵認知是 kubelet 有自己的驅逐機制，它獨立於排程器跟 API 伺服器。節點資源低於閾值時，kubelet 主動殺掉一些 Pod 回收資源，而這不走驅逐介面，所以中斷預算攔不住。

驅逐順序依序看三件事，Pod 的實際用量有沒有超過它宣告的請求量、Pod 的優先級、以及超出的幅度。實務上的結果就是盡力而為等級最先死，保證等級最後。

我覺得這題最有價值的是區分被 OOM 殺掉跟被驅逐。前者是單一容器超過自己的限制，核心直接殺掉那個容器，Pod 通常原地重啟。後者是整個節點的記憶體吃緊，kubelet 挑選 Pod 驅逐，Pod 會在別的節點重建。排查方向完全不同，前者要調高限制或修記憶體洩漏，後者要看節點上有沒有別的 Pod 在超用。

最需要防範的是一個 Pod 害死鄰居。沒設限制的 Pod 可以無限吃記憶體，它自己不會被 OOM 殺掉因為沒有上限，卻會把節點吃到觸發驅逐，而被驅逐的可能是其他規矩的 Pod。所以我會用限制範圍強制每個容器都有限制。

## 常見追問

### Pod 被 Evicted 之後會發生什麼？

**核心答案**：**取決於它由誰管理**。**由 Deployment 或 ReplicaSet 管理的**——控制器會建立一個新的 Pod（可能在別的節點），而被驅逐的 Pod 物件會留在 API 中處於 Failed 狀態。**裸 Pod**——**沒有人重建它，就這樣消失**。**DaemonSet 的 Pod**——會在同一個節點重建，可能又被驅逐，形成循環。

**詳細解析**：「Evicted 的 Pod 物件會堆積」是一個實務上的困擾：它們不佔資源但會累積在 `kubectl get pods` 的輸出裡——有時候幾百個 Evicted 記錄淹沒了真正在跑的 Pod。**清理要靠 `kubectl delete pods --field-selector status.phase=Failed`，或者設定 kube-controller-manager 的 `--terminated-pod-gc-threshold`。** 而更重要的觀察是「反覆驅逐意味著容量規劃有問題」：如果 Pod 被驅逐後在新節點又觸發驅逐，那不是驅逐機制的問題，而是叢集整體資源不足或者某些 Pod 的 requests 嚴重低估。所以「驅逐次數」應該是一個被監控的指標——它上升代表叢集正在接近容量邊界，而那是一個應該在事故前就處理的訊號。

**面試回答方式**：按管理者分三種情況回答（控制器管理的會重建、裸 Pod 消失、DaemonSet 在同節點重建可能形成循環）。加分點是**Evicted 的 Pod 物件會堆積**淹沒 `kubectl get pods` 的輸出，給出清理方式。核心的判斷力在最後：反覆驅逐意味著容量規劃有問題——不是驅逐機制的問題，而是叢集資源不足或 requests 嚴重低估，所以「驅逐次數」應該被監控，它上升代表叢集接近容量邊界，是應該在事故前處理的訊號。

### 怎麼查一個 Pod 為什麼被 OOMKilled？

**核心答案**：**先確認是哪一種 OOM**。`kubectl describe pod` 看 `Last State` 是 `OOMKilled` 且 `Exit Code: 137`——**這是容器超過自己的 limits**。如果節點上同時有多個 Pod 被殺，那可能是節點級的記憶體壓力。**然後看應用側**：**JVM 要看是堆內還是堆外**（堆內會先拋 OutOfMemoryError，直接被 OOMKilled 通常表示堆外記憶體超標）。

**詳細解析**：JVM 在容器裡的記憶體問題特別常見，而根因通常是「只設了堆大小卻忘了堆外」：Metaspace、執行緒堆疊、直接記憶體、以及 JIT 的程式碼快取都不在 `-Xmx` 之內——**所以容器的 limits 必須明顯大於 `-Xmx`**（**經驗值是留 25% 到 30% 的餘裕**）。現代 JVM 支援 `-XX:MaxRAMPercentage`，讓堆大小按容器 limits 的百分比自動計算，**比硬編碼 `-Xmx` 更適合容器環境**。**另一個容易忽略的是「page cache 算不算」**：cgroup v1 把檔案快取算進容器的記憶體用量——一個大量讀寫檔案的應用可能因為快取而觸發 OOM，雖然那些快取本來是可回收的。cgroup v2 對此有改善，但知道這個機制能解釋很多「明明沒用那麼多記憶體卻被殺」的困惑。

**面試回答方式**：給診斷步驟（describe 看 Last State 與 Exit Code 137、確認是單容器還是節點級、再看應用側）。核心加分點是 **JVM 的堆外記憶體**：Metaspace、執行緒堆疊、直接記憶體、JIT 程式碼快取都不在 `-Xmx` 之內，**所以 limits 要比 `-Xmx` 大 25% 到 30%**，並推薦 **`-XX:MaxRAMPercentage`**。第二個是 **page cache 的計算**：**cgroup v1 把檔案快取算進容器記憶體**，大量讀寫檔案的應用可能因此被 OOM 雖然快取本來可回收——這能解釋很多「明明沒用那麼多卻被殺」的困惑。

### 怎麼預防節點被單一 Pod 拖垮？

**核心答案**：**四層防護**。**LimitRange** 強制每個容器都有 requests 與 limits（**沒有 limits 的容器是最大的風險**）。**ResourceQuota** 限制 namespace 的總量。**正確的 kubelet 資源預留與驅逐閾值**，讓節點有緩衝。以及對「requests 與實際用量的差距」做監控——宣告 100 MB 實際用 2 GB 的 Pod 是排程器看不見的定時炸彈。

**詳細解析**：**第四項最少被做但最有價值**。排程器完全按 requests 分配——如果 requests 嚴重低估，節點看起來很空但實際已經滿了，排程器會繼續往上放 Pod 直到觸發驅逐。這種「超賣」在多數叢集裡是普遍存在的，而它在流量低谷時完全看不出問題，只在高峰時集中爆發。監控的做法是計算每個工作負載的「實際用量 p95 / requests」比值並定期檢視——比值遠大於 1 的要調高 requests，遠小於 1 的則是在浪費資源。把這個檢視變成週期性的例行工作，比任何一次性的調優都有效，而且它同時改善了穩定性與成本兩件事。

**面試回答方式**：給四層防護並指出**沒有 limits 的容器是最大的風險**。核心加分點是強調第四項**最少被做但最有價值**：排程器完全按 requests 分配，requests 嚴重低估時節點看起來很空但實際已滿，而這種超賣在低谷看不出問題、只在高峰集中爆發。給出具體做法：計算每個工作負載的「實際用量 p95 除以 requests」比值並定期檢視，**大於 1 要調高、遠小於 1 是浪費**，把它變成週期性例行工作比任何一次性調優都有效，而且同時改善穩定性與成本。

## 相關

- [[009-requests-limits-qos-oomkilled.md]]
- [[028-pdb-and-node-maintenance.md]]
