# Kubernetes 面試題

InterviewHelpMe 第 9 個內容類別，共 50 題，涵蓋控制平面、工作負載、節點、網路、儲存、伸縮、安全與擴充能力，並包含 GKE 特有的題目。

## 這個類別的設計

一半以上是**差異比較題**（Deployment vs StatefulSet、DaemonSet 三者、Service 三型別 vs Ingress、三種探針），因為 K8s 的面試很少單問一個名詞的定義，多半是「這兩個看起來很像的東西差在哪、什麼時候用哪個」。另一半是**單一主題的深度題**（etcd、kube-apiserver、kubelet、Pod 生命週期），用來撐起前半部比較題所需要的底層理解。

第 025 到 050 題是第二批，換一個角度：**每一題都圍繞「實際運維時會踩到什麼」**。五個方向——**排程與資源治理**（親和性與 taint、拓撲分散、優先級與搶佔、PDB、節點壓力與驅逐、HPA 調校）、**工作負載的運行細節**（滾動更新參數、init 與 sidecar、映像管理、StatefulSet 的實務難題、CSI 與擴容）、**網路與流量**（CNI、EndpointSlice 與流量政策、Ingress 與 TLS）、**交付與治理**（Helm 與 Kustomize、GitOps、多叢集、升級策略、成本）、以及**安全與判斷**（Secret 的真實安全性、Pod Security、供應鏈、排錯流程、什麼時候不該用 K8s、以及收束題「抽象的代價」）。

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
| 025 | 節點選擇：nodeSelector、Affinity、Taint 與 Toleration | medium |
| 026 | Pod 拓撲分散：怎麼確保副本不會擠在同一個地方 | medium |
| 027 | PriorityClass 與搶佔：資源不足時誰該被犧牲 | medium |
| 028 | PodDisruptionBudget 與節點維護的協調 | medium |
| 029 | 滾動更新的參數與策略選擇 | medium |
| 030 | Init Container 與 Sidecar：多容器 Pod 的生命週期 | medium |
| 031 | HPA 的調校：自訂指標與擴縮行為 | hard |
| 032 | 節點資源壓力與 kubelet 驅逐 | hard |
| 033 | 容器映像的管理：標籤、拉取策略與映像倉庫 | medium |
| 034 | CNI 與 Pod 網路模型：Pod 之間是怎麼通的 | hard |
| 035 | EndpointSlice 與流量政策：Service 的細節控制 | medium |
| 036 | Ingress Controller 的選型與 TLS 管理 | medium |
| 037 | StatefulSet 的實務難題：擴縮、備份與資料遷移 | hard |
| 038 | CSI、磁碟快照與容量擴充 | medium |
| 039 | Secret 的真實安全性與外部密鑰管理 | medium |
| 040 | Pod 起不來：系統性的排錯流程 | medium |
| 041 | 叢集層級的可觀測性：指標、日誌與事件 | medium |
| 042 | Helm 與 Kustomize：設定管理該怎麼選 | medium |
| 043 | GitOps：以 Git 為單一真相來源的交付模式 | medium |
| 044 | 多叢集：什麼時候該拆、怎麼管 | hard |
| 045 | Pod 安全與容器逃逸的風險面 | hard |
| 046 | 供應鏈安全：映像簽章、SBOM 與來源驗證 | medium |
| 047 | 叢集升級與版本策略 | medium |
| 048 | Kubernetes 的成本控制 | medium |
| 049 | 什麼時候不該用 Kubernetes | hard |
| 050 | Kubernetes 的整體判斷：抽象的代價與收益 | hard |

難度分布：easy 3、medium 33、hard 14。
