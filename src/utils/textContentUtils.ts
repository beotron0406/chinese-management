import { TextContent, isChineseContent, isSimpleText } from '@/types/textContent';

/**
 * Get display text from TextContent.
 * For Chinese content, joins the characters together.
 * For simple text, returns the text as-is.
 */
export function getDisplayText(content: TextContent | string | undefined | null): string {
  if (!content) return '';
  
  // Handle legacy string format
  if (typeof content === 'string') return content;
  
  // Handle Chinese content
  if (isChineseContent(content)) {
    return content.chinese!.join('');
  }
  
  // Handle simple text
  if (isSimpleText(content)) {
    return content.text!;
  }
  
  return '';
}

/**
 * Get display pinyin from TextContent.
 * For Chinese content, joins the pinyin together with spaces.
 */
export function getDisplayPinyin(content: TextContent | undefined | null): string {
  if (!content || !isChineseContent(content)) return '';
  return content.pinyin?.join(' ') || '';
}

/**
 * Create a simple text TextContent object.
 */
export function createTextContent(text: string): TextContent {
  return { text };
}

/**
 * Create a Chinese TextContent object with split pinyin.
 */
export function createChineseContent(chinese: string[], pinyin: string[]): TextContent {
  return { chinese, pinyin };
}

/**
 * Convert legacy string to TextContent format.
 * If already TextContent, returns as-is.
 */
export function normalizeToTextContent(value: string | TextContent | undefined | null): TextContent {
  if (!value) return { text: '' };
  if (typeof value === 'string') return { text: value };
  return value;
}

/**
 * Check if a TextContent object is empty (no text and no chinese content).
 */
export function isTextContentEmpty(content: TextContent | string | undefined | null): boolean {
  if (!content) return true;
  if (typeof content === 'string') return content.trim().length === 0;
  
  const hasText = content.text && content.text.trim().length > 0;
  const hasChinese = content.chinese && content.chinese.length > 0;
  
  return !hasText && !hasChinese;
}

/**
 * Validate that Chinese and Pinyin arrays have matching lengths.
 */
export function validateChineseContent(content: TextContent): boolean {
  if (!isChineseContent(content)) return true; // Not Chinese content, skip validation
  
  const chineseLen = content.chinese?.length || 0;
  const pinyinLen = content.pinyin?.length || 0;
  
  return chineseLen === pinyinLen;
}
