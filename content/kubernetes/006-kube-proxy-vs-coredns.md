---
id: kubernetes-006
category: kubernetes
slug: kube-proxy-vs-coredns
title: kube-proxy 與 CoreDNS 各自負責什麼？Service 是怎麼真的通的
difficulty: medium
tags: [kube-proxy, CoreDNS, Service, 網路, iptables, IPVS]
source: original
---

# 題目

一個 Pod 用 `http://my-service` 呼叫另一個服務，從送出請求到封包抵達目標 Pod，中間 CoreDNS 和 kube-proxy 各做了什麼？

## 核心答案

兩者負責**完全不同的兩段**，串起來才通。**CoreDNS 負責「名稱變成 IP」**——Pod 查詢 `my-service` 時，CoreDNS 回答這個 Service 的 **ClusterIP**（一個虛擬 IP）。**kube-proxy 負責「虛擬 IP 變成真實 Pod IP」**——它在**每個節點上**維護 iptables 或 IPVS 規則，把送往 ClusterIP 的封包 **DNAT** 成某一個實際後端 Pod 的 IP。

關鍵在於 **ClusterIP 是個不存在的位址**：它不綁在任何網卡上，ping 不到、也沒有任何行程在監聽它。它之所以「可達」，純粹是因為封包離開 Pod 時被節點上那套轉發規則改寫了目的地。這也解釋了為什麼**叢集外打不到 ClusterIP**——外面的機器沒有這套規則。另外 kube-proxy **不是流量的中繼**，它只負責寫規則，實際轉發由核心完成，所以 kube-proxy 掛掉時既有連線不受影響，只是規則不再更新。

## 詳細解析

**完整的一次呼叫**：Pod 發出 `my-service` 的 DNS 查詢 → 這個查詢依 Pod 的 `/etc/resolv.conf` 送到 CoreDNS 的 Service IP → CoreDNS 從 API Server 得知的 Service 資料回答 ClusterIP → Pod 對 ClusterIP 發起 TCP 連線 → 封包經過節點的 iptables／IPVS 規則被 DNAT 成某個 Pod IP → 經由 CNI 的網路送達目標 Pod。

**Endpoints 才是規則的來源**：kube-proxy 不是憑空知道要轉去哪。Endpoints（新版是 EndpointSlice）由 controller 依 Service 的 label selector 動態維護，只收錄**通過 Readiness 探針**的 Pod。所以「Readiness 沒過的 Pod 不會收到流量」這件事，實作上就是它沒有被寫進 Endpoints、kube-proxy 的規則裡沒有它。

**iptables 與 IPVS 的差別**：iptables 模式把每個 Service 展開成一串規則，比對是**線性**的，Service 數量到幾千個時規則更新與封包比對都會變慢。IPVS 用雜湊表，規則量大時效能明顯較好，還支援輪詢、最少連線等多種負載平衡演算法。大型叢集通常會切到 IPVS。

**DNS 的搜尋網域會放大查詢量**：Pod 的 `resolv.conf` 帶有 `ndots:5` 與一串 search 網域。查一個像 `api.example.com` 這種點數不足 5 的外部名稱時，解析器會**先依序嘗試補上各個 search 網域**（`api.example.com.default.svc.cluster.local` 等）全部失敗後，才查真正的外部名稱。這讓每次外部查詢變成好幾次無效查詢，是 CoreDNS 負載偏高與應用延遲的常見原因。對外部呼叫頻繁的服務，可以在 Pod 層調整 `dnsConfig` 的 `ndots`，或把外部網域寫成結尾帶點的完整名稱。

**故障時的症狀不同**：CoreDNS 出問題的症狀是「名稱解析不了」——連線階段就失敗，錯誤訊息通常是 no such host。kube-proxy 出問題則是「解析得到但連不上或連到已死的 Pod」。這個分辨能省下大量排查時間。

## 面試回答方式

把兩者切成「名稱到 IP」和「虛擬 IP 到真實 Pod IP」兩段，這是回答的骨架。接著一定要點出 ClusterIP 是個不存在的位址、ping 不到，可達完全靠節點上的轉發規則——這句話能同時解釋為什麼叢集外連不到。補上 kube-proxy 不是流量中繼、只寫規則，所以它掛掉時既有連線不受影響。加分點有兩個：Endpoints 只收錄 Readiness 通過的 Pod，這就是「未就緒不收流量」的實作機制；以及 `ndots:5` 造成外部網域查詢被放大成多次無效查詢，是 CoreDNS 負載偏高的常見原因。最後給出故障分辨法：解析不了是 DNS 問題，解析得到但連不上是 kube-proxy 或 Endpoints 問題。

## 講稿

這兩個負責完全不同的兩段，串起來才通。

CoreDNS 負責名稱變成 IP。Pod 查 my-service，CoreDNS 回答這個 Service 的 ClusterIP。kube-proxy 負責虛擬 IP 變成真實的 Pod IP，它在每個節點上維護 iptables 或 IPVS 規則，把送往 ClusterIP 的封包改寫目的地。

關鍵是 ClusterIP 其實是個不存在的位址，它不綁在任何網卡上，ping 不到，也沒有任何行程在監聽。它可達純粹是因為封包離開 Pod 時被節點上那套規則改寫了。這也直接解釋了為什麼叢集外打不到 ClusterIP，因為外面沒有這套規則。

