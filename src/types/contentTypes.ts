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
  // Add structure for sentences content when needed
  [key: string]: any;
}

// Union type for all content data types
export type ContentData = WordDefinitionData | SentencesData | Record<string, any>;