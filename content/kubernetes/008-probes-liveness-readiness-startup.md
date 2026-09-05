---
id: kubernetes-008
category: kubernetes
slug: probes-liveness-readiness-startup
title: Liveness、Readiness、Startup 三種探針的差異
difficulty: medium
tags: [Probe, Liveness, Readiness, Startup, 自我修復, 健康檢查]
source: original
---

# 題目

Liveness、Readiness、Startup 三種探針分別在解決什麼問題？失敗時各自會發生什麼事？

## 核心答案

差別在**失敗之後 K8s 做什麼**，這是唯一該記的判準。

**Liveness 失敗 → 重啟容器**。它回答的是「這個行程還有救嗎」，用來處理死結、無限迴圈這類**重啟才能解決**的狀態。Readiness 失敗 → 把 Pod 從 Endpoints 移除、停止導流量，但不重啟。它回答的是「現在能不能接請求」，用來處理暖機中、下游依賴暫時不可用這類**等一下就會好**的狀態。Startup 失敗 → 重啟容器；但在它成功之前，Liveness 與 Readiness 都被暫停。它專門解決「啟動很慢的應用被 Liveness 誤殺」的問題——沒有它，你只能把 Liveness 的 `initialDelaySeconds` 設得很長，結果是啟動後真的死掉也要等很久才被發現。

最常見的錯誤是**把兩者設成同一個端點**：下游資料庫短暫不可用時，Readiness 應該只是暫時不收流量，但如果 Liveness 也檢查資料庫，整批 Pod 會被一起重啟，把小故障放大成全面雪崩。

## 詳細解析

**Liveness 要檢查「自己」，Readiness 才檢查「依賴」**：這是設計探針的核心原則。Liveness 應該只驗證行程本身還能回應——重啟能修好的問題才屬於它。資料庫連不上、下游 API 逾時，重啟這個 Pod 完全沒用，那是 Readiness 的範圍。違反這條原則，就是把外部故障轉換成自己的重啟風暴。

**Readiness 是 Endpoints 的閘門**：Service 底下的 Endpoints 只收錄 Readiness 通過的 Pod。所以「未就緒不收流量」在實作上就是「它沒被寫進 Endpoints，kube-proxy 的轉發規則裡沒有它」。這也代表 Readiness 有傳播延遲——狀態變化要經過 controller 更新 Endpoints、kube-proxy 改規則，不是瞬間生效。

**Startup 探針解決的具體問題**：一個 JVM 應用可能要 90 秒才起得來。沒有 Startup 探針時，Liveness 的 `initialDelaySeconds` 必須大於 90 秒，於是應用啟動完成後若在第 100 秒死掉，也要等到探針週期才被發現，而且這個長延遲永遠存在。有了 Startup 探針，你可以給它寬鬆的 `failureThreshold × periodSeconds`（例如 30 次 × 5 秒 = 150 秒容忍）讓應用慢慢起，一旦它成功，Liveness 立刻切換成緊湊的設定（例如每 5 秒一次、失敗 3 次就重啟）。

**三種檢查方式與其陷阱**：`httpGet` 最常用但要注意它從 kubelet 發出，不經過 Service；`tcpSocket` 只驗 port 開著，行程 hang 住時仍然會通過，過於寬鬆；`exec` 每次都要在容器內起一個行程，週期短時開銷不可忽略。另外探針的逾時預設只有 1 秒，負載高時很容易誤判，這是「Pod 莫名其妙一直重啟」的常見原因。

**沒設探針比設錯好嗎**：沒設 Readiness 時，Pod 一 Running 就會收到流量，滾動更新期間會有一批請求打到還沒暖機完成的實例。沒設 Liveness 時，卡死的 Pod 會永遠留著吃流量。但設錯的 Liveness 造成的重啟風暴，破壞力通常大於沒設。所以順序上應該**先把 Readiness 設對，Liveness 寧可保守**。

## 面試回答方式

開頭就給判準——三者的差別在「失敗之後 K8s 做什麼」，不要背定義。接著一句話講完三種後果：Liveness 重啟、Readiness 移出 Endpoints 不重啟、Startup 成功前暫停另外兩者。核心原則一定要講：**Liveness 檢查自己、Readiness 才檢查依賴**，並給出違反它的具體災難——Liveness 也檢查資料庫，下游一抖整批 Pod 一起重啟，小故障變雪崩。Startup 的價值要用具體場景說明：沒有它就得把 `initialDelaySeconds` 設很長，代價是啟動後真的死掉也要等很久才發現。加分點是探針逾時預設只有 1 秒，高負載下誤判是「Pod 莫名重啟」的常見原因。

## 講稿

三者的差別只有一個判準：失敗之後 K8s 做什麼。

Liveness 失敗會重啟容器，它問的是這個行程還有沒有救。Readiness 失敗會把 Pod 從 Endpoints 移除、停止導流量，但不重啟。Startup 失敗也會重啟，但在它成功之前，另外兩個探針都被暫停。

設計時有一條原則最關鍵：Liveness 檢查自己，Readiness 才檢查依賴。重啟能修好的問題才屬於 Liveness，比如死結。資料庫連不上、下游逾時，重啟這個 Pod 完全沒用。

