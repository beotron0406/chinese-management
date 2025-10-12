import { QuestionType } from "@/enums/question-type.enum";

export interface AudioImageQuestionData {
  instruction?: string;
  audio?: string;
  audio_url?: string;
  options?: Array<{
    id: string;
    image: string;
    alt: string;
  }>;
  answers?: Array<{
    id: number;
    image_url: string;
    label: string;
    correct: boolean;
  }>;
  correctAnswer?: string;
  explanation?: string;
  audio_transcript_chinese?: string;
  audio_transcript_pinyin?: string;
  audio_transcript_translation?: string;
}

export interface TextSelectionQuestionData {
  instruction: string;
  question: string;
  options: Array<{
    id: string;
    text: string;
  }>;
  correctAnswer: string;
  explanation?: string;
}

export interface MatchingTextQuestionData {
  instruction: string;
  leftColumn: Array<{
    id: string;
    text: string;
    pinyin: string;
  }>;
  rightColumn: Array<{
    id: string;
    text: string;
  }>;
  correctMatches: Array<{
    left: string;
    right: string;
  }>;
}

export interface FillBlankQuestionData {
  instruction: string;
  sentence: string;
  pinyin: string;
  english: string;
  options: Array<{
    text: string;
    pinyin: string;
  }>;
  correctAnswer: string;
  correctAnswerPinyin: string;
  explanation?: string;
}

export interface AudioBoolQuestionData {
  instruction: string;
  audio: string;
  transcript: string;
  pinyin: string;
  english: string;
  correctAnswer: boolean;
  explanation?: string;
}

export type QuestionData = 
  | AudioImageQuestionData
  | TextSelectionQuestionData
  | MatchingTextQuestionData
  | FillBlankQuestionData
  | AudioBoolQuestionData;

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
  data: any;
  isActive?: boolean;
}