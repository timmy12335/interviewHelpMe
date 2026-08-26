---
id: kubernetes-022
category: kubernetes
slug: networkpolicy
title: NetworkPolicy：預設全通的網路要怎麼收斂？
difficulty: medium
tags: [NetworkPolicy, 網路隔離, CNI, 零信任, 安全]
source: original
---

# 題目

K8s 的 Pod 網路預設是什麼行為？NetworkPolicy 怎麼運作？為什麼有人設了 NetworkPolicy 卻完全沒有效果？

## 核心答案

**K8s 的預設是「全通」**——任何 Pod 都能直接連到叢集裡任何其他 Pod，跨 namespace 也一樣，沒有任何限制。這對安全是個大缺口：一個被入侵的前端 Pod 可以直接掃描並連線到資料庫 Pod，namespace 完全擋不住。

**NetworkPolicy 是白名單機制，而且是「選擇性啟用」的**：只要某個 Pod **沒有被任何 NetworkPolicy 選中**，它維持全通；一旦有任何一條 policy 選中它，該方向（Ingress 或 Egress）就變成**預設拒絕，只放行明確列出的來源**。這個「被選中才生效」的語意是理解它的關鍵。

**設了卻沒效果，最常見的原因是 CNI 不支援**——NetworkPolicy 是一份宣告，實際執行由網路外掛負責。Calico、Cilium 支援；如果叢集用的是不支援的 CNI，policy 會被正常建立、`kubectl get` 看得到，但**完全不會生效，也不會有任何警告**。GKE 需要明確啟用網路政策（或使用 Dataplane V2）。

## 詳細解析

**Ingress 與 Egress 要分開想**：一條 policy 的 `policyTypes` 決定它管哪個方向。只寫了 Ingress 規則的 policy 不會影響出向流量。實務上很多人只做入向管控就以為完成了零信任，但被入侵的 Pod 對外連線（回傳資料、下載工具）需要 Egress 規則才擋得住。

**預設拒絕的標準做法**：先在每個 namespace 建立一條選中所有 Pod、但不放行任何來源的 policy（`podSelector: {}` 加空的規則），把預設從全通翻轉成全拒，再逐一加上必要的放行。這個順序很重要——先開再收會漏，先收再開才安全。導入時建議先在非生產環境驗證，或先用只記錄不阻擋的模式觀察。

**別忘了 DNS**：一旦啟用 Egress 的預設拒絕，Pod 連 CoreDNS 都會被擋住，結果是**所有名稱解析失敗**，症狀看起來像是應用壞了而不是網路被擋。每一條 Egress 預設拒絕的 policy 都必須配上允許連到 kube-system 的 DNS 服務（UDP 與 TCP 的 53 埠）。這是導入 Egress 管控最常見的第一個坑。

**選擇器的三種來源**：規則的來源可以是 `podSelector`（同 namespace 的特定 Pod）、`namespaceSelector`（特定 namespace 的所有 Pod）、`ipBlock`（CIDR 網段，用於叢集外的來源）。要注意 `podSelector` 與 `namespaceSelector` 寫在同一個項目裡是 **AND**（那個 namespace 裡的那些 Pod），分成兩個項目則是 **OR**——YAML 縮排差一格語意就完全不同，這是很常見的設定錯誤。

**NetworkPolicy 管不到的東西**：它作用在 L3／L4，只認 IP、port、協定，**無法表達 HTTP 路徑或方法層級的規則**。要做「這個服務只能呼叫那個服務的 GET 端點」這種控制，需要 service mesh 的授權政策。另外它也管不到節點層級的流量與 hostNetwork 的 Pod。

## 面試回答方式

第一句就講預設全通，並給出後果——被入侵的前端可以直接連資料庫，namespace 擋不住。接著解釋 NetworkPolicy「被選中才生效」的語意，這是最容易誤解的地方。「設了沒效果」要直接回答 **CNI 不支援**，並強調它會靜默失敗——policy 建得起來、看得到、就是不生效，沒有任何警告。實務加分點三個：Egress 預設拒絕會擋掉 DNS，症狀像應用壞掉，是導入時第一個坑；`podSelector` 與 `namespaceSelector` 同項目是 AND、分項目是 OR，縮排差一格語意就變；以及它只到 L4，HTTP 層級的授權要靠 service mesh。

## 講稿

K8s 的預設是全通。任何 Pod 都能直接連到叢集裡任何其他 Pod，跨 namespace 也一樣。

這對安全是個明顯缺口。一個被入侵的前端 Pod 可以直接掃描並連到資料庫 Pod，namespace 完全擋不住，因為它不是網路邊界。

NetworkPolicy 是白名單機制，但語意有個關鍵細節：它是選擇性啟用的。某個 Pod 沒有被任何 policy 選中就維持全通。一旦有任何一條選中它，那個方向就翻轉成預設拒絕，只放行明確列出的來源。

至於為什麼有人設了卻沒效果，最常見的原因是 CNI 不支援。NetworkPolicy 只是一份宣告，實際執行要靠網路外掛。如果叢集用的 CNI 不支援，policy 會正常建立、kubectl 看得到，就是不生效，而且沒有任何警告。

導入時有個坑幾乎每個人都會踩。一旦啟用 Egress 的預設拒絕，Pod 連 CoreDNS 都會被擋，所有名稱解析失敗。症狀看起來像應用壞了而不是網路被擋，很容易查錯方向。所以每條 Egress 預設拒絕都必須配上允許連 DNS 的規則。

