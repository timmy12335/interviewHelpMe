---
id: kubernetes-007
category: kubernetes
slug: configmap-vs-secret
title: ConfigMap 與 Secret 的差異
difficulty: easy
tags: [ConfigMap, Secret, 設定管理, base64, etcd]
source: original
---

# 題目

ConfigMap 和 Secret 有什麼差別？Secret 只是 base64 編碼，這樣算安全嗎？

## 核心答案

功能上兩者幾乎一樣——都是鍵值對，都能以**環境變數**或**掛載成檔案**的方式提供給 Pod，都能讓設定與映像檔解耦。差別在**用途語意與周邊處理**：ConfigMap 放非敏感設定，Secret 放密碼、Token、憑證。

至於 base64，**它不是加密，只是編碼**，任何人拿到都能還原。Secret 真正的安全性來自別的地方：**RBAC 可以獨立控管誰能讀 Secret**（不會因為能看 ConfigMap 就能看 Secret）、**值不會出現在 `kubectl describe` 與多數日誌裡**、**可以設定 etcd 靜態加密（encryption at rest）**、掛載時用 tmpfs 放在記憶體而非寫進磁碟。所以正確的說法是：**Secret 預設並不安全，它提供的是「可以被保護的位置」，實際安全程度取決於你有沒有開啟那些保護**。真正敏感的東西，實務上會交給外部密鑰管理服務（GCP Secret Manager、Vault），K8s 只保留取用的憑證。

## 詳細解析

**兩種注入方式的差別很重要**：用**環境變數**注入，值在容器啟動時就固定了，**之後更新 ConfigMap 不會生效**，必須重啟 Pod；而且環境變數容易在崩潰堆疊、`/proc` 或日誌裡外洩。用**檔案掛載**注入，kubelet 會定期同步，更新後檔案內容**會自動改變**（有數十秒的延遲），但**應用必須自己重讀檔案**才會用到新值——很多人以為掛載就等於熱更新，其實少了應用端這一半。

**base64 的存在理由**：它是為了讓二進位內容（憑證、金鑰檔）能安全地放進 YAML／JSON，不是為了保密。這也是為什麼 `kubectl get secret -o yaml` 直接就能看到編碼後的值——它從來沒打算隱藏什麼。

**etcd 靜態加密要另外開**：預設情況下 Secret 在 etcd 裡是**明文**存放的（只有 base64）。也就是說拿到 etcd 備份就等於拿到所有 Secret。要防這件事必須設定 EncryptionConfiguration。在 GKE 這類託管環境，控制平面由 Google 管理，可以額外啟用以 Cloud KMS 金鑰做的 Application-layer Secrets Encryption。

**不要把 Secret 提交進 Git**：這是最常見的實際外洩途徑，而且 Git 歷史難以徹底清除。GitOps 流程要用 Sealed Secrets、SOPS 這類加密後才進版控的方案，或者根本不放——改用 External Secrets Operator 從外部密鑰服務同步進來。

**能讀 Pod 就能讀它的 Secret**：RBAC 保護的是 API 層面。如果某人能在該 namespace 建立 Pod，他就可以掛載該 namespace 的任何 Secret 並把內容印出來。所以 Secret 的隔離邊界實際上是 **namespace + 誰能建立工作負載**，不只是「誰能 get secret」。

## 面試回答方式

先講兩者功能幾乎相同，差別在用途語意與周邊處理，不要一開始就陷進 base64。接著正面回答 base64 那一半——它是編碼不是加密，存在理由是讓二進位內容能放進 YAML。重點放在「Secret 真正的保護來自哪裡」：獨立的 RBAC、不出現在 describe、可開啟 etcd 靜態加密、掛載走 tmpfs。給出那句定調——**Secret 預設不安全，它提供的是可以被保護的位置**。加分點有三個：環境變數注入無法熱更新且容易外洩、檔案掛載會自動同步但應用要自己重讀、以及「能在該 namespace 建立 Pod 的人就能讀該 namespace 的 Secret」這個常被忽略的邊界。

## 講稿

功能上這兩個幾乎一樣，都是鍵值對，都能用環境變數或檔案掛載給 Pod。差別在用途語意跟周邊處理：ConfigMap 放非敏感設定，Secret 放密碼、Token、憑證。

至於 base64，它是編碼不是加密，任何人拿到都能還原。它存在的理由只是讓憑證這種二進位內容能放進 YAML，從來沒打算隱藏什麼。

Secret 真正的保護來自別的地方。RBAC 可以獨立控管誰能讀 Secret，值不會出現在 describe 裡，可以設定 etcd 靜態加密，掛載時是放在記憶體的 tmpfs 而不是寫進磁碟。

所以我會這樣定調：Secret 預設並不安全，它提供的是一個可以被保護的位置，實際安全到什麼程度，取決於你有沒有把那些保護打開。

有一個容易被忽略的邊界要提。RBAC 保護的是 API 層面，但如果一個人能在那個 namespace 建立 Pod，他就可以掛載該 namespace 的任何 Secret 再印出來。所以實際的隔離邊界是 namespace 加上誰能建工作負載，不只是誰能 get secret。

