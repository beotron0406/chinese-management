"use client";
import React, { useState, useEffect } from 'react';
import { Input, Switch, Space, Typography, Button } from 'antd';
import { PlusOutlined, CloseOutlined } from '@ant-design/icons';
import { pinyin } from 'pinyin-pro';
import { TextContent } from '@/types/textContent';
import { isChineseContent, isSimpleText } from '@/types/textContent';

const { Text } = Typography;
const { TextArea } = Input;

interface TextContentInputProps {
  value?: TextContent;
  onChange?: (value: TextContent) => void;
  placeholder?: string;
  label?: string;
  /** Use textarea instead of input for multi-line content */
  multiline?: boolean;
  /** Number of rows for textarea (default: 3) */
  rows?: number;
}

/**
 * TextContentInput component with switch toggle between:
 * - Simple Text mode (for Vietnamese, English, etc.)
 * - Chinese + Pinyin mode (split character-by-character)
 * 
 * IMPORTANT: Only outputs relevant fields for the selected mode:
 * - Simple Text: { text: "..." }
 * - Chinese: { chinese: [...], pinyin: [...] }
 */
const TextContentInput: React.FC<TextContentInputProps> = ({
  value,
  onChange,
  placeholder = 'Nhập nội dung...',
  label,
  multiline = false,
  rows = 3,
}) => {
  // Determine initial mode from value
  const [isChineseMode, setIsChineseMode] = useState<boolean>(
    isChineseContent(value)
  );
  
  // Local state for Chinese mode
  const [chineseChars, setChineseChars] = useState<string[]>(
    value?.chinese && value.chinese.length > 0 ? value.chinese : ['']
  );
  const [pinyinArray, setPinyinArray] = useState<string[]>(
    value?.pinyin && value.pinyin.length > 0 ? value.pinyin : ['']
  );
  
  // Local state for simple text mode
  const [simpleText, setSimpleText] = useState<string>(
    value?.text || ''
  );

  // Sync with external value changes
  useEffect(() => {
    if (value) {
      if (isChineseContent(value)) {
        setIsChineseMode(true);
        setChineseChars(value.chinese && value.chinese.length > 0 ? value.chinese : ['']);
        setPinyinArray(value.pinyin && value.pinyin.length > 0 ? value.pinyin : ['']);
      } else if (isSimpleText(value)) {
        setIsChineseMode(false);
        setSimpleText(value.text || '');
      }
    }
  }, [value]);

  // Generate pinyin for a Chinese character/word
  const generatePinyin = (chinese: string): string => {
    try {
      return pinyin(chinese, {
        toneType: 'symbol',
        type: 'array'
      }).join('');
    } catch (error) {
      console.warn('Failed to generate pinyin:', error);
      return '';
    }
  };

  // Handle mode switch
  const handleModeSwitch = (checked: boolean) => {
    setIsChineseMode(checked);
    
    if (checked) {
      // Switching to Chinese mode - ensure at least one slot
      const chars = chineseChars.length > 0 ? chineseChars : [''];
      const pins = pinyinArray.length > 0 ? pinyinArray : [''];
      setChineseChars(chars);
      setPinyinArray(pins);
      // Only output chinese/pinyin, NO text field
      onChange?.({ chinese: chars, pinyin: pins });
    } else {
      // Switching to simple text mode - only output text, NO chinese/pinyin
      onChange?.({ text: simpleText });
    }
  };

  // Handle simple text change - only output text field
  const handleSimpleTextChange = (text: string) => {
    setSimpleText(text);
    onChange?.({ text });
  };

  // Handle Chinese character change - only output chinese/pinyin fields
  const handleChineseChange = (index: number, charValue: string) => {
    const newChineseChars = [...chineseChars];
    newChineseChars[index] = charValue;
    setChineseChars(newChineseChars);
    
    // Auto-generate pinyin if value is entered
    const newPinyinArray = [...pinyinArray];
    if (charValue) {
      newPinyinArray[index] = generatePinyin(charValue);
    }
    setPinyinArray(newPinyinArray);
    
    // Only output chinese/pinyin, NO text field
    onChange?.({ chinese: newChineseChars, pinyin: newPinyinArray });
  };

  // Handle pinyin change (manual override) - only output chinese/pinyin fields
  const handlePinyinChange = (index: number, pinyinValue: string) => {
    const newPinyinArray = [...pinyinArray];
    newPinyinArray[index] = pinyinValue;
    setPinyinArray(newPinyinArray);
    // Only output chinese/pinyin, NO text field
    onChange?.({ chinese: chineseChars, pinyin: newPinyinArray });
  };

  // Add new character slot
  const addCharacterSlot = () => {
    const newChineseChars = [...chineseChars, ''];
    const newPinyinArray = [...pinyinArray, ''];
    setChineseChars(newChineseChars);
    setPinyinArray(newPinyinArray);
    // Only output chinese/pinyin, NO text field
    onChange?.({ chinese: newChineseChars, pinyin: newPinyinArray });
  };

  // Remove character slot
  const removeCharacterSlot = (index: number) => {
    if (chineseChars.length <= 1) return;
    
    const newChineseChars = chineseChars.filter((_, i) => i !== index);
    const newPinyinArray = pinyinArray.filter((_, i) => i !== index);
    setChineseChars(newChineseChars);
    setPinyinArray(newPinyinArray);
    // Only output chinese/pinyin, NO text field
    onChange?.({ chinese: newChineseChars, pinyin: newPinyinArray });
  };

  // Get preview text
  const getPreview = (): string => {
    if (isChineseMode) {
      const chineseStr = chineseChars.filter(c => c).join('');
      const pinyinStr = pinyinArray.filter(p => p).join(' ');
      return chineseStr ? `${chineseStr} (${pinyinStr})` : '';
    }
    return simpleText;
  };

  return (
    <div className="text-content-input">
      {/* Mode Switch */}
      <div className="flex items-center justify-between mb-3">
        {label && <Text strong>{label}</Text>}
        <Space>
          <Text type="secondary" className="text-sm">Văn bản đơn giản</Text>
          <Switch
            checked={isChineseMode}
            onChange={handleModeSwitch}
            checkedChildren="中文"
            unCheckedChildren="Text"
          />
          <Text type="secondary" className="text-sm">Tiếng Trung + Pinyin</Text>
        </Space>
      </div>

      {/* Simple Text Mode */}
      {!isChineseMode && (
        <div>
          {multiline ? (
            <TextArea
              value={simpleText}
              onChange={(e) => handleSimpleTextChange(e.target.value)}
              placeholder={placeholder}
              rows={rows}
            />
          ) : (
            <Input
              value={simpleText}
              onChange={(e) => handleSimpleTextChange(e.target.value)}
              placeholder={placeholder}
            />
          )}
        </div>
      )}

      {/* Chinese + Pinyin Mode */}
      {isChineseMode && (
        <div className="chinese-input-container">
          {/* Character/Pinyin pairs */}
          <div className="flex flex-wrap gap-2 mb-3">
            {chineseChars.map((char, index) => (
              <div 
                key={index} 
                className="flex flex-col items-center p-2 border rounded-md bg-gray-50 relative group"
              >
                {/* Remove button */}
                {chineseChars.length > 1 && (
                  <Button
                    type="text"
                    size="small"
                    icon={<CloseOutlined />}
                    className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow-sm rounded-full"
                    onClick={() => removeCharacterSlot(index)}
                    danger
                  />
                )}
                
                {/* Chinese character input */}
                <Input
                  value={char}
                  onChange={(e) => handleChineseChange(index, e.target.value)}
                  placeholder="字"
                  className="w-16 text-center text-lg font-medium mb-1"
                  maxLength={4}
                />
                
                {/* Pinyin input */}
                <Input
                  value={pinyinArray[index] || ''}
                  onChange={(e) => handlePinyinChange(index, e.target.value)}
                  placeholder="pīn"
                  className="w-16 text-center text-xs"
                  size="small"
                />
              </div>
            ))}
            
            {/* Add button */}
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={addCharacterSlot}
              className="h-20 w-16"
            >
              Thêm
            </Button>
          </div>

          {/* Preview */}
          {getPreview() && (
            <div className="p-2 bg-blue-50 rounded-md">
              <Text type="secondary" className="text-xs">Xem trước: </Text>
              <Text className="text-base">{getPreview()}</Text>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TextContentInput;