## 常見追問

### 要怎麼實作「預設拒絕」？

**核心答案**：在每個 namespace 建立一條**選中所有 Pod 但不放行任何來源**的 policy——`podSelector: {}` 選中全部，`policyTypes` 列出 Ingress 與 Egress，規則留空。因為「被選中就翻轉成預設拒絕」，這條 policy 等於把整個 namespace 的網路關閉，接著再逐一加上必要的放行規則。**順序很重要：先收再開，不要先開再收**。

**詳細解析**：實務導入的難點不在寫這條規則，而在**盤點出必要的放行清單**——通常會漏掉 DNS、監控代理抓取指標的路徑、健康檢查（來自節點的 kubelet）、以及對外部服務的呼叫。建議的做法是先在測試環境套用預設拒絕，觀察什麼壞掉並逐一補上，或者先用可觀測的方式收集實際的連線關係（Cilium 的 Hubble 這類工具可以視覺化 Pod 之間的實際流量）再據此產生規則。切忌在生產環境直接套用預設拒絕再慢慢修，那會造成大規模中斷。另外要記得 NetworkPolicy 是 namespace 層級的資源，新建的 namespace 不會自動繼承，需要用政策工具或 namespace 範本確保每個新 namespace 都套用了基準規則。

**面試回答方式**：給出 `podSelector: {}` 加空規則這個具體寫法，並解釋為什麼它等於關閉網路。重點放在**先收再開**的順序原則。加分點是講盤點放行清單才是真正的難點（DNS、監控、健康檢查、外部呼叫），並給出用流量觀測工具產生規則的做法，以及提醒新 namespace 不會自動繼承。

### 啟用 NetworkPolicy 之後，應用突然報 DNS 解析失敗，為什麼？

**核心答案**：因為 **Egress 的預設拒絕把往 CoreDNS 的流量也擋掉了**。Pod 要解析任何名稱都必須先連到 kube-system 裡的 DNS 服務，一旦出向被預設拒絕而沒有放行 DNS，所有名稱解析都會失敗——包括連叢集內部的 Service。症狀是應用報 no such host 或連線逾時，很容易被誤判成應用程式的問題。

**詳細解析**：修正方式是加一條 Egress 規則，放行往 kube-system namespace 的 DNS Pod、**UDP 與 TCP 的 53 埠都要**（大型回應會退回用 TCP，只開 UDP 會造成間歇性失敗，這種偶發性問題更難查）。實作上通常用 `namespaceSelector` 選中 kube-system 再用 `podSelector` 選中 DNS 的標籤。要注意如果叢集啟用了 NodeLocal DNSCache，Pod 實際查詢的目標是節點上的本地位址而不是 DNS Service 的 ClusterIP，規則要對應調整，否則一樣會被擋。這也是為什麼建議把「允許 DNS」做成每個 namespace 都會套用的基準規則，而不是每次想到才加。

**面試回答方式**：直接指出是 Egress 預設拒絕擋掉了 DNS，並強調症狀像應用壞掉、容易查錯方向。給出修正方式並特別點出 **UDP 與 TCP 53 都要開**——只開 UDP 造成的間歇性失敗更難查。加分點是提到 NodeLocal DNSCache 會改變查詢目標，以及建議把允許 DNS 做成基準規則。

### NetworkPolicy 和 service mesh 的授權政策差在哪？該用哪個？

**核心答案**：**層級不同**。NetworkPolicy 作用在 **L3／L4**，只能表達「哪些 Pod 可以連到哪些 Pod 的哪個 port」。service mesh 的授權政策作用在 **L7**，能表達 HTTP 方法、路徑、標頭，甚至基於**工作負載身分**（mTLS 憑證）而非 IP 來授權——例如「只有訂單服務可以呼叫支付服務的 POST /charge」。

**詳細解析**：兩者不是二選一，而是**縱深防禦的兩層**。NetworkPolicy 在網路層提供基礎隔離，成本低、沒有額外的延遲、不依賴應用感知；service mesh 提供細粒度授權與加密傳輸，代價是每個 Pod 多一個 sidecar（記憶體與延遲開銷）、以及整體維運複雜度明顯上升。實務建議是**先做好 NetworkPolicy**——它是基礎且投入產出比高；只有在真的需要 L7 授權、mTLS、或流量治理（重試、熔斷、金絲雀）時才引入 mesh。常見的錯誤是為了「零信任」直接上 mesh 卻沒有做 NetworkPolicy，結果 sidecar 被繞過（例如攻擊者直接連 Pod IP 而非透過 mesh）時就完全沒有防護。兩層都有，才是真正的縱深。

**面試回答方式**：用「層級」切開兩者，並給出 L7 授權的具體例子（只有訂單服務能呼叫支付服務的某個端點）。重點是**不是二選一而是兩層**。給出實務建議的順序——先做 NetworkPolicy 因為投入產出比高，需要 L7 或 mTLS 才上 mesh。加分點是指出只上 mesh 不做 NetworkPolicy 的漏洞：sidecar 被繞過就沒有防護。

## 相關

- [[005-service-types-vs-ingress.md]]
- [[006-kube-proxy-vs-coredns.md]]
- [[020-namespace-quota-limitrange.md]]
