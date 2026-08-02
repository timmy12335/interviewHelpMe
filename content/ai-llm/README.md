# AI 大模型面試題（樣板類別）

InterviewHelpMe 第九個內容類別，共 24 題，涵蓋 Transformer 架構基礎（自注意力機制、多頭注意力、Tokenization、位置編碼）、訓練與微調技術（預訓練/微調、LoRA/PEFT、RLHF、DPO）、提示工程與應用層技術（Prompt Engineering、In-Context Learning、Chain of Thought、Function Calling、Prompt Injection）、檢索與知識增強（RAG 架構、向量資料庫）、推理與部署效率（模型量化、KV Cache、混合專家模型、模型蒸餾）、以及生成控制與可靠性議題（取樣策略、幻覺問題、長文本處理、困惑度與評估指標、Scaling Laws）。

## 檔案格式

與其他類別相同：每題一個 `NNN-slug.md`，frontmatter 對應 [schema.sql](../../backend/sql/schema.sql) 的 `question` 表（`category: ai-llm`）。正文含：題目、核心答案、詳細解析、面試回答方式、常見追問（3 題，各含核心答案／詳細解析／面試回答方式）、相關。題目之間大量交叉連結（例如 RLHF ↔ DPO ↔ Chain of Thought、模型量化 ↔ KV Cache ↔ 混合專家模型 ↔ 模型蒸餾這幾個效率優化技術之間反覆比較彼此作用的維度），也透過 `[[../category/file.md]]` 連結到後端工程、資料庫、Redis、系統設計等類別（如快取一致性、分散式系統概念），呼應大型語言模型應用落地時經常需要借用的既有後端工程知識。

## 題目清單

| # | 題目 | 難度 |
|---|------|------|
| 001 | Transformer 架構基礎與自注意力機制 | easy |
| 002 | 多頭注意力機制（Multi-Head Attention） | medium |
| 003 | Tokenization 與 BPE 分詞演算法 | easy |
| 004 | 位置編碼（Positional Encoding） | medium |
| 005 | 預訓練與微調（Pre-training vs Fine-tuning） | medium |
| 006 | Prompt Engineering 提示工程 | medium |
| 007 | In-Context Learning 與少樣本學習 | medium |
| 008 | RAG（檢索增強生成）架構設計 | hard |
| 009 | 向量資料庫與相似度搜尋 | medium |
| 010 | LoRA 與參數高效微調（PEFT） | hard |
| 011 | 模型量化（Quantization） | medium |
| 012 | KV Cache 與推理加速 | hard |
| 013 | 取樣策略（Temperature, Top-k, Top-p） | easy |
| 014 | 幻覺問題（Hallucination） | medium |
| 015 | 長文本與上下文視窗處理 | medium |
| 016 | 困惑度（Perplexity）與模型評估指標 | easy |
| 017 | Scaling Laws 縮放定律 | hard |
| 018 | 混合專家模型（Mixture of Experts, MoE） | medium |
| 019 | RLHF 與人類反饋強化學習 | medium |
| 020 | DPO 與對齊技術演進 | medium |
| 021 | Chain of Thought 思維鏈推理 | medium |
| 022 | Function Calling 與工具呼叫 | medium |
| 023 | Prompt Injection 與 LLM 安全 | hard |
| 024 | 模型蒸餾（Knowledge Distillation） | hard |

難度分布：easy 4、medium 14、hard 6（鐘型分布，中等題最多）。

## 進度

9 大類第 9 類。已完成：Java 核心、Java 併發、JVM、Spring、Redis、資料庫、後端工程、系統設計、AI 大模型。待做：AI Agent（最後一類）。