違反這條原則的後果很具體。如果 Liveness 也去檢查資料庫，下游一抖，整批 Pod 會被同時重啟，一個小故障就被放大成全面雪崩。

Startup 解決的是慢啟動被誤殺。JVM 應用可能要九十秒才起得來，沒有它你只能把 Liveness 的初始延遲設很長，代價是啟動後真的死掉也要等很久才發現。有了它就能啟動期寬鬆、啟動完切成緊湊設定。

還有個常見坑：探針逾時預設只有一秒，高負載時很容易誤判，這是 Pod 莫名一直重啟的常見原因。

## 常見追問

### 為什麼有人說「Liveness 探針設錯比不設更危險」？

**核心答案**：因為設錯的 Liveness 會**主動製造故障**，而不設只是少了一層修復。最典型的是 Liveness 檢查了外部依賴：資料庫短暫抖動時，所有 Pod 的 Liveness 同時失敗、同時被重啟，重啟後又同時湧向剛恢復的資料庫，把它再次打垮——這就形成了一個自我維持的重啟迴圈。另一個常見版本是逾時設得太緊，高負載時探針自己逾時，於是流量越高、重啟越多、剩下的 Pod 負載越重。

**詳細解析**：兩個案例的共同結構是**正回饋**——探針的反應讓情況更糟，而不是更好。所以設計 Liveness 時的心態應該是保守：只檢查最基本的「行程還能回應」，逾時和 `failureThreshold` 都寧可寬鬆，因為誤殺的代價遠大於晚幾秒發現。實務上很多成熟的服務甚至只設 Readiness 不設 Liveness，理由是應用層的問題交給重試與熔斷處理，真正卡死的行程由外部監控告警後人工介入，比讓 K8s 自動重啟更可控。要設的話，也應該讓 Liveness 的門檻明顯寬鬆於 Readiness。

**面試回答方式**：用「主動製造故障 vs 少一層修復」定調。給出正回饋迴圈這個結構——重啟讓情況更糟，並用資料庫抖動與高負載逾時兩個具體案例。加分點是提到成熟服務常常只設 Readiness 不設 Liveness，並說明理由。

### Readiness 探針失敗時，正在處理中的請求會怎樣？

**核心答案**：**不會被中斷**。Readiness 失敗只是讓 Pod 從 Endpoints 移除、不再收到**新**流量，容器本身照常運行，既有連線與處理中的請求會正常跑完。這正是它和 Liveness 的關鍵差異——Liveness 失敗是直接重啟容器，處理中的請求會被硬生生切斷。

**詳細解析**：不過「不再收到新流量」有傳播延遲。Endpoints 更新、kube-proxy 改寫每個節點的規則，這中間有短暫空窗，期間仍可能有新請求進來。這也是為什麼優雅終止不能只依賴 Readiness——Pod 進入 Terminating 時，K8s 會同時移除 Endpoints 並送出 SIGTERM，若應用收到 SIGTERM 就立刻關閉，那些在空窗期送進來的請求就會失敗。標準做法是在 `preStop` 加一個短暫的 sleep，讓移除先傳播完成，應用才開始關閉。理解這點就能把 Readiness、Endpoints、優雅終止串成同一條鏈路。

**面試回答方式**：直接回答不會中斷，並用「移出 Endpoints vs 重啟容器」對比 Liveness。加分點是講傳播延遲，以及它和優雅終止的關係——為什麼需要 `preStop` 的 sleep 讓移除先於關閉。

### Startup 探針和把 Liveness 的 initialDelaySeconds 設長，效果不是一樣嗎？

**核心答案**：不一樣，差在**啟動完成之後**。`initialDelaySeconds` 是一個固定的延遲，設成 120 秒代表容器啟動後 120 秒內完全不檢查，就算應用在第 30 秒就起好、第 40 秒就死掉，也要等到 120 秒後才會被發現，而且這個延遲**每次重啟都要再等一遍**。Startup 探針則是「持續探測直到成功」，一旦成功就交棒給 Liveness 使用緊湊的設定，所以啟動期寬鬆與運行期靈敏可以同時成立。

**詳細解析**：另一個實質差異是**啟動時間不固定的應用**。冷啟動、快取預熱、資料量成長都會讓啟動時間浮動，用固定延遲就必須抓最壞情況，於是平常都在浪費時間。Startup 探針用 `failureThreshold × periodSeconds` 表達的是「最多容忍多久」而不是「一定等多久」，起得快就早點結束。設定上常見的做法是給 Startup 一個很大的 `failureThreshold`（例如 30 次 × 5 秒等於容忍 150 秒），Liveness 則用 `periodSeconds: 5`、`failureThreshold: 3`，兩者職責分明。

**面試回答方式**：用「啟動完成之後」切開差異——固定延遲期間完全不檢查，而且每次重啟都要重等；Startup 是探到成功就交棒。補上啟動時間浮動的場景，說明固定延遲必須抓最壞情況、平常都在浪費。加分點是給出具體的參數搭配。

## 相關

- [[006-kube-proxy-vs-coredns.md]]
- [[018-pod-lifecycle-and-termination.md]]
- [[010-hpa-vpa-cluster-autoscaler.md]]
