export function extractTagsFromText(text: string): string[] {
  const jsonMatch = text.match(/\{[\s\S]*\}/);

  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed.tags)) {
        return parsed.tags
          .map((tag: unknown) => String(tag).trim())
          .filter(Boolean);
      }
    } catch (error) {
      console.warn("Failed to parse JSON tags:", error);
    }
  }

  const fallback = text
    .replace(/[`"'\\[\]{}（）()]/g, " ")
    .split(/[\n,，、;；\s]+/)
    .map((tag) => tag.trim())
    .filter(Boolean);

  // 去重
  return Array.from(new Set(fallback)).slice(0, 8);
}
