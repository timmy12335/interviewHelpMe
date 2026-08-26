---
id: kubernetes-001
category: kubernetes
slug: pod-as-smallest-unit
title: 為什麼 K8s 的最小部署單位是 Pod，而不是 Container？
difficulty: easy
tags: [Pod, Container, 基礎概念, pause container]
source: original
---

# 題目

Kubernetes 排程與管理的最小單位是 Pod 而不是 Container。為什麼要多包一層？一個 Pod 裡放多個 Container 的合理場景是什麼？

## 核心答案

因為有些容器必須**共享網路與儲存、被綁在一起排程**，而 Container 這個抽象沒有辦法表達這種「這幾個東西必須一起活、一起死、一起被放到同一台機器」的關係。Pod 就是這個關係的容器——同一個 Pod 裡的所有 Container **共享同一個 network namespace**（彼此可以用 `localhost` 互通、共用同一個 Pod IP 與 port 空間）、**可以掛載同一組 Volume**，而且**永遠被排程到同一個 Node 上**。實作上 K8s 會先啟動一個幾乎不做事的 **pause container** 持有這些 namespace，其他 Container 再加入它，所以就算業務容器重啟，Pod IP 也不會變。多容器 Pod 的合理場景是 **Sidecar 模式**——主容器跑業務，旁邊掛一個日誌收集、憑證輪替或 service mesh proxy 的輔助容器，兩者關係緊密到不該被分開排程。反過來說，如果兩個容器可以各自獨立擴縮、獨立部署，那它們就該是兩個 Pod，而不是塞進同一個。

## 詳細解析

**共享 network namespace 的具體意義**：同一個 Pod 裡的容器看到的是同一張網卡、同一個 IP。A 容器在 8080 監聽，B 容器直接打 `localhost:8080` 就通，不需要經過 Service，也沒有跨主機的網路延遲。代價是**port 不能撞**——兩個容器都想用 8080 會有一個起不來，這是多容器 Pod 最常見的低級錯誤。

**pause container 的作用**：它是每個 Pod 裡都存在、但幾乎不佔資源的容器，唯一的工作是**持有 network namespace 並保持存活**。有它在，業務容器 crash 重啟時 namespace 不會被回收，Pod IP 因此保持穩定。用 `docker ps` 在節點上看會發現 Pod 數量的兩倍容器，多出來的就是它。

**「一起活、一起死」的排程語意**：Pod 是排程的單位，不是容器。Scheduler 挑的是「這個 Pod 要去哪個 Node」，Pod 裡幾個容器全部跟著走。這也代表資源請求是**整個 Pod 的總和**——一個 Pod 要 4 核，就必須有一台 Node 湊得出 4 核，不能拆到兩台。

**什麼時候不該用多容器 Pod**：判準是**能不能獨立擴縮**。前端和後端放同一個 Pod，看起來省事，但流量上來時你只想加後端卻被迫連前端一起加，而且任一個容器 crash 會影響整個 Pod 的重啟。凡是可以各自獨立演進、獨立擴縮的東西，就該是各自的 Pod，用 Service 互相找到對方。

**Init Container 是另一種形態**：它在主容器啟動**之前**依序跑完並結束，用來做等待依賴就緒、下載設定、跑資料庫 migration 這類前置工作。它和 Sidecar 的差別在於生命週期——Init Container 跑完就退場，Sidecar 全程陪跑。

## 面試回答方式

先講「為什麼需要多一層」而不是急著背定義——重點是 Container 這個抽象表達不了「必須共享網路與儲存、必須被綁在一起排程」的關係。接著給出 Pod 提供的三件事：共享 network namespace（可用 localhost 互通、Pod IP 穩定）、共享 Volume、保證同節點排程。能主動提到 pause container 持有 namespace、所以業務容器重啟不會換 IP，是展現你看過底層的加分點。最後一定要講**反面**——什麼時候不該放同一個 Pod，判準是「能不能獨立擴縮」，這比只會說 Sidecar 更能證明你有實際設計過。

## 講稿

Container 這個抽象少了一樣東西，就是沒辦法表達「這幾個東西必須綁在一起」的關係。Pod 就是為了裝這個關係而存在的。

同一個 Pod 裡的容器共享 network namespace，等於共用同一張網卡、同一個 IP。A 在 8080 監聽，B 直接打 localhost 就通，不用繞 Service。它們也能掛同一組 Volume，而且一定被排到同一個 Node。

實作上 K8s 會先起一個幾乎不做事的 pause container 來持有這些 namespace。有它在，業務容器 crash 重啟時 Pod IP 不會變。在節點上用 docker ps 會看到容器數是 Pod 數的兩倍，多出來的就是它。

多容器最典型的用法是 Sidecar，旁邊掛個日誌收集或 service mesh proxy。但我覺得更該講的是反面：什麼時候不該放一起。

