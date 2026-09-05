---
id: kubernetes-004
category: kubernetes
slug: job-cronjob-vs-cloud-run
title: Job、CronJob 與 Cloud Run Jobs 的差異
difficulty: medium
tags: [Job, CronJob, Cloud Run, GKE, GCP, 批次任務]
source: original
---

# 題目

K8s 的 Job 和 CronJob 差在哪？既然 GCP 有 Cloud Run Jobs 與 Cloud Scheduler，什麼情況該用哪一個？

## 核心答案

**Job 是「跑完就結束」的一次性任務**——它確保指定數量的 Pod **成功執行完畢並退出**，這和 Deployment 期望 Pod 永遠活著的語意相反。**CronJob 則是 Job 的排程器**，按 cron 運算式在時間到的時候**建立一個新的 Job**，兩者是「模板與實例」的關係，不是平行選項。

至於**該不該用 K8s 跑批次**，判準是**依賴**而不是任務本身：如果這個任務需要叢集內的資源——存取 ClusterIP Service、掛載 PVC、使用叢集的 Secret、走 NetworkPolicy 管控的內網——那就該留在 K8s，因為 Cloud Run 拿不到這些。反之若它只是「定期打一支 API、處理一批資料、寫回資料庫」這種**自足的任務**，**Cloud Run Jobs 搭配 Cloud Scheduler 通常更划算**：不需要維護節點、按執行時間計費、閒置時零成本，而 K8s 的 CronJob 就算一天只跑一次，底下的節點仍然二十四小時計費。

## 詳細解析

**Job 的完成語意與重試**：Job 用 `completions` 指定要成功幾次、`parallelism` 指定同時跑幾個，兩者組合可以表達「跑一次」「跑一百次」「同時十個跑滿一百次」等模式。失敗時由 `backoffLimit` 控制重試上限，超過就標記為 Failed。這裡有個常見陷阱：**Job 完成後 Pod 不會自動消失**，會以 Completed 狀態留著讓你看日誌，累積久了會塞滿 etcd 與 Pod 列表，要靠 `ttlSecondsAfterFinished` 設定自動清理。

**CronJob 的併發策略是重點**：`concurrencyPolicy` 有三個值——`Allow`（預設，允許上一次還沒跑完就啟動下一次）、`Forbid`（跳過這次）、`Replace`（砍掉舊的換新的）。預設的 `Allow` 是實務上最常出事的設定：一個原本五分鐘跑完的任務因為資料量成長變成十五分鐘，而排程是每五分鐘一次，於是三份同時在跑，互相搶資料庫連線、重複處理資料。批次任務的預設應該考慮設成 `Forbid`。

**錯過的排程怎麼辦**：CronJob 靠 controller 定期檢查，如果 controller 因故停擺超過 `startingDeadlineSeconds`，錯過的排程會被直接跳過而不是補跑。這代表 **CronJob 不保證一定會執行**，對帳、結算這類不能漏的任務不能只依賴它，要有補跑機制或對帳檢查。

**Cloud Run Jobs 的取捨**：優點是完全不用管節點——沒有容量規劃、沒有節點升級、按實際執行的 vCPU 秒數計費，跑完就不收錢。缺點是它活在 K8s 叢集外面：預設打不到 ClusterIP、掛不了 PVC、拿不到叢集的 Secret。要存取 VPC 內資源得另外設定 Serverless VPC Access 連接器，而且有最長執行時間的限制。所以它適合自足的、時間可控的任務。

**成本這件事要算清楚**：常見的誤判是「反正叢集已經在跑了，CronJob 是免費的」。這在叢集本來就有閒置容量時成立，但如果批次任務需要大量記憶體，逼得你為它多開一個節點池、或把節點規格往上調，那成本就相當實在。反過來，如果任務執行時間長且頻繁，Cloud Run 按秒計費也未必比較便宜。判準應該是依賴關係優先，成本其次。

## 面試回答方式

先釐清 Job 和 CronJob 不是平行選項——CronJob 是排程器，時間到就建一個 Job，兩者是模板與實例的關係。接著把 Cloud Run 的比較拉到正確的判準上：**看依賴，不是看任務類型**。需要 ClusterIP、PVC、叢集 Secret、走 NetworkPolicy 就留在 K8s；自足的定時任務用 Cloud Run Jobs 加 Cloud Scheduler 更划算。實務加分點有三個：`concurrencyPolicy` 預設 `Allow` 導致任務疊跑是最常見的坑；Job 完成後 Pod 不會自動清理要設 `ttlSecondsAfterFinished`；CronJob 不保證一定執行，關鍵任務要有補跑機制。

## 講稿

先釐清一件事，Job 和 CronJob 不是平行的選項。Job 是跑完就結束的一次性任務，CronJob 是它的排程器，時間到就建一個新的 Job。兩者是模板跟實例的關係。

至於該不該用 K8s 跑批次，我的判準是看依賴，不是看任務本身。

如果任務要存取 ClusterIP、要掛 PVC、要用叢集的 Secret，那就留在 K8s，因為 Cloud Run 拿不到這些。但如果只是定期打一支 API、處理一批資料、寫回資料庫這種自足的任務，Cloud Run Jobs 配 Cloud Scheduler 通常更划算，不用管節點，按秒計費，閒置零成本。

實務上有三個坑。concurrencyPolicy 預設是 Allow，任務變慢之後會疊跑，三份同時搶資料庫連線，批次任務通常該設成 Forbid。Job 完成後 Pod 不會自動消失，要設 ttlSecondsAfterFinished。

