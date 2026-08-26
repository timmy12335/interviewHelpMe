---
id: kubernetes-018
category: kubernetes
slug: pod-lifecycle-and-termination
title: Pod 的生命週期與優雅終止：滾動更新為什麼還是會掉請求？
difficulty: hard
tags: [Pod, 生命週期, SIGTERM, preStop, 優雅終止, 滾動更新]
source: original
---

# 題目

Pod 從被刪除到真正消失經過哪些階段？為什麼明明設定了滾動更新，部署時還是會有少量請求失敗？

## 核心答案

刪除 Pod 時，K8s **同時**啟動兩件互不等待的事：**（1）** 把 Pod 從 **Endpoints 移除**，讓 kube-proxy 更新各節點的轉發規則；**（2）** 對容器執行 **preStop hook**，然後送出 **SIGTERM**，並開始倒數 `terminationGracePeriodSeconds`（預設 30 秒），時間到還沒退出就送 **SIGKILL**。

**掉請求的根本原因就在「同時」這兩個字**——移除 Endpoints 需要經過 controller 更新、kube-proxy 改寫每個節點的規則，這條鏈路有**數百毫秒到數秒**的傳播延遲。如果應用一收到 SIGTERM 就立刻關閉連線，那些在傳播完成前送進來的請求就會撞上一個正在關閉的行程。

標準解法是**在 preStop 加一個短暫的 sleep**（通常 5–15 秒），讓「移除 Endpoints」先跑完，應用才開始關閉。另外應用本身必須**正確處理 SIGTERM**——停止接受新連線但把手上的請求做完再退出；很多容器的問題是根本沒有處理信號（例如用 shell 包裝導致信號沒傳到主行程），於是每次都等到寬限期結束被 SIGKILL 硬砍。

## 詳細解析

**完整的終止順序**：Pod 進入 `Terminating` → 同時觸發 Endpoints 移除與 preStop → preStop 執行完畢後送 SIGTERM → 應用開始優雅關閉 → 全部容器退出或寬限期到期 → SIGKILL → Pod 物件被移除。關鍵是 preStop **會佔用寬限期的時間**——`terminationGracePeriodSeconds: 30` 配上 15 秒的 preStop sleep，應用實際只剩約 15 秒可以收尾。

**信號傳不到主行程是常見陷阱**：如果 Dockerfile 用 `CMD ["sh", "-c", "myapp"]`，PID 1 是 shell，SIGTERM 送給 shell 而 shell 不會轉發給子行程，應用完全收不到。用 exec 形式（`CMD ["myapp"]`）或在啟動指令加 `exec` 才能讓應用成為 PID 1。症狀是每次終止都剛好卡滿整個寬限期，這是個很好認的訊號。

**滾動更新的參數決定了風險**：`maxUnavailable` 控制同時能有幾個舊 Pod 下線，`maxSurge` 控制能多開幾個新 Pod。把 `maxUnavailable` 設成 0 可以確保容量不下降，但需要額外的資源空間。更關鍵的是**新 Pod 必須真的就緒才算數**——如果 Readiness 探針設得太寬鬆（例如只檢查 port 有沒有開），K8s 會以為新 Pod 可以服務而提早下線舊 Pod，那才是掉請求的大宗。

**Readiness 與終止是同一條鏈路的兩端**：上線時 Readiness 決定何時開始收流量，下線時 Endpoints 移除決定何時停止收流量。兩端都靠同一套 Endpoints 傳播機制，所以兩端都有延遲，設計時要一起考慮。

**客戶端也有責任**：即使伺服器端做得完美，長連線與連線池仍可能持有指向已終止 Pod 的連線。呼叫方需要合理的重試與退避、連線的最大存活時間，以及對可重試錯誤（連線被重置）與不可重試錯誤的區分。在分散式系統裡完全消除這個空窗並不現實，重試是必要的補償。

## 面試回答方式

先講「同時啟動兩件互不等待的事」——這是理解掉請求的關鍵，比按時間順序背流程有用得多。接著點出根本原因是 Endpoints 移除有傳播延遲，而應用可能已經開始關閉。給出標準解法：preStop 加 sleep 讓移除先完成，並提醒 **preStop 會佔用寬限期**。實務加分點三個：信號傳不到主行程（shell 包裝導致 PID 1 是 shell），症狀是每次都卡滿寬限期；Readiness 設太寬鬆會讓新 Pod 提早被認為就緒、舊 Pod 提早下線，這才是掉請求的大宗；以及客戶端的重試是必要補償，這個空窗無法完全消除。

## 講稿

刪除一個 Pod 的時候，K8s 會同時啟動兩件互不等待的事。

第一件是把 Pod 從 Endpoints 移除，讓 kube-proxy 更新轉發規則。第二件是執行 preStop，然後送 SIGTERM，開始倒數寬限期，預設三十秒，時間到就 SIGKILL。

掉請求的原因就在「同時」這兩個字。移除 Endpoints 這條鏈路有數百毫秒到數秒的延遲，如果應用一收到 SIGTERM 就立刻關閉，那些在傳播完成前送進來的請求就會撞上一個正在關閉的行程。

標準解法是在 preStop 加五到十五秒的 sleep，讓移除先跑完。要注意 preStop 會佔用寬限期，三十秒配十五秒 sleep，應用實際只剩十五秒收尾。

