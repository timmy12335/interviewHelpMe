---
id: kubernetes-017
category: kubernetes
slug: kubelet-and-cri
title: kubelet 負責什麼？它和 Container Runtime 的關係
difficulty: medium
tags: [kubelet, CRI, containerd, Container Runtime, Node]
source: original
---

# 題目

kubelet 在節點上做哪些事？它和 containerd 這類 Container Runtime 是什麼關係？為什麼 K8s 要定義 CRI 這層介面？

## 核心答案

kubelet 是每個節點上的代理人，負責讓「這台機器上該跑的 Pod」真的跑起來並保持健康。它的核心迴圈是：從 apiserver 取得**被綁定到自己這個節點**的 Pod 清單 → 比對節點上實際跑著什麼 → 有差異就呼叫 Container Runtime 建立或刪除容器 → 持續執行探針、回報 Pod 與節點狀態。

**kubelet 自己不跑容器**，它透過 **CRI（Container Runtime Interface）** 這個 gRPC 介面，指揮真正的執行環境（containerd、CRI-O）去拉映像檔、建立容器、管理生命週期。

**CRI 存在的理由是解耦**：早期 kubelet 直接內建對 Docker 的支援，換執行環境就要改 kubelet 的程式碼。定義 CRI 之後，任何實作這個介面的執行環境都能被 K8s 使用，K8s 也不必為特定廠商維護專用程式碼——這正是後來能移除 dockershim 的基礎。

值得注意的是 kubelet 的工作是**節點層級**的：它只管自己這台機器，不知道也不關心叢集全貌，這讓它在與 apiserver 失聯時仍能繼續維持既有 Pod 運行。

## 詳細解析

**kubelet 也是一個 reconcile 迴圈**：和其他控制器同構——期望是「apiserver 說這個節點該有這些 Pod」，實際是「節點上現在有這些容器」，差異就補。理解這點就理解了為什麼 kubelet 與 apiserver 短暫失聯時，既有 Pod 不受影響：它手上還有上一次拿到的期望狀態，會繼續維持。

**kubelet 的職責比想像中多**：除了管容器，它還負責掛載 Volume、下載 ConfigMap 與 Secret 並寫進容器、執行三種探針、回報節點資源與狀態（Node status）、以及在節點資源不足時**主動驅逐 Pod**（eviction）。驅逐是 kubelet 的決定，不是 scheduler 的——這也解釋了為什麼驅逐依據的是 QoS 等級與實際用量。

**dockershim 移除的真正意義**：Kubernetes 1.24 移除了 kubelet 內建的 Docker 支援，但這**不代表 Docker 建的映像檔不能用**——映像檔格式由 OCI 標準規範，containerd 一樣能跑。改變的只是節點上的執行環境元件，多數使用者其實無感。這題常被誤解成「Docker 被 K8s 淘汰」，實際上 containerd 本來就是 Docker 內部使用的元件，等於是拿掉了中間那一層。

**節點上的 pause container**：kubelet 為每個 Pod 先建立一個 pause container 持有 network namespace，其他容器再加入。這是「同一 Pod 共享網路」與「業務容器重啟不換 IP」的實作基礎，在節點上用 `crictl ps` 會看到它們。

**與 apiserver 失聯的行為**：既有 Pod 繼續跑，但 kubelet 無法回報狀態，node controller 一段時間後會把節點標記 `NotReady` 並加上 taint，觸發 Pod 被驅逐重排。所以「節點失聯」的後果不是節點上的服務立刻停止，而是叢集認為它不可靠而開始在別處重建——這中間可能出現短暫的雙份實例，對需要單一實例保證的有狀態應用要特別注意。

## 面試回答方式

先給 kubelet 的核心迴圈：取得綁定到自己的 Pod、比對實際、有差異就呼叫 runtime。強調**它自己不跑容器**，透過 CRI 指揮 containerd。CRI 的存在理由用「解耦」回答——不必為特定廠商維護專用程式碼，這是能移除 dockershim 的基礎。實務加分點：kubelet 也是 reconcile 迴圈，所以與 apiserver 失聯時既有 Pod 不受影響；驅逐是 kubelet 的決定不是 scheduler 的；以及 dockershim 移除不代表 Docker 映像檔不能用，因為映像檔格式由 OCI 規範——這個誤解很常見，能澄清是加分。

## 講稿

kubelet 是每個節點上的代理人，職責是讓這台機器上該跑的 Pod 真的跑起來並保持健康。

它的核心迴圈跟其他控制器同構：從 apiserver 拿到綁定到自己這個節點的 Pod 清單，比對節點上實際跑著什麼，有差異就動手。這解釋了為什麼跟 apiserver 短暫失聯時，既有的 Pod 完全不受影響，因為它手上還有上一次的期望狀態。

要注意 kubelet 自己不跑容器，它透過 CRI 這個介面指揮 containerd 去拉映像檔、建容器。

CRI 存在的理由是解耦。早期 kubelet 內建 Docker 支援，換執行環境就得改它的程式碼。有了介面，任何實作它的執行環境都能用，這就是後來能移除 dockershim 的基礎。

