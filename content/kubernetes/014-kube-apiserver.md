---
id: kubernetes-014
category: kubernetes
slug: kube-apiserver
title: kube-apiserver 處理一個請求會經過哪些階段？
difficulty: medium
tags: [kube-apiserver, 認證, 授權, Admission, 控制平面]
source: original
---

# 題目

一個 `kubectl apply` 送到 kube-apiserver 之後，在真正寫進 etcd 之前經過哪些階段？為什麼所有元件都要透過它？

## 核心答案

請求會依序經過四個階段：**認證（Authentication）→ 授權（Authorization）→ Admission 控制 → 寫入 etcd**。

**認證**回答「你是誰」——驗證憑證、Token 或 ServiceAccount，得出一個身分；**授權**回答「你能不能做這件事」——主要由 RBAC 判斷這個身分對這個資源的這個動作有沒有權限；**Admission 控制**回答「這個請求本身合不合規」，又分兩段：**Mutating**（可以改寫請求內容，例如自動注入 sidecar、補上預設資源設定）先跑，**Validating**（只能放行或拒絕，不能改）後跑；全部通過後才做 schema 驗證並**寫入 etcd**。

**所有元件都經過它的原因**是把 etcd 保護在單一入口之後：認證、授權、准入、驗證、稽核**只需要實作一次**。如果 scheduler、kubelet、controller 各自直連 etcd，每一個都得自己實作這些控制，而且任何一個有漏洞就等於整個叢集被攻破。這也讓 apiserver 成為唯一需要嚴密防護的攻擊面，以及唯一的稽核點。

## 詳細解析

**Mutating 在前、Validating 在後的原因**：如果順序反過來，先驗證再改寫，改寫後的結果就沒有被驗證過，等於留了一個繞過檢查的後門。先改後驗才能保證「最終寫進 etcd 的內容」一定通過了所有驗證。

**Admission webhook 是擴充點也是風險點**：許多平台能力都建立在這裡——service mesh 自動注入 sidecar、政策引擎（OPA Gatekeeper、Kyverno）強制執行規則、GKE Autopilot 自動補上資源設定。但 webhook 是**同步呼叫外部服務**，`failurePolicy` 設成 `Fail` 時，webhook 服務掛掉會讓相關的 API 請求全部失敗——曾經有叢集因為一個 webhook 不可用而完全無法部署任何東西。設定時要謹慎選擇 `failurePolicy`，並用 `namespaceSelector` 把 webhook 的作用範圍縮小，特別是排除 kube-system。

**watch 讓 apiserver 成為事件中樞**：控制器與 kubelet 不輪詢，而是建立長連線 watch 感興趣的資源。這代表 apiserver 要同時維持大量長連線並推播變更，是控制平面最吃資源的元件。大型叢集的 apiserver 通常需要水平擴充多個副本，並在前面放負載平衡器。

**樂觀併發靠 resourceVersion**：每個物件都帶一個 `resourceVersion`，更新時 apiserver 會比對——版本不符代表物件已被別人改過，回傳衝突錯誤。這就是為什麼控制器的標準寫法是「取得、修改、送出，衝突就重試」。理解這點也就理解了為什麼 `kubectl apply` 偶爾會出現 conflict 而重試就好。

**API 版本與 CRD 都在這一層**：apiserver 也負責處理 API 群組與版本轉換，並透過 aggregation layer 與 CRD 讓使用者擴充新的資源型別——擴充的資源同樣享有認證、授權、admission 這整套機制，這是 K8s 擴充性的基礎。

## 面試回答方式

先把四個階段依序講出來，這是骨架——認證、授權、Admission、寫入 etcd。接著解釋 Mutating 在前 Validating 在後的**原因**：反過來的話改寫的結果沒被驗證，等於留後門。回答「為什麼都要經過它」時，重點放在**控制只實作一次**與**單一稽核點**，並指出各元件直連 etcd 會讓每一個都變成攻擊面。實務加分點：Admission webhook 是同步呼叫外部服務，`failurePolicy: Fail` 加上 webhook 掛掉會讓整個叢集無法部署，這是真實發生過的事故；以及 `resourceVersion` 的樂觀併發解釋了 conflict 錯誤與重試模式。

## 講稿

一個請求進到 apiserver 之後會經過四個階段。

認證先回答你是誰。授權接著回答你能不能做這件事，主要由 RBAC 判斷。然後是 Admission 控制，回答這個請求本身合不合規。全部通過才寫進 etcd。

Admission 又分兩段，順序很關鍵。Mutating 先跑，可以改寫請求內容，比如自動注入 sidecar、補上預設資源設定。Validating 後跑，只能放行或拒絕，不能改。

為什麼是這個順序？因為反過來的話，先驗證再改寫，改寫後的結果就沒被驗證過，等於留了一個繞過檢查的後門。先改後驗才能保證最終寫進 etcd 的內容一定通過了所有檢查。

至於為什麼所有元件都要經過 apiserver，核心是把 etcd 保護在單一入口後面，認證、授權、准入、稽核只需要實作一次。各自直連的話，任何一個有漏洞就等於整個叢集被攻破。

