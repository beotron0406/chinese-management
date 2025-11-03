import { QuestionType } from "@/enums/question-type.enum";

// Selection Question Interfaces
export interface SelectionTextTextQuestionData {
  instruction: string;
  question: string;
  options: Array<{
    id: string;
    text: string;
  }>;
  correctAnswer: string;
  explanation?: string;
}

export interface SelectionTextImageQuestionData {
  instruction: string;
  question: string;
  options: Array<{
    id: string;
    image: string;
    alt: string;
  }>;
  correctAnswer: string;
  explanation?: string;
}

export interface SelectionAudioTextQuestionData {
  instruction: string;
  audio: string;
  audio_url?: string;
  options: Array<{
    id: string;
    text: string;
  }>;
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
  options: Array<{
    id: string;
    image: string;
    alt: string;
  }>;
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
  options: Array<{
    id: string;
    text: string;
  }>;
  correctAnswer: string;
  explanation?: string;
}

// Matching Question Interfaces
export interface MatchingTextTextQuestionData {
  instruction: string;
  leftColumn: Array<{
    id: string;
    text: string;
    pinyin?: string;
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

export interface MatchingTextImageQuestionData {
  instruction: string;
  leftColumn: Array<{
    id: string;
    text: string;
    pinyin?: string;
  }>;
  rightColumn: Array<{
    id: string;
    image: string;
    alt: string;
  }>;
  correctMatches: Array<{
    left: string;
    right: string;
  }>;
}

export interface MatchingAudioTextQuestionData {
  instruction: string;
  leftColumn: Array<{
    id: string;
    audio: string;
    audio_url?: string;
    transcript?: string;
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

export interface MatchingAudioImageQuestionData {
  instruction: string;
  leftColumn: Array<{
    id: string;
    audio: string;
    audio_url?: string;
    transcript?: string;
  }>;
  rightColumn: Array<{
    id: string;
    image: string;
    alt: string;
  }>;
  correctMatches: Array<{
    left: string;
    right: string;
  }>;
}

// Fill Question Interfaces
export interface FillTextTextQuestionData {
  instruction: string;
  sentence: string[];
  pinyin: string[];
  vietnamese: string;
  optionBank: string[];
  blanks: {
    index: number;
    correct: string[];
  }[];
  explanation: string;
}

// Bool Question Interfaces
export interface BoolAudioTextQuestionData {
  instruction: string;
  audio: string;
  audio_url?: string;
  transcript: string;
  pinyin?: string;
  english?: string;
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
  | BoolAudioTextQuestionData;

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