---
id: kubernetes-011
category: kubernetes
slug: gke-standard-vs-autopilot
title: GKE Standard 與 Autopilot 的差異
difficulty: medium
tags: [GKE, Autopilot, GCP, 託管叢集, 節點池, 成本]
source: original
---

# 題目

GKE 的 Standard 和 Autopilot 模式差在哪？什麼情況下不該選 Autopilot？

## 核心答案

差別在**節點由誰負責**，以及**按什麼計費**。

**Standard 模式**：你自己建立與管理節點池——選機型、決定數量、設定自動伸縮、負責節點升級的節奏。**計費是按節點**，不管上面的 Pod 用了多少，開著就收錢。**Autopilot 模式**：Google 管理節點，你看不到也管不到節點池，只提交 Pod。**計費是按 Pod 實際 request 的 CPU、記憶體與儲存**，沒有閒置節點的浪費。

Autopilot 的代價是**限制**：不能用 privileged 容器、多數 hostPath 與 hostNetwork 被禁止、不能在節點上裝自己的 agent（會影響許多 DaemonSet 型的工具）、無法選擇特定機型的細節、也不能 SSH 進節點除錯。

**不該選 Autopilot 的情況**：需要節點級存取（自建監控／安全 agent、特殊核心參數、GPU 驅動自訂）、依賴 privileged 或 hostNetwork 的網路／儲存外掛、以及**資源利用率已經調得很高的大型穩定負載**——這種情況下按節點計費往往比按 Pod request 計費便宜。

## 詳細解析

**「按 request 計費」改變了資源設定的意義**：在 Standard 模式，requests 設得過高只是浪費排程空間，帳單不變；在 Autopilot，**requests 直接等於帳單**。這讓「把 requests 設準」從一個效能議題變成成本議題。Autopilot 也會自動補上未指定的 requests 與 limits，並套用最小值，所以極小的工作負載未必比較便宜。

**節點升級的責任轉移**：Standard 模式下你要規劃升級視窗、處理節點 drain、承擔升級造成的中斷風險。Autopilot 由 Google 負責，好處是省事，代價是**你對時機的掌控變少**——雖然可以設定維護視窗，但無法像自管那樣完全掌握節奏。這對有嚴格變更凍結期的組織是需要評估的點。

**DaemonSet 的處境不同**：Autopilot 允許 DaemonSet，但受限於不能 privileged、hostPath 多半被禁，許多節點級 agent 裝不上去。而且 GKE 本身已內建日誌與監控代理，重複部署只是浪費每個節點的資源配額。設計時要先確認平台提供了什麼。

**兩者共通的部分比想像中多**：API、工作負載資源、Service、Ingress、RBAC 這些都一樣，應用本身通常不需要改。真正的差異集中在**基礎設施層的權限與可見度**，所以評估時該問的是「我的工作負載需不需要碰節點」，而不是「我熟不熟 K8s」。

**成本比較沒有一致答案**：Autopilot 在**負載波動大、利用率低、團隊規模小**時通常較划算，因為省掉了閒置節點與維運人力。Standard 在**負載穩定、已做過裝箱優化、能用 Spot／預留折扣**時較划算。要實際估算而不是直覺判斷——把現有叢集的 requests 總和與節點總成本拉出來比對，就能看出差距。

## 面試回答方式

先用「節點由誰負責、按什麼計費」兩句話定調，這是所有差異的根源。接著講 Autopilot 的代價是限制，並具體列舉：privileged、hostPath、hostNetwork、節點級 agent、無法 SSH。回答「什麼時候不該選」時要給判準——**我的工作負載需不需要碰節點**，而不是熟不熟 K8s。實務加分點：Autopilot 下 requests 直接等於帳單，把資源設定從效能議題變成成本議題；GKE 已內建日誌與監控代理，別重複裝 DaemonSet；以及成本沒有一致答案，要拿 requests 總和對比節點成本實際算。

## 講稿

差別的根源只有兩件事：節點由誰負責，還有按什麼計費。

Standard 模式你自己管節點池，選機型、決定數量、排升級節奏，計費是按節點，開著就收錢，不管上面跑了多少 Pod。Autopilot 是 Google 管節點，你看不到也管不到節點池，只要提交 Pod，計費按 Pod 實際 request 的 CPU、記憶體跟儲存。

Autopilot 的代價是限制。不能用 privileged 容器，多數 hostPath 跟 hostNetwork 被禁，不能在節點裝自己的 agent，也不能 SSH 進去除錯。

所以該不該選，判準是「我的工作負載需不需要碰節點」，而不是團隊熟不熟 K8s。需要自建安全 agent、要調核心參數、要自訂 GPU 驅動，那就得用 Standard。

有一個影響很實際的差異值得提。Autopilot 是按 request 計費，等於 requests 直接就是帳單。在 Standard 模式把 requests 設高只是浪費排程空間，帳單不變；在 Autopilot 你設多少就付多少。這讓資源設定從效能議題變成成本議題。