有個坑值得提。Admission webhook 是同步呼叫外部服務，failurePolicy 設成 Fail 而 webhook 掛了，相關請求會全部失敗。真的有叢集因此完全無法部署任何東西。

## 常見追問

### 為什麼有時候 kubectl apply 會出現 conflict 錯誤？

**核心答案**：因為 apiserver 使用 **`resourceVersion` 做樂觀併發控制**。每個物件都帶著一個版本號，更新時 apiserver 會比對你送來的版本與 etcd 裡的現況——如果不符，代表在你讀取之後有別人改過這個物件，apiserver 就回傳衝突錯誤而不是覆蓋掉對方的修改。重試通常就會成功，因為重試會先重新讀取最新版本。

**詳細解析**：這在 K8s 裡非常常見，因為同一個物件往往有多個寫入者——你的 `kubectl`、HPA 在改副本數、各種 controller 在更新 status、admission webhook 在補欄位。所以「取得、修改、送出，衝突就重試」是所有控制器的標準寫法。理解這點也就理解了為什麼不建議用 `kubectl edit` 或直接 `replace` 去改由控制器管理的欄位——你會和控制器互相覆蓋。正確做法是改動來源（例如改 Deployment 而不是改它產生的 ReplicaSet），或使用 `kubectl patch` 只送出要改的欄位。Server-Side Apply 進一步用欄位所有權的概念解決多寫入者問題，記錄每個欄位是誰設定的，衝突時能明確指出是哪個管理者在爭奪。

**面試回答方式**：解釋樂觀併發與 `resourceVersion` 的比對機制，強調它是在保護別人的修改不被覆蓋。點出多寫入者是常態（kubectl、HPA、controller、webhook）。加分點是引申到實務建議——不要直接改控制器管理的資源，以及 Server-Side Apply 用欄位所有權解決這個問題。

### Admission webhook 掛掉會發生什麼事？

**核心答案**：取決於 `failurePolicy`。設成 **`Fail`**（預設）時，webhook 無法回應會讓所有落在它作用範圍內的 API 請求被拒絕——如果範圍沒設好，可能導致整個叢集無法建立任何 Pod，連修復用的部署都送不出去。設成 **`Ignore`** 則是 webhook 失敗時放行請求，代價是那份政策在故障期間完全失效。

**詳細解析**：這是一個安全與可用性的直接衝突，沒有普遍正確的答案，要看 webhook 的職責。負責**安全強制**的（例如禁止 privileged 容器）通常該用 `Fail`，因為放行等於開了洞；負責**便利性**的（例如自動注入 sidecar）用 `Ignore` 比較合理，注入失敗頂多少了個 sidecar。無論選哪個，都必須用 `namespaceSelector` 或 `objectSelector` 把作用範圍縮到最小，**特別要排除 kube-system**——否則 webhook 掛掉時連控制平面元件都可能無法重建，形成無法自我修復的死結。另外 webhook 服務本身應該多副本、有健康檢查，並且不要把它部署成依賴自己才能啟動的循環結構。

**面試回答方式**：用 `failurePolicy` 兩個值分岔回答，並點出 `Fail` 可能導致整個叢集無法部署這個具體後果。接著給判準——安全類用 `Fail`、便利類用 `Ignore`。加分點是強調一定要用 selector 縮小範圍並排除 kube-system，避免形成無法自我修復的死結。

### apiserver 是無狀態的嗎？可以水平擴充嗎？

**核心答案**：**是無狀態的，可以水平擴充**。所有狀態都在 etcd，apiserver 自己不保存資料，所以可以跑多個副本並放在負載平衡器後面，這也是高可用控制平面的標準做法。不過「無狀態」是指持久狀態——它仍然要維持大量 **watch 長連線**與快取，記憶體用量與連線數高度相關。

**詳細解析**：擴充 apiserver 能解決請求併發的問題，但**不能解決 etcd 的瓶頸**——所有寫入最終都要經過 Raft 落盤，加再多 apiserver 副本也不會讓 etcd 變快。所以大型叢集的優化重點通常在減少對 etcd 的壓力：避免高頻更新的物件、清理不需要的資源、用 watch 而不是輪詢、對讀取多的場景善用 apiserver 的快取。另外 watch 連線在 apiserver 重啟時會全部斷開並由客戶端重連，多副本時要注意重連風暴——所有 controller 同時重建 watch 會造成瞬間負載尖峰。在 GKE 這類託管環境，控制平面的擴充由平台自動處理，使用者感受到的通常只有 API 的速率限制。

**面試回答方式**：直接回答無狀態、可水平擴充，並補充「無狀態指的是持久狀態，watch 連線與快取仍然吃記憶體」。重點放在擴充 apiserver 不能解決 etcd 瓶頸這個關鍵區分。加分點是給出減少 etcd 壓力的方向，以及提到 GKE 上這件事由平台處理、使用者感受到的是 API 速率限制。

## 相關

- [[013-etcd.md]]
- [[023-admission-controller.md]]
- [[021-rbac-serviceaccount-workload-identity.md]]
