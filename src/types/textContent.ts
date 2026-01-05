/**
 * TextContent type for supporting both simple text and Chinese with split pinyin.
 * 
 * This follows the same pattern used in content_sentences and grammar patterns
 * for word-by-word pinyin mapping.
 * 
 * @example Simple text (Vietnamese, English)
 * { text: "Xin chào" }
 * 
 * @example Chinese with split pinyin
 * { chinese: ["你", "好"], pinyin: ["nǐ", "hǎo"] }
 */
export interface TextContent {
  /** Simple text for non-Chinese content (Vietnamese, English, etc.) */
  text?: string;
  
  /** Split Chinese characters - each element maps 1:1 with pinyin array */
  chinese?: string[];
  
  /** Split pinyin - each element maps 1:1 with chinese array */
  pinyin?: string[];
}

/**
 * Type guard to check if TextContent has Chinese content
 */
export function isChineseContent(content: TextContent | undefined | null): boolean {
  return !!content && Array.isArray(content.chinese) && content.chinese.length > 0;
}

/**
 * Type guard to check if TextContent has simple text
 */
export function isSimpleText(content: TextContent | undefined | null): boolean {
  return !!content && typeof content.text === 'string' && content.text.length > 0;
}
