# Kubernetes 面試題

InterviewHelpMe 第 9 個內容類別，共 24 題，涵蓋控制平面、工作負載、節點、網路、儲存、伸縮、安全與擴充能力，並包含 GKE 特有的題目。

## 這個類別的設計

一半以上是**差異比較題**（Deployment vs StatefulSet、DaemonSet 三者、Service 三型別 vs Ingress、三種探針），因為 K8s 的面試很少單問一個名詞的定義，多半是「這兩個看起來很像的東西差在哪、什麼時候用哪個」。另一半是**單一主題的深度題**（etcd、kube-apiserver、kubelet、Pod 生命週期），用來撐起前半部比較題所需要的底層理解。

GKE 相關的題目沒有獨立成類，而是混在對應的主題裡——Cloud Run Jobs 放在 Job／CronJob 那題、Autopilot 放在節點管理、Workload Identity 放在 RBAC。這樣安排是因為實際面試不會把「K8s 概念」和「GKE 操作」分開問，而是問「你在 GKE 上會怎麼做」。

## 檔案格式

與其他類別相同：每題一個 `NNN-slug.md`，frontmatter 對應 [schema.sql](../../backend/sql/schema.sql) 的 `question` 表（`category: kubernetes`，`source: original`）。正文含：題目、核心答案、詳細解析、面試回答方式、講稿、常見追問（3 題）、相關。

新增題目請用 `node scripts/new-question.mjs kubernetes <slug> "<標題>"` 產生骨架，它會處理編號、frontmatter 與區塊結構。寫完跑 `npm test` 驗證結構與交叉連結，跑 `node scripts/check-scripts.mjs kubernetes` 驗證講稿品質。

## 題目清單

| # | 題目 | 難度 |
|---|------|------|
| 001 | 為什麼 K8s 的最小部署單位是 Pod，而不是 Container？ | easy |
| 002 | Deployment 與 StatefulSet 的差異 | medium |
| 003 | DaemonSet 與 Deployment、StatefulSet 的差異 | medium |
| 004 | Job、CronJob 與 Cloud Run Jobs 的差異 | medium |
| 005 | Service 的三種型別與 Ingress 的差異 | medium |
| 006 | kube-proxy 與 CoreDNS 各自負責什麼？Service 是怎麼真的通的 | medium |
| 007 | ConfigMap 與 Secret 的差異 | easy |
| 008 | Liveness、Readiness、Startup 三種探針的差異 | medium |
| 009 | requests 與 limits 的差異，以及 QoS 與 OOMKilled | medium |
| 010 | HPA、VPA 與 Cluster Autoscaler 的差異 | medium |
| 011 | GKE Standard 與 Autopilot 的差異 | medium |
| 012 | GKE Ingress、LoadBalancer Service 與 Gateway API 的取捨 | hard |
| 013 | etcd 在 K8s 裡扮演什麼角色？為什麼節點數要是奇數 | hard |
| 014 | kube-apiserver 處理一個請求會經過哪些階段？ | medium |
| 015 | kube-scheduler 怎麼決定 Pod 要放到哪個 Node？ | medium |
| 016 | 控制器與 Reconcile 迴圈：宣告式的本質是什麼？ | medium |
| 017 | kubelet 負責什麼？它和 Container Runtime 的關係 | medium |
| 018 | Pod 的生命週期與優雅終止：滾動更新為什麼還是會掉請求？ | hard |
| 019 | PV、PVC 與 StorageClass 的關係 | medium |
| 020 | Namespace、ResourceQuota 與 LimitRange 的資源治理 | easy |
| 021 | RBAC、ServiceAccount 與 GKE Workload Identity | hard |
| 022 | NetworkPolicy：預設全通的網路要怎麼收斂？ | medium |
| 023 | Admission Controller 與 Webhook：政策是怎麼被強制執行的 | hard |
| 024 | CRD 與 Operator：怎麼把運維知識寫成程式 | hard |

難度分布：easy 3、medium 15、hard 6。
