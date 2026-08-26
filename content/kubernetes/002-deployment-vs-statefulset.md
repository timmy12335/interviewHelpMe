---
id: kubernetes-002
category: kubernetes
slug: deployment-vs-statefulset
title: Deployment 與 StatefulSet 的差異
difficulty: medium
tags: [Deployment, StatefulSet, 工作負載, 有狀態應用]
source: original
---

# 題目

Deployment 和 StatefulSet 都能管理一組 Pod 副本，差別在哪？什麼情況下非用 StatefulSet 不可？

## 核心答案

核心差異是 **Pod 有沒有「身分」**。Deployment 底下的 Pod 是**可互換的**——名稱帶隨機後綴、順序不保證、任何一個都能被任何一個取代，適合無狀態應用。StatefulSet 則給每個 Pod 一個**穩定且可預測的身分**，具體表現在三件事：**穩定的名稱**（`web-0`、`web-1`，重建後名稱不變）、**穩定的網路識別**（配合 headless Service，每個 Pod 有自己的 DNS 名稱）、**穩定的儲存**（透過 `volumeClaimTemplates` 為每個 Pod 各自建立一份 PVC，Pod 重建後掛回**原本那一份**資料）。此外 StatefulSet 的**建立、擴縮與滾動更新都是有序的**——依序 0、1、2 建立，縮容時反序刪除，更新時一個就緒才動下一個。非用不可的場景是**副本之間彼此不對等**的系統：資料庫主從、Kafka、ZooKeeper、Elasticsearch 這類需要各節點認得彼此、且各自持有不同資料分片的應用。

## 詳細解析

**「可互換」與「有身分」的實際後果**：Deployment 滾動更新時，新 Pod 的名稱、IP 全部是新的，舊 Pod 直接消失，因為對無狀態應用來說誰服務這個請求都一樣。但如果是資料庫的主節點，其他節點必須知道「主節點是誰」，一旦名稱每次都變，叢集就無法自我組織。StatefulSet 保證 `mysql-0` 永遠是 `mysql-0`，重建後其他節點還找得到它。

**穩定儲存是靠 volumeClaimTemplates**：Deployment 如果掛 PVC，所有副本會共用**同一個** PVC——這對多數儲存類型是災難，因為 `ReadWriteOnce` 的磁碟只能掛在一個節點上，副本一多就有 Pod 卡在 Pending。StatefulSet 用 `volumeClaimTemplates` 讓每個 Pod 各自建一份 PVC（`data-web-0`、`data-web-1`），而且 **Pod 刪除時 PVC 不會被一起刪掉**，重建的 `web-0` 會掛回原來那份資料。這是 StatefulSet 最實質的價值。

**有序性的代價**：擴縮與更新都是一個一個來，所以 StatefulSet 的部署速度明顯慢於 Deployment。而且一旦某個序號的 Pod 卡住不就緒，後面的序號**永遠不會開始**——這在 Deployment 上不會發生。這個「卡住就整條卡住」的特性在排查時很關鍵：看到 StatefulSet 只起到一半，要先看卡住的那一個。

**headless Service 是必要搭配**：StatefulSet 的穩定 DNS 名稱不是它自己給的，而是要搭配 `clusterIP: None` 的 headless Service。一般 Service 給的是一個虛擬 IP 做負載平衡，headless Service 則直接把 DNS 解析成各個 Pod 的實際 IP，讓呼叫方能指名找 `mysql-0.mysql.default.svc.cluster.local`。少了它，穩定名稱就沒有辦法被解析。

**不要為了「有掛磁碟」就選 StatefulSet**：常見的誤用是「只要要存檔案就用 StatefulSet」。判準不是有沒有磁碟，而是**副本之間對不對等**。如果三個副本掛的是同一份共享儲存（例如 `ReadWriteMany` 的 NFS）、任何一個都能處理任何請求，那它其實是無狀態的，用 Deployment 就好。

## 面試回答方式

先給一句話定調——差別在 Pod 有沒有身分，而不是有沒有掛磁碟。接著把 StatefulSet 的三個「穩定」講清楚：名稱、網路識別、儲存，並強調儲存是靠 `volumeClaimTemplates` 為每個 Pod 各建一份 PVC、Pod 刪了 PVC 還在。有序建立／刪除／更新要主動提，並補上它的代價——某個序號卡住，後面永遠不會開始。加分點是講反面：只是要掛磁碟、副本彼此對等的情況不該用 StatefulSet，判準是副本對不對等。能提到 headless Service 是穩定 DNS 的必要搭配會更完整。

## 講稿

差別在 Pod 有沒有身分，不在有沒有掛磁碟。這是很多人第一個搞錯的地方。

Deployment 底下的 Pod 是可互換的，名稱帶隨機後綴，誰取代誰都無所謂，因為無狀態應用不在乎是哪一個實例在服務。StatefulSet 則給每個 Pod 一個固定身分，表現在三件事上。

名稱穩定，永遠是 web-0、web-1，重建後不變。網路識別穩定，配合 headless Service，每個 Pod 有自己的 DNS 名稱可以被指名找到。儲存穩定，用 volumeClaimTemplates 為每個 Pod 各建一份 PVC，Pod 刪掉 PVC 還在，重建的 web-0 掛回原本那份資料。

