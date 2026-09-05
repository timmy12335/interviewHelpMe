---
id: kubernetes-005
category: kubernetes
slug: service-types-vs-ingress
title: Service 的三種型別與 Ingress 的差異
difficulty: medium
tags: [Service, ClusterIP, NodePort, LoadBalancer, Ingress, 網路]
source: original
---

# 題目

ClusterIP、NodePort、LoadBalancer 這三種 Service 型別各自解決什麼問題？既然有 LoadBalancer，為什麼還需要 Ingress？

## 核心答案

三種 Service 型別是**逐層往外疊加**的關係，不是三選一：**ClusterIP** 是基礎，給一個只有叢集內部可達的虛擬 IP；**NodePort** 在 ClusterIP 之上，額外在**每個節點**開一個高位 port（30000–32767），從叢集外打任一節點的那個 port 就會被轉進來；**LoadBalancer** 又在 NodePort 之上，額外請雲端供應商配一個外部負載平衡器指向這些 NodePort。所以建立一個 LoadBalancer，底下其實同時存在 ClusterIP 與 NodePort。

需要 Ingress 的原因是**層級不同**：Service 工作在 L4（只認 IP 與 port），而每個 LoadBalancer Service 都會各自佔用一個外部 IP 與一台雲端負載平衡器——十個服務就是十個 IP、十份帳單。Ingress 工作在 **L7**，能依照 **HTTP 主機名與路徑**把流量路由到不同 Service，讓所有服務**共用一個入口與一個 IP**，並在這一層統一處理 TLS 憑證。

## 詳細解析

**ClusterIP 是個不存在的 IP**：它不綁在任何網卡上，ping 不到。它之所以可達，是因為 kube-proxy 在每個節點上寫了 iptables 或 IPVS 規則，把送往這個 IP 的封包 DNAT 成某個實際 Pod 的 IP。理解這點就能回答「為什麼叢集外打不到 ClusterIP」——因為外面沒有這套規則。

**NodePort 的實務問題**：它要求呼叫方知道節點 IP，但節點會被替換、擴縮，IP 不穩定；而且 port 範圍是高位數字，不能直接對外提供 80／443；此外流量進到任一節點後可能還要再跳一次到別的節點上的 Pod，多一跳延遲。所以 NodePort 很少直接對外，多半是給外部負載平衡器當後端用。

**LoadBalancer 為什麼貴**：每一個 LoadBalancer Service 都會觸發 cloud-controller-manager 去雲端申請一台負載平衡器與一個外部 IP。這是實實在在的雲端資源，按小時計費。微服務架構下服務數量一多，這筆費用與 IP 管理成本會很可觀。

**Ingress 本身不做事，Ingress Controller 才做**：Ingress 只是一份路由規則的宣告，叢集裡必須有 Ingress Controller（NGINX Ingress、GKE 內建的 GCE Ingress 等）去讀取它並實際配置代理。只建立 Ingress 資源而沒有安裝 Controller，是最常見的「設定完全沒有生效」原因，而且不會有明顯報錯，只會看到 Ingress 的 ADDRESS 欄位一直空著。

**什麼時候仍然該用 LoadBalancer**：Ingress 是為 HTTP／HTTPS 設計的。如果要對外的是 gRPC 以外的 TCP／UDP 服務（資料庫、遊戲伺服器、MQTT），Ingress 幫不上忙，還是得用 LoadBalancer Service，或改用能表達多協定的 Gateway API。

## 面試回答方式

第一句就要點出三種型別是**疊加**而非三選一——LoadBalancer 底下同時有 NodePort 和 ClusterIP，這個結構講清楚，後面就都順了。接著用「層級」解釋為什麼需要 Ingress：Service 在 L4 只認 IP 和 port，每個 LoadBalancer 各佔一個外部 IP 和一台負載平衡器；Ingress 在 L7 能依主機名與路徑分流，讓所有服務共用一個入口並統一管 TLS。實務加分點：ClusterIP 是靠 kube-proxy 的轉發規則才可達、本身 ping 不到；只建 Ingress 沒裝 Controller 是最常見的「完全沒生效」原因，症狀是 ADDRESS 一直空白。最後補上 Ingress 的邊界——非 HTTP 的 TCP／UDP 服務仍然要用 LoadBalancer。

## 講稿

第一件要講清楚的是，這三種型別是疊加上去的，不是三選一。

ClusterIP 是基礎，給一個只有叢集內可達的虛擬 IP。NodePort 在它之上，額外在每個節點開一個高位 port。LoadBalancer 又在 NodePort 之上，額外請雲端配一台負載平衡器和一個外部 IP。所以你建一個 LoadBalancer，底下其實三層都在。

那為什麼還要 Ingress？因為層級不一樣。Service 在 L4 只認 IP 跟 port，而每個 LoadBalancer Service 都各佔一個外部 IP、一台負載平衡器，十個服務就是十份帳單。Ingress 在 L7，能依主機名和路徑分流，所有服務共用一個入口，TLS 也統一處理。

兩個實務細節。ClusterIP 其實是個不存在的 IP，ping 不到，它可達是因為 kube-proxy 在每個節點寫了轉發規則。

還有，Ingress 本身不做事，要有 Controller 讀它才生效。只建 Ingress 沒裝 Controller 是最常見的「設定完全沒反應」，而且不報錯，只會看到 ADDRESS 一直空著。

