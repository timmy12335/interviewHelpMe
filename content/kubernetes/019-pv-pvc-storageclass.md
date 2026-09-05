---
id: kubernetes-019
category: kubernetes
slug: pv-pvc-storageclass
title: PV、PVC 與 StorageClass 的關係
difficulty: medium
tags: [PV, PVC, StorageClass, 儲存, 動態佈建, access mode]
source: original
---

# 題目

PV、PVC、StorageClass 三者的關係是什麼？access mode 為什麼重要？PVC 一直 Pending 要怎麼查？

## 核心答案

三者是**供給、需求與規格**的分工：**PV（PersistentVolume）是實際的儲存資源**——一顆雲端磁碟、一個 NFS 匯出點，屬於叢集層級。**PVC（PersistentVolumeClaim）是 Pod 提出的需求**——「我要 10GB、可讀寫」，屬於 namespace 層級。**StorageClass 是「怎麼生出 PV」的規格模板**——定義用哪種磁碟類型、哪個佈建器、回收策略。

流程是：Pod 掛載 PVC → PVC 依照指定的 StorageClass **動態佈建**出一個 PV 並綁定 → Pod 透過這層間接關係使用實際儲存。這個間接層的價值是**應用不必知道底層是什麼**——同一份 YAML 在不同雲上只要 StorageClass 名稱對得上就能跑。

**access mode 決定了架構可能性**：`ReadWriteOnce`（RWO，只能被**單一節點**掛載讀寫）是多數雲端區塊儲存的能力上限；`ReadWriteMany`（RWX，多節點同時讀寫）需要 NFS、Filestore 這類檔案儲存。多副本共用一份 RWO 的 PVC 是最常見的錯誤——只有一個 Pod 起得來，其他卡在 Pending。

## 詳細解析

**RWO 的「Once」指的是節點不是 Pod**：同一個節點上的多個 Pod 可以共用一份 RWO 磁碟，跨節點才不行。這個細節常被誤解，也解釋了為什麼有時候兩個副本剛好在同一台就沒事、重新排程後就爆炸——這種間歇性故障特別難查。

**動態佈建 vs 靜態佈建**：靜態是管理員預先建好 PV 放在那裡等人來綁；動態是 PVC 指定 StorageClass，由佈建器即時建立。現在幾乎都用動態，因為靜態要預測需求且容易浪費。但要注意動態佈建的 PV 名稱是隨機的，備份與復原流程要以 PVC 為單位思考。

**回收策略決定資料的下場**：`Delete`（多數雲端 StorageClass 的預設）在 PVC 被刪除時**連底層磁碟一起刪掉**；`Retain` 則保留 PV 與資料，需要人工處理。生產環境的重要資料應該用 `Retain` 或至少確認預設值——「刪掉 namespace 導致資料全沒」是真實發生過的事故。

**volumeBindingMode 影響排程**：預設的 `Immediate` 會在 PVC 建立時立刻佈建 PV，但這時還不知道 Pod 會被排到哪個區域，可能佈建在 A 區而 Pod 排到 B 區導致掛不上。`WaitForFirstConsumer` 則延後到 Pod 被排程後才佈建，確保磁碟建在正確的區域。**多可用區叢集應該使用後者**。

**擴容可以、縮容不行**：StorageClass 設定 `allowVolumeExpansion: true` 後可以調大 PVC 的容量，但**沒有縮容機制**。所以初始容量不必抓得太大（可以擴），但也別小到頻繁需要擴。擴容後檔案系統可能需要重新掛載才生效，視 CSI 驅動而定。

## 面試回答方式

用「供給、需求、規格」三個詞把三者定位清楚，並講出間接層的價值——應用不必知道底層是什麼。接著把重點放在 **access mode**，因為那是最容易出實際問題的地方：RWO 是多數雲端區塊儲存的上限，多副本共用一份 RWO 是最常見的錯誤。一定要澄清「Once 指的是節點不是 Pod」，並用它解釋為什麼會出現「同節點就沒事、重新排程就爆」的間歇性故障。實務加分點：回收策略 `Delete` 會連磁碟一起刪，刪 namespace 導致資料全沒是真實事故；`volumeBindingMode` 在多可用區要用 `WaitForFirstConsumer`；以及擴容可以、縮容不行。

## 講稿

三者是供給、需求跟規格的分工。

PV 是實際的儲存資源，屬於叢集層級。PVC 是 Pod 提出的需求，屬於 namespace 層級。StorageClass 是怎麼生出 PV 的規格模板。流程是 Pod 掛 PVC，PVC 依 StorageClass 動態佈建一個 PV 綁定。這個間接層的價值是應用不必知道底層是什麼。

實務上最容易出事的是 access mode。ReadWriteOnce 是多數雲端區塊儲存的上限，ReadWriteMany 要 NFS 這類檔案儲存才有。最常見的錯誤是多副本共用一份 RWO 的 PVC，結果只有一個 Pod 起得來，其他卡在 Pending。

這裡有個細節值得講清楚：RWO 的 Once 指的是節點不是 Pod。同節點的多個 Pod 可以共用，跨節點才不行。所以會出現兩個副本剛好排在同一台就沒事、重新排程之後就爆掉，這種間歇性故障特別難查。