有個常見陷阱。Dockerfile 寫成 sh -c 包住應用的話，PID 1 是 shell，SIGTERM 送給它而它不會轉發。症狀很好認：每次終止都剛好卡滿整個寬限期。

不過掉請求的最大宗其實是另一件事：Readiness 設太寬鬆，K8s 以為新 Pod 能服務了就提早下線舊 Pod。

## 常見追問

### terminationGracePeriodSeconds 設多久合適？

**核心答案**：**由最長的合理請求處理時間決定，再加上 preStop 的 sleep**。如果服務的 P99 回應時間是 2 秒，那 5 秒的收尾加上 10 秒的 preStop sleep，總共 15–20 秒就很充裕。長連線服務（WebSocket、gRPC streaming）需要更長，因為要等連線自然結束或主動通知客戶端遷移；批次工作可能需要好幾分鐘。**沒有通用答案，但盲目調大是有代價的**。

**詳細解析**：設太長的代價是**節點排空與滾動更新都會變慢**——節點升級時要等所有 Pod 一個個走完寬限期，設成 10 分鐘會讓整個維運流程慢得難以接受，緊急情況下也拖延了恢復。設太短則是請求被硬砍。判斷方式應該是量測而非猜測：觀察 Pod 從 Terminating 到真正消失實際花了多久，如果一直等於寬限期上限，那通常代表應用沒有正確處理 SIGTERM，該修的是應用而不是調大這個值。另外要記得這個值是**每個 Pod** 的，`kubectl delete` 時可以用 `--grace-period` 覆寫，緊急時設 0 會直接 SIGKILL，但那應該是最後手段。

**面試回答方式**：給出計算方式——最長合理處理時間加 preStop sleep，並依服務型態分場景（一般請求、長連線、批次）。重點放在**設太長的代價**：節點排空與滾動更新變慢、緊急恢復被拖延。加分點是給出診斷法——實際終止時間如果一直等於上限，該修的是應用沒處理 SIGTERM。

### 已經加了 preStop sleep，為什麼還是偶爾掉請求？

**核心答案**：優先懷疑**上線那一端而不是下線那一端**。滾動更新是「新 Pod 就緒 → 舊 Pod 下線」的交替，如果 Readiness 探針太寬鬆（只檢查 TCP port 或一個永遠回 200 的端點），新 Pod 在還沒暖機完成時就被判定就緒，K8s 隨即下線舊 Pod，於是流量被導到一個還不能好好服務的實例——這個影響通常比終止端的空窗大得多。

**詳細解析**：其他值得檢查的方向有幾個。長連線與連線池會持有指向舊 Pod 的連線，即使 Endpoints 已更新也不影響既有連線，需要設定連線最大存活時間或讓客戶端支援優雅重連。使用外部負載平衡器時，它的健康檢查間隔可能比 Endpoints 更新慢，這時 container-native load balancing（直接對 Pod 做健康檢查）能明顯改善。還有 `maxSurge` 與 `maxUnavailable` 的組合——`maxUnavailable` 不為 0 代表容量會在更新期間下降，若原本就沒有餘裕，剩下的實例可能因為負載暴增而變慢甚至逾時。排查時建議先量化：在部署期間觀察錯誤發生的時間點是集中在新 Pod 剛就緒時，還是舊 Pod 終止時，兩者指向完全不同的原因。

**面試回答方式**：先把懷疑方向轉到上線端——Readiness 太寬鬆讓新 Pod 提早被認為就緒，這是最大宗。再列出長連線、外部 LB 健康檢查較慢、`maxUnavailable` 造成容量下降這幾個方向。加分點是給出量化排查法：看錯誤集中在新 Pod 就緒時還是舊 Pod 終止時。

### Pod 一直卡在 Terminating 狀態，刪不掉，怎麼處理？

**核心答案**：最常見的原因是 **finalizer**。物件上如果有 finalizer，K8s 會等對應的控制器完成清理工作並把 finalizer 移除後才真正刪除；如果那個控制器已經不存在或壞掉，Pod 就會永遠停在 Terminating。其次是**節點失聯**——kubelet 連不上，沒有人回報容器已經停止，apiserver 就無法確認可以移除物件。

**詳細解析**：處理方式要先分清楚是哪一種。finalizer 造成的，先看 `kubectl get pod -o yaml` 的 `metadata.finalizers` 有什麼，確認負責的控制器狀況——修好控制器讓它正常清理是正解，手動移除 finalizer 是最後手段，因為那等於跳過了清理工作，可能留下孤兒的外部資源（例如雲端磁碟沒有卸載）。節點失聯造成的，正確做法是先確認節點真的死了（而不是網路暫時中斷），再刪除 Node 物件讓 K8s 確信上面的 Pod 已不存在。**強制刪除（`--force --grace-period=0`）要非常謹慎**——它只是移除 apiserver 裡的物件，如果節點其實還活著，那個容器仍在運行，於是形成雙份實例，對有狀態應用可能造成資料損壞。

**面試回答方式**：先給兩個成因（finalizer、節點失聯）並說明各自的機制。強調正解是修因而不是強刪——finalizer 要修控制器、節點失聯要確認節點真的死了再刪 Node 物件。加分點是明確警告強制刪除的風險：只是移除 apiserver 的物件，容器可能還在跑，形成雙份實例。

## 相關

- [[008-probes-liveness-readiness-startup.md]]
- [[006-kube-proxy-vs-coredns.md]]
- [[017-kubelet-and-cri.md]]
