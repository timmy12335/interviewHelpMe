---
id: kubernetes-024
category: kubernetes
slug: crd-and-operator
title: CRD 與 Operator：怎麼把運維知識寫成程式
difficulty: hard
tags: [CRD, Operator, 控制器, 擴充性, 自訂資源]
source: original
---

# 題目

CRD 和 Operator 是什麼關係？什麼情況下值得自己寫一個 Operator？

## 核心答案

**CRD（CustomResourceDefinition）讓你在 K8s 裡定義新的資源型別**——定義完之後，`kubectl get mydatabase` 就能用，而且這個新資源**自動享有認證、授權、Admission、watch、樂觀併發**這整套 apiserver 的機制。但 CRD 本身**只是資料結構**，建立一個自訂資源不會發生任何事。

**Operator = CRD + 自訂控制器**。控制器監聽這個自訂資源，執行和內建控制器完全相同的 **reconcile 迴圈**：比對期望與實際、有差異就採取動作。所以 Operator 的本質是把原本要人工執行的運維步驟寫成持續執行的程式——你宣告「我要一個三節點、每天備份的 PostgreSQL 叢集」，Operator 負責建立 StatefulSet、設定主從複製、排程備份、在主節點故障時執行切換。

值得自己寫的判準是「這套運維知識是否複雜、重複、且對你的業務特有」。有現成 Operator 的（PostgreSQL、Redis、Kafka、cert-manager）直接用；只是要部署幾個 Deployment 加 Service 的，用 Helm 就夠了——**Operator 的價值在 day-2 運維**（備份、升級、故障切換、擴縮），不在初次部署。

## 詳細解析

**CRD 免費得到的東西比想像中多**：定義好 schema 之後，apiserver 會負責驗證欄位型別、提供 watch、處理版本轉換、套用 RBAC。這代表你不需要自己蓋一套 API 伺服器、認證機制與儲存層——這正是 K8s 擴充性的核心價值。

**Helm 與 Operator 解決的是不同階段**：Helm 是**打包與安裝**的工具，把一堆 YAML 模板化後一次套用，執行完就結束。Operator 是**持續運行**的程式，安裝之後仍在監聽與校正。所以「用 Helm 還是 Operator」的正確問法是「這件事需不需要有人持續照看」——只是初次部署用 Helm，需要持續維護狀態才需要 Operator。實務上兩者常常並用：用 Helm 安裝 Operator。

**status 與 conditions 決定 Operator 好不好用**：使用者理解 Operator 在做什麼，靠的是 `status` 欄位與 `conditions`。一個沉默的 Operator——資源建立了卻沒有任何狀態回報——在出問題時極難排查。成熟的 Operator 會清楚回報目前處於哪個階段、遇到什麼錯誤，並用 Kubernetes Events 記錄重要動作。

**版本演進是長期成本**：CRD 一旦有使用者，schema 就不能隨意改。新增欄位相容，但改變語意或移除欄位需要走多版本並存與轉換 webhook 的流程。這是自建 Operator 最容易被低估的長期負擔——寫出來只是開始，維護它的 API 契約才是持續投入。

**權限是風險點**：Operator 通常需要不小的權限（建立 StatefulSet、管理 Secret、有時是 ClusterRole）。這讓它成為高價值攻擊目標，也代表一個有 bug 的 Operator 可能造成大範圍破壞（例如錯誤地刪除資源）。權限應該盡量限縮到它實際管理的 namespace 與資源型別。

## 面試回答方式

先把 CRD 與 Operator 的關係講準——CRD 只是資料結構，建立自訂資源不會發生任何事，加上控制器才是 Operator。接著點出 CRD 免費得到認證、授權、watch 這整套機制，這是 K8s 擴充性的核心。用「reconcile 迴圈和內建控制器完全相同」把它接回宣告式模型。判準那一問要給出明確標準——**Operator 的價值在 day-2 運維而非初次部署**，並用「這件事需不需要有人持續照看」區分 Helm 與 Operator。加分點：status 與 conditions 決定 Operator 好不好排查；CRD 的版本演進是最容易被低估的長期成本；以及 Operator 權限大、是高價值攻擊目標。

## 講稿

先講兩者的關係。CRD 讓你在 K8s 裡定義新的資源型別，定義完 kubectl get 就能用，而且這個新資源自動享有認證、授權、Admission、watch 這整套機制。

但 CRD 本身只是資料結構。你建立一個自訂資源不會發生任何事，因為沒有人在看它。加上一個自訂控制器才是 Operator，而這個控制器跑的是跟內建控制器完全相同的 reconcile 迴圈。

所以 Operator 的本質，是把原本要人工執行的運維步驟寫成持續執行的程式。你宣告我要一個三節點、每天備份的 PostgreSQL 叢集，Operator 負責建 StatefulSet、設定主從複製、排程備份、主節點掛掉時做切換。

什麼時候值得自己寫？判準是這套運維知識夠不夠複雜、是不是你的業務特有。有現成的就直接用。

