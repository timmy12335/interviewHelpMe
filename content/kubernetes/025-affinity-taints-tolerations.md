---
id: kubernetes-025
category: kubernetes
slug: affinity-taints-tolerations
title: 節點選擇：nodeSelector、Affinity、Taint 與 Toleration
difficulty: medium
tags: [排程, 親和性, Taint, 節點管理]
source: original
---

# 題目

nodeSelector、nodeAffinity、taint 與 toleration 的差異是什麼？各自什麼時候用？

## 核心答案

**關鍵是方向相反**：**親和性是 Pod 挑節點**（我想去哪），**taint 是節點拒絕 Pod**（誰不准來）。兩者常需要搭配使用，因為只有其中一個往往達不到目的。

**nodeSelector** 是最簡單的形式——**標籤完全相符才排程**，**不符就一直 Pending**，沒有任何彈性。

**nodeAffinity** 是它的進階版：支援 `In`、`NotIn`、`Exists` 等運算子，**而且分成硬性（required）與軟性（preferred）**——軟性表達「偏好但不強制」，找不到就退而求其次，**這是 nodeSelector 完全做不到的**。

**taint 與 toleration** 則反過來：**節點打上 taint 表示「預設拒絕所有 Pod」**，**只有帶對應 toleration 的 Pod 才能上來**。**三種效果**：`NoSchedule`（新 Pod 不排上來）、`PreferNoSchedule`（盡量不要）、`NoExecute`（連已經在跑的都驅逐）。

## 詳細解析

「為什麼需要兩個機制」是這題的核心。假設你有一批 GPU 節點——只用 nodeAffinity 讓 GPU 工作負載去那裡是不夠的：普通的 Pod 仍然可以被排到 GPU 節點上，白白佔用昂貴的資源。**只用 taint 也不夠**：GPU Pod 雖然容忍了 taint，但排程器沒有理由「偏好」把它放到 GPU 節點。所以正確的組合是「GPU 節點打 taint + GPU Pod 帶 toleration 與 nodeAffinity」——**taint 擋住別人，affinity 吸引自己**。能說出這個組合，比分別解釋兩個機制更能證明實際用過。

**`NoExecute` 是唯一會影響已運行 Pod 的效果**，而它正是節點故障時自動驅逐的實作方式：node controller 在節點失聯時自動打上 `node.kubernetes.io/unreachable:NoExecute`，Pod 的 `tolerationSeconds`（預設 300 秒）決定它多久後被驅逐。這解釋了一個常見疑問：「節點掛了為什麼 Pod 過五分鐘才重建」——那個五分鐘就是預設的容忍時間，對延遲敏感的服務可以調短，代價是網路抖動時會產生不必要的重建。

**podAffinity 與 podAntiAffinity 是另一個維度**：它們基於「已經在節點上的其他 Pod」而非節點本身的標籤。podAntiAffinity 常用來把同一個服務的副本打散到不同節點——**但要注意它的計算成本很高**（每次排程都要檢查所有相關 Pod 的分布），**大規模叢集裡官方建議改用 topologySpreadConstraints**。

## 面試回答方式

先給最重要的區分——方向相反：親和性是 Pod 挑節點，taint 是節點拒絕 Pod，再依序說明 nodeSelector（完全相符、不符就 Pending）、nodeAffinity（硬性與軟性，軟性是 nodeSelector 完全做不到的）與 taint 的三種效果。加分點有三個：用 GPU 節點的例子說明為什麼需要兩個機制——只用 affinity 擋不住普通 Pod 佔用昂貴資源，只用 taint 又沒有理由偏好放過去，**所以要 taint 擋住別人加 affinity 吸引自己**；`NoExecute` 是節點故障自動驅逐的實作方式，而 `tolerationSeconds` 預設 300 秒正是「節點掛了 Pod 過五分鐘才重建」的原因；以及podAntiAffinity 計算成本高，大規模叢集官方建議改用 topologySpreadConstraints。

## 講稿

最關鍵的區分是方向相反。親和性是 Pod 挑節點，我想去哪。汙點是節點拒絕 Pod，誰不准來。

節點選擇器是最簡單的形式，標籤完全相符才排，不符就一直卡在待處理。節點親和性是進階版，支援更多運算子，而且分成硬性跟軟性，軟性表達偏好但不強制，找不到就退而求其次，這是節點選擇器完全做不到的。

汙點跟容忍反過來，節點打上汙點就是預設拒絕所有 Pod，只有帶對應容忍的才能上來。

為什麼需要兩個機制？以 GPU 節點為例。只用親和性不夠，普通 Pod 仍然可以被排上去白白佔用昂貴資源。只用汙點也不夠，GPU Pod 雖然容忍了，但排程器沒有理由偏好把它放過去。所以正確的組合是節點打汙點加上 Pod 同時帶容忍跟親和性，汙點擋住別人，親和性吸引自己。

另外有個實用的知識點。節點失聯時控制器會自動打上不可執行的汙點，而容忍秒數預設三百秒，那就是節點掛掉之後 Pod 要等五分鐘才重建的原因。

## 常見追問

### Pod 一直 Pending 怎麼查？