另外它的建立、擴縮、更新都是有序的。代價是慢，而且某個序號卡住不就緒，後面的序號永遠不會開始，這點排查時要記得。

我想補一個反面。不要因為「要存檔案」就選 StatefulSet。如果三個副本掛的是同一份共享儲存、任何一個都能處理任何請求，那它本質上是無狀態的，用 Deployment 就好。真正的判準是副本之間對不對等。

## 常見追問

### Deployment 如果掛了 PVC，三個副本會發生什麼事？

**核心答案**：三個副本會嘗試掛載**同一個** PVC。如果底層儲存是 `ReadWriteOnce`（多數雲端區塊儲存都是），那份磁碟同時只能掛在一個節點上，於是只有恰好被排到那個節點的 Pod 起得來，其他 Pod 會一直卡在 **Pending** 或 **ContainerCreating**，`kubectl describe` 會看到 volume 掛載失敗的事件。

**詳細解析**：這是「有磁碟就用 StatefulSet」這個誤解的反面——真正的坑不是用了 Deployment，而是**多副本共用一份 ReadWriteOnce 儲存**。如果儲存是 `ReadWriteMany`（NFS、Filestore 這類），多個 Pod 確實可以同時掛載，這時 Deployment 加共享 PVC 是完全合理的設計，例如多個副本共讀同一份靜態資源。所以判斷順序應該是：先問副本之間對不對等，再問儲存的 access mode 支不支援多掛。單副本的 Deployment 掛 ReadWriteOnce 也沒問題，但要注意滾動更新時新舊 Pod 會短暫並存，一樣會卡住，這時要把更新策略改成 `Recreate`。

**面試回答方式**：先講具體症狀——只有一個 Pod 起得來，其他卡在 Pending，describe 看得到掛載失敗。再點出關鍵不是 Deployment 本身，而是 ReadWriteOnce 不支援多掛；如果是 ReadWriteMany 就完全合理。加分點是提到單副本 Deployment 滾動更新時新舊並存也會卡，要改成 Recreate。

### StatefulSet 縮容時，PVC 會跟著被刪除嗎？

**核心答案**：預設**不會**。把副本數從 3 縮到 1，`web-1`、`web-2` 這兩個 Pod 會被刪掉，但 `data-web-1`、`data-web-2` 這兩份 PVC 會留著。這是刻意的保護設計——有狀態資料誤刪無法復原，所以 K8s 選擇寧可留下孤兒 PVC 也不自動清理。副作用是這些 PVC 會持續佔用（並計費）雲端磁碟，需要人工確認後刪除。

**詳細解析**：這個設計的好處是縮容可逆——之後再擴回 3，新的 `web-1` 會掛回原本那份資料，就像它從來沒離開過。壞處是成本容易失控，尤其在頻繁擴縮的環境裡，孤兒 PVC 會默默累積。較新的 Kubernetes 版本提供了 `persistentVolumeClaimRetentionPolicy`，可以分別設定「StatefulSet 被刪除時」和「縮容時」要保留還是刪除 PVC，讓這件事變成明確的選擇而不是隱含行為。實務上如果是真正的資料庫，維持預設保留是對的；如果是可重建的快取類工作負載，設成縮容時刪除比較省事。

**面試回答方式**：先給結論——預設不刪，並解釋這是保護有狀態資料的刻意設計。點出兩面：好處是縮容可逆、擴回來資料還在；壞處是孤兒 PVC 持續計費。加分點是提到 `persistentVolumeClaimRetentionPolicy` 可以把這件事變成明確設定。

### 為什麼 StatefulSet 需要 headless Service？一般的 Service 不行嗎？

**核心答案**：因為一般 Service 給的是**一個虛擬 IP 做負載平衡**，呼叫方打過去會被隨機導到某一個 Pod——這正好抹掉了 StatefulSet 想保留的身分。headless Service（`clusterIP: None`）不分配虛擬 IP，DNS 查詢直接回傳所有 Pod 的實際 IP，並且讓每個 Pod 有自己的 DNS 名稱，呼叫方才能指名找 `mysql-0` 而不是「隨便一台 mysql」。

**詳細解析**：有狀態叢集的成員需要**互相指名**。從節點要知道主節點是哪一個、Kafka broker 要知道其他 broker 在哪，這些都不能靠負載平衡解決。headless Service 提供的 `<pod>.<service>.<namespace>.svc.cluster.local` 這個格式，讓每個實例有一個跨重建都穩定的位址。值得注意的是這兩種 Service 可以並存而且常常一起用——用 headless Service 讓叢集內部成員互相發現，另外再開一個一般的 ClusterIP Service 給外部客戶端做讀取負載平衡。所以「該用哪一個」其實是個假問題，真實答案通常是兩個都要，各自解決不同的問題。

**面試回答方式**：講清楚一般 Service 的負載平衡剛好抹掉身分，這是重點。接著說明 headless 不配虛擬 IP、DNS 直接回 Pod IP，讓成員能互相指名。加分點是點出兩者常常並存——headless 給叢集內部互相發現，一般 Service 給外部客戶端做負載平衡。

## 相關

- [[003-daemonset-vs-others.md]]
- [[019-pv-pvc-storageclass.md]]
- [[005-service-types-vs-ingress.md]]