真正敏感的東西，實務上會交給 Secret Manager 或 Vault，K8s 只留取用的憑證。

## 常見追問

### 更新了 ConfigMap，為什麼 Pod 裡的設定沒有變？

**核心答案**：**看你是怎麼注入的**。如果是用**環境變數**注入，值在容器啟動時就固定了，更新 ConfigMap 完全不會生效，必須重啟 Pod。如果是**檔案掛載**，kubelet 會定期同步，檔案內容確實會自動更新（延遲數十秒），但**應用必須自己重讀檔案**——很多人以為掛載就等於熱更新，漏掉了應用端這一半。

**詳細解析**：實務上有三種做法。最單純的是接受要重啟，並讓重啟自動發生——在 Deployment 的 Pod template 加一個帶有 ConfigMap 內容雜湊的 annotation，內容一變雜湊就變，Deployment 自然觸發滾動更新。第二種是應用端實作檔案監看（inotify）或定期重讀，適合設定變更頻繁、又不想重啟的服務。第三種是用專門的設定中心，K8s 只提供連線資訊。要注意用 `subPath` 掛載的檔案**不會**被自動更新，這是個容易踩的例外。另外滾動重啟時記得確認新設定是對的，否則會把壞設定滾到所有副本上。

**面試回答方式**：先用注入方式分流——環境變數不會變、檔案掛載會變但應用要重讀。點出「掛載等於熱更新」是常見誤解。給出三種實務做法，並特別推薦 annotation 雜湊觸發滾動更新這個乾淨的解法。加分點是提到 `subPath` 掛載不會自動更新這個例外。

### Secret 應該放在 Git 裡嗎？GitOps 流程要怎麼處理？

**核心答案**：**明文的 Secret 絕對不能進 Git**，這是最常見的實際外洩途徑，而且 Git 歷史難以徹底清除——就算之後刪掉，commit 歷史、fork、快取裡都還在。GitOps 的做法有兩條：一是**加密後才進版控**（Sealed Secrets、SOPS），Git 裡放的是只有叢集能解開的密文；二是**根本不放**，用 External Secrets Operator 從 GCP Secret Manager、Vault 這類外部服務同步進叢集。

**詳細解析**：兩條路的取捨在於「你想不想讓 Git 成為唯一真實來源」。Sealed Secrets 保持了 GitOps 的核心精神——所有東西都在 Git，可審計、可回溯，代價是金鑰輪替時要重新加密所有 Secret，而且解密金鑰本身變成新的單點。External Secrets 把密鑰的生命週期交給專業的密鑰服務，支援自動輪替、細緻的存取稽核，但 Git 就不再是完整的真實來源，環境重建時多一個外部依賴。實務上中大型團隊多半選 External Secrets，因為輪替與稽核的需求終究會出現。無論選哪條，都要搭配 pre-commit 掃描或 CI 的秘密掃描，因為最終防線是「不小心貼上去」這種人為疏失。

**面試回答方式**：先斬釘截鐵說明文不能進 Git，並點出 Git 歷史難清除這個關鍵理由。給出兩條路並用「Git 要不要當唯一真實來源」來對比取捨。加分點是說明中大型團隊多半選 External Secrets（輪替與稽核需求），以及無論哪條都要配秘密掃描擋人為疏失。

### 為什麼有人說「能建立 Pod 就等於能讀所有 Secret」？

**核心答案**：因為 RBAC 對 Secret 的保護只在 **API 層面**——它擋的是 `kubectl get secret`。但如果某人有權在某個 namespace 建立 Pod，他可以寫一個 Pod spec 去掛載該 namespace 的**任何** Secret，然後在容器裡直接把內容印出來或送到外部。整個過程完全合法，不需要 `get secret` 權限。

**詳細解析**：這代表 Secret 的實際隔離邊界是 **namespace 加上「誰能在這個 namespace 建立工作負載」**，而不是單純的 Secret 讀取權限。所以真正的隔離要靠 namespace 切分——把不同信任等級的工作負載放在不同 namespace，並嚴格控管每個 namespace 的建立權限。這也是為什麼多租戶場景下「一個叢集多個 namespace」的隔離強度有限，安全要求高時會傾向用多個叢集。延伸來看，這個道理對 ServiceAccount 也成立：能建立 Pod 就能指定要用哪個 ServiceAccount，等於能取得那個身分的權限，所以高權限的 ServiceAccount 必須放在受管控的 namespace 裡。

**面試回答方式**：講清楚 RBAC 只擋 API 層面，而建立 Pod 是另一條合法路徑。點出真正的邊界是 namespace 加建立工作負載的權限。加分點有兩個：多租戶時 namespace 隔離強度有限、安全要求高會用多叢集；以及同樣道理適用於 ServiceAccount，高權限帳號要放在受控 namespace。

## 相關

- [[019-pv-pvc-storageclass.md]]
- [[020-namespace-quota-limitrange.md]]
- [[021-rbac-serviceaccount-workload-identity.md]]