第三個最容易忽略：CronJob 不保證一定會執行，controller 停擺超過期限的排程會被跳過而不是補跑。對帳、結算這種不能漏的任務，要另外有補跑機制。

## 常見追問

### CronJob 的任務執行時間變長，超過了排程間隔，會發生什麼事？

**核心答案**：預設情況下會**疊跑**。`concurrencyPolicy` 預設是 `Allow`，代表上一次還在執行時，時間到了照樣建立新的 Job。一個原本五分鐘跑完的任務因為資料量成長變成十五分鐘、排程卻是每五分鐘一次，就會有三份同時在跑，互相搶資料庫連線、重複處理同一批資料，嚴重時把下游打垮。

**詳細解析**：這個坑陰險在於它是**漸進出現**的——上線時任務只跑兩分鐘，一切正常，半年後資料量成長才開始重疊，而那時已經沒有人記得有這個設定。解法有兩層：設定層面把 `concurrencyPolicy` 改成 `Forbid`（跳過這次）或 `Replace`（砍舊換新），選哪個看任務性質——資料處理通常用 `Forbid` 比較安全，因為砍掉跑到一半的任務可能留下不一致的狀態。程式層面則應該讓任務本身具備冪等性或加上分散式鎖，不要把正確性完全押在排程設定上，因為手動觸發、重試都可能造成並行。另外要搭配監控任務的執行時長，在它逼近排程間隔之前就示警。

**面試回答方式**：先講具體後果——預設 Allow 會疊跑，多份同時搶資源、重複處理。強調這個坑是漸進出現的，上線時不會有事。解法講兩層：設定上改 `Forbid` 或 `Replace`，程式上做冪等或加鎖，不要把正確性押在排程設定。加分點是提到監控執行時長、在逼近間隔前示警。

### 為什麼 Job 完成後 Pod 還留著？要怎麼清掉？

**核心答案**：這是刻意的——Pod 留在 Completed 狀態是為了讓你事後還能 `kubectl logs` 查看執行結果，如果跑完就刪，失敗原因就沒地方查了。但它不會自動清理，高頻的 CronJob 會累積出成千上萬個 Completed Pod，佔用 etcd 空間、拖慢 `kubectl get pods`。解法是在 Job spec 設 `ttlSecondsAfterFinished`，讓 K8s 在完成後指定秒數自動刪除。

**詳細解析**：CronJob 另外有 `successfulJobsHistoryLimit` 和 `failedJobsHistoryLimit`，控制保留幾個歷史 Job（預設分別是 3 和 1），這是 Job 物件層級的清理。兩者搭配才完整：history limit 管 Job 物件的數量，`ttlSecondsAfterFinished` 管 Pod 的存活時間。實務上建議把成功的保留時間設短、失敗的保留久一點，因為成功的日誌通常不會有人看，失敗的才需要排查。更根本的做法是**不要依賴 Pod 留存來看日誌**——把日誌送到集中式的日誌系統（GKE 預設會送到 Cloud Logging），這樣就能放心地積極清理，也不會因為 Pod 被驅逐而永久失去記錄。

**面試回答方式**：先解釋為什麼留著（要能查日誌），再講後果（累積佔 etcd、拖慢 kubectl）。給出 `ttlSecondsAfterFinished` 和 CronJob 的 history limit 兩層清理。加分點是點出更根本的做法——日誌送集中式系統，就能放心積極清理。

### Cloud Run Jobs 要存取 GKE 叢集裡的資料庫，做得到嗎？

**核心答案**：**看資料庫在哪裡**。如果資料庫是跑在叢集裡的 Pod、只透過 ClusterIP Service 暴露，那 Cloud Run 預設打不到——ClusterIP 是叢集內部的虛擬 IP，叢集外沒有意義。需要透過 **Serverless VPC Access 連接器**讓 Cloud Run 進到 VPC，並且把資料庫用 internal LoadBalancer 這類方式暴露到 VPC 網段。但如果資料庫本來就是 Cloud SQL 這類託管服務，那 Cloud Run 直接連就好，完全沒有這個問題。

**詳細解析**：這題其實在測「你知不知道 ClusterIP 的作用範圍」。ClusterIP 只在叢集內的網路命名空間有意義，kube-proxy 在每個節點上維護的轉發規則才讓它可達，叢集外的東西沒有這套規則。所以「Cloud Run 能不能連」的答案完全取決於目標暴露在哪一層。這也回到原本的判準——如果任務對叢集內部資源有這麼深的依賴，硬要搬到 Cloud Run 反而要多維護一組網路設定，得不償失，不如直接留在 K8s 用 CronJob。反過來說，如果架構本來就把有狀態的東西放在託管服務（Cloud SQL、Memorystore），那批次任務跟叢集根本沒有耦合，搬到 Cloud Run 就很自然。這其實也是個架構訊號：批次任務難以搬離叢集，往往代表叢集內外的界線沒有劃清楚。

**面試回答方式**：先反問「資料庫在哪」把問題拆開——叢集內的 ClusterIP 打不到、託管的 Cloud SQL 直接連。解釋 ClusterIP 只在叢集內有意義，靠 kube-proxy 的轉發規則。加分點是把它拉回架構層面：批次任務搬不走，通常代表叢集內外的界線沒劃清楚。

## 相關

- [[005-service-types-vs-ingress.md]]
- [[006-kube-proxy-vs-coredns.md]]
- [[011-gke-standard-vs-autopilot.md]]
