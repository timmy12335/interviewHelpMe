import { Tag } from "antd";

export interface TagListProps {
  tags: string[];
  max?: number;
}

/**
 * 顯示標籤清單，並在超過顯示上限時呈現隱藏數量。
 */
export function TagList({ tags, max }: TagListProps) {
  if (tags.length === 0) {
    return null;
  }

  const isTruncated = max !== undefined && tags.length > max;
  const visibleTags = isTruncated ? tags.slice(0, max) : tags;

  return (
    <>
      {visibleTags.map((tag, index) => (
        <Tag key={`${tag}-${index}`}>{tag}</Tag>
      ))}
      {isTruncated && <Tag>+{tags.length - max}</Tag>}
    </>
  );
}
