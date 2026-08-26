---
id: kubernetes-009
category: kubernetes
slug: requests-limits-qos-oomkilled
title: requests 與 limits 的差異，以及 QoS 與 OOMKilled
difficulty: medium
tags: [requests, limits, QoS, OOMKilled, 資源管理, CPU throttling]
source: original
---

# 題目

resources 的 requests 和 limits 差在哪？它們怎麼決定 Pod 的 QoS 等級？為什麼有些 Pod 會被 OOMKilled、有些會被驅逐？

## 核心答案

**requests 是排程的依據，limits 是執行期的天花板**。Scheduler 只看 **requests** 決定這個 Pod 放得進哪個節點——它比對的是節點上**已被 request 的總量**，不是實際用量。limits 則由 kubelet 與 cgroup 在執行期強制執行。

**CPU 和記憶體超限的後果完全不同**，這是最該記住的差異：**CPU 超過 limit 會被 throttle（限速變慢，但不會死）**；**記憶體超過 limit 會直接被核心 OOMKill（沒有商量餘地，因為記憶體無法回收）**。

**QoS 由 requests 與 limits 的關係決定**：兩者都設且相等是 **Guaranteed**；有設但不相等（或只設其一）是 **Burstable**；兩者都沒設是 **BestEffort**。QoS 決定**節點資源不足時誰先被驅逐**——BestEffort 先死，接著是用量超過 requests 最多的 Burstable，Guaranteed 最後。

所以 **OOMKilled 和驅逐是兩件事**：OOMKilled 是**這個容器自己**超過它的記憶體 limit，跟節點有沒有壓力無關；驅逐是**節點整體**資源不足，kubelet 依 QoS 挑 Pod 趕走。

## 詳細解析

**Scheduler 看 requests 而非實際用量造成的兩種病**：requests 設太高，節點看起來滿了但實際 CPU 只用 10%，白白浪費（也讓 Cluster Autoscaler 開出不必要的節點）；requests 設太低，一堆 Pod 被塞進同一台，實際用量一上來就互相搶資源、集體變慢。所以 requests 應該貼近**穩態的實際用量**，用監控數據來定，而不是拍腦袋。

**CPU limit 的爭議**：因為超過只是被 throttle，很多團隊主張**不要設 CPU limit**——設了會讓應用在節點明明還有空閒 CPU 時仍被限速，尤其對延遲敏感的服務傷害明顯（GC、突發流量都會被卡住）。反方意見是不設 limit 會讓吵鬧的鄰居影響同節點的其他 Pod。折衷做法是設一個寬鬆的 limit，或用 Guaranteed 等級把重要服務隔離出來。

**記憶體 limit 一定要設**：不設的話一個記憶體洩漏的容器可以吃光整台機器，導致節點上**所有** Pod 一起被驅逐，影響面遠大於它自己被 OOMKill。這是 CPU 與記憶體最重要的非對稱之處。

**OOMKilled 的排查訊號**：`kubectl describe pod` 會看到 `Last State: Terminated`、`Reason: OOMKilled`、`Exit Code: 137`（128 + SIGKILL 的 9）。看到 137 就直接往記憶體查。要注意 JVM 這類有自己堆管理的執行環境，容器 limit 必須大於 JVM 的最大堆再加上 metaspace、執行緒堆疊與原生記憶體，否則 JVM 自己覺得沒事、容器卻先被 OOMKill。

**驅逐的順序與 requests 有關**：同樣是 Burstable，kubelet 會優先驅逐**實際用量超出自己 requests 最多**的那個。這給了一個實務啟示——把 requests 設得誠實，不只是為了排程準確，也是在節點吃緊時保護自己。

## 面試回答方式

先用一句話定調：requests 是排程依據、limits 是執行期天花板，Scheduler 只看 requests。接著立刻講最重要的非對稱——**CPU 超限只是變慢，記憶體超限直接被殺**，因為記憶體無法回收。QoS 三級用 requests 與 limits 的關係說明，並點出它決定的是**驅逐順序**。一定要區分 OOMKilled 與驅逐：前者是容器自己超過 limit、跟節點壓力無關，後者是節點整體不足由 kubelet 挑人。實務加分點：Exit Code 137 就是 OOMKilled 的訊號；JVM 的容器 limit 要大於最大堆加上堆外開銷；以及「該不該設 CPU limit」這個有爭議的實務議題，能講出兩邊理由比選邊站更好。

## 講稿

requests 是排程的依據，limits 是執行期的天花板。Scheduler 只看 requests，而且比對的是節點上已被 request 的總量，不是實際用量。

最該記住的是 CPU 跟記憶體超限的後果完全不同。CPU 超過 limit 只是被 throttle，變慢但不會死。記憶體超過會直接被核心 OOMKill，沒有商量餘地，因為記憶體沒辦法像 CPU 那樣回收。

QoS 由這兩個值的關係決定。都設且相等是 Guaranteed，有設但不相等是 Burstable，都沒設是 BestEffort。它決定節點資源不足時誰先被趕走。

這裡要分清楚兩件事。OOMKilled 是容器自己超過它的記憶體 limit，跟節點壓力無關。驅逐是節點整體資源不足，kubelet 依 QoS 挑人趕走。症狀很像，成因完全不同。