順帶澄清一個誤解。移除 dockershim 不代表 Docker 建的映像檔不能用，映像檔格式是 OCI 規範的。containerd 本來就是 Docker 內部在用的東西，等於只是拿掉中間那一層。

另外 kubelet 職責比很多人想的多：掛載 Volume、寫入 Secret、執行探針，還有節點資源不足時主動驅逐 Pod。

## 常見追問

### kubelet 掛掉，節點上的容器會停止嗎？

**核心答案**：**不會立刻停止**。容器是由 containerd 直接管理的行程，kubelet 只是指揮者不是父行程，它掛掉之後既有容器照常運行、繼續服務流量。但這個節點失去了自我修復能力——容器 crash 之後**沒有人會重啟它**，探針停止執行，Pod 狀態也不再回報。

**詳細解析**：真正的連鎖反應來自狀態回報中斷：node controller 收不到心跳，一段時間後把節點標記 `NotReady` 並加上 `NoExecute` taint，觸發上面的 Pod 被驅逐並在其他節點重建。這時會出現一個危險的中間狀態——**舊節點上的容器其實還在跑**（因為 kubelet 死了沒人去停它），新節點上的替代 Pod 也起來了，等於同時有兩份實例。對無狀態服務只是多一份容量，但對需要單一實例保證的有狀態應用（例如持有分散式鎖、寫同一份資料）可能造成資料損壞。這正是 StatefulSet 在節點失聯時不會自動建立替代 Pod、寧可等人工確認的原因。

**面試回答方式**：先回答不會立刻停止，並解釋 kubelet 是指揮者不是父行程。重點放在失去自我修復能力——crash 不重啟、探針不跑、狀態不回報。加分點是講出「雙份實例」這個危險中間狀態，並用它解釋 StatefulSet 為何不自動替換。

### 為什麼 K8s 1.24 之後移除了 dockershim？我的映像檔要重建嗎？

**核心答案**：**不用重建**。映像檔格式由 **OCI 標準**規範，用 `docker build` 建出來的映像檔 containerd 一樣能跑，這件事完全沒有改變。移除的是 **kubelet 內建的那層 Docker 轉接程式**（dockershim）——因為 Docker 本身不實作 CRI，K8s 必須額外維護一層轉接，而其他執行環境都直接支援 CRI。移除它是為了不再為單一廠商維護特例程式碼。

**詳細解析**：實務上受影響的是**依賴節點上有 Docker 的東西**，而不是映像檔。例如掛載 `/var/run/docker.sock` 的 CI 工具或監控 agent 會失效，需要改用 CRI 相容的方式（`crictl` 取代 `docker` 指令）；在 Pod 裡用 Docker 建映像檔的做法也要改成 Kaniko、Buildah 這類不需要 Docker daemon 的工具。有趣的是 containerd 本來就是 Docker 內部使用的執行環境元件，所以這個變更等於是拿掉中間商直接對接。對多數使用託管服務的使用者來說，這個遷移由平台完成，幾乎無感。

**面試回答方式**：先斬釘截鐵回答不用重建，並用 OCI 標準解釋原因——這是澄清誤解的關鍵。說明移除的是轉接層，動機是不為單一廠商維護特例。加分點是指出真正受影響的是掛載 docker.sock 的工具與 Pod 內建映像檔的做法，並給出替代方案。

### 節點上的 Pod 被 kubelet 驅逐（Evicted），和被 OOMKilled 有什麼不同？

**核心答案**：**觸發者與範圍完全不同**。OOMKilled 是**這個容器自己**超過它的記憶體 limit，由 Linux 核心的 OOM killer 直接殺掉，跟節點整體有沒有壓力無關。Evicted 則是 **kubelet 主動的決定**——它偵測到節點整體資源（記憶體、磁碟）低於門檻，為了保護節點不崩潰而挑幾個 Pod 趕走，挑選依據是 QoS 等級與實際用量超出 requests 的程度。

**詳細解析**：兩者的排查方向不同。OOMKilled 要看**這個應用**的記憶體用量與 limit 設定；Evicted 要看**節點**的資源狀況，常見成因除了記憶體，還有磁碟壓力——容器日誌沒有輪替、映像檔堆積、emptyDir 寫太多都會觸發，這類問題調應用的 limit 完全沒用。另外被驅逐的 Pod 會留下 `Evicted` 狀態的殘骸物件，不會自動清理，累積多了會干擾 `kubectl get pods` 的觀察，需要定期清掉。從預防角度看，OOMKilled 靠正確設定 limit 與修復洩漏，Evicted 靠讓 requests 誠實反映用量（QoS 才會保護你）與監控節點資源水位。

**面試回答方式**：用「觸發者與範圍」切開兩者——容器自己超限 vs kubelet 為保護節點主動驅逐。強調排查方向不同：一個查應用、一個查節點。加分點是指出磁碟壓力也會造成驅逐（日誌沒輪替、映像檔堆積），這時調 limit 完全沒用；以及 Evicted 殘骸不會自動清理。

## 相關

- [[015-kube-scheduler.md]]
- [[018-pod-lifecycle-and-termination.md]]
- [[009-requests-limits-qos-oomkilled.md]]