**核心答案**：**先看 `kubectl describe pod` 的 Events**——排程失敗的原因會明確寫在那裡，例如 `0/5 nodes are available: 3 Insufficient cpu, 2 node(s) had taint that the pod didn't tolerate`。這一行訊息通常就直接給出答案，它會列出每一類失敗原因各有幾個節點。常見原因依頻率：**資源不足**、**taint 未被容忍**、**nodeSelector/affinity 無匹配節點**、**PVC 無法綁定**、**以及 Pod 拓撲約束無法滿足**。

**詳細解析**：**「資源不足」這個訊息容易誤導**——**它比較的是 requests 而非實際使用量**。節點的 CPU 使用率只有 20%，但如果上面的 Pod 宣告的 requests 加起來已經接近可配置量，新 Pod 仍然排不上去。這是 K8s 初學者最常見的困惑，而理解它需要區分「宣告的需求」與「實際的用量」。另一個容易漏掉的是「節點的可配置量小於節點總量」——**kubelet 與系統元件預留了一部分（allocatable vs capacity）**，所以一台 4 核的機器可能只有 3.9 核可以分配。排查時應該看 `kubectl describe node` 的 Allocated resources 區段，而不是節點規格。

**面試回答方式**：給明確的第一步——`kubectl describe pod` 的 Events 會列出每一類失敗原因各有幾個節點，並舉出典型訊息與常見原因清單。核心加分點是指出「資源不足」比較的是 requests 而非實際使用量——節點只用 20% 但 requests 加起來接近可配置量就排不上去，**這是最常見的困惑**。第二個是**節點的可配置量小於總量**（kubelet 與系統元件預留），**所以要看 describe node 的 Allocated resources 而非節點規格**。

### 怎麼把節點下線做維護？

**核心答案**：**`kubectl cordon` 加 `kubectl drain`**。**cordon** 把節點標記為不可排程（**實際上就是打一個 `node.kubernetes.io/unschedulable` 的 taint**），新 Pod 不會再上來，但既有的繼續跑。**drain** 則進一步**驅逐既有的 Pod**——它會遵守 PodDisruptionBudget，逐個驅逐並等待替代的 Pod 就緒。維護完成後用 **`kubectl uncordon`** 恢復。

**詳細解析**：drain 卡住是最常見的問題，而原因通常是三個之一：**PDB 過於嚴格**（`minAvailable` 等於副本數，於是一個都不能驅逐——**這是一個必然卡死的設定**）、**有 Pod 不由控制器管理**（裸 Pod 沒有東西會重建它，drain 預設拒絕驅逐，需要 `--force`）、**或者 DaemonSet 的 Pod**（它們本來就該在每個節點上，需要 `--ignore-daemonsets`）。理解這三個原因能讓你在幾秒內判斷 drain 為什麼不動。而更根本的建議是「維護前先確認 PDB 的設定是可行的」——PDB 的目的是防止一次驅逐太多，而不是防止任何驅逐，設成一個都不能動就失去了意義。

**面試回答方式**：給 cordon、drain、uncordon 的流程並說明 **cordon 實際上就是打一個 unschedulable 的 taint**、**drain 會遵守 PDB 並等待替代 Pod 就緒**。核心加分點是**drain 卡住的三個常見原因**：PDB 過嚴（minAvailable 等於副本數必然卡死）、裸 Pod 需要 `--force`、DaemonSet 需要 `--ignore-daemonsets`。收在根本建議：PDB 的目的是防止一次驅逐太多而非防止任何驅逐，設成一個都不能動就失去意義。

### 專用節點池該怎麼規劃？

**核心答案**：按「資源型態」與「隔離需求」劃分，而不是按團隊或服務。合理的節點池：**一般運算**、**記憶體型**（快取、大 JVM）、**GPU 或特殊硬體**、**以及 spot/搶佔式節點**（跑可中斷的批次工作）。每個特殊池都用 taint 保護，並用 affinity 引導對應的工作負載。

**詳細解析**：「按團隊劃分節點池」是一個常見但通常錯誤的做法——它讓每個池都需要各自預留冗餘容量，整體利用率大幅下降，而 K8s 的價值恰恰在於共用資源池。如果需要的是成本歸屬，用標籤與成本分析工具解決，不要用實體隔離。 真正需要實體隔離的只有三種情況：合規要求、噪音鄰居問題嚴重、以及硬體確實不同。 **spot 節點值得特別提**：**它便宜 60% 到 90%，但會被隨時回收**——適合無狀態且能容忍中斷的工作，而使用它的前提是「PDB 設定正確」與「應用能優雅處理終止訊號」，否則省下的成本會被可用性問題吃掉。

**面試回答方式**：主張按資源型態與隔離需求劃分而非按團隊，並列出合理的池類型。核心加分點是說明**按團隊劃分通常錯誤**——每個池都要各自預留冗餘，整體利用率大幅下降，而 K8s 的價值恰恰在共用資源池；成本歸屬應該用標籤與成本工具而非實體隔離，真正需要隔離的只有合規、噪音鄰居、硬體不同三種。收在 spot 節點：**便宜 60% 到 90% 但隨時被回收**，前提是 PDB 正確與應用能優雅處理終止訊號。

## 相關

- [[015-kube-scheduler.md]]
- [[026-topology-spread-constraints.md]]
