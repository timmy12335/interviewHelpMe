# AI Agent 面試題（樣板類別）

InterviewHelpMe 第十個、也是最後一個內容類別，共 24 題，涵蓋 Agent 基礎架構模式（基本定義、ReAct、Plan-and-Execute、任務分解與規劃）、記憶與狀態管理（短期/長期記憶、狀態管理與檢查點）、多代理協作（多代理系統架構、Agent 間通訊協定、MCP、子代理委派、工作流程編排）、自我改進機制（Reflection、Reflexion）、安全與治理（沙箱、Human-in-the-Loop、護欄設計、自主性層級光譜）、以及工程實務（可觀測性與追蹤、評估方法論、測試策略、成本控制與速率限制、長時間執行與任務佇列、Computer Use、框架選型）。

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

難度分布：easy 4、medium 14、hard 6（鐘型分布，中等題最多）。

## 進度

全部 10 大類已完成：Java 核心、Java 併發、JVM、Spring、Redis、資料庫、後端工程、系統設計、AI 大模型、AI Agent。共 240 題面試題。