還有一個真的出過事的點。回收策略如果是 Delete，刪掉 PVC 會連底層磁碟一起刪。刪一個 namespace 導致資料全沒，這是真實發生過的事故。

## 常見追問

### PVC 一直 Pending，怎麼查？

**核心答案**：`kubectl describe pvc` 的事件區會直接說明原因。最常見的三種：**沒有指定 StorageClass 且叢集沒有預設的**（PVC 找不到誰來佈建）、**指定的 StorageClass 不存在**（名稱打錯或跨叢集複製 YAML 沒改）、以及 **`volumeBindingMode: WaitForFirstConsumer` 但還沒有 Pod 使用這個 PVC**——最後這種其實是正常行為，不是故障。

**詳細解析**：第三種特別容易誤判。`WaitForFirstConsumer` 的設計就是要等到有 Pod 要用它、確定會被排到哪個區域之後才佈建，所以先建 PVC 再看它 Pending 是預期的，建了 Pod 之後就會綁定。除了這三種，還有配額用盡（namespace 的 ResourceQuota 限制了儲存總量）、雲端配額用盡（該區域的磁碟配額或 IP 額度滿了）、以及 CSI 驅動異常。排查順序建議是先看 `describe pvc` 的事件，再看有沒有對應的 StorageClass（`kubectl get sc`），最後看 CSI 控制器的日誌。GKE 上如果是區域配額問題，事件訊息通常會直接寫出來，不需要猜。

**面試回答方式**：給出明確第一步——`describe pvc` 看事件。列出三種最常見成因，並特別點出 `WaitForFirstConsumer` 造成的 Pending 是正常行為而非故障，這個澄清很能展現實務經驗。加分點是補上配額用盡（namespace 與雲端兩層）與 CSI 異常，並給排查順序。

### 想讓多個 Pod 同時讀寫同一份資料，該怎麼做？

**核心答案**：需要支援 **`ReadWriteMany`** 的儲存——NFS、GCP Filestore、CephFS 這類檔案儲存服務，一般的雲端區塊儲存（Persistent Disk、EBS）做不到。但在採用之前應該先問：**這個共享真的必要嗎**？很多情況下改用物件儲存（GCS）或資料庫，比硬要多個 Pod 共寫同一個檔案系統更合適。

**詳細解析**：RWX 的代價常被低估。檔案儲存的延遲通常明顯高於區塊儲存，而且多寫入者的一致性語意很微妙——NFS 的檔案鎖行為與本地檔案系統不同，多個 Pod 同時寫同一個檔案容易出現非預期結果，應用如果沒有為此設計就會踩坑。成本也較高。所以典型的替代路徑是：使用者上傳的檔案放物件儲存並用簽章網址存取；需要共享的結構化狀態放資料庫或 Redis；只讀的靜態資源直接打進映像檔或用 initContainer 下載。真正適合 RWX 的是那些本來就以檔案系統為介面、又無法改造的既有應用，或是機器學習訓練這類多個工作節點共讀同一份大型資料集的場景。

**面試回答方式**：先給直接答案（需要 RWX 儲存，區塊儲存做不到），但立刻反問「這個共享真的必要嗎」——這個反問比直接給方案更能展現判斷力。列出 RWX 的代價：延遲高、多寫入者一致性語意微妙、成本高。給出替代路徑（物件儲存、資料庫），並說明什麼情況才真正適合 RWX。

### 刪除 namespace 之後，裡面的 PVC 資料還在嗎？

**核心答案**：**看 PV 的回收策略**。如果是 `Delete`（多數雲端 StorageClass 的預設），刪除 namespace 會連帶刪除裡面的 PVC，PV 與底層的實際磁碟也會被一起刪掉，資料永久消失。如果是 `Retain`，PV 會保留下來（狀態變成 `Released`），資料還在，但需要人工處理才能重新使用。

**詳細解析**：這是一個真實造成過資料損失的組合——動態佈建預設 `Delete`，而刪 namespace 是個看起來很日常的清理動作。防護要分幾層：重要資料的 StorageClass 明確設成 `Retain`；用雲端的磁碟刪除保護或快照排程做最後防線；並且用 RBAC 限制誰能刪除 namespace。另外 `Retain` 的 PV 在 PVC 被刪後不會自動被新的 PVC 綁定（狀態卡在 `Released`），需要人工清掉 `claimRef` 才能重用，這個手動步驟正是它的保護作用所在。實務上建議把「有狀態應用」與「無狀態應用」放在不同 namespace，讓日常清理不會誤觸有資料的那一區。

**面試回答方式**：先用回收策略分岔回答，並強調 `Delete` 是多數雲端 StorageClass 的**預設值**——這個「預設就是危險的」是重點。指出這是真實造成資料損失的組合，因為刪 namespace 看起來很日常。給出分層防護：StorageClass 設 `Retain`、雲端層的刪除保護與快照、RBAC 限制。加分點是建議有狀態與無狀態分開放在不同 namespace。

## 相關

- [[002-deployment-vs-statefulset.md]]
- [[020-namespace-quota-limitrange.md]]
- [[007-configmap-vs-secret.md]]
