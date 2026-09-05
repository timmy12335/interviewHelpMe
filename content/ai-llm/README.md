# AI 大模型面試題（樣板類別）

InterviewHelpMe 第九個內容類別，共 50 題，涵蓋 Transformer 架構基礎（自注意力機制、多頭注意力、Tokenization、位置編碼）、訓練與微調技術（預訓練/微調、LoRA/PEFT、RLHF、DPO）、提示工程與應用層技術（Prompt Engineering、In-Context Learning、Chain of Thought、Function Calling、Prompt Injection）、檢索與知識增強（RAG 架構、向量資料庫）、推理與部署效率（模型量化、KV Cache、混合專家模型、模型蒸餾）、以及生成控制與可靠性議題（取樣策略、幻覺問題、長文本處理、困惑度與評估指標、Scaling Laws）。

## 這個類別的設計

前 24 題建立大模型的基本詞彙——這些概念是什麼、怎麼運作。第 025 到 050 題換一個角度：**每一題都圍繞判準、失敗模式與成本**。五個方向：

- **架構的內部細節**（025-029）：Decoder-only 的取捨、殘差與正規化、RoPE 與長度外推、注意力的效率優化、詞表與 tokenizer 的實務影響。
- **訓練的工程現實**（030-035）：預訓練資料的處理、分散式平行策略、訓練穩定性、指令微調與資料合成、災難性遺忘、以及 RLHF 的失效模式。
- **推理與部署**（036-040）：prefill 與 decode 的兩階段特性、continuous batching、推測解碼、服務成本、結構化輸出。
- **應用層的可靠性**（041-045）：RAG 的檢索品質與失敗模式、評估方法論、嵌入模型選型、多模態結構。
- **判斷題**（046-050）：推理模型與測試時計算、模型選型與成本、應用安全、提示/RAG/微調怎麼選、以及收束題「能力邊界在哪裡」。

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
| 025 | 解碼器架構與因果遮罩：為什麼現在的大模型都是 Decoder-only | medium |
| 026 | 殘差連接與層正規化：Transformer 為什麼能訓得很深 | medium |
| 027 | RoPE 與長度外推：模型怎麼處理沒見過的長度 | hard |
| 028 | 注意力的效率優化：FlashAttention 與稀疏注意力 | hard |
| 029 | 詞表設計與 tokenizer 的實務影響 | medium |
| 030 | 預訓練資料：清洗、去重與配比 | medium |
| 031 | 分散式訓練：資料、張量、管線與專家平行 | hard |
| 032 | 訓練穩定性：學習率、精度與發散的處理 | hard |
| 033 | 指令微調與資料合成 | medium |
| 034 | 災難性遺忘與領域適配 | medium |
| 035 | 獎勵模型與 RLHF 的失效模式 | hard |
| 036 | 推理的兩個階段：prefill 與 decode | hard |
| 037 | 批次策略與 continuous batching | medium |
| 038 | 推測解碼：用小模型加速大模型 | hard |
| 039 | 推理服務的部署與成本 | medium |
| 040 | 結構化輸出與約束解碼 | medium |
| 041 | RAG 的檢索品質：切分、重排與混合檢索 | medium |
| 042 | RAG 的失敗模式與評估 | medium |
| 043 | LLM 的評估：基準、LLM-as-judge 與線上評估 | medium |
| 044 | 嵌入模型的選型與微調 | medium |
| 045 | 多模態模型的基本結構 | medium |
| 046 | 推理模型與測試時計算 | hard |
| 047 | 模型選型與成本判斷 | medium |
| 048 | LLM 應用的安全與濫用防護 | medium |
| 049 | 提示、RAG 還是微調：怎麼選 | medium |
| 050 | 大模型的整體判斷：能力邊界在哪裡 | hard |

難度分布：easy 4、medium 31、hard 15（鐘型分布，中等題最多）。
