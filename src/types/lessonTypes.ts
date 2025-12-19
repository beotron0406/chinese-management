import { ContentType } from "@/enums/content-type.enum";

export interface Lesson {
  id: number;
  name: string; // Changed from title to name
  description: string;
  courseId: number;
  orderIndex: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  course?: {
    id: number;
    hskLevel: number;
    title: string;
    description: string;
    prerequisiteCourseId: number | null;
    isActive: boolean;
    orderIndex: number;
    createdAt: string;
  };
  lessonWords?: LessonWord[]; // Updated with proper type
  lessonGrammarPatterns?: LessonGrammarPattern[]; // Updated with proper type
}

export interface LessonContent {
  id: number;
  type:
    | ContentType
    | "text"
    | "vocabulary"
    | "grammar"
    | "exercise"
    | "divider";
  data: Record<string, any>;
  orderIndex?: number;
  lessonId: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface LessonItem {
  id: number;
  type: "content" | "question";
  lessonId: number;
  orderIndex?: number;
  data: Record<string, any>;
  contentType?: ContentType;
  questionType?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Also update your form values interfaces
export interface LessonFormData {
  name: string; // Changed from title to name
  description: string;
  courseId?: number;
  orderIndex: number;
}

export interface LessonFormValues {
  name: string; // Changed from title to name
  description: string;
  courseId?: number | null;
  isActive?: boolean;
}

// Add content form interface
export interface ContentFormValues {
  lessonId: number;
  type:
    | ContentType
    | "text"
    | "vocabulary"
    | "grammar"
    | "exercise"
    | "divider";
  data: Record<string, any>;
  orderIndex?: number;
}

export interface ILessonByCourse {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  orderIndex: number;
  courseId: number;
  course: {
    id: number;
    hskLevel: number;
    title: string;
    description: string;
    prerequisiteCourseId: number | null;
    isActive: boolean;
    orderIndex: number;
    createdAt: string; // ISO date string
  };
}

// ===== LESSON WORD INTERFACES =====

export interface LessonWord {
  id: number;
  lessonId: number;
  wordSenseId: number;
  orderIndex?: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  wordSense?: {
    id: number;
    wordId: number;
    definition: string;
    partOfSpeech?: string;
    language: string;
    word?: {
      id: number;
      simplified: string;
      traditional: string;
      pinyin: string;
      hskLevel?: number;
      isActive: boolean;
    };
  };
}

export interface AddLessonWordDto {
  wordSenseId: number;
  orderIndex?: number;
  isActive?: boolean;
}

// ===== LESSON GRAMMAR PATTERN INTERFACES =====

export interface LessonGrammarPattern {
  id: number;
  lessonId: number;
  grammarPatternId: number;
  orderIndex?: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  grammarPattern?: {
    id: number;
    pattern: string[];
    patternPinyin?: string[];
    patternFormula?: string;
    hskLevel?: number;
    createdAt: string;
    translations?: Array<{
      id: number;
      grammarPatternId: number;
      language: string;
      grammarPoint: string;
      explanation: string;
      example?: Array<{
        chinese: string[];
        pinyin?: string[];
        translation: string;
      }>;
    }>;
  };
}

export interface AddLessonGrammarPatternDto {
  grammarPatternId: number;
  orderIndex?: number;
  isActive?: boolean;
}

// ===== LESSON RESPONSE INTERFACES =====

// ===== MAIN RESPONSE INTERFACE =====
export interface LessonContentResponse {
  id: number;
  name: string;
  description: string;
  content: ContentItem[];
  words: LessonWordItem[];
  grammarPatterns: LessonGrammarPatternItem[];
}

// ===== CONTENT ITEM INTERFACES =====
export interface ContentItem {
  id: number;
  itemType: "content" | "question";
  orderIndex: number;
  type: string;
  isActive: boolean;
  data:
    | ContentWordDefinitionData
    | ContentSentencesData
    | QuestionSelectionTextTextData
    | QuestionSelectionTextImageData
    | QuestionSelectionAudioTextData
    | QuestionSelectionAudioImageData
    | QuestionSelectionImageTextData
    | QuestionMatchingTextTextData
    | QuestionMatchingTextImageData
    | QuestionMatchingAudioTextData
    | QuestionMatchingAudioImageData
    | QuestionBoolAudioTextData
    | QuestionFillTextTextData;
}

// ===== CONTENT TYPE DATA =====
export interface ContentWordDefinitionData {
  pinyin: string;
  speech: string;
  audio_url: string;
  picture_url: string;
  chinese_text: string;
  translation: string;
}

export interface ContentSentencesData {
  pinyin: string[];
  audio_url: string;
  picture_url: string;
  chinese_text: string[];
  explaination: string;
  additional_info: string;
}

// ===== QUESTION SELECTION DATA =====
export interface QuestionSelectionTextTextData {
  options: Array<{
    id: string;
    text: string;
  }>;
  question: string;
  explanation: string;
  instruction: string;
  correctAnswer: string;
}

export interface QuestionSelectionTextImageData {
  options: Array<{
    id: string;
    alt: string;
    image: string;
  }>;
  question: string;
  explanation: string;
  instruction: string;
  correctAnswer: string;
}

export interface QuestionSelectionAudioTextData {
  audio: string;
  options: Array<{
    id: string;
    text: string;
  }>;
  audio_url: string;
  explanation: string;
  instruction: string;
  correctAnswer: string;
  audio_transcript_pinyin: string;
  audio_transcript_chinese: string;
  audio_transcript_translation: string;
}

export interface QuestionSelectionAudioImageData {
  audio: string;
  options: Array<{
    id: string;
    alt: string;
    image: string;
  }>;
  audio_url: string;
  explanation: string;
  instruction: string;
  correctAnswer: string;
  audio_transcript_pinyin: string;
  audio_transcript_chinese: string;
  audio_transcript_translation: string;
}

export interface QuestionSelectionImageTextData {
  image: string;
  options: Array<{
    id: string;
    text: string;
  }>;
  explanation: string;
  instruction: string;
  correctAnswer: string;
}

// ===== QUESTION MATCHING DATA =====
export interface QuestionMatchingTextTextData {
  leftColumn: Array<{
    id: string;
    text: string;
    pinyin: string;
  }>;
  rightColumn: Array<{
    id: string;
    text: string;
  }>;
  explanation: string;
  instruction: string;
  correctMatches: Array<{
    left: string;
    right: string;
  }>;
}

export interface QuestionMatchingTextImageData {
  leftColumn: Array<{
    id: string;
    text: string;
    pinyin: string;
  }>;
  rightColumn: Array<{
    id: string;
    text?: string;
    alt?: string;
    image: string;
  }>;
  explanation: string;
  instruction: string;
  correctMatches: Array<{
    left: string;
    right: string;
  }>;
}

export interface QuestionMatchingAudioTextData {
  leftColumn: Array<{
    id: string;
    text?: string;
    audio: string;
    pinyin?: string;
    audio_url: string;
    transcript: string;
  }>;
  rightColumn: Array<{
    id: string;
    alt?: string;
    text: string;
    image?: string;
  }>;
  explanation: string;
  instruction: string;
  correctMatches: Array<{
    left: string;
    right: string;
  }>;
}

export interface QuestionMatchingAudioImageData {
  leftColumn: Array<{
    id: string;
    audio: string;
    audio_url: string;
    transcript: string;
  }>;
  rightColumn: Array<{
    id: string;
    text?: string;
    alt?: string;
    image: string;
  }>;
  explanation: string;
  instruction: string;
  correctMatches: Array<{
    left: string;
    right: string;
  }>;
}

// ===== QUESTION BOOL & FILL DATA =====
export interface QuestionBoolAudioTextData {
  audio: string;
  pinyin: string;
  english: string;
  transcript: string;
  explanation: string;
  instruction: string;
  correctAnswer: boolean;
}

export interface QuestionFillTextTextData {
  blanks: Array<{
    index: number;
    correct: string[];
  }>;
  pinyin: string[];
  sentence: string[];
  optionBank: string[];
  vietnamese: string;
  explanation: string;
  instruction: string;
}

// ===== WORD ITEM INTERFACES =====
export interface LessonWordItem {
  id: number;
  lessonId: number;
  wordSenseId: number;
  orderIndex: number;
  wordSense: {
    id: number;
    wordId: number;
    senseNumber: number;
    pinyin: string;
    partOfSpeech: string;
    hskLevel: number;
    isPrimary: boolean;
    imageUrl: string | null;
    audioUrl: string | null;
    word: {
      id: number;
      simplified: string;
      traditional: string;
      createdAt: string;
    };
    translations?: Array<{
      language: string;
      translation: string;
      additionalDetail?: string;
    }>;
  };
}

// ===== GRAMMAR PATTERN INTERFACES =====
export interface LessonGrammarPatternItem {
  id: number;
  lessonId: number;
  grammarPatternId: number;
  orderIndex: number;
  grammarPattern: {
    id: number;
    pattern: string[];
    patternPinyin: string[];
    patternFormula: string;
    hskLevel: number;
    createdAt: string;
    translations?: Array<{
      language: string;
      grammarPoint: string;
      explanation: string;
      example?: Array<{
        chinese: string[];
        pinyin: string[];
        translation: string;
      }>;
    }>;
  };
}
