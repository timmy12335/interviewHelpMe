# 計算機網路面試題

InterviewHelpMe 第 16 個內容類別，共 50 題，取材自 [JavaGuide](https://github.com/Snailclimb/JavaGuide) 與 [backend-interview](https://github.com/yongxinz/backend-interview) 的計算機基礎章節，涵蓋 TCP 機制、HTTP 演進、TLS 與憑證、DNS、連線管理與網路排查。

## 這個類別的設計

網路題最容易被當成**背誦題**——三次握手背得出來、七層模型背得出來，但被問「連不上你會怎麼查」就答不出來。所以這裡每一題都盡量收在**可以拿來做決定或排查的結論**上：三次握手那題的重點是「兩次為什麼排除不掉舊連線」，`TIME_WAIT` 那題的重點是「解法的優先順序是先減少短連線而不是改核心參數」。

第 025 到 050 題是第二批，往四個方向深入：**TCP 的機制與調校**（狀態機診斷、Nagle 與延遲確認、緩衝區與視窗、現代擁塞控制、長肥管道）、**HTTP 與 Web 協定**（快取、HTTP/2 的多路複用、QUIC 與 HTTP/3、內容協商與壓縮、Cookie 安全、CORS、TLS 1.3）、**基礎設施**（負載平衡的四層與七層、反向代理的逾時串接、CDN、DNS 進階、Anycast 與 BGP、常見攻擊與防護），以及**診斷與判斷**（延遲拆解、丟包診斷、抓包實務、容器與雲端的網路問題、IPv6、gRPC 的網路特性、內網通訊設計，以及收束題「抽象在哪裡洩漏」）。

有幾題刻意**先糾正前提**。問「一台伺服器最多幾條連線」，答案是埠號不是限制、連線由五元組識別；問 HTTP keep-alive 與 TCP keepalive，答案是名字像但層次與目的完全不同。這些更正在實際面試中最能拉開差距。

最後三題（022 到 024）是**排查方法**而非協定知識，放進來是因為前面 21 題的價值最終要體現在「問題發生時你能不能定位」，而多數候選人在這一段是空白的。

編號依主題分組：001 到 008 是 TCP 與傳輸層，009 到 013 是 HTTP 與 TLS，014 到 021 是 DNS、狀態管理、連線與序列化，022 到 024 是排查。

## 檔案格式

與其他類別相同：每題一個 `NNN-slug.md`，frontmatter 對應 [schema.sql](../../backend/sql/schema.sql) 的 `question` 表（`category: computer-network`，`source: original`）。正文含：題目、核心答案、詳細解析、面試回答方式、講稿、常見追問（3 題）、相關。

新增題目請用 `node scripts/new-question.mjs computer-network <slug> "<標題>"` 產生骨架。寫完跑 `npm test` 驗證結構與交叉連結，跑 `node scripts/check-scripts.mjs computer-network` 驗證講稿品質。

## 題目清單

| # | 題目 | 難度 |
|---|------|------|
| 001 | OSI 七層與 TCP/IP 四層：分層到底解決什麼問題 | easy |
| 002 | TCP 三次握手：為什麼是三次，不是兩次或四次 | medium |
| 003 | 四次揮手與 TIME_WAIT：為什麼要等 2MSL | medium |
| 004 | TCP 與 UDP 的取捨：什麼時候該選 UDP | easy |
| 005 | TCP 如何保證可靠傳輸 | medium |
| 006 | 流量控制與滑動視窗：和擁塞控制差在哪 | medium |
| 007 | 擁塞控制：慢啟動、擁塞避免與快速恢復 | hard |
| 008 | 黏包與拆包：TCP 是位元組流，訊息邊界要自己定 | medium |
| 009 | HTTP 報文結構與狀態碼：怎麼選才不會誤導呼叫方 | easy |
| 010 | HTTP 從 1.1 到 3：每一版解決了什麼問題 | medium |
| 011 | GET 與 POST 的真實差異 | easy |
| 012 | HTTPS 的 TLS 握手流程 | hard |
| 013 | 憑證信任鏈與中間人攻擊 | hard |
| 014 | DNS 解析流程、快取與常見故障 | medium |
| 015 | Session、Cookie 與 Token：三者的關係與取捨 | medium |
| 016 | 輪詢、長輪詢、SSE 與 WebSocket 怎麼選 | medium |
| 017 | Socket 與五元組：埠號會不會不夠用 | medium |
| 018 | keep-alive、連線池與逾時設定 | medium |
| 019 | NAT 與內外網：為什麼內網機器連得出去卻連不進來 | easy |
| 020 | MTU、MSS 與 IP 分片：為什麼小封包通得過、大封包卡住 | medium |
| 021 | 序列化協定的選擇：JSON、Protobuf 與其他 | medium |
| 022 | 網路排查工具：ping、traceroute、抓包與連線狀態 | medium |
| 023 | 半開連線、逾時與重試風暴 | hard |
| 024 | 分層排查法：問題到底出在哪一層 | easy |
| 025 | TCP 狀態機：那些不該出現的狀態 | medium |
| 026 | Nagle 演算法與延遲確認：40 毫秒的神秘延遲 | medium |
| 027 | TCP 緩衝區與視窗調校 | medium |
| 028 | 現代擁塞控制：從 CUBIC 到 BBR | hard |
| 029 | 長肥管道：跨地域的大量資料傳輸 | hard |
| 030 | HTTP 快取：強快取與協商快取 | medium |
| 031 | HTTP/2 的多路複用與它的限制 | medium |
| 032 | QUIC 與 HTTP/3 的關鍵設計 | hard |
| 033 | 內容協商與壓縮 | medium |
| 034 | Cookie 的安全屬性與 SameSite | medium |
| 035 | CORS 的機制與常見錯誤 | medium |
| 036 | TLS 1.3 的改進與 0-RTT 的取捨 | hard |
| 037 | 常見的網路層攻擊與防護 | medium |
| 038 | 負載平衡的四層與七層 | medium |
| 039 | 反向代理的連線管理與逾時串接 | medium |
| 040 | CDN 的快取行為與回源 | medium |
| 041 | DNS 的進階：解析策略、TTL 與故障轉移 | medium |
| 042 | Anycast 與 BGP：流量是怎麼找到路的 | hard |
| 043 | 延遲從哪裡來：拆解一次請求的時間 | medium |
| 044 | 丟包與重傳的診斷 | hard |
| 045 | 抓包分析的實務 | medium |
| 046 | 容器與雲端環境的網路問題 | medium |
| 047 | IPv6 與雙協定堆疊 | medium |
| 048 | gRPC 的網路層特性與常見問題 | medium |
| 049 | 內網服務之間的通訊設計 | medium |
| 050 | 網路的整體判斷：抽象在哪裡洩漏 | hard |

難度分布：easy 5、medium 34、hard 11。
