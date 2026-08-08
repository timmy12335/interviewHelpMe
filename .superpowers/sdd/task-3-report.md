# Task 3：TagList TDD 實作報告

## 狀態

已完成 `TagList({ tags: string[]; max?: number })`、單元測試及 Storybook Stories。

## RED 證據

先建立 `frontend/src/components/TagList/TagList.test.tsx`，涵蓋：

1. `tags` 為空陣列時回傳空 DOM。
2. 標籤數量未超過 `max` 時完整顯示，且不顯示隱藏數量。
3. 標籤數量超過 `max` 時只顯示前 `max` 個標籤，並顯示 `+N`。

執行：

```text
cd frontend && npm test -- src/components/TagList/TagList.test.tsx
```

在尚未建立實作前，測試如預期失敗：

```text
FAIL  src/components/TagList/TagList.test.tsx
Error: Failed to resolve import "./index"
Test Files  1 failed (1)
Exit code: 1
```

這是有效的 compile-time RED：測試引用預期 API，但元件尚未實作。

## 實作

- 新增 `frontend/src/components/TagList/index.tsx`。
- 使用 Ant Design 5 的 `Tag`。
- 空陣列回傳 `null`。
- 有設定 `max` 且超出上限時，顯示前 `max` 個標籤及 `+N`。
- 元件使用繁體中文 JSDoc，props 維持英文命名。
- 無 API、hook 或其他副作用。

## GREEN 證據

以相同測試目標重跑：

```text
cd frontend && npm test -- src/components/TagList/TagList.test.tsx

✓ src/components/TagList/TagList.test.tsx (3 tests)
Test Files  1 passed (1)
Tests       3 passed (3)
Exit code: 0
```

最終驗證也再次通過相同的 3 個測試。

## Storybook

新增 `frontend/src/components/TagList/TagList.stories.tsx`：

- `Default`
- `Empty`
- `ManyTags`
- `tags: ["autodocs"]`

執行 `npm run build-storybook` 成功：

```text
info => Preview built
info => Output directory: frontend/storybook-static
Exit code: 0
```

建置僅出現 bundle size 建議警告，沒有建置錯誤；IDE linter 亦未回報 TagList 檔案錯誤。
