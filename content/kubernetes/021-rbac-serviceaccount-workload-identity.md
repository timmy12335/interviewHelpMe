---
id: kubernetes-021
category: kubernetes
slug: rbac-serviceaccount-workload-identity
title: RBAC、ServiceAccount 與 GKE Workload Identity
difficulty: hard
tags: [RBAC, ServiceAccount, Workload Identity, GKE, 權限, 安全]
source: original
---

# 題目

Role 和 ClusterRole 差在哪？ServiceAccount 是給誰用的？Pod 要存取 GCP 服務時，為什麼建議用 Workload Identity 而不是把服務帳號金鑰塞進 Secret？

## 核心答案

**RBAC 由四個資源組成**：`Role`／`ClusterRole` 定義**能做什麼**（對哪些資源的哪些動作），`RoleBinding`／`ClusterRoleBinding` 定義**誰能做**（把角色綁到使用者、群組或 ServiceAccount）。差別在**作用範圍**：`Role` 屬於單一 namespace，`ClusterRole` 是叢集層級——後者用於跨 namespace 的權限，以及 Node、PV、StorageClass 這類本來就沒有 namespace 的資源。

一個容易混淆的組合是 **ClusterRole 搭配 RoleBinding**：這會讓那個 ClusterRole 的權限**只在該 namespace 生效**，實務上很常用——定義一次通用的「唯讀」ClusterRole，再用 RoleBinding 綁到各個 namespace。

**ServiceAccount 是給 Pod 用的身分**（人類使用者由外部身分系統提供）。每個 Pod 都會有一個，沒指定就用該 namespace 的 `default`。

**Workload Identity 解決的是「Pod 怎麼安全存取 GCP 服務」**：傳統做法是產生服務帳號的 JSON 金鑰、放進 Secret 掛給 Pod——這等於**製造了一個長期有效、可被複製、難以輪替、外洩後難以察覺的憑證**。Workload Identity 讓 K8s 的 ServiceAccount 直接對應到 GCP 服務帳號，Pod 取得的是**短期自動輪替的權杖**，完全不需要金鑰檔存在。

## 詳細解析

**RBAC 只做加法，沒有拒絕規則**：權限是所有綁定的聯集，沒有「deny」可以扣回來。所以權限設計必須從最小開始逐步加，而不是給了大權再想辦法限縮。要表達「禁止」得靠 Admission 政策（OPA Gatekeeper、Kyverno）而不是 RBAC。

**default ServiceAccount 是常見的疏忽**：不指定 ServiceAccount 的 Pod 會自動使用 `default`，而且預設會把它的權杖掛進容器。雖然 `default` 本身通常沒什麼權限，但這個權杖可以用來呼叫 apiserver，是容器被入侵後橫向移動的起點。不需要存取 API 的 Pod 應該設定 `automountServiceAccountToken: false`。

**權限最小化的實務判準**：先問「這個 Pod 到底需不需要呼叫 apiserver」——絕大多數業務應用**完全不需要**。真正需要的是 Operator、CI 工具、監控代理這類基礎設施元件。給權限時盡量用 `Role` 而非 `ClusterRole`，動詞只給實際用到的（`get`、`list`、`watch` 通常就夠，不要順手給 `*`）。

**Workload Identity 的運作方式**：在 GCP 端把 GCP 服務帳號與「某個叢集的某個 namespace 的某個 KSA」建立信任關係，Pod 使用該 KSA 時，metadata server 會為它換發短期的 GCP 存取權杖。好處是沒有金鑰檔可以外洩、權限綁定在 workload 身分而非一份可複製的檔案、輪替自動發生、而且稽核日誌能追溯到具體是哪個 workload。

**金鑰檔的問題有多實際**：JSON 金鑰預設沒有到期時間，一旦被提交進 Git、寫進映像檔、或從被入侵的容器複製出去，攻擊者可以長期使用而不留下明顯痕跡。輪替需要人工協調所有使用方，因此常常被無限期拖延。這是雲端環境最常見的憑證外洩途徑之一。

## 面試回答方式

先把 RBAC 的四個資源與「能做什麼 vs 誰能做」的分工講清楚，再用作用範圍區分 Role 與 ClusterRole。主動提到 **ClusterRole + RoleBinding** 這個組合能展現實務經驗。ServiceAccount 定位成「Pod 的身分」，並點出 `default` 會被自動掛載權杖這個疏忽點。Workload Identity 那一問要把重點放在**金鑰檔本身就是問題**——長期有效、可複製、難輪替、外洩難察覺，而 Workload Identity 給的是短期自動輪替的權杖、沒有檔案可以外洩。加分點：RBAC 只做加法沒有 deny，所以要表達禁止得靠 Admission 政策；以及「這個 Pod 到底需不需要呼叫 apiserver」這個最小化的第一問。

## 講稿

RBAC 由四個資源組成。Role 跟 ClusterRole 定義能做什麼，RoleBinding 跟 ClusterRoleBinding 定義誰能做。差別在作用範圍，Role 屬於單一 namespace，ClusterRole 是叢集層級。

有個組合實務上很常用：ClusterRole 搭配 RoleBinding，會讓權限只在該 namespace 生效，通用角色定義一次就能綁到各處。

還有一點很關鍵，RBAC 只做加法。權限是所有綁定的聯集，給出去就收不回來，要表達禁止得靠 Admission 政策。

ServiceAccount 是給 Pod 用的身分，沒指定就用 default，而且預設會把權杖掛進容器。不需要呼叫 apiserver 的 Pod 應該把自動掛載關掉，那個權杖是被入侵後橫向移動的起點。

