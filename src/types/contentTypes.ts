// Word Definition specific data type for CONTENT_WORD_DEFINITION
export interface WordDefinitionData {
  picture_url: string;
  audio_url: string;
  chinese_text: string;
  pinyin: string;
  speech: string;
  explaination: string;
  additional_info: string;
}

// Sentences content data type for CONTENT_SENTENCES
export interface SentencesData {
  picture_url: string;
  audio_url: string;
  chinese_text: string[];
  pinyin: string[];
  translation: string;
  additional_info: string;
}

// Union type for all content data types
export type ContentData = WordDefinitionData | SentencesData | Record<string, any>;