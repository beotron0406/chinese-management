"use client";
import React from 'react';
import { Typography, Space } from 'antd';
import { TextContent } from '@/types/textContent';
import { isChineseContent, isSimpleText } from '@/types/textContent';
import { getDisplayText, getDisplayPinyin } from '@/utils/textContentUtils';

const { Text } = Typography;

interface TextContentDisplayProps {
  content?: TextContent | string;
  /** Show pinyin above Chinese characters (ruby style) */
  showPinyin?: boolean;
  /** Size variant */
  size?: 'small' | 'default' | 'large';
  /** Additional className */
  className?: string;
  /** Text color */
  color?: string;
}

/**
 * TextContentDisplay component for rendering TextContent.
 * Supports both simple text and Chinese with pinyin (ruby-style).
 */
const TextContentDisplay: React.FC<TextContentDisplayProps> = ({
  content,
  showPinyin = true,
  size = 'default',
  className = '',
  color,
}) => {
  if (!content) return null;

  // Handle legacy string format
  if (typeof content === 'string') {
    return (
      <Text className={className} style={{ color }}>
        {content}
      </Text>
    );
  }

  // Handle simple text
  if (isSimpleText(content)) {
    return (
      <Text className={className} style={{ color }}>
        {content.text}
      </Text>
    );
  }

  // Handle Chinese content with split pinyin
  if (isChineseContent(content)) {
    const sizeStyles = {
      small: { chinese: 'text-sm', pinyin: 'text-xs' },
      default: { chinese: 'text-base', pinyin: 'text-xs' },
      large: { chinese: 'text-lg', pinyin: 'text-sm' },
    };

    const styles = sizeStyles[size];

    if (!showPinyin) {
      // Just show Chinese without pinyin
      return (
        <Text className={`${styles.chinese} ${className}`} style={{ color }}>
          {content.chinese?.join('')}
        </Text>
      );
    }

    // Ruby-style display with pinyin on top
    return (
      <span className={`inline-flex flex-wrap ${className}`}>
        {content.chinese?.map((char, index) => (
          <span key={index} className="inline-flex flex-col items-center mx-0.5">
            {/* Pinyin on top */}
            <span className={`${styles.pinyin} text-gray-500 leading-tight`}>
              {content.pinyin?.[index] || ''}
            </span>
            {/* Chinese character below */}
            <span className={`${styles.chinese} leading-tight`} style={{ color }}>
              {char}
            </span>
          </span>
        ))}
      </span>
    );
  }

  // Fallback
  return (
    <Text className={className} style={{ color }}>
      {getDisplayText(content)}
    </Text>
  );
};

/**
 * Inline version that displays Chinese(pinyin) format in a single line.
 */
export const TextContentInline: React.FC<TextContentDisplayProps> = ({
  content,
  showPinyin = true,
  className = '',
  color,
}) => {
  if (!content) return null;

  const displayText = getDisplayText(content);
  
  // For Chinese content, show inline format
  if (typeof content !== 'string' && isChineseContent(content) && showPinyin) {
    const pinyinText = getDisplayPinyin(content);
    return (
      <Text className={className} style={{ color }}>
        {displayText} <Text type="secondary">({pinyinText})</Text>
      </Text>
    );
  }

  return (
    <Text className={className} style={{ color }}>
      {displayText}
    </Text>
  );
};

export default TextContentDisplay;
