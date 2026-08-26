---
id: kubernetes-010
category: kubernetes
slug: hpa-vpa-cluster-autoscaler
title: HPA、VPA 與 Cluster Autoscaler 的差異
difficulty: medium
tags: [HPA, VPA, Cluster Autoscaler, 自動伸縮, Metrics Server, GKE]
source: original
---

# 題目

HPA、VPA 和 Cluster Autoscaler 分別在調整什麼？它們可以同時使用嗎？

## 核心答案

三者調整的是**不同的維度**，而且是**接力關係**：

**HPA（Horizontal Pod Autoscaler）調 Pod 的數量**——依 CPU、記憶體或自訂指標增減副本數，是最常用的一種。**VPA（Vertical Pod Autoscaler）調單一 Pod 的 requests／limits**——它觀察實際用量，建議或自動修正資源配置。**Cluster Autoscaler 調節點的數量**——當有 Pod 因為資源不足而 **Pending** 時增加節點，節點長時間低使用率時移除。

接力關係是：HPA 加了 Pod → 現有節點放不下、Pod 進入 Pending → Cluster Autoscaler 開新節點。所以 **HPA 和 Cluster Autoscaler 是天生搭配、幾乎一定要一起用**。

但 **HPA 和 VPA 不能同時對「同一個指標」作用**——兩者都盯 CPU 的話會互相打架：VPA 調高 requests 讓每個 Pod 的使用率下降，HPA 看到使用率降低就縮減副本，然後負載又集中回來，形成震盪。要並用必須讓它們看不同維度（例如 VPA 只管記憶體、HPA 用自訂指標）。

## 詳細解析

**HPA 的計算方式決定了它的行為**：目標副本數大致是「目前副本數 × (目前指標 ÷ 目標指標)」。注意它算的是**平均值**，所以少數 Pod 特別忙不會觸發擴容。另外 HPA 的 CPU 使用率是相對於 **requests** 而非 limits——requests 設得太低會讓使用率虛高、動不動就擴容；設太高則永遠擴不起來。**HPA 的行為好壞，一半取決於 requests 設得準不準**。

**HPA 依賴 Metrics Server**：沒有安裝 Metrics Server，HPA 的 TARGETS 欄位會顯示 `<unknown>` 而完全不動作。這是「HPA 設了沒反應」最常見的原因。要用 QPS、佇列長度這類自訂指標，還需要額外的 adapter（Prometheus Adapter，或 GKE 上的 Custom Metrics Stackdriver Adapter）。

**VPA 的最大限制是需要重建 Pod**：傳統上修改 requests 必須重啟容器，所以 VPA 的 `Auto` 模式會驅逐並重建 Pod，對線上服務有中斷風險。實務上很多團隊只用 `Off`（僅提供建議）模式，把 VPA 當成「幫我算出合理 requests」的推薦引擎，再由人決定要不要套用。較新的 Kubernetes 版本開始支援原地調整資源，這個限制正在被緩解。

**Cluster Autoscaler 的縮容比擴容保守得多**：它要確認節點上的 Pod 都能被搬到別處、沒有本地儲存、沒有被 PodDisruptionBudget 擋住、不是 DaemonSet，而且要持續低使用率一段時間才會動手。所以「為什麼節點一直不縮」通常不是壞掉，而是某個 Pod 讓它搬不走——常見元凶是使用 hostPath 或 emptyDir 的 Pod，以及沒有設 PDB 導致無法安全驅逐的單副本服務。

**GKE 的對應能力**：GKE 的 Cluster Autoscaler 是託管的，另外還有 **Node Auto-Provisioning**，能在現有節點池都不合適時**自動建立新的節點池**（例如有 Pod 要求 GPU 或特殊機型）。Autopilot 模式則更進一步，節點完全由平台管理，使用者只需要關心 Pod 層級的伸縮。

## 面試回答方式

用「調整的維度」把三者切開——HPA 調 Pod 數、VPA 調單 Pod 資源、Cluster Autoscaler 調節點數。接著講**接力關係**：HPA 加 Pod 導致 Pending，Cluster Autoscaler 才開節點，所以這兩個幾乎一定要一起用。然後正面回答「能不能同時用」——HPA 與 VPA 對同一指標會震盪，要用必須錯開維度。實務加分點：HPA 的使用率是相對於 requests，所以 requests 準不準決定 HPA 好不好用；沒裝 Metrics Server 會讓 HPA 顯示 unknown 完全不動；以及「節點一直不縮」通常是某個 Pod 搬不走（hostPath、emptyDir、PDB），而不是 Autoscaler 壞掉。

## 講稿

這三個調整的是不同維度，而且彼此是接力關係。

HPA 調 Pod 的數量，VPA 調單一 Pod 的 requests 跟 limits，Cluster Autoscaler 調節點數量。

接力關係是這樣：HPA 加了 Pod，現有節點放不下，Pod 進入 Pending，Cluster Autoscaler 這時才開新節點。所以這兩個幾乎一定要一起用。

但 HPA 跟 VPA 不能同時盯同一個指標，會打架。VPA 調高 requests，每個 Pod 的使用率就下降，HPA 看到使用率低就縮副本，負載又集中回來，來回震盪。

