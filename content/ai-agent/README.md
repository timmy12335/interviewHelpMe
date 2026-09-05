# AI Agent 面試題（樣板類別）

InterviewHelpMe 第十個、也是最後一個內容類別，共 50 題，涵蓋 Agent 基礎架構模式（基本定義、ReAct、Plan-and-Execute、任務分解與規劃）、記憶與狀態管理（短期/長期記憶、狀態管理與檢查點）、多代理協作（多代理系統架構、Agent 間通訊協定、MCP、子代理委派、工作流程編排）、自我改進機制（Reflection、Reflexion）、安全與治理（沙箱、Human-in-the-Loop、護欄設計、自主性層級光譜）、以及工程實務（可觀測性與追蹤、評估方法論、測試策略、成本控制與速率限制、長時間執行與任務佇列、Computer Use、框架選型）。

## 這個類別的設計

前 24 題建立 Agent 的基本模式與詞彙。第 025 到 050 題換一個角度：**每一題都圍繞「實際做起來會踩到什麼」**。六個方向：

- **工具層**（025-028）：工具介面與描述的設計、工具選擇失敗的診斷、MCP 的實務、檔案系統作為工作空間。
- **上下文與控制迴圈**（029-034）：上下文管理與壓縮、長對話的行為退化、終止條件、錯誤處理的特殊性、並行調度、可重現性。
- **多代理的判斷**（035-036）：通訊拓撲與收斂、以及什麼時候不該用多代理。
- **安全與治理**（037-039）：權限模型、間接提示注入與資料流控制、審計與責任歸屬。
- **產品與工程**（040-045）：使用者介面與進度呈現、中斷與接管、部署形態、快取與冪等、版本管理與行為漂移、延遲分析。
- **落地與收束**（046-050）：編碼 Agent 的特殊挑戰、業務流程 Agent 的落地、既有系統整合、什麼時候用工作流就好、以及收束題「可靠性從哪裡來」。

## 檔案格式

與其他類別相同：每題一個 `NNN-slug.md`，frontmatter 對應 [schema.sql](../../backend/sql/schema.sql) 的 `question` 表（`category: ai-agent`）。正文含：題目、核心答案、詳細解析、面試回答方式、常見追問（3 題，各含核心答案／詳細解析／面試回答方式）、相關。這個類別的題目彼此高度交叉連結——多個核心概念（如「錯誤不應被靜默忽略」「一體適用單一標準很少是最理想選擇」「自我審查天生存在系統性盲點」）會在不同題目裡被反覆識別、遷移應用到新的具體場景，也大量連結到 AI 大模型類別（Function Calling、Prompt Injection、RAG、向量資料庫、RLHF、Chain of Thought 等）與後端工程類別（服務發現、分散式追蹤、分散式交易），呼應 Agent 技術本質上是把 LLM 能力和既有後端工程知識整合應用到具體任務執行場景。

## 題目清單

| # | 題目 | 難度 |
|---|------|------|
| 001 | AI Agent 基本定義與核心組成 | easy |
| 002 | ReAct 模式（Reasoning + Acting） | easy |
| 003 | Agent 規劃與任務分解 | medium |
| 004 | Agent 記憶系統（短期與長期記憶） | medium |
| 005 | 多代理系統架構（Multi-Agent Systems） | medium |
| 006 | Agent 間通訊協定與 A2A | medium |
| 007 | MCP（Model Context Protocol）架構與設計理念 | medium |
| 008 | Plan-and-Execute 架構模式 | medium |
| 009 | Agent 自我修正與 Reflection | medium |
| 010 | Agent 沙箱與程式碼執行安全 | hard |
| 011 | Human-in-the-Loop 設計模式 | medium |
| 012 | Agent 可觀測性與追蹤 | medium |
| 013 | Agent 評估方法論 | hard |
| 014 | Agent 自主性層級與人機協作光譜 | easy |
| 015 | Computer Use 與瀏覽器操作型 Agent | medium |
| 016 | Agent 工作流程編排模式 | medium |
| 017 | 子代理與委派模式（Sub-agent Delegation） | hard |
| 018 | Agent 成本控制與速率限制 | medium |
| 019 | Agent 狀態管理與檢查點 | hard |
| 020 | Agent 護欄設計（Guardrails） | medium |
| 021 | Reflexion 與自我批評機制延伸 | hard |
| 022 | Agent 測試策略與模擬 | medium |
| 023 | 長時間執行 Agent 與任務佇列 | hard |
| 024 | Agent 框架比較與選型考量 | easy |
| 025 | 工具設計：介面、描述與錯誤回傳 | medium |
| 026 | 工具選擇失敗的診斷與改善 | medium |
| 027 | MCP 的實務：伺服器設計、權限與部署 | medium |
| 028 | 檔案系統作為 Agent 的工作空間 | medium |
| 029 | 上下文管理：壓縮、摘要與遺忘 | hard |
| 030 | 上下文腐化：長對話中的行為退化 | medium |
| 031 | 迴圈控制：終止條件與無限迴圈的防範 | medium |
| 032 | Agent 的錯誤處理與重試特殊性 | medium |
| 033 | 並行工具呼叫與依賴調度 | medium |
| 034 | 確定性與可重現性：Agent 的除錯基礎 | hard |
| 035 | 多代理的通訊拓撲與收斂問題 | hard |
| 036 | 什麼時候不該用多代理 | hard |
| 037 | Agent 的權限模型與最小權限 | medium |
| 038 | 間接提示注入與 Agent 的資料流控制 | hard |
| 039 | 審計、可追溯性與責任歸屬 | medium |
| 040 | Agent 的使用者介面與進度呈現 | medium |
| 041 | 中斷、接管與修正：人怎麼介入執行中的 Agent | medium |
| 042 | Agent 的部署形態：同步、非同步與常駐 | medium |
| 043 | 快取與冪等在 Agent 中的應用 | medium |
| 044 | 版本管理與行為漂移 | medium |
| 045 | Agent 的延遲：時間花在哪裡 | medium |
| 046 | 編碼 Agent 的特殊挑戰 | hard |
| 047 | 客服與業務流程 Agent 的落地 | medium |
| 048 | Agent 與既有系統的整合 | medium |
| 049 | 什麼時候不該用 Agent：工作流就夠了 | hard |
| 050 | Agent 的整體判斷：可靠性從哪裡來 | hard |

難度分布：easy 4、medium 32、hard 14（鐘型分布，中等題最多）。

## 進度

17 大知識類別已完成：Java 核心、Java 併發、JVM、Spring、Redis、資料庫、後端工程、系統設計、Kubernetes、AI 大模型、AI Agent、演算法與資料結構、行為面試、前端、計算機網路、訊息佇列、設計模式，另有實戰面試題類別。共 718 題面試題。
