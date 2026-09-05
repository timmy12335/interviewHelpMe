---
id: kubernetes-012
category: kubernetes
slug: gke-ingress-vs-gateway
title: GKE Ingress、LoadBalancer Service 與 Gateway API 的取捨
difficulty: hard
tags: [GKE, Ingress, Gateway API, LoadBalancer, GCLB, 網路]
source: original
---

# 題目

在 GKE 上把服務對外，可以用 LoadBalancer Service、Ingress 或 Gateway API。三者各自適合什麼場景？Gateway API 想解決 Ingress 的什麼問題？

## 核心答案

**LoadBalancer Service** 工作在 **L4**，把一個 Service 直接映射到一台雲端負載平衡器與一個外部 IP。**優點是支援任意 TCP／UDP 協定**（資料庫、遊戲伺服器、MQTT），缺點是每個服務各佔一個 IP 與一台 LB，數量一多成本與管理都很難看。

**Ingress** 工作在 **L7**，讓多個服務共用一個入口，依主機名與路徑分流並統一處理 TLS。在 GKE 上它會被翻譯成 Google Cloud Load Balancer。問題是 Ingress 的規範能表達的東西太少——重試、逾時、流量權重切分、標頭改寫這些常見需求都不在規範裡，各家 Controller 只能用**廠商專屬的 annotation** 各自實作，結果是設定完全無法跨環境移植，而且一份 Ingress 資源同時混雜了平台團隊與應用團隊該管的東西。

**Gateway API** 是為了解決這兩件事而生的後繼者：它把設定拆成**角色分明的多層資源**——`GatewayClass`（基礎設施提供者定義）、`Gateway`（平台團隊管入口與憑證）、`HTTPRoute`／`TCPRoute` 等（應用團隊管自己的路由），並把權重切分、標頭操作、跨命名空間授權這些能力**寫進規範本身**而不是 annotation。它也不再限於 HTTP，能表達多種協定。

## 詳細解析

**Ingress 的 annotation 問題有多實際**：同一份 Ingress 從 NGINX Ingress 搬到 GKE 內建的 GCE Ingress，幾乎所有 annotation 都要重寫——逾時、後端協定、健康檢查路徑、憑證來源各家寫法都不同。這讓「換 Ingress Controller」變成一次不小的遷移，也讓多雲部署難以共用設定。

**角色分離是 Gateway API 最實質的改進**：Ingress 把 TLS 憑證、主機名、路由規則全部塞在同一份 YAML，代表應用團隊要改一條路徑就得碰到憑證設定，平台團隊也難以劃出安全邊界。Gateway API 讓平台團隊擁有 `Gateway`（含憑證與監聽器），應用團隊只提交 `HTTPRoute` 並綁到那個 Gateway 上，而且 Gateway 可以明確宣告**允許哪些命名空間掛上來**，這是 Ingress 做不到的授權表達。

**GKE 上三者的實際對應**：LoadBalancer Service 對應 L4 的網路負載平衡器；Ingress 與 Gateway 都會產出 L7 的應用程式負載平衡器。GKE 的 Gateway Controller 是託管的，還支援**多叢集 Gateway**——把跨區域多個叢集放在同一個入口後面做全域流量分配，這用 Ingress 是做不到的。

**container-native load balancing 值得知道**：GKE 支援透過 NEG（Network Endpoint Group）讓負載平衡器**直接把流量送到 Pod IP**，而不是先到 NodePort 再由 kube-proxy 轉一次。少一跳能降低延遲，健康檢查也直接針對 Pod，故障感知更快。這對 Ingress 與 Gateway 都適用，是 GKE 上該預設開啟的優化。

**不要為了新而換**：Gateway API 在功能上是超集，但它更複雜、資源更多，小型叢集只有幾條簡單路由時 Ingress 反而更省事。合理的判準是——**有沒有遇到 Ingress 表達不了的需求**（流量權重切分、跨命名空間授權、多叢集入口、非 HTTP 協定），有才換。

## 面試回答方式

用「工作層級」開場把三者排開：LoadBalancer 在 L4 支援任意協定但每個服務各佔一個 IP；Ingress 在 L7 讓多服務共用入口。接著把重點放在 **Gateway API 想解決什麼**，這才是這題的深度所在——兩件事：Ingress 規範表達力不足導致設定全靠廠商 annotation、無法移植；以及所有東西塞在同一份 YAML，平台團隊與應用團隊的職責混在一起。說明 Gateway API 用多層資源做角色分離，並把能力寫進規範。GKE 特有加分點：Gateway 支援多叢集入口、以及 container-native load balancing 用 NEG 直送 Pod IP 少一跳。最後給出取捨判準——沒遇到 Ingress 表達不了的需求就不必換。

## 講稿

先用工作層級把三個排開。

LoadBalancer Service 在 L4，一個 Service 映射一台雲端負載平衡器跟一個外部 IP。好處是支援任意 TCP、UDP 協定。壞處是每個服務各佔一個 IP 跟一台 LB，數量一多成本很難看。Ingress 在 L7，多個服務共用一個入口，依主機名跟路徑分流，TLS 統一處理。

那 Gateway API 想解決 Ingress 的什麼問題？我覺得有兩件。

第一是表達力不足。重試、逾時、流量權重切分，這些常見需求 Ingress 規範裡都沒有，各家 Controller 只能用自己的 annotation 實作。結果是設定不能移植，從 NGINX 換到 GCE Ingress 幾乎每個 annotation 都要重寫。