還有一點常被誤解，kube-proxy 不是流量的中繼站，它只負責寫規則，真正轉發是核心在做。所以 kube-proxy 掛掉時既有連線不受影響，只是規則不再更新。

規則的來源是 Endpoints，由 controller 依 label selector 維護，而且只收錄通過 Readiness 探針的 Pod。所謂「未就緒的 Pod 不會收到流量」，實作上就是它沒被寫進去。

排查時這個分辨很省時間：解析不了是 DNS 的問題，解析得到但連不上或連到死掉的 Pod，那就是 kube-proxy 或 Endpoints 那一段。

## 常見追問

### 為什麼有時候 Pod 之間偶爾會連不上，重試就好了？

**核心答案**：最常見的原因是**規則更新有延遲**。Pod 被刪除或未就緒時，controller 要先更新 Endpoints，kube-proxy 再監聽到變化並改寫每個節點的規則，這中間有短暫的空窗，期間流量仍可能被送往已經死掉的 Pod。另一個常見原因是**應用還沒準備好就被列入 Endpoints**——Readiness 探針設定太寬鬆或根本沒設。

**詳細解析**：這類間歇性失敗的解法是分層的。首先確保 Readiness 探針真的反映「能不能處理請求」，而不是只回一個永遠 200 的健康檢查端點。其次在 Pod 終止時加上 `preStop` 的短暫延遲——讓 Pod 先從 Endpoints 移除、等規則傳播完成，再開始關閉應用，避免「已經在關了但流量還在進來」。第三是讓客戶端具備重試與退避，因為在分散式系統裡完全消除這個空窗並不現實。GKE 這類環境還可以搭配 container-native load balancing，讓負載平衡器直接對 Pod IP 做健康檢查，縮短感知延遲。

**面試回答方式**：指出是規則傳播的空窗期，並說明鏈路——Endpoints 更新、kube-proxy 改規則，兩段都有延遲。解法分三層講：Readiness 要真實反映可用性、`preStop` 延遲讓移除先於關閉、客戶端要有重試。加分點是承認這個空窗無法完全消除，所以重試是必要的。

### CoreDNS 負載很高、DNS 查詢變慢，可以怎麼處理？

**核心答案**：先確認是不是 **`ndots:5` 造成的查詢放大**——Pod 查外部網域時會先依序嘗試補上多個叢集 search 網域，全部失敗才查真正的名稱，一次外部呼叫可能變成四五次 DNS 查詢。針對這點可以在 Pod 的 `dnsConfig` 調低 `ndots`，或把外部網域寫成結尾帶點的完整名稱直接跳過搜尋。其次是擴容 CoreDNS 副本，並在節點上啟用 **NodeLocal DNSCache**，讓查詢先打本機快取而不是每次都跨節點。

**詳細解析**：這三個手段的效果差很多。調 `ndots` 或用完整名稱是**從源頭減少查詢量**，通常效果最顯著且零成本，但要逐個服務調整。NodeLocal DNSCache 是在每個節點跑一個 DNS 快取（本身就是個 DaemonSet），把大量重複查詢擋在本機，同時也減少了跨節點的 UDP 連線——這對曾經有 conntrack 相關的 DNS 逾時問題的環境幫助很大。單純擴 CoreDNS 副本是最直覺但效益最低的，因為問題往往不在算力而在查詢量與網路路徑。排查時可以先看 CoreDNS 的 metrics，如果 NXDOMAIN 的比例異常高，那幾乎可以確定就是 search 網域造成的無效查詢。

**面試回答方式**：把 `ndots:5` 的查詢放大講清楚，這是最能展現理解的點。給出三個手段並排出優先序：從源頭減量（調 ndots 或用完整名稱）最有效、NodeLocal DNSCache 次之、擴副本效益最低。加分點是給出診斷依據——看 CoreDNS metrics 的 NXDOMAIN 比例。

### kube-proxy 掛掉的話，現有的連線會斷嗎？

**核心答案**：**不會**。kube-proxy 只是規則的**寫入者**，實際的封包轉發由 Linux 核心的 iptables 或 IPVS 完成。它掛掉時既有規則仍然留在核心裡繼續生效，所以現有連線和後續打到既有 ClusterIP 的流量都正常。真正的影響是**規則停止更新**——新建立的 Service 不會生效、Pod 汰換後 Endpoints 變了但規則沒跟上，流量會被送往已經不存在的 Pod。

**詳細解析**：這個問題在測「你知不知道 kube-proxy 在資料路徑上還是控制路徑上」。它在控制路徑，這也是為什麼它可以用 DaemonSet 部署、更新時短暫中斷可以接受。症狀通常有延遲性——kube-proxy 掛掉當下一切正常，直到下一次部署或 Pod 汰換才開始出現連到死 Pod 的錯誤，這種「壞掉很久才發現」的特性讓它值得被監控。順帶一提，較新的架構有些已經不用 kube-proxy 了——例如以 eBPF 為基礎的 CNI（Cilium）可以直接在核心層處理 Service 轉發，取代 kube-proxy 的角色，效能與可觀測性都更好。

**面試回答方式**：直接回答不會斷，並用「它在控制路徑不在資料路徑」解釋。強調真正的影響有延遲性——當下沒事，下次部署才爆，所以值得監控。加分點是提到 eBPF CNI 可以完全取代 kube-proxy 的角色。

## 相關

- [[005-service-types-vs-ingress.md]]
- [[008-probes-liveness-readiness-startup.md]]
- [[018-pod-lifecycle-and-termination.md]]
