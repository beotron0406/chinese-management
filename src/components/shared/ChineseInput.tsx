"use client";
import React, { useState, useEffect } from 'react';
import { Input, Space, Typography, Button } from 'antd';
import { PlusOutlined, CloseOutlined, ReloadOutlined } from '@ant-design/icons';
import { pinyin } from 'pinyin-pro';
import { TextContent } from '@/types/textContent';

const { Text } = Typography;

interface ChineseInputProps {
  value?: TextContent;
  onChange?: (value: TextContent) => void;
  placeholder?: string;
  /** Compact mode for inline use */
  compact?: boolean;
}

/**
 * ChineseInput - A simplified input for Chinese text with auto-generated pinyin.
 * This is a Chinese-only version (no switch toggle).
 */
const ChineseInput: React.FC<ChineseInputProps> = ({
  value,
  onChange,
  placeholder = 'Nhập chữ Trung...',
  compact = false,
}) => {
  const [chineseChars, setChineseChars] = useState<string[]>(
    value?.chinese && value.chinese.length > 0 ? value.chinese : ['']
  );
  const [pinyinArray, setPinyinArray] = useState<string[]>(
    value?.pinyin && value.pinyin.length > 0 ? value.pinyin : ['']
  );

  // Sync with external value changes
  useEffect(() => {
    if (value?.chinese && value.chinese.length > 0) {
      setChineseChars(value.chinese);
      setPinyinArray(value.pinyin || value.chinese.map(() => ''));
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
      return '';
    }
  };

  // Handle Chinese character change
  const handleChineseChange = (index: number, charValue: string) => {
    const newChineseChars = [...chineseChars];
    newChineseChars[index] = charValue;
    setChineseChars(newChineseChars);
    
    // Auto-generate pinyin
    const newPinyinArray = [...pinyinArray];
    if (charValue) {
      newPinyinArray[index] = generatePinyin(charValue);
    }
    setPinyinArray(newPinyinArray);
    
    onChange?.({ chinese: newChineseChars, pinyin: newPinyinArray });
  };

  // Handle pinyin change (manual override)
  const handlePinyinChange = (index: number, pinyinValue: string) => {
    const newPinyinArray = [...pinyinArray];
    newPinyinArray[index] = pinyinValue;
    setPinyinArray(newPinyinArray);
    onChange?.({ chinese: chineseChars, pinyin: newPinyinArray });
  };

  // Add new character slot
  const addCharacterSlot = () => {
    const newChineseChars = [...chineseChars, ''];
    const newPinyinArray = [...pinyinArray, ''];
    setChineseChars(newChineseChars);
    setPinyinArray(newPinyinArray);
    onChange?.({ chinese: newChineseChars, pinyin: newPinyinArray });
  };

  // Remove character slot
  const removeCharacterSlot = (index: number) => {
    if (chineseChars.length <= 1) return;
    
    const newChineseChars = chineseChars.filter((_, i) => i !== index);
    const newPinyinArray = pinyinArray.filter((_, i) => i !== index);
    setChineseChars(newChineseChars);
    setPinyinArray(newPinyinArray);
    onChange?.({ chinese: newChineseChars, pinyin: newPinyinArray });
  };

  // Regenerate all pinyin
  const regenerateAllPinyin = () => {
    const newPinyinArray = chineseChars.map(char => char ? generatePinyin(char) : '');
    setPinyinArray(newPinyinArray);
    onChange?.({ chinese: chineseChars, pinyin: newPinyinArray });
  };

  if (compact) {
    // Compact single-line input
    return (
      <div className="flex items-center gap-2">
        <div className="flex flex-wrap gap-1">
          {chineseChars.map((char, index) => (
            <div key={index} className="flex flex-col items-center">
              <Input
                value={char}
                onChange={(e) => handleChineseChange(index, e.target.value)}
                placeholder="字"
                className="w-12 text-center text-sm"
                size="small"
              />
              <Text className="text-xs text-gray-500">{pinyinArray[index] || ''}</Text>
            </div>
          ))}
        </div>
        <Button size="small" icon={<PlusOutlined />} onClick={addCharacterSlot} />
      </div>
    );
  }

  return (
    <div className="chinese-input">
      <div className="flex flex-wrap gap-2 mb-2">
        {chineseChars.map((char, index) => (
          <div 
            key={index} 
            className="flex flex-col items-center p-2 border rounded-md bg-gray-50 relative group"
          >
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
            
            <Input
              value={char}
              onChange={(e) => handleChineseChange(index, e.target.value)}
              placeholder="字"
              className="w-14 text-center text-lg font-medium mb-1"
              maxLength={4}
            />
            
            <Input
              value={pinyinArray[index] || ''}
              onChange={(e) => handlePinyinChange(index, e.target.value)}
              placeholder="pīn"
              className="w-14 text-center text-xs"
              size="small"
            />
          </div>
        ))}
        
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={addCharacterSlot}
          className="h-[72px] w-14"
        />
      </div>

      {/* Preview and regenerate */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {chineseChars.filter(c => c).join('')}
          {' '}
          <span className="text-blue-500">
            ({pinyinArray.filter(p => p).join(' ')})
          </span>
        </div>
        <Button
          type="link"
          size="small"
          icon={<ReloadOutlined />}
          onClick={regenerateAllPinyin}
        >
          Tạo lại pinyin
        </Button>
      </div>
    </div>
  );
};

export default ChineseInput;
