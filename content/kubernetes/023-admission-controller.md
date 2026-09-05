---
id: kubernetes-023
category: kubernetes
slug: admission-controller
title: Admission Controller 與 Webhook：政策是怎麼被強制執行的
difficulty: hard
tags: [Admission Controller, Webhook, Mutating, Validating, 政策, OPA]
source: original
---

# 題目

Mutating 和 Validating Admission 有什麼差別？為什麼順序是先 Mutating 後 Validating？用 Admission webhook 做政策管控有什麼風險？

## 核心答案

Admission 是請求通過認證與授權之後、寫入 etcd 之前的最後一道關卡，它檢查的是**請求內容本身合不合規**（RBAC 只管「誰能碰哪類資源」，管不到內容）。

**Mutating 可以改寫請求**——自動注入 sidecar、補上預設的資源設定、加上標籤。**Validating 只能放行或拒絕**，不能修改。

**順序是先 Mutating 後 Validating，原因很關鍵**：如果反過來，改寫發生在驗證之後，那麼改寫的結果**沒有被任何規則檢查過**，等於留了一個繞過所有驗證的後門。先改後驗才能保證「最終寫進 etcd 的內容」一定通過了全部檢查。

**最大的風險是 webhook 成為單點**：它是 apiserver **同步呼叫的外部服務**，`failurePolicy: Fail` 時 webhook 不可用會讓落在其作用範圍內的所有 API 請求失敗。如果範圍沒有限縮好，可能導致整個叢集無法建立任何 Pod，連修復用的部署都送不出去——這是真實發生過的事故型態。

## 詳細解析

**內建的 Admission 外掛比想像中多**：`ResourceQuota`、`LimitRanger`、`NamespaceLifecycle`、`ServiceAccount`、`PodSecurity` 都是 Admission 外掛。所以「設了 ResourceQuota 之後沒宣告資源的 Pod 被拒絕」正是 Admission 在運作，不是什麼特別機制。

政策引擎讓規則可以宣告式管理：OPA Gatekeeper 與 Kyverno 把「不准用 latest 標籤」「必須有 owner 標籤」「不准 privileged」這類規則寫成 CRD，由它們的 webhook 統一執行。相較於自己寫 webhook，好處是規則本身可以被版控、審查、測試。Kyverno 用 YAML 表達規則，學習曲線通常比 OPA 的 Rego 語言平緩。

**dry-run 與 audit 模式是導入的必要步驟**：直接在生產環境套用拒絕規則，會讓既有的、不符合新規則的工作負載在下次部署時全部失敗。成熟的做法是先用 audit 模式跑一段時間、盤點有多少既有資源違規、逐一修正之後才切成強制拒絕。

**webhook 自身的部署要避免循環依賴**：如果政策 webhook 本身是叢集裡的 Deployment，而它的規則又會攔截 Pod 的建立，那麼在叢集重啟或 webhook Pod 全部掛掉時，就形成「要建 Pod 得先問 webhook，但 webhook 自己是 Pod 起不來」的死結。解法是用 `namespaceSelector` 排除 webhook 自己所在的 namespace 與 kube-system。

**Mutating 造成的困惑**：使用者送出的 YAML 與實際生效的內容可能不同（sidecar 被注入、資源被補上），除錯時要看 `kubectl get -o yaml` 的實際結果而不是自己寫的檔案。GKE Autopilot 自動補資源設定就是這個機制，很多人第一次看到 requests 被改掉會以為出錯。

## 面試回答方式

先定位 Admission 在請求鏈路中的位置——認證授權之後、寫入 etcd 之前，管的是**內容**而 RBAC 管的是**誰碰哪類資源**，這個分工要講清楚。接著用「能不能改寫」區分 Mutating 與 Validating。順序那一問要給出**原因**：反過來的話改寫結果沒被驗證，是繞過檢查的後門。風險那一問聚焦在 webhook 是同步的外部單點，`failurePolicy: Fail` 加上範圍沒限縮會讓整個叢集無法部署。實務加分點：ResourceQuota 與 PodSecurity 本身就是內建 Admission 外掛；導入政策要先跑 audit 模式盤點違規再切強制；以及 webhook 要排除自己所在的 namespace 避免循環依賴死結。

## 講稿

Admission 是請求通過認證跟授權之後、寫進 etcd 之前的最後一道關卡。它檢查的是請求內容本身合不合規，跟 RBAC 的分工很清楚——RBAC 管誰能碰哪類資源，管不到內容。

它分兩種。Mutating 可以改寫請求，例如注入 sidecar、補預設資源設定。Validating 只能放行或拒絕。

順序是先 Mutating 後 Validating，理由很關鍵。如果反過來，改寫發生在驗證之後，那改寫的結果就沒被任何規則檢查過，等於留了一個繞過所有驗證的後門。

風險最該提的是 webhook 成為單點。它是同步呼叫的外部服務，failurePolicy 設成 Fail 而它不可用時，落在範圍內的請求會全部失敗，可能整個叢集都建不了 Pod。

所以有兩個實務原則。第一，用 namespaceSelector 把範圍縮到最小，特別要排除 kube-system 跟 webhook 自己的 namespace，不然會形成「要建 Pod 得先問 webhook，但 webhook 自己是 Pod」的死結。

第二，導入政策要先跑 audit 模式，盤點違規並修好，才切成強制拒絕。