排查有個快捷方式，看到 Exit Code 137 就直接往記憶體查。另外 JVM 這類自己管堆的執行環境要小心，容器 limit 必須大於最大堆再加上 metaspace 跟原生記憶體，不然 JVM 覺得還很寬裕，容器卻先被殺了。

## 常見追問

### 一個 Pod 一直 CrashLoopBackOff，Exit Code 是 137，你會怎麼查？

**核心答案**：137 代表容器收到 SIGKILL，在 K8s 裡幾乎都是 **OOMKilled**。先用 `kubectl describe pod` 確認 `Last State` 的 `Reason` 是不是 OOMKilled——是的話就確定是記憶體問題，接著要分辨是**真的需要更多記憶體**還是**應用有洩漏**：看重啟前的記憶體曲線，穩定成長到撞頂是洩漏，一啟動就衝高則是配置不足或啟動階段峰值高。

**詳細解析**：三種常見成因要分開處理。第一是 limit 單純設太小，看歷史用量調高即可。第二是**啟動峰值**——某些應用啟動時載入快取或索引，瞬間用量遠高於穩態，這時調高 limit 或改用 Startup 探針配合延後載入。第三是**執行環境沒感知到容器 limit**，最典型的是舊版 JVM 不會讀 cgroup 限制，仍以整台機器的記憶體去算預設堆大小，於是容器 limit 2GB、JVM 卻以為有 64GB 可用。現代 JVM 預設會感知容器，但仍建議明確設定堆上限並為堆外預留空間。另外要注意 `kubectl logs` 看的是**目前**這個容器，OOMKilled 前的日誌要加 `--previous` 才看得到，這是排查時最容易漏掉的一步。

**面試回答方式**：先把 137 對應到 OOMKilled，並給出 describe 確認的動作。用「記憶體曲線」分辨洩漏與配置不足，這比亂調參數有方法。列出三種成因（limit 太小、啟動峰值、執行環境沒感知 cgroup）並各給處理方向。加分點是提到 `kubectl logs --previous` 才看得到被殺之前的日誌。

### 為什麼有人主張不要設 CPU limit？

**核心答案**：因為 CPU limit 是靠 cgroup 的 CFS quota 實作的**硬性限速**——即使節點上還有大量閒置 CPU，容器一旦用滿配額就會被強制暫停到下一個週期。對延遲敏感的服務，這會造成明顯的尾端延遲：GC、突發流量、批次處理都可能撞到配額而被卡住，而此時機器其實是閒的。不設 limit 則讓容器能吃到節點的閒置算力，requests 仍然保障它在競爭時分得到應有的份額。

**詳細解析**：反方的顧慮是「吵鬧的鄰居」——不設 limit 的容器可能吃光節點 CPU，影響同節點其他 Pod。但這個顧慮部分被 CPU 的特性化解：CPU 是**可壓縮資源**，競爭時 cgroup 會依 requests 的比例分配，不會有人完全餓死，這和記憶體「被搶走就直接死」的性質不同。所以實務上的共識傾向是：**記憶體 limit 必設，CPU limit 視情況**。延遲敏感的線上服務傾向不設或設得很寬鬆；批次任務、不受信任的多租戶工作負載則該設。要注意 GKE Autopilot 這類託管模式會自動補上 limit，選擇權沒有那麼自由。

**面試回答方式**：講清楚 CFS quota 是硬性限速——節點閒著也會被暫停，這是核心理由。用「可壓縮 vs 不可壓縮」對比 CPU 與記憶體，說明為什麼記憶體 limit 必設、CPU 可以商量。給出分場景的結論而不是選邊站。加分點是提到 Autopilot 會自動補 limit。

### Guaranteed、Burstable、BestEffort 這三級，實務上該怎麼選？

**核心答案**：**看這個工作負載被犧牲的代價**。核心線上服務用 **Guaranteed**（requests 等於 limits），換取最低的驅逐優先序與最穩定的資源；一般服務用 **Burstable**，requests 設在穩態用量、limits 留一些突發空間，這是多數情況的合理選擇；**BestEffort** 幾乎不該用在正式環境——它第一個被驅逐，而且完全不參與資源保障，只適合真正可有可無的實驗性工作負載。

**詳細解析**：Guaranteed 的代價是**資源利用率低**——requests 等於 limits 代表你必須按峰值預留，平常那些空間誰也用不到。所以不該全部都設成 Guaranteed，那會讓叢集成本大幅上升。實務上的分配通常是少數關鍵服務用 Guaranteed、大多數用 Burstable。另外要記得 QoS 只在**節點資源不足**時才起作用，平常三級的行為沒有差別，所以它是一種「壞事發生時的保險」而不是效能設定。還有一個細節：Guaranteed 需要 Pod 內**每一個容器**的每一種資源都設定且相等，只要有一個 sidecar 沒設，整個 Pod 就掉到 Burstable——這是設定完卻發現等級不對的常見原因。

**面試回答方式**：用「被犧牲的代價」當判準，給出三級的適用場景。點出 Guaranteed 的代價是利用率低、不該全部都用。強調 QoS 只在節點資源不足時起作用，是保險不是效能設定。加分點是講 sidecar 沒設資源會讓整個 Pod 掉級這個實務陷阱。

## 相關

- [[010-hpa-vpa-cluster-autoscaler.md]]
- [[020-namespace-quota-limitrange.md]]
- [[015-kube-scheduler.md]]
