---
id: kubernetes-015
category: kubernetes
slug: kube-scheduler
title: kube-scheduler 怎麼決定 Pod 要放到哪個 Node？
difficulty: medium
tags: [kube-scheduler, 排程, affinity, taint, toleration, Pending]
source: original
---

# 題目

kube-scheduler 排程一個 Pod 的流程是什麼？nodeSelector、affinity、taint／toleration 各自在哪個環節起作用？

## 核心答案

排程分兩個階段：**Filter（過濾）→ Score（評分）**。

**Filter** 先刷掉所有不可行的節點——資源不足（比對節點剩餘可 request 的量）、`nodeSelector` 或 `nodeAffinity` 不符、有 **taint** 而 Pod 沒有對應的 **toleration**、port 衝突、PV 的區域限制等。**Score** 再從剩下的可行節點裡挑最好的——考量資源分佈是否均衡、映像檔是否已在該節點快取、`podAffinity`／`podAntiAffinity` 的偏好等，選分數最高的。

三者的定位不同：**`nodeSelector` 是最陽春的硬性標籤比對**；**affinity 更有表達力**，分成硬性（`required`，在 Filter 階段生效）與軟性（`preferred`，在 Score 階段生效）；**taint／toleration 是反向的**——前兩者是 Pod 挑節點，taint 是**節點排斥 Pod**，除非 Pod 明確表示容忍。

排完之後 scheduler 只是**寫入綁定結果**（把 Pod 的 `nodeName` 設定好），實際拉映像檔與啟動容器是**該節點上的 kubelet** 看到這個綁定後才做的。

## 詳細解析

**Filter 看的是 requests，不是實際用量**：節點上已被 request 的總和決定它還放不放得下，跟實際 CPU 用了多少無關。所以會出現「節點 CPU 只用 20%，卻顯示資源不足無法排程」的情況——那是 requests 被設得太高把額度佔滿了。

**Pending 的兩種成因要分清楚**：`kubectl describe pod` 的事件會直接告訴你。`FailedScheduling` 代表 **Filter 之後沒有可行節點**，訊息會列出每個節點被刷掉的原因（幾個因為資源不足、幾個因為 taint）——這是排查 Pending 最直接的線索。另一種 Pending 是**已經綁定但容器還沒起來**，那是映像檔拉取或 volume 掛載的問題，不歸 scheduler 管。

**taint 的三種效果差別很大**：`NoSchedule` 只擋新的排程，已在節點上的 Pod 不受影響；`PreferNoSchedule` 是軟性的，沒有更好的選擇時仍會排上去；`NoExecute` 最強，會驅逐已經在節點上且不容忍的 Pod。節點失聯時 K8s 自動加上的就是 `NoExecute` 類的 taint，這也是節點故障後 Pod 會被重新排程的機制。

**podAntiAffinity 的實務價值與代價**：把同一個服務的副本分散到不同節點或可用區，是避免單點故障的標準做法（用 `topologyKey` 指定分散的維度）。但硬性的 `required` 反親和在節點不足時會讓 Pod 直接 Pending——例如要求三個副本各在不同節點，但叢集只有兩個節點。所以多數情況該用 `preferred`，或改用更晚出現、專門為此設計的 **Pod Topology Spread Constraints**，它能表達「盡量均勻，但允許偏差多少」這種更精確的意圖。

**優先級與搶佔**：Pod 可以透過 `PriorityClass` 設定優先級。高優先級的 Pod 排不進去時，scheduler 會嘗試**驅逐低優先級的 Pod** 騰出空間（preemption）。這是保障關鍵服務的手段，但要注意被搶佔的 Pod 是直接被驅逐的，所以低優先級的工作負載要能承受隨時被中斷。

## 面試回答方式

先講兩階段 Filter → Score 這個骨架，並說明各階段在做什麼。接著把三種機制對位：`nodeSelector` 是陽春的硬性比對、affinity 分硬性（Filter）與軟性（Score）、taint／toleration 是**反向**的節點排斥。一定要補上「scheduler 只寫綁定結果，實際啟動是 kubelet 做的」——這個分工常被誤解。實務加分點：Filter 看 requests 不看實際用量，所以會出現「CPU 才用 20% 卻說資源不足」；`describe pod` 的 `FailedScheduling` 事件會列出每個節點被刷掉的原因，是排查 Pending 最直接的線索；以及硬性反親和在節點不足時會造成 Pending，多數情況該用 preferred 或 Topology Spread Constraints。

## 講稿

排程分兩個階段，Filter 然後 Score。

Filter 先刷掉所有不可行的節點：資源不夠的、標籤對不上的、有 taint 但 Pod 沒有對應 toleration 的。Score 再從剩下的節點裡挑最好的一個。

三種機制定位不一樣。nodeSelector 是最陽春的硬性標籤比對。affinity 表達力更好，硬性在 Filter 生效、軟性在 Score 生效。taint 跟 toleration 則是反向的，前兩個是 Pod 挑節點，taint 是節點排斥 Pod，除非 Pod 明確說我容忍。

有個分工常被誤解。scheduler 排完之後只是寫入綁定結果，把 nodeName 設好，實際拉映像檔跟啟動容器是那個節點上的 kubelet 做的。

實務上兩個重點。第一，Filter 看的是 requests 不是實際用量，所以會出現節點 CPU 才用兩成卻說資源不足，那是 requests 設太高把額度佔滿了。