判準是能不能獨立擴縮。前端後端塞同一個 Pod 看起來省事，但流量來的時候你只想加後端，卻被迫連前端一起加，而且任一個容器掛掉整個 Pod 都要重啟。可以各自演進的東西，就該是各自的 Pod。

## 常見追問

### 同一個 Pod 裡的兩個容器，可以監聽同一個 port 嗎？

**核心答案**：不行。它們共享同一個 network namespace，等於共用同一個 port 空間，兩個容器都綁 8080 會有一個因為 address already in use 起不來。這是多容器 Pod 最常見的低級錯誤，而且症狀容易誤導——你會看到 Pod 一直 CrashLoopBackOff，但主容器的日誌完全正常，要去看另一個容器的日誌才找得到原因。

**詳細解析**：共享 network namespace 是 Pod 的核心特性，好處是 localhost 互通，代價就是 port 衝突。這和「兩個 Pod 可以都用 8080」不一樣——不同 Pod 各有自己的 namespace 與 IP，互不影響。排查時要記得 `kubectl logs` 預設只給你第一個容器，多容器 Pod 要用 `-c` 指定容器名，或用 `--all-containers`。設計上如果真的需要兩個都對外，就得讓它們用不同 port，或者重新思考它們是不是根本該拆成兩個 Pod。

**面試回答方式**：直接說不行，並解釋原因是共享 namespace 導致共用 port 空間。加分點是講出排查時的陷阱——Pod 一直重啟但主容器日誌正常，要用 `kubectl logs -c` 看另一個容器。

### Init Container 和 Sidecar 有什麼差別？

**核心答案**：差在生命週期。Init Container 在主容器啟動**之前**依序執行並且**必須跑完退出**，用來做等待依賴就緒、下載設定、跑 migration 這類前置工作；它失敗會導致 Pod 反覆重試，主容器根本不會被啟動。Sidecar 則是和主容器**同時運行、全程陪跑**，做日誌收集、憑證輪替、proxy 這類持續性的輔助工作。

**詳細解析**：Init Container 的「依序執行」是重點——列了三個就是一個跑完才跑下一個，不是並行。這讓它很適合表達有先後依賴的前置條件。另外它可以用和主容器完全不同的映像檔，所以常拿來裝一些主容器不該有的工具，例如用一個帶 `curl` 或 `psql` 的映像檔去探測依賴是否就緒，主容器就能維持精簡、不必為了初始化而多裝工具。Sidecar 早期只是「多寫一個容器」的慣例，較新的 Kubernetes 版本把它正式化成可以在主容器之前啟動、之後才終止的原生 sidecar，解決了以前 sidecar 比主容器晚就緒、或先被砍掉導致日誌漏收的問題。

**面試回答方式**：用生命週期切開兩者——Init 是「跑完退場」的前置條件，Sidecar 是「全程陪跑」的輔助。補上 Init Container 可以用不同映像檔這個實務價值，以及新版把 sidecar 原生化解決了啟動與終止順序的問題。

### 為什麼 Pod 的 IP 是會變的？既然有 pause container 保持穩定，為什麼還需要 Service？

**核心答案**：pause container 保證的是**單一 Pod 生命週期之內** IP 不變——業務容器 crash 重啟，IP 還是那個。但 Pod 本身被刪除重建（滾動更新、被驅逐、節點故障）時，新的 Pod 是全新的物件，會拿到全新的 IP。所以 Pod IP 對呼叫方而言是不可靠的，需要 Service 提供一個穩定的虛擬 IP 與 DNS 名稱，在後面動態追蹤實際存活的 Pod。

**詳細解析**：這兩層穩定性常被混為一談。pause container 解決的是「容器重啟時 namespace 不要被回收」，屬於 Pod 內部的穩定；Service 解決的是「Pod 集合本身會不斷汰換」，屬於外部尋址的穩定。Deployment 做滾動更新時會建新 Pod、砍舊 Pod，IP 全部換掉，如果呼叫方硬記 Pod IP，每次部署就斷線。Service 用 label selector 動態維護後端清單，配合 CoreDNS 提供固定的名稱，呼叫方只認名稱不認 IP。這也解釋了為什麼 StatefulSet 需要額外的 headless Service——有狀態應用需要的是「每個實例各自的穩定身分」，而不只是一個負載平衡的入口。

**面試回答方式**：把兩層穩定性分開講——pause container 管的是 Pod 內、容器重啟不換 IP；Pod 被重建就是全新 IP，那是 Service 要解的。點出滾動更新時 IP 全換，硬記 Pod IP 每次部署就斷線，這個具體後果比抽象說明有說服力。

## 相關

- [[002-deployment-vs-statefulset.md]]
- [[005-service-types-vs-ingress.md]]
- [[018-pod-lifecycle-and-termination.md]]
