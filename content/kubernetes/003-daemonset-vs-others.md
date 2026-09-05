---
id: kubernetes-003
category: kubernetes
slug: daemonset-vs-others
title: DaemonSet 與 Deployment、StatefulSet 的差異
difficulty: medium
tags: [DaemonSet, Deployment, StatefulSet, 工作負載, 節點級服務]
source: original
---

# 題目

DaemonSet 和 Deployment、StatefulSet 差在哪？什麼樣的工作負載應該用 DaemonSet？

## 核心答案

差別在**「副本數由誰決定」**。Deployment 和 StatefulSet 都是你指定 `replicas: 3`，由控制器想辦法湊到三個；DaemonSet **沒有 replicas 這個欄位**，它的規則是「每個符合條件的 Node 上跑剛好一個」，副本數等於節點數，會隨叢集擴縮自動增減——新節點加入時自動補一個 Pod，節點移除時跟著消失。這個語意決定了它的適用場景：**節點級的基礎服務**，也就是那些「這台機器上必須有一份」的東西——日誌收集（Fluent Bit）、監控代理（Node Exporter）、網路外掛（CNI）、儲存外掛、安全代理。三者的另一個對比是身分：Deployment 的 Pod 可互換、StatefulSet 的 Pod 有序且有穩定身分、DaemonSet 的 Pod 則是**綁在特定 Node 上**——它的身分來自它所在的機器，而不是序號。

## 詳細解析

**為什麼不能用 Deployment 加 replicas 湊**：把 `replicas` 設成節點數看起來等價，但完全不可靠。Scheduler 沒有義務把三個副本分散到三台不同的機器，很可能兩個擠在同一台、另一台一個都沒有——那台機器的日誌就漏收了。就算用 podAntiAffinity 強制分散，節點數一變你就得手動改 replicas。DaemonSet 直接把「每台一個」寫進控制器語意，這件事不需要你維護。

**DaemonSet 也會被 nodeSelector 與 taint 影響**：「每個節點一個」其實是「每個**符合條件**的節點一個」。可以用 `nodeSelector` 或 `affinity` 限制只在特定節點池跑（例如只在 GPU 節點裝驅動）。反過來，如果節點有 taint，DaemonSet 也需要對應的 toleration 才上得去——這是排查「為什麼某台機器沒有我的 agent」時最常見的原因，尤其是控制平面節點通常帶有 taint。

**更新策略不同**：DaemonSet 的滾動更新是逐節點替換，用 `maxUnavailable` 控制同時能有幾台在更新。它沒有 Deployment 那種 `maxSurge`——因為每台只能有一個，不可能先起新的再砍舊的，必然是先砍後起，所以更新期間該節點的服務會短暫中斷。這對日誌收集這類服務通常可接受，但要心裡有數。

**節點級服務的權限往往較高**：DaemonSet 常需要 hostPath 掛載節點的日誌目錄、hostNetwork 存取節點網路、甚至 privileged 權限。這讓它成為叢集裡權限最集中的一類工作負載，也就成為安全審查的重點——一個被入侵的 DaemonSet 等於拿到每一台機器。實務上要用 RBAC 與 Pod Security 標準嚴格限制誰能建立 DaemonSet。

**在託管環境裡的注意事項**：GKE Autopilot 這類託管模式對 DaemonSet 有額外限制，因為節點由平台管理，privileged 與 hostPath 多半被禁止。需要節點級 agent 時，要先確認託管平台是否已內建（GKE 本身就內建了日誌與監控代理），避免重複部署浪費每台機器的資源。

## 面試回答方式

用「副本數由誰決定」這個角度切入最乾淨——Deployment 和 StatefulSet 是你指定，DaemonSet 是節點數決定、沒有 replicas 欄位。接著解釋為什麼不能用 Deployment 湊：Scheduler 不保證分散，可能兩個擠一台、一台都沒有，節點數變了還要手動改。舉出典型場景（日誌收集、監控代理、CNI、儲存外掛）。加分點有兩個：一是 taint／toleration 是「某台沒有我的 agent」最常見的原因；二是 DaemonSet 權限通常很高（hostPath、hostNetwork），是安全審查重點。

## 講稿

三者最乾淨的切法是「副本數由誰決定」。

Deployment 和 StatefulSet 你要寫 replicas，控制器想辦法湊到那個數字。DaemonSet 根本沒有 replicas 這個欄位，它的規則是每個符合條件的節點上跑剛好一個。節點加進來自動補、節點移掉自動消失。

所以它的場景很明確，就是節點級的基礎服務，那些「這台機器上必須有一份」的東西：日誌收集、監控代理、CNI 網路外掛、儲存外掛。

有人會問，用 Deployment 把 replicas 設成節點數不就好了？不行。Scheduler 沒有義務幫你分散，很可能兩個擠在同一台、另一台一個都沒有，那台的日誌就漏收了。而且節點數一變你就得手動改。