至於 Workload Identity，它解決的是金鑰檔本身。傳統做法產生一份 JSON 金鑰塞進 Secret，等於製造了一個長期有效、可被複製、難以輪替、外洩了還很難察覺的憑證。改用它之後，Pod 拿到的是短期自動輪替的權杖，根本沒有金鑰檔存在。

## 常見追問

### 為什麼說 RBAC「沒有 deny」會影響權限設計？

**核心答案**：因為權限是所有 RoleBinding 的**聯集**，沒有任何規則可以扣掉已經給出去的權限。這代表你不能用「先給大範圍、再排除幾項」的方式設計，必須**從零開始逐項累加**。實務上的後果是：一旦某個群組被綁定了過大的 ClusterRole（例如 `cluster-admin`），唯一的修正方式是移除那個綁定，而不能疊加一條限制。

**詳細解析**：這個特性讓「臨時給權限」變得危險——為了救火給某人 `cluster-admin`，事後若忘了移除，權限就永久留著，而且沒有任何機制會提醒你。所以組織上需要定期稽核綁定（可以用 `kubectl auth can-i --list` 檢查特定身分實際擁有什麼），並優先使用有到期機制的臨時提權流程。要表達真正的「禁止」必須用 Admission 層——OPA Gatekeeper 或 Kyverno 可以寫出「任何人都不得建立 privileged 容器」這種 RBAC 表達不了的規則，而且它作用在請求內容上而非資源類型上，粒度細得多。兩者是互補的：RBAC 管「誰能碰哪類資源」，Admission 管「內容合不合規」。

**面試回答方式**：解釋聯集的特性與「只能加不能減」的後果。用臨時提權忘記移除這個具體場景說明危險。給出兩個對策：定期稽核（`kubectl auth can-i --list`）與有到期機制的提權流程。加分點是講清楚 RBAC 與 Admission 政策的互補分工——一個管資源類型、一個管內容。

### Workload Identity 設定好了，但 Pod 還是拿不到權限，怎麼查？

**核心答案**：這個綁定有**兩端**，兩端都要對。GCP 端要把 GCP 服務帳號授予 Workload Identity User 角色給「某叢集某 namespace 某 KSA」這個主體；K8s 端要在 ServiceAccount 上加註對應的 GCP 服務帳號 annotation。**最常見的錯誤是只做了一端**，或是 Pod 根本沒有指定使用那個 KSA（用了 `default`）。

**詳細解析**：排查順序建議是：先確認 Pod 實際用的是哪個 ServiceAccount（`kubectl get pod -o yaml` 看 `serviceAccountName`，不要假設），再確認該 SA 有沒有正確的 annotation，最後確認 GCP 端的 IAM 綁定主體字串完全正確——那個字串包含專案、叢集、namespace、SA 名稱，任何一段打錯都會靜默失敗。驗證方式是在 Pod 裡呼叫 metadata server 查詢目前的身分，看它回報的是不是預期的 GCP 服務帳號；如果回報的是節點的預設服務帳號，代表 Workload Identity 沒有生效。另外要確認叢集與節點池都啟用了 Workload Identity——節點池層級沒開的話，該節點上的 Pod 會靜默地退回使用節點的服務帳號，這個「退回」行為特別容易讓人誤以為設定成功了（因為某些 API 呼叫可能剛好也成功）。

**面試回答方式**：先講清楚有兩端要對，並指出最常見的錯是只做一端或 Pod 沒指定 KSA。給出排查順序：確認實際使用的 SA、確認 annotation、確認 IAM 主體字串。加分點是給出驗證方式（在 Pod 裡查 metadata server 的身分），以及節點池沒啟用會靜默退回節點服務帳號這個陰險的行為。

### 一個 Pod 需要呼叫 Kubernetes API 才能運作，要怎麼給權限比較安全？

**核心答案**：**先確認它是不是真的需要**——絕大多數業務應用完全不需要呼叫 apiserver，會有這個需求的通常是 Operator、CI 工具、監控代理這類基礎設施元件。確定需要之後，做法是：建立**專屬的 ServiceAccount**（不要用 `default`），用 **`Role` 而非 `ClusterRole`**（除非真的需要跨 namespace），動詞只給實際用到的，資源用 `resourceNames` 限縮到具體物件。

**詳細解析**：實務上有幾個容易忽略的細節。第一，`list` 與 `watch` 權限的殺傷力比想像中大——能 list Secret 就等於能讀取所有 Secret 的內容，這和 `get` 單一物件的風險完全不同層級。第二，`escalate` 與 `bind` 這兩個動詞非常危險，它們允許持有者建立比自己權限更大的角色，等於權限提升的後門，一般工作負載絕對不該有。第三，給了 API 權限之後，這個 Pod 就成為攻擊的高價值目標，應該搭配 NetworkPolicy 限制它的出向流量、用 Pod Security 標準禁止 privileged，並且獨立監控它的 API 呼叫行為。最後，權限給完應該用 `kubectl auth can-i --list --as=system:serviceaccount:ns:name` 實際驗證它拿到的是不是預期的集合，而不是只看 YAML 推測。

**面試回答方式**：第一步先反問「真的需要嗎」，這比直接談怎麼給更能展現判斷力。給出具體做法：專屬 SA、優先用 Role、動詞最小化、用 `resourceNames` 限縮。加分點三個：`list` Secret 等於讀取全部內容，風險遠高於 `get`；`escalate` 與 `bind` 是權限提升後門；以及用 `kubectl auth can-i --list --as=...` 實際驗證而不是看 YAML 推測。

## 相關

- [[014-kube-apiserver.md]]
- [[020-namespace-quota-limitrange.md]]
- [[023-admission-controller.md]]
