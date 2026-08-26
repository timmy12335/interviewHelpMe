---
id: kubernetes-020
category: kubernetes
slug: namespace-quota-limitrange
title: Namespace、ResourceQuota 與 LimitRange 的資源治理
difficulty: easy
tags: [Namespace, ResourceQuota, LimitRange, 資源治理, 多租戶]
source: original
---

# 題目

Namespace 提供了什麼隔離？ResourceQuota 和 LimitRange 差在哪？多團隊共用一個叢集時該怎麼劃分？

## 核心答案

**Namespace 是「命名與管理」的邊界，不是安全邊界**。它提供的是：資源名稱的作用域（不同 namespace 可以有同名的 Service）、RBAC 授權的範圍、以及 ResourceQuota 的套用單位。它**預設不提供網路隔離**——不同 namespace 的 Pod 彼此可以自由通訊，要隔離必須另外用 NetworkPolicy。

**ResourceQuota 管的是「這個 namespace 總共能用多少」**——CPU、記憶體的 requests 與 limits 總量、Pod／Service／PVC 的物件數量上限。它是**團隊層級的天花板**。

**LimitRange 管的是「單一個 Pod 或容器的範圍」**——最小值、最大值，以及**沒設定時的預設值**。它是**個體層級的約束**。

兩者常常必須搭配：一旦設定了 ResourceQuota 限制 CPU 總量，該 namespace 裡**沒有設定 requests 的 Pod 會直接被拒絕建立**（因為無法計入配額）。這時 LimitRange 提供預設值就成了必要配套，否則所有沒寫資源設定的 YAML 都會突然失敗。

## 詳細解析

**Namespace 不是安全邊界的具體含義**：能在某個 namespace 建立 Pod 的人，可以掛載該 namespace 的任何 Secret 並把內容印出來，也可以指定使用該 namespace 的任何 ServiceAccount。所以真正的隔離取決於「誰能在這個 namespace 建立工作負載」。多租戶場景下，如果租戶之間互不信任，多個叢集的隔離強度遠高於同叢集多 namespace。

**ResourceQuota 的連鎖效應**：設定配額之後，該 namespace 的所有 Pod 都必須明確宣告資源，否則建立失敗。這個變化對既有工作負載是破壞性的——導入配額前應該先確認所有 YAML 都有資源設定，或同時部署 LimitRange 提供預設值。這是導入資源治理時最常見的翻車點。

**LimitRange 的預設值是「補上」不是「覆蓋」**：它只對沒有設定的欄位生效，已經寫了值的容器不受影響（但仍受最大最小值約束）。所以它適合當作安全網，防止有人忘記設定資源就把 Pod 丟進來。

**配額也能限制物件數量**：除了運算資源，ResourceQuota 可以限制 Pod、Service、ConfigMap、PVC 的數量，甚至限制 LoadBalancer 型別的 Service 數量——後者很實用，因為每個 LoadBalancer 都是實在的雲端費用。也可以限制儲存總量，避免單一團隊佔滿磁碟配額。

**namespace 的劃分策略**：常見的切法有按團隊、按環境（dev／staging／prod）、按應用。實務上建議**至少讓有狀態與無狀態分開**，因為刪除 namespace 是常見的清理動作，而有狀態的 PVC 在 `Delete` 回收策略下會連資料一起消失。環境之間則強烈建議用不同叢集而非不同 namespace——生產環境和測試環境共用控制平面，一次誤操作的影響範圍太大。

## 面試回答方式

第一句就要點出 **Namespace 不是安全邊界**，這是最常被誤解的地方，並具體說明為什麼——能建立 Pod 就能讀該 namespace 的 Secret。接著用「總量 vs 個體」切開 ResourceQuota 與 LimitRange。一定要講出兩者的搭配關係：設了 ResourceQuota 之後沒寫資源的 Pod 會被拒絕，所以 LimitRange 提供預設值是必要配套——這是導入資源治理最常見的翻車點。實務加分點：ResourceQuota 也能限制 LoadBalancer 數量（直接對應雲端費用）；有狀態與無狀態應該分不同 namespace，因為刪 namespace 會連 PVC 資料一起消失；以及環境隔離該用不同叢集而非不同 namespace。

## 講稿

先講一個最常被誤解的點：Namespace 不是安全邊界。

它提供的是命名與管理的邊界——資源名稱的作用域、RBAC 授權的範圍、ResourceQuota 的套用單位。但它預設不提供網路隔離，不同 namespace 的 Pod 可以自由通訊。

更關鍵的是，能在某個 namespace 建立 Pod 的人，就可以掛載該 namespace 的任何 Secret 再印出來。所以真正的隔離邊界是誰能在這裡建工作負載，不只是誰能讀資源。

ResourceQuota 跟 LimitRange 的差別是總量對個體。前者管這個 namespace 總共能用多少，是團隊層級的天花板。後者管單一 Pod 或容器的範圍，還有沒設定時的預設值。

兩者常常必須一起用。一旦設了 ResourceQuota 限制 CPU 總量，該 namespace 裡沒設 requests 的 Pod 會直接被拒絕建立，因為無法計入配額。所以導入配額時若沒同時部署 LimitRange 提供預設值，所有沒寫資源設定的 YAML 都會突然失敗。這是導入資源治理最常翻車的地方。