第二，Pod 卡在 Pending 時，describe 的事件會列出每個節點被刷掉的原因，幾個因為資源不足、幾個因為 taint。這是最直接的線索，比亂猜快得多。

## 常見追問

### Pod 一直 Pending，你的排查順序是什麼？

**核心答案**：第一步永遠是 **`kubectl describe pod`** 看事件區。如果看到 **`FailedScheduling`**，代表沒有可行節點，訊息會直接列出每個節點被刷掉的原因——「3 個節點資源不足、2 個節點有不容忍的 taint」這種形式，順著它去查就好。如果**沒有** `FailedScheduling` 而是別的訊息，代表 Pod 其實已經綁定到節點了，問題出在映像檔拉取或 volume 掛載，那就不是 scheduler 的責任。

**詳細解析**：這個「有沒有 FailedScheduling」的分流能省掉大量時間。落在 scheduler 這一側時，常見成因依機率排序是：requests 設太高（節點看似有空但額度滿了）、節點有 taint 而 Pod 沒 toleration、硬性 affinity 或反親和太嚴格、PVC 綁到特定區域而該區沒有合適節點。落在另一側時，常見的是映像檔拉取失敗（私有倉庫憑證、映像檔名打錯）或 PVC 一直 Pending（沒有符合的 StorageClass 或動態佈建失敗）。如果叢集有 Cluster Autoscaler，Pending 也可能只是暫時的——它正在開新節點，這時要去看 Autoscaler 的日誌確認它有沒有被什麼原因擋住。

**面試回答方式**：給出明確的第一步與分流判準——有沒有 `FailedScheduling` 決定問題在 scheduler 還是在 kubelet 那一側。兩側各列出常見成因並依機率排序。加分點是提到有 Autoscaler 時 Pending 可能只是暫時的，要去看它的日誌。

### 怎麼確保同一個服務的副本分散在不同的可用區？

**核心答案**：用 **Pod Topology Spread Constraints**，以 `topologyKey: topology.kubernetes.io/zone` 指定要分散的維度，並用 `maxSkew` 表達「各區之間允許相差幾個」。相較於用 `podAntiAffinity`，它能精確表達「盡量均勻但允許一點偏差」，而 `podAntiAffinity` 只能表達硬性的「不准同區」或軟性的「盡量不同區」，兩者都不夠精準。

**詳細解析**：關鍵取捨在 `whenUnsatisfiable`：設成 `DoNotSchedule` 是硬性的，滿足不了就 Pending——安全但可能在節點不足時讓服務起不來；設成 `ScheduleAnyway` 則是盡力而為，保證可用性但不保證分散。多數線上服務適合後者，再搭配監控確認實際分佈。要注意這個約束只在**排程當下**生效，之後節點被移除造成的傾斜不會自動修正，需要額外的重平衡工具或滾動重啟才會重新分佈——這是很多人以為設了就永遠均勻的誤解。另外分散到多可用區會帶來跨區流量費用與延遲，設計時要一併考慮；如果服務之間互相呼叫頻繁，有時反而會用 `podAffinity` 把相關服務拉到同一區。

**面試回答方式**：直接給 Topology Spread Constraints 這個答案，並用「表達力」對比 podAntiAffinity——`maxSkew` 能表達允許的偏差程度。講清楚 `whenUnsatisfiable` 的取捨並給出建議。加分點有兩個：約束只在排程當下生效、之後傾斜不會自動修正；以及跨區有流量費用與延遲，未必永遠該分散。

### 節點故障時，上面的 Pod 是怎麼被搬走的？

**核心答案**：不是 scheduler 主動偵測的。節點失聯時，**node controller** 會先把節點標記為 `NotReady`，一段時間後為它加上 `NoExecute` 類的 **taint**。因為 Pod 通常不容忍這個 taint，taint manager 就會**驅逐**節點上的 Pod；Pod 被刪除後，管理它的 Deployment 或 StatefulSet 發現副本數不足，才建立新的 Pod，這時 scheduler 才介入把新 Pod 排到健康的節點上。

**詳細解析**：這條鏈路解釋了為什麼節點故障到服務恢復會有數分鐘的延遲——標記 NotReady 有寬限期、加 taint 有延遲、Pod 還有 `tolerationSeconds` 可以再撐一段時間。這些預設值偏保守，是為了避免短暫的網路抖動造成不必要的大規模搬遷。想縮短恢復時間可以調整這些參數，但要小心過於激進會讓網路抖動觸發雪崩式的重新排程。另外要注意 StatefulSet 的行為不同——因為它保證每個序號只有一個實例，在無法確認舊 Pod 真的死透之前不會建立替代的 Pod，所以節點失聯時 StatefulSet 的恢復可能需要人工介入確認，這是它為了資料安全付出的代價。

**面試回答方式**：把鏈路完整講出來——node controller 標記、加 NoExecute taint、taint manager 驅逐、控制器補副本、scheduler 才排程。用這條鏈路解釋為什麼恢復有數分鐘延遲，並說明預設值保守是為了避免網路抖動造成雪崩。加分點是指出 StatefulSet 為了保證單一實例，故障恢復可能需要人工介入。

## 相關

- [[009-requests-limits-qos-oomkilled.md]]
- [[017-kubelet-and-cri.md]]
- [[010-hpa-vpa-cluster-autoscaler.md]]