## 常見追問

### 想強制「所有 Pod 都必須有 owner 標籤」，該用 RBAC 還是 Admission？

**核心答案**：**必須用 Admission**。RBAC 的粒度是「某個身分能不能對某類資源執行某個動作」，它**看不到請求的內容**——無法表達「可以建立 Pod，但這個 Pod 必須有某個標籤」。這種基於內容的規則只有 Admission 層做得到。

**詳細解析**：實作上不必自己寫 webhook，用 OPA Gatekeeper 或 Kyverno 把規則寫成 CRD 即可，這樣規則本身可以進版控與 code review。Kyverno 的規則用 YAML 表達，對已經熟悉 K8s 的團隊學習成本較低；OPA 用 Rego 語言，表達力更強但需要額外學習。實務上還有一個選擇：與其**拒絕**沒有標籤的 Pod，不如用 Mutating **自動補上**預設標籤（例如從 namespace 繼承 owner），這樣既達成治理目的又不會擋住開發流程——強制拒絕會產生摩擦，自動修正則幾乎無感。判準是這個欄位有沒有合理的預設值：有的話用 mutating 補，沒有的話（例如成本中心代碼）才用 validating 拒絕並在錯誤訊息裡寫清楚該怎麼修。

**面試回答方式**：直接回答必須用 Admission，並解釋原因——RBAC 看不到請求內容。給出 Gatekeeper 與 Kyverno 兩個選擇並簡述差異。加分點是提出「與其拒絕不如自動補上」這個更好的設計，並給出判準：這個欄位有沒有合理的預設值。

### Admission webhook 讓 API 請求變慢，怎麼優化？

**核心答案**：因為 webhook 是**同步呼叫**，每個落在其作用範圍內的請求都要等它回應。優化方向有三個：**縮小作用範圍**（用 `rules` 精確指定資源類型與動作、用 `namespaceSelector` 排除不需要的 namespace，讓大多數請求根本不會觸發 webhook）、**降低 webhook 本身的延遲**（避免在裡面做外部呼叫或複雜運算，需要的資料用快取或 informer 而非即時查詢）、以及**設定合理的 `timeoutSeconds`**（預設 10 秒太長，通常 1–3 秒就該放棄）。

**詳細解析**：範圍縮小是效益最高的一項——很多 webhook 註冊時圖方便寫成攔截所有資源的所有動作，結果連 `kubectl get` 觸發的請求都要繞一圈。要注意 webhook 的延遲會直接反映在**所有使用者的操作體驗**上，包括 controller 的 reconcile，所以一個慢的 webhook 可能讓整個叢集的控制迴圈都變慢，症狀是「部署變慢」但看不出是誰造成的。監控上應該追蹤 apiserver 的 admission webhook 延遲指標，並為每個 webhook 設定告警。另外多個 webhook 是**串行**執行的，各自的延遲會累加，所以叢集裡 webhook 數量多的時候要特別注意總和。

**面試回答方式**：先說明同步呼叫是慢的根源。三個優化方向依效益排序，把縮小範圍放第一並指出常見錯誤（圖方便攔截所有資源）。加分點是講出影響面——webhook 慢會拖慢所有人的操作與 controller 的 reconcile，症狀是「部署變慢」卻查不出原因；以及多個 webhook 是串行、延遲會累加。

### PodSecurity 和以前的 PodSecurityPolicy 有什麼不同？

**核心答案**：**PodSecurityPolicy（PSP）已經被移除**，取代它的是內建的 **Pod Security Admission**，以三個等級（`privileged`、`baseline`、`restricted`）搭配三種模式（`enforce`、`audit`、`warn`）在 **namespace 層級**用標籤啟用。相較於 PSP，它大幅簡化——不需要 RBAC 綁定、沒有多個 policy 同時適用時難以預測的選擇邏輯，設定就是在 namespace 上加幾個標籤。

**詳細解析**：PSP 最為人詬病的是它的授權模型：policy 要透過 RBAC 授權給 ServiceAccount，當多個 PSP 同時可用時，實際套用哪一個的規則相當不直覺，導致「明明設了限制卻沒生效」或「不小心套用了寬鬆的那一個」。Pod Security Admission 用 namespace 標籤取代這套，行為可預測得多。它的三種模式可以**同時設定**，這對導入非常有用——先用 `audit` 與 `warn` 觀察會有多少工作負載違規、給使用者警告，確認影響範圍後才加上 `enforce`。要注意它的能力範圍比 PSP 窄，只涵蓋 Pod 安全上下文相關的規則；更複雜的政策（映像檔來源白名單、必須有某些標籤）仍然需要 Gatekeeper 或 Kyverno。所以實務上常見的組合是「Pod Security Admission 管基準安全，政策引擎管其餘治理規則」。

**面試回答方式**：先講 PSP 已移除、由 Pod Security Admission 取代。用「授權模型」說明 PSP 的核心問題——多個 policy 時選擇邏輯不直覺，導致設了沒生效。強調新機制用 namespace 標籤、三種模式可同時設定，`audit` 加 `warn` 先觀察是導入的正確順序。加分點是指出它的範圍較窄，複雜治理規則仍需政策引擎，兩者是分工。

## 相關

- [[014-kube-apiserver.md]]
- [[021-rbac-serviceaccount-workload-identity.md]]
- [[024-crd-and-operator.md]]