## 常見追問

### 為什麼 kubectl get ingress 看到 ADDRESS 欄位一直是空的？

**核心答案**：最常見的原因是**叢集裡沒有 Ingress Controller**，或者 Ingress 沒有指定正確的 `ingressClassName`。Ingress 只是一份規則宣告，本身不會產生任何網路設定；ADDRESS 是 Controller 實際配置好代理之後回填的，沒有 Controller 讀它，這個欄位就永遠空著，而且不會有任何錯誤訊息——這正是它難查的原因。

**詳細解析**：排查順序建議是：先確認有沒有 Controller（`kubectl get pods -A | grep ingress`），再確認 `ingressClassName` 有沒有對上（叢集裡可能同時裝了 NGINX 和雲端原生的 Controller，各自只處理自己 class 的 Ingress），最後看 `kubectl describe ingress` 的事件區。在 GKE 上還有一個特有的情況：使用內建的 GCE Ingress 時，Google Cloud Load Balancer 的佈建本身就需要幾分鐘，所以剛建立時 ADDRESS 空白是正常的，要等一下。另一個容易忽略的點是後端 Service 必須是 NodePort 或 LoadBalancer 型別（GCE Ingress 的要求），純 ClusterIP 會讓 Ingress 建不起來。

**面試回答方式**：直接點出 Ingress 是宣告、Controller 才做事，沒有 Controller 就永遠空白且不報錯。給出排查順序：有沒有 Controller、`ingressClassName` 對不對、describe 看事件。加分點是提到 GKE 上 GCLB 佈建本來就要幾分鐘，以及 GCE Ingress 要求後端是 NodePort。

### Service 的 externalTrafficPolicy 設成 Local 和 Cluster 有什麼差別？

**核心答案**：差在流量進到節點後還會不會再跳一次，以及**來源 IP 保不保得住**。預設的 `Cluster` 會讓封包在節點之間再做一次負載平衡，好處是流量分佈均勻，代價是多一跳延遲、而且經過 SNAT 之後後端看到的來源 IP 是節點 IP，不是真實客戶端 IP。設成 `Local` 則只轉給**本節點上的 Pod**，沒有額外跳躍、保留真實來源 IP，但如果某個節點上剛好沒有這個服務的 Pod，打到那個節點的流量就會被丟棄。

**詳細解析**：這個取捨在需要記錄客戶端 IP、或做 IP 白名單、限流的場景特別重要——用預設的 `Cluster`，你的存取日誌會全部變成節點 IP，限流也會誤把整個節點當成同一個客戶端。改成 `Local` 能解決，但必須配合讓 Pod 分佈到每個節點（否則部分節點成為黑洞），雲端負載平衡器的健康檢查也會據此把沒有 Pod 的節點標成不健康而不再送流量過去——這正是 `Local` 能運作的關鍵機制。另一個常見的替代方案是不動這個設定，改由 L7 層取得真實 IP：Ingress Controller 會把客戶端 IP 放進 `X-Forwarded-For` 標頭，應用讀標頭而不是讀 TCP 來源位址。

**面試回答方式**：用「還會不會再跳一次」和「來源 IP 保不保得住」兩個面向切開。強調預設 `Cluster` 會讓日誌與限流全部看到節點 IP，這個後果最具體。講 `Local` 的代價——沒有 Pod 的節點成為黑洞，要靠健康檢查配合。加分點是提出 L7 讀 `X-Forwarded-For` 這個常見替代方案。

### 一個 Service 底下有三個 Pod，流量是怎麼分配的？可以做到 session 黏著嗎？

**核心答案**：預設是**近似隨機**的分配，由 kube-proxy 的規則決定——iptables 模式是機率式的隨機選擇，IPVS 模式則支援輪詢、最少連線等演算法。可以透過 `sessionAffinity: ClientIP` 做到黏著，讓同一個來源 IP 固定導到同一個 Pod，並用 `sessionAffinityConfig` 設定逾時。

**詳細解析**：要注意 `ClientIP` 黏著的可靠度受前面提過的 SNAT 影響——如果流量經過 `externalTrafficPolicy: Cluster` 或某些負載平衡器，kube-proxy 看到的來源 IP 已經不是真實客戶端，那麼「同一個 IP」可能代表一整批不同的使用者，黏著就失去意義甚至造成負載傾斜。另外 L4 的黏著粒度很粗，只能綁 IP，行動網路下使用者 IP 會變、企業網路下大量使用者共用同一個出口 IP，兩種情況都會出問題。所以實務上如果真的需要會話一致性，比較穩健的做法是在 L7 用 cookie 做黏著（Ingress Controller 多半支援），或者更根本地把 session 狀態外部化到 Redis，讓應用真正無狀態——這樣就不需要黏著了。

**面試回答方式**：先講預設近似隨機、以及 iptables 與 IPVS 模式的差別。給出 `sessionAffinity: ClientIP` 這個直接答案，但重點放在它的限制：SNAT 會讓來源 IP 失真、IP 粒度太粗（行動網路會變、企業網路共用）。加分點是給出更穩健的兩條路——L7 cookie 黏著，或把 session 外部化到 Redis 讓應用真正無狀態。

## 相關

- [[006-kube-proxy-vs-coredns.md]]
- [[012-gke-ingress-vs-gateway.md]]
- [[022-networkpolicy.md]]