## 常見追問

### 導入 ResourceQuota 之後，為什麼原本好好的 Deployment 突然建不出 Pod？

**核心答案**：因為 ResourceQuota 一旦限制了 CPU 或記憶體，該 namespace 裡**所有 Pod 都必須明確宣告對應的 requests 與 limits**，否則 apiserver 無法把它計入配額，會直接拒絕建立。原本沒有寫資源設定的 Deployment 就會開始失敗——而且症狀在 ReplicaSet 層級，`kubectl get pods` 看不到任何 Pod，要 `describe` ReplicaSet 才會看到 `FailedCreate` 的錯誤訊息。

**詳細解析**：這個症狀的難查之處在於**錯誤不在 Deployment 上**。Deployment 顯示副本數不足，但沒有 Pod 可以 describe，很多人會卡在這裡。正確的排查路徑是 `kubectl describe rs` 或看 namespace 的事件。解法有兩條：一是同時部署 LimitRange 提供預設的 requests 與 limits，讓沒寫的 Pod 自動被補上；二是修改所有工作負載明確宣告資源。實務上建議兩者都做——LimitRange 當安全網，同時逐步讓各團隊明確設定，因為預設值終究只是猜測，明確設定才能反映真實需求。導入順序上，應該先部署 LimitRange，再啟用 ResourceQuota。

**面試回答方式**：先解釋因果——有配額就必須能計入，沒宣告資源就無法計入。重點放在**症狀難查**：錯誤在 ReplicaSet 層級不在 Deployment，`get pods` 看不到東西。給出兩條解法並強調正確的導入順序是先 LimitRange 再 ResourceQuota。

### 多團隊共用一個叢集，namespace 隔離夠嗎？

**核心答案**：**看團隊之間互不互相信任**。如果是同一個組織內部、彼此信任的團隊，namespace 加上 RBAC、ResourceQuota、NetworkPolicy 通常夠用，成本效益也最好。但如果租戶之間**互不信任**（例如對外提供服務、或有法規要求的隔離），namespace 的隔離強度不足——共用控制平面、共用節點核心，容器逃逸或誤設定的影響會跨越 namespace。這時應該用**多個叢集**。

**詳細解析**：namespace 隔離的具體缺口有幾個：節點是共用的，所以吵鬧的鄰居仍會影響效能，除非用節點親和把團隊釘在不同節點池；核心是共用的，容器逃逸漏洞會影響同節點的所有工作負載；CRD 與許多控制器是叢集層級的，一個團隊安裝的 Operator 可能影響全叢集；叢集層級的資源（ClusterRole、PV、StorageClass）本來就跨 namespace。加強的手段包括 Pod Security 標準、每個團隊專屬節點池、嚴格的 NetworkPolicy 預設拒絕、以及限制誰能建立叢集層級資源。但這些加總起來的維運複雜度，往往已經接近直接開多個叢集——所以判準是先問信任模型，再算成本。

**面試回答方式**：用「互不互相信任」當判準回答，不要一概而論。列出 namespace 隔離的具體缺口：共用節點與核心、叢集層級資源跨 namespace、Operator 影響全叢集。加分點是指出加強手段的維運複雜度往往接近直接開多叢集，所以要先問信任模型再算成本。

### ResourceQuota 限制的是 requests 還是 limits？

**核心答案**：**兩者都可以，而且意義完全不同**。限制 `requests.cpu` 與 `requests.memory` 管的是**保證配置的總量**，直接對應這個 namespace 在叢集裡佔掉的排程額度；限制 `limits.cpu` 與 `limits.memory` 管的是**允許突發到的上限總和**。實務上通常兩者都設，因為只設 requests 會讓團隊把 limits 開得很大而影響鄰居，只設 limits 則無法控制實際佔掉的排程空間。

**詳細解析**：兩者的比值其實表達了一種**超賣策略**。requests 總和決定叢集必須實際保留多少資源，limits 總和則是理論上的最大用量——允許 limits 總和大於 requests 總和，等於賭「不會所有工作負載同時衝到上限」，這在多數場景是合理的，因為峰值不會同時發生。比值設多少取決於工作負載的特性與你能承受的風險。要注意配額計算用的是**已建立物件的宣告值**而非實際用量，所以一個 request 很高卻閒置的 Pod 一樣佔滿配額——這也是為什麼要求團隊把 requests 設得誠實，不只是為了排程準確，也是為了不浪費自己的配額。另外 GKE Autopilot 因為按 request 計費，配額管理與成本管理在那裡幾乎是同一件事。

**面試回答方式**：回答兩者都可以，並用「保證配置 vs 突發上限」區分意義。重點放在兩者的比值代表超賣策略——允許 limits 總和大於 requests 總和是在賭峰值不同時發生。加分點是指出配額算的是宣告值不是實際用量，所以 requests 設太高是在浪費自己的配額。

## 相關

- [[007-configmap-vs-secret.md]]
- [[009-requests-limits-qos-oomkilled.md]]
- [[021-rbac-serviceaccount-workload-identity.md]]
