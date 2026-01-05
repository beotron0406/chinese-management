import { QuestionType } from "@/enums/question-type.enum";
import { TextContent } from "./textContent";

/**
 * Text option that supports both simple text and Chinese with split pinyin.
 * Use `content` for new data. Legacy `text` field is kept for backward compatibility.
 */
export interface TextOption {
  id: string;
  /** @deprecated Use `content` instead for new data */
  text?: string;
  /** New unified format supporting simple text or Chinese with pinyin */
  content?: TextContent;
}

/**
 * Image option for selection/matching questions.
 */
export interface ImageOption {
  id: string;
  image: string;
  alt: string;
}

// Selection Question Interfaces
export interface SelectionTextTextQuestionData {
  instruction: string;
  /** @deprecated Use `questionContent` instead for new data */
  question?: string;
  /** New unified format supporting simple text or Chinese with pinyin */
  questionContent?: TextContent;
  options: TextOption[];
  correctAnswer: string;
  explanation?: string;
}

export interface SelectionTextImageQuestionData {
  instruction: string;
  /** @deprecated Use `questionContent` instead for new data */
  question?: string;
  /** New unified format supporting simple text or Chinese with pinyin */
  questionContent?: TextContent;
  options: ImageOption[];
  correctAnswer: string;
  explanation?: string;
}

export interface SelectionAudioTextQuestionData {
  instruction: string;
  audio: string;
  audio_url?: string;
  options: TextOption[];
  correctAnswer: string;
  explanation?: string;
  audio_transcript_chinese?: string;
  audio_transcript_pinyin?: string;
  audio_transcript_translation?: string;
}

export interface SelectionAudioImageQuestionData {
  instruction: string;
  audio: string;
  audio_url?: string;
  options: ImageOption[];
  correctAnswer: string;
  explanation?: string;
  audio_transcript_chinese?: string;
  audio_transcript_pinyin?: string;
  audio_transcript_translation?: string;
}

export interface SelectionImageTextQuestionData {
  instruction: string;
  image: string;
  alt: string;
  options: TextOption[];
  correctAnswer: string;
  explanation?: string;
}

// Matching Question Interfaces

/**
 * Text item for matching columns.
 */
export interface MatchingTextItem {
  id: string;
  /** @deprecated Use `content` instead for new data */
  text?: string;
  /** @deprecated Pinyin is now included in `content` */
  pinyin?: string;
  /** New unified format supporting simple text or Chinese with pinyin */
  content?: TextContent;
}

/**
 * Audio item for matching columns.
 */
export interface MatchingAudioItem {
  id: string;
  audio: string;
  audio_url?: string;
  transcript?: string;
}

export interface MatchingTextTextQuestionData {
  instruction: string;
  leftColumn: MatchingTextItem[];
  rightColumn: MatchingTextItem[];
  correctMatches: Array<{
    left: string;
    right: string;
  }>;
}

export interface MatchingTextImageQuestionData {
  instruction: string;
  leftColumn: MatchingTextItem[];
  rightColumn: ImageOption[];
  correctMatches: Array<{
    left: string;
    right: string;
  }>;
}

export interface MatchingAudioTextQuestionData {
  instruction: string;
  leftColumn: MatchingAudioItem[];
  rightColumn: MatchingTextItem[];
  correctMatches: Array<{
    left: string;
    right: string;
  }>;
}

export interface MatchingAudioImageQuestionData {
  instruction: string;
  leftColumn: MatchingAudioItem[];
  rightColumn: ImageOption[];
  correctMatches: Array<{
    left: string;
    right: string;
  }>;
}

// Fill Question Interfaces

/** Segment in a fill-in-the-blank sentence */
export interface FillSegment {
  type: 'text' | 'blank';
  /** TextContent for text segments */
  content?: TextContent;
  /** Blank index (1, 2, 3...) for blank segments */
  blankIndex?: number;
}

/** Correct answer for a blank with pinyin support */
export interface FillBlankAnswer {
  index: number;
  correctAnswers: TextContent[];
}

export interface FillTextTextQuestionData {
  instruction: string;
  vietnamese: string;
  explanation: string;
  
  // New format with segments and TextContent
  /** Sentence segments (text or blank placeholders) */
  segments?: FillSegment[];
  /** Option bank with pinyin support */
  optionBankItems?: TextContent[];
  /** Blank answers with pinyin support */
  blankAnswers?: FillBlankAnswer[];
  
  // Legacy format (for backward compatibility)
  /** @deprecated Use segments instead */
  sentence?: string[];
  /** @deprecated Pinyin is now in segments */
  pinyin?: string[];
  /** @deprecated Use optionBankItems instead */
  optionBank?: string[];
  /** @deprecated Use blankAnswers instead */
  blanks?: {
    index: number;
    correct: string[];
  }[];
}


// Bool Question Interfaces
export interface BoolAudioTextQuestionData {
  instruction: string;
  
  // Audio source
  audio: string;
  audio_url?: string;
  
  // Audio transcript (Chinese with pinyin)
  transcriptContent?: TextContent;
  english?: string;  // English translation of audio
  
  // Statement to judge (can be Chinese or simple text)
  statementContent: TextContent;
  
  // Answer
  correctAnswer: boolean;
  explanation?: string;
}

export interface BoolImageTextQuestionData {
  instruction: string;
  
  // Image source
  image: string;
  image_url?: string;
  alt?: string;
  
  // Statement to judge (can be Chinese or simple text)
  statementContent: TextContent;
  
  // Answer
  correctAnswer: boolean;
  explanation?: string;
}

export type QuestionData = 
  | SelectionTextTextQuestionData
  | SelectionTextImageQuestionData
  | SelectionAudioTextQuestionData
  | SelectionAudioImageQuestionData
  | SelectionImageTextQuestionData
  | MatchingTextTextQuestionData
  | MatchingTextImageQuestionData
  | MatchingAudioTextQuestionData
  | MatchingAudioImageQuestionData
  | FillTextTextQuestionData
  | BoolAudioTextQuestionData
  | BoolImageTextQuestionData;

export interface Question {
  id: number;
  lessonId: number;
  orderIndex: number;
  questionType: QuestionType;
  data: QuestionData;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface QuestionFormValues {
  lessonId: number;
  orderIndex: number;
  questionType: QuestionType;
  data: QuestionData;
  isActive?: boolean;
}