如果只是要部署幾個 Deployment 加 Service，Helm 就夠了。兩者解決的是不同階段：Helm 是打包安裝，跑完就結束；Operator 是持續運行、持續校正。所以正確的問法是「這件事需不需要有人持續照看」。

## 常見追問

### 有了 Helm，為什麼還需要 Operator？

**核心答案**：因為兩者解決**不同階段**的問題。Helm 是**安裝時**的工具——把模板算出最終 YAML、一次套用、執行結束，之後就不再參與。Operator 是**持續運行**的程式——安裝之後仍在監聽資源變化、比對狀態、採取行動。判準是「這件事需不需要有人持續照看」：只是初次部署用 Helm 就夠；需要備份排程、故障切換、版本升級這類**day-2 運維**才需要 Operator。

**詳細解析**：具體舉例最清楚：用 Helm 部署一個 PostgreSQL，它會幫你建好 StatefulSet、Service、Secret，然後結束。但主節點掛掉時，Helm 不會做任何事——它早就跑完了。Operator 則會偵測到主節點失效、選出新的主節點、更新 Service 指向、通知從節點重新設定複製。這種「需要根據實際狀況做判斷並採取一連串動作」的知識，只能用持續運行的程式表達。實務上兩者常常並用，最常見的模式就是**用 Helm 安裝 Operator**，然後用自訂資源宣告你要的實例。另外 Helm 在升級時的 diff 與回滾能力，對於純粹的應用部署仍然很好用，不必因為引入了 Operator 就全面放棄。

**面試回答方式**：用「安裝時 vs 持續運行」把兩者切開，並給出判準——需不需要有人持續照看。用 PostgreSQL 主節點故障這個具體例子說明 Helm 跑完就結束、Operator 才會處理。加分點是指出兩者常並用（用 Helm 安裝 Operator），不是二選一。

### 自己寫 Operator 有哪些容易低估的成本？

**核心答案**：最容易低估的是 **CRD 的版本演進**。一旦有人開始使用你的自訂資源，schema 就變成公開契約——新增欄位還好，但改變語意、移除欄位、調整結構都需要走**多版本並存加轉換 webhook** 的流程，而且要處理已經存在於 etcd 裡的舊版本物件。其次是**權限管理**：Operator 通常需要不小的權限，成為高價值攻擊目標，也代表 bug 的破壞範圍很大。

**詳細解析**：還有幾項常被忽略。**錯誤處理與重試**——reconcile 失敗要用指數退避，但也不能對永久性錯誤無限重試塞爆佇列；**可觀測性**——沒有清楚的 status、conditions 與 events，使用者遇到問題只能來問你，維護成本會持續上升；**冪等性**——事件重送與重啟會讓 reconcile 執行多次，任何「無條件執行動作」的寫法都會出錯；**升級路徑**——Operator 自己也要能安全升級，而它正在管理著有狀態的工作負載。這些加總起來，寫一個能用的 Operator 可能只要幾天，但寫一個能長期維護的要投入數量級更多的心力。所以評估時應該誠實地問：這套運維知識是否真的複雜到值得，還是其實一份文件加幾個腳本就夠了。

**面試回答方式**：把 CRD 版本演進放在第一位，並解釋為什麼——schema 變成公開契約，還要處理 etcd 裡的舊物件。列出其他項目：錯誤重試策略、可觀測性、冪等性、Operator 自身的升級路徑。加分點是給出誠實的評估建議——先問這套知識是否真的複雜到值得，還是文件加腳本就夠。

### CRD 和 API Aggregation 有什麼差別？

**核心答案**：兩者都是擴充 K8s API 的方式，差別在**誰負責儲存與處理**。**CRD** 由 apiserver 直接處理，資料存在 **etcd**，你只需要定義 schema，不必寫 API 伺服器——這是絕大多數情況的正確選擇。**API Aggregation** 則是註冊一個**你自己實作的 API 伺服器**，apiserver 把該路徑的請求轉發過去，儲存與處理邏輯完全由你決定。

**詳細解析**：Aggregation 的使用時機非常特定：需要**不存在 etcd 的資料**（例如 metrics-server 提供的即時指標，那是即算即回的，不該持久化）、需要**自訂的儲存後端**、或需要 CRD 表達不了的 API 行為（例如特殊的子資源語意）。代價是你要自己負責高可用、效能、版本管理與儲存——工作量比 CRD 大一個數量級。實務上的建議很明確：先用 CRD，除非遇到它真的做不到的需求。metrics-server 是最經典的 Aggregation 案例，因為即時指標寫進 etcd 既沒必要又會拖垮控制平面——這個例子也剛好呼應了「不該把高頻變動的資料放進 etcd」這個原則。

**面試回答方式**：用「誰負責儲存與處理」切開兩者。強調 CRD 是絕大多數情況的正確選擇。給出 Aggregation 的特定使用時機（資料不該存 etcd、自訂儲存後端），並用 metrics-server 當例子。加分點是把 metrics-server 的理由接回「高頻變動的資料不該進 etcd」這個原則。

## 相關

- [[016-controller-and-reconcile.md]]
- [[023-admission-controller.md]]
- [[014-kube-apiserver.md]]