第二是職責混在一起。Ingress 把憑證、主機名、路由規則全塞在同一份 YAML，應用團隊改一條路徑就得碰憑證設定。Gateway API 把它拆開，平台團隊管 Gateway 跟憑證，應用團隊只提交 HTTPRoute 綁上去。

不過也不必為了新而換。判準是有沒有遇到 Ingress 表達不了的需求。

## 常見追問

### 什麼是 container-native load balancing？為什麼建議開？

**核心答案**：預設情況下雲端負載平衡器把流量送到**節點的 NodePort**，再由 kube-proxy 在節點上轉發到某個 Pod——可能還要跨節點再跳一次。container-native load balancing 透過 **NEG（Network Endpoint Group）** 讓負載平衡器**直接認識 Pod IP**，流量從 LB 一步送到目標 Pod。好處是**少一跳延遲**、**健康檢查直接針對 Pod**（故障感知更快更準）、以及**負載分佈更均勻**（不再受節點層級的二次轉發影響）。

**詳細解析**：少的那一跳在尾端延遲上很有感，尤其跨可用區時。健康檢查的差異更關鍵——走 NodePort 時 LB 檢查的是節點，節點健康不代表上面的 Pod 健康，於是流量可能被送到一個節點後才發現沒有可用的 Pod；直接對 Pod 檢查就沒有這層落差，Pod 未就緒時 LB 立刻停止送流量，滾動更新期間的錯誤率明顯下降。另外它也讓 `externalTrafficPolicy` 那組取捨變得沒有必要——不再有 SNAT 造成的來源 IP 失真，也不需要為了保留來源 IP 而讓沒有 Pod 的節點變成黑洞。在 GKE 上使用 VPC 原生叢集時，這通常是預設或只需一個 annotation 就能啟用。

**面試回答方式**：用「LB 送到哪裡」把兩種模式對比清楚——NodePort 再轉一次 vs 直達 Pod IP。三個好處要具體：少一跳延遲、健康檢查直接對 Pod 所以滾動更新錯誤率降低、負載更均勻。加分點是指出它讓 `externalTrafficPolicy` 的取捨變得不必要。

### 用 Gateway API 要怎麼做金絲雀發布？

**核心答案**：用 `HTTPRoute` 的**權重**。同一條路由規則可以指向多個 `backendRefs`，各自帶 `weight`——例如 stable 服務 95、canary 服務 5，流量就按比例分配。要推進就改權重，出問題就把 canary 權重歸零。這是**規範內建**的能力，不需要任何廠商專屬 annotation，這正是 Gateway API 相對 Ingress 的具體價值。

**詳細解析**：除了權重，`HTTPRoute` 也支援依**標頭比對**分流，可以做到「帶特定標頭的內部測試流量才走新版」，適合上線前的定向驗證。相比之下用 Ingress 做金絲雀，各家 Controller 的做法完全不同——NGINX Ingress 要用 `canary` 系列 annotation 並額外建一份 Ingress，GCE Ingress 則幾乎做不到，只能退回用兩個 Service 加外部流量分配。實務上還要注意權重分配是**無狀態**的，同一個使用者的連續請求可能一下走 stable、一下走 canary，若新舊版本的行為不相容會造成困惑，這時要搭配標頭或 cookie 的黏著。另外光靠流量切分不夠，要配合指標觀察（錯誤率、延遲）才能決定推進或回滾，成熟的做法會用 Argo Rollouts 這類工具把「切流量、看指標、自動決策」串成一條流程。

**面試回答方式**：直接給 `backendRefs` 加 `weight` 這個答案，並強調它是規範內建、不需要 annotation——這句話才是重點。對比 Ingress 各家做法不一致。加分點有兩個：標頭比對可做定向驗證；以及權重分配無狀態，行為不相容時要配合黏著，而且要搭配指標觀察才算完整的金絲雀。

### 一個服務要同時對外提供 HTTP 和 gRPC，該怎麼設計？

**核心答案**：**gRPC 建立在 HTTP/2 之上**，所以 L7 負載平衡器可以處理，但必須讓後端協定被正確識別——在 GKE 上要透過 `BackendConfig` 或 Service 的 annotation 指定後端使用 HTTP/2，否則 LB 會用 HTTP/1.1 連後端，gRPC 直接不通。用 Gateway API 的話，`GRPCRoute` 是規範內建的資源型別，比 Ingress 靠 annotation 表達乾淨得多。

**詳細解析**：這裡有一個容易忽略的坑：**gRPC 是長連線**，而 L7 負載平衡是**以連線為單位**分配的。一個客戶端建立連線後，後續所有請求都走同一條連線到同一個後端 Pod，於是擴容之後新 Pod 拿不到既有客戶端的流量，負載嚴重傾斜。解法通常是在客戶端啟用 gRPC 的負載平衡（配合 headless Service 直接取得所有 Pod IP），或引入 service mesh 在 L7 做**每個請求**的負載平衡，或設定連線最大存活時間強迫客戶端定期重連。另外 TLS 終止的位置也要想清楚——在 LB 終止最單純，但如果需要端到端加密，就要讓後端也走 TLS 並正確設定憑證信任。

**面試回答方式**：先講 gRPC 是 HTTP/2、L7 LB 可以處理，但要明確指定後端協定，否則不通——這是最常踩的坑。提到 `GRPCRoute` 是 Gateway API 的內建型別。加分點是長連線導致的負載傾斜問題，並給出三種解法（客戶端負載平衡、service mesh、限制連線存活時間）。

## 相關

- [[005-service-types-vs-ingress.md]]
- [[011-gke-standard-vs-autopilot.md]]
- [[022-networkpolicy.md]]