有兩個實務重點。第一，HPA 的 CPU 使用率是相對於 requests 算的，不是 limits。所以 requests 設得準不準，直接決定 HPA 好不好用。

第二，節點一直不縮通常不是 Autoscaler 壞了，而是有 Pod 搬不走——用了 hostPath 或 emptyDir、或是單副本服務沒設 PodDisruptionBudget 導致無法安全驅逐。查這個比重啟 Autoscaler 有用。

## 常見追問

### HPA 設好了但完全不動作，怎麼查？

**核心答案**：先跑 `kubectl get hpa` 看 **TARGETS** 欄位。如果顯示 `<unknown>`，代表 HPA 拿不到指標——最常見的原因是**沒有安裝 Metrics Server**，其次是**目標 Pod 沒有設定 requests**（HPA 的使用率是相對於 requests 計算的，沒有 requests 就無從計算）。如果 TARGETS 有數字但副本數不動，那就是還沒達到閾值，或是被 `minReplicas`／`maxReplicas` 卡住。

**詳細解析**：排查順序建議是：TARGETS 是不是 unknown → 有沒有 Metrics Server（`kubectl top pods` 能不能用是個快速測試）→ 目標工作負載有沒有設 requests → `kubectl describe hpa` 看事件區的訊息。如果用的是自訂指標，還要確認 adapter 有正確註冊 API。另外 HPA 有**冷卻機制**——擴容較積極、縮容則有預設數分鐘的穩定視窗，避免流量波動造成頻繁抖動，所以看到「流量降了但副本沒馬上減」通常是正常行為而不是故障。這個穩定視窗可以透過 `behavior` 欄位調整。

**面試回答方式**：給出明確的第一步——看 TARGETS 是不是 unknown，這個分流最有效。列出兩個常見原因（沒有 Metrics Server、沒設 requests），並給 `kubectl top pods` 這個快速測試。加分點是說明縮容有穩定視窗，看起來不動可能是正常的。

### 為什麼 Cluster Autoscaler 一直不縮容？

**核心答案**：因為它的縮容條件非常保守——必須確認節點上**所有** Pod 都能被安全地搬到其他節點。任何一個 Pod 不符合就整個節點留著。常見的阻擋原因有：Pod 使用了 **hostPath 或 emptyDir** 這類本地儲存（搬走資料就沒了）、**PodDisruptionBudget** 不允許再驅逐、Pod 沒有被任何控制器管理（裸 Pod 刪了不會重建）、或是 **kube-system 的元件**沒有設定允許被移動。

**詳細解析**：排查時可以直接看 Cluster Autoscaler 的日誌，它會明確記錄「這個節點不可縮容，因為某某 Pod 的某某原因」，比猜測快得多。GKE 上這些訊息在叢集的事件或 Cloud Logging 裡找得到。實務上要讓縮容順利，需要幾個習慣：避免在無狀態服務裡用 emptyDir 當快取（改用記憶體或外部快取）、為每個服務設定合理的 PDB（既能保護可用性又不會完全卡死驅逐）、以及為 DaemonSet 之外的系統元件加上可安全驅逐的標註。另外要注意縮容還有使用率門檻與時間門檻，剛降下來的節點不會立刻被回收。

**面試回答方式**：先講縮容條件保守這個本質——所有 Pod 都要搬得走。列出常見阻擋（hostPath／emptyDir、PDB、裸 Pod、kube-system 元件）。給出最實用的動作：直接看 Autoscaler 日誌，它會寫明原因。加分點是給出讓縮容順利的幾個設計習慣。

### 流量是可預測的尖峰（例如每天早上九點），HPA 夠用嗎？

**核心答案**：**通常不夠**，因為 HPA 是**反應式**的——它要先觀察到指標上升才擴容，而擴容本身有延遲鏈：指標採集週期、HPA 評估週期、Pod 排程、映像檔拉取、應用啟動與暖機。可預測的尖峰往往在這條鏈跑完之前就已經打進來了，使用者體驗到的是前幾分鐘的高延遲或錯誤。

**詳細解析**：解法有三個方向。最直接的是**預先擴容**——用 CronJob 或排程工具在尖峰前調高 `minReplicas`，尖峰過後調回，把反應式變成預測式。第二是**縮短擴容鏈**：預先在節點上拉好映像檔、減少啟動時的暖機工作、用 Startup 探針讓慢啟動不被誤殺。第三是準備**緩衝容量**——用低優先級的佔位 Pod 佔住節點資源，尖峰時它們被搶佔讓出空間，這樣就省掉了開新節點那段最慢的時間（節點從無到可用通常要數分鐘）。GKE 上還可以搭配節點池的預留或 Autopilot 的 balloon Pod 做類似的事。實務上這三者常常一起用。

**面試回答方式**：先解釋為什麼不夠——HPA 是反應式的，並把擴容延遲鏈逐段拆開（採集、評估、排程、拉映像、啟動暖機），這比只說「有延遲」具體得多。給出三個方向並點出各自解決鏈路的哪一段。加分點是提到用低優先級佔位 Pod 預留緩衝，省掉開節點那段最慢的時間。

## 相關

- [[009-requests-limits-qos-oomkilled.md]]
- [[011-gke-standard-vs-autopilot.md]]
- [[015-kube-scheduler.md]]