實務上有兩個坑值得提。第一，節點有 taint 的話 DaemonSet 也要有對應的 toleration 才上得去，這是「為什麼某台機器沒有我的 agent」最常見的原因。第二，這類服務常常要 hostPath、hostNetwork 甚至 privileged，權限很高，一旦被入侵等於拿到每一台機器，所以誰能建 DaemonSet 要嚴格控管。

## 常見追問

### 為什麼我的 DaemonSet 沒有部署到控制平面節點？

**核心答案**：因為控制平面節點通常帶有 taint（例如 `node-role.kubernetes.io/control-plane:NoSchedule`），用來阻止一般工作負載被排上去。DaemonSet 雖然語意是「每個節點一個」，但它一樣受 taint 約束——沒有對應的 toleration 就上不去。要讓它涵蓋控制平面節點，必須在 Pod spec 明確加上該 taint 的 toleration。

**詳細解析**：這是「每個節點」這個說法造成的誤解——精確的說法是「每個**能被排上去**的節點」。除了 taint，`nodeSelector` 和 affinity 也會縮小範圍。排查順序建議是：先 `kubectl get ds` 看 DESIRED 數字是多少，如果 DESIRED 本身就小於節點數，代表是選擇條件把節點排除了（taint 或 selector）；如果 DESIRED 對但 READY 不足，那才是 Pod 起不來的問題，要去看該節點上 Pod 的事件。順帶一提，在託管叢集如 GKE 裡你通常碰不到控制平面節點，這個問題只在自建叢集出現。

**面試回答方式**：直接指出是 taint 擋住的，並修正「每個節點」為「每個能被排上去的節點」。給出排查順序——先看 DESIRED 是不是本來就少（選擇條件問題），再看 READY 不足（Pod 起不來問題），這個分流比亂猜有效。

### DaemonSet 更新時會不會有服務中斷？

**核心答案**：會，而且無法避免。因為每個節點上只能有一個，不可能像 Deployment 那樣先起新的再砍舊的（沒有 `maxSurge` 這個概念），必然是**先砍後起**。所以該節點在新 Pod 就緒之前會有一段空窗。能控制的只有影響範圍——用 `maxUnavailable` 限制同時更新幾台，預設是 1，也就是一台一台換。

**詳細解析**：這個空窗對不同服務的意義差很多。日誌收集中斷幾秒通常只是少收一點（如果有本地緩衝甚至不會掉），可以接受；但如果 DaemonSet 是 CNI 網路外掛或 service mesh 的資料平面，中斷就可能影響該節點上所有 Pod 的網路，那就要非常謹慎，通常會搭配節點逐台 drain 的方式更新，而不是直接滾動。另外 DaemonSet 也支援 `OnDelete` 更新策略——改了 spec 不會自動替換，要等你手動刪掉舊 Pod 才生效，適合需要人工掌控節奏的關鍵元件。

**面試回答方式**：先說會中斷並解釋原因——每台只能一個，不可能先起後砍，必然先砍後起。接著講能控制的是影響範圍（`maxUnavailable`）。加分點是分場景：日誌收集可接受，CNI 或 mesh 資料平面就要配合節點 drain，並提到 `OnDelete` 策略可以人工掌控節奏。

### 節點級的 agent，除了 DaemonSet 還有別的做法嗎？

**核心答案**：有，主要是直接裝在節點的作業系統映像檔或啟動腳本裡，不經過 Kubernetes。差別在管理方式——DaemonSet 讓 agent 變成叢集的一個資源，可以用 `kubectl` 部署、滾動更新、看日誌，和其他工作負載同一套流程；裝在映像檔裡則要透過節點池重建才能更新，節奏慢很多，但不受叢集本身的健康狀態影響。

**詳細解析**：兩種做法的取捨點在於「這個 agent 需不需要在 Kubernetes 出問題時仍然運作」。監控與日誌收集用 DaemonSet 很合適，因為它們本來就是叢集的一部分，而且需要頻繁更新設定。但像節點層級的安全稽核、或是必須在 kubelet 都還沒起來就開始工作的元件，放在映像檔裡比較可靠——DaemonSet 畢竟要等 kubelet 正常、API Server 可達才會被部署。在 GKE 這類託管環境還有第三種選擇：平台已經內建了日誌與監控代理，這時自己再裝一份 DaemonSet 只是重複佔用每台機器的資源，應該先確認平台提供了什麼。

**面試回答方式**：給出替代方案（裝進節點映像檔）並用「管理方式」對比——DaemonSet 走 kubectl 那一套、更新快；映像檔要重建節點池、慢但不依賴叢集健康。判準是這個 agent 需不需要在 K8s 本身出問題時還能運作。加分點是提到託管平台通常已內建監控與日誌代理，別重複部署。

## 相關

- [[002-deployment-vs-statefulset.md]]
- [[011-gke-standard-vs-autopilot.md]]
- [[015-kube-scheduler.md]]