成本上沒有一致答案。負載波動大、利用率低的情況 Autopilot 通常划算，負載穩定又已經做過裝箱優化的用 Standard 比較便宜。這個要拿 requests 總和對比節點成本實際算，不能靠直覺。

## 常見追問

### Autopilot 上為什麼我的 Pod requests 被改掉了？

**核心答案**：因為 Autopilot 會透過 **mutating admission webhook** 自動補上或調整資源設定——沒設 requests 的容器會被填上預設值、沒設 limits 的會被補上（Autopilot 要求 requests 等於 limits，也就是全部跑在 Guaranteed 等級），低於平台最小值的會被拉高到最小值。這不是錯誤，是 Autopilot 的運作方式，因為它要靠 requests 計費並據此配置節點。

**詳細解析**：這帶來兩個實務影響。第一是**成本可預測性提高但下限被抬高**——非常小的 sidecar 或工具容器會被拉到平台最小值，所以「拆很多小容器」在 Autopilot 上未必划算。第二是**Burstable 模式消失**：Standard 上常見的「requests 設穩態、limits 留突發空間」策略在 Autopilot 不成立，你必須按峰值付費。規劃時要用實際的峰值需求去估算，而不是拿 Standard 的 requests 直接換算。另外資源會被調整這件事，也代表你在 YAML 裡寫的值不一定是最終生效的值，除錯時要用 `kubectl get pod -o yaml` 看實際套用的結果。

**面試回答方式**：指出是 mutating webhook 自動補值，並解釋動機——Autopilot 靠 requests 計費。講兩個實務影響：小容器被拉到最小值所以拆太細不划算、Burstable 策略失效要按峰值付費。加分點是提醒 YAML 寫的不等於實際生效的，要看 `-o yaml`。

### 已經在跑的 Standard 叢集，可以直接切成 Autopilot 嗎？

**核心答案**：**不能原地切換**。Standard 和 Autopilot 是建立叢集時就決定的模式，沒有轉換選項。要換必須**建立新的 Autopilot 叢集，再把工作負載遷移過去**，並在遷移前確認現有工作負載沒有用到 Autopilot 禁止的功能。

**詳細解析**：遷移的實際工作量取決於你有多少東西碰到節點層。應用本身的 Deployment、Service、ConfigMap 這些通常可以直接套用；真正要處理的是 DaemonSet 型的 agent（確認平台是否已內建、或有無 Autopilot 相容版本）、依賴 hostPath 的元件、以及任何 privileged 的工具。實務上會先在新叢集用少量流量做平行驗證，確認沒有被 admission 擋下來的資源，再逐步切流量。因為要重建叢集，這也是重新檢視命名空間規劃、RBAC、網路策略的好時機，不必把舊叢集的歷史包袱原樣搬過去。反過來說，如果評估後發現一半的工具都要改，那本身就是「不該用 Autopilot」的訊號。

**面試回答方式**：直接回答不能原地切，必須建新叢集遷移。把工作量拆開——應用本身好搬、碰節點的元件才是重點。加分點是提到可以趁機重整命名空間與 RBAC，以及「如果一半工具都要改，那就是不該用 Autopilot 的訊號」。

### Autopilot 下要怎麼除錯？沒辦法 SSH 進節點的話。

**核心答案**：改用**不需要節點存取的工具**。日誌與指標走 Cloud Logging 與 Cloud Monitoring（GKE 預設就整合好）；要進容器內部用 `kubectl exec`；容器沒有除錯工具或已經 crash 時，用 **ephemeral container**（`kubectl debug`）掛一個帶完整工具的臨時容器進同一個 Pod，共享它的 namespace 來檢查網路與行程。

**詳細解析**：`kubectl debug` 是這個限制下最重要的工具，它有兩種常用模式：掛進既有 Pod 共享 namespace（適合查網路、看行程），或是**複製一個 Pod** 並改掉指令（適合查 CrashLoopBackOff——原本一啟動就死的容器，複製版可以改成 sleep 讓你進去慢慢看）。這其實是個好習慣，即使在 Standard 模式也該優先用它，因為 SSH 進節點做的事情往往繞過了審計，而且在節點會被自動汰換的環境裡本來就不可靠。至於節點層級的指標（磁碟、核心），Autopilot 下由平台負責，在 Cloud Monitoring 看得到聚合資訊，但你不需要也不應該去調整它。

**面試回答方式**：給出替代路徑而不是抱怨限制——日誌走 Cloud Logging、進容器用 exec、沒工具或 crash 用 `kubectl debug`。特別說明 `kubectl debug` 的兩種模式，尤其複製 Pod 改指令來查 CrashLoopBackOff 這招很實用。加分點是指出這在 Standard 上也是更好的習慣，因為 SSH 繞過審計、節點又會被汰換。

## 相關

- [[003-daemonset-vs-others.md]]
- [[009-requests-limits-qos-oomkilled.md]]
- [[012-gke-ingress-vs-gateway.md]]
