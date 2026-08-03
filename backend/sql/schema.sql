-- InterviewHelpMe draft schema (proposal, not yet wired to a running app)
-- Simplified from liyupi/mianshiya-next's question_bank / question / question_bank_question model:
-- our categories are a fixed, curated set (not user-created banks), so a direct FK replaces the join table.

CREATE DATABASE IF NOT EXISTS interview_help_me;
USE interview_help_me;

-- 分類（固定 10 大知識類別 + 1 個實戰題庫：java、spring、jvm、java-concurrency、redis、database、backend-engineering、system-design、ai-llm、ai-agent、real-interviews）
CREATE TABLE IF NOT EXISTS category
(
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    slug        VARCHAR(64)  NOT NULL COMMENT '分類代碼，例如 java-concurrency',
    name_zh     VARCHAR(128) NOT NULL COMMENT '中文名稱',
    name_en     VARCHAR(128) NULL COMMENT '英文名稱',
    description TEXT         NULL,
    sort_order  INT          DEFAULT 0,
    created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_slug (slug)
) COMMENT '面試題分類' COLLATE = utf8mb4_unicode_ci;

-- 題目
CREATE TABLE IF NOT EXISTS question
(
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    category_id BIGINT       NOT NULL COMMENT '所屬分類',
    slug        VARCHAR(128) NOT NULL COMMENT '題目代碼，用於檔案對應與網址',
    title       VARCHAR(256) NOT NULL COMMENT '題目標題',
    difficulty  ENUM ('easy', 'medium', 'hard') NOT NULL DEFAULT 'medium',
    tags        JSON         NULL COMMENT '子主題標籤陣列，例如 ["synchronized", "JMM"]',
    content     MEDIUMTEXT   NOT NULL COMMENT '題目內容（markdown）',
    answer      MEDIUMTEXT   NOT NULL COMMENT '詳細解答（markdown）',
    source      VARCHAR(32)  DEFAULT 'original' COMMENT 'original | community | adapted',
    created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_category_slug (category_id, slug),
    FULLTEXT KEY ft_title_content (title, content),
    CONSTRAINT fk_question_category FOREIGN KEY (category_id) REFERENCES category (id)
) COMMENT '面試題目' COLLATE = utf8mb4_unicode_ci;

-- 收藏（v1 可延後；先保留欄位設計）
CREATE TABLE IF NOT EXISTS favorite
(
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT   NOT NULL,
    question_id BIGINT   NOT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_question (user_id, question_id),
    CONSTRAINT fk_favorite_question FOREIGN KEY (question_id) REFERENCES question (id)
) COMMENT '使用者收藏' COLLATE = utf8mb4_unicode_ci;

INSERT INTO category (slug, name_zh, name_en, sort_order) VALUES
    ('java', 'Java 面試題', 'Java', 1),
    ('spring', 'Spring 面試題', 'Spring', 2),
    ('jvm', 'JVM 面試題', 'JVM', 3),
    ('java-concurrency', 'Java 併發面試題', 'Java Concurrency', 4),
    ('redis', 'Redis 面試題', 'Redis', 5),
    ('database', '資料庫面試題', 'Database', 6),
    ('backend-engineering', '後端工程面試題', 'Backend Engineering', 7),
    ('system-design', '系統設計面試題', 'System Design', 8),
    ('ai-llm', 'AI 大模型面試題', 'AI LLM', 9),
    ('ai-agent', 'AI Agent 面試題', 'AI Agent', 10),
    ('real-interviews', '實戰面試題（真實公司考題風格）', 'Real Company Interviews', 11);
