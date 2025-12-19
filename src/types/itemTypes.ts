export interface ILesson {
  id: number;
  name: string;
  description: string;
  content: LessonItem[];
}

export interface LessonItem {
  id: number;
  itemType: "content" | "question";
  orderIndex: number;
  type: string;
  isActive: boolean;
  data:
    | ContentWordDefinition
    | ContentSentences
    | QuestionSelectionTextText
    | QuestionSelectionTextImage
    | QuestionSelectionAudioText
    | QuestionSelectionAudioImage
    | QuestionSelectionImageText
    | QuestionMatchingTextText
    | QuestionMatchingTextImage
    | QuestionMatchingAudioText
    | QuestionMatchingAudioImage
    | QuestionBoolAudioText
    | QuestionFillTextText;
}

export interface ContentWordDefinition {
  pinyin: string;
  speech: string;
  audio_url: string;
  picture_url: string;
  translation: string;
  chinese_text: string;
}

export interface ContentSentences {
  pinyin: string[];
  audio_url: string;
  picture_url: string;
  chinese_text: string[];
  explaination: string;
  additional_info: string;
}

// ---- Question types ----

// 1️⃣ Selection (text → text)
export interface QuestionSelectionTextText {
  options: { id: string; text: string }[];
  question: string;
  explanation: string;
  instruction: string;
  correctAnswer: string;
}

// 2️⃣ Selection (text → image)
export interface QuestionSelectionTextImage {
  options: { id: string; alt: string; image: string }[];
  question: string;
  explanation: string;
  instruction: string;
  correctAnswer: string;
}

// 3️⃣ Selection (audio → text)
export interface QuestionSelectionAudioText {
  audio: string;
  audio_url: string;
  audio_transcript_pinyin: string;
  audio_transcript_chinese: string;
  audio_transcript_translation: string;
  options: { id: string; text: string }[];
  explanation: string;
  instruction: string;
  correctAnswer: string;
}

// 4️⃣ Selection (audio → image)
export interface QuestionSelectionAudioImage {
  audio: string;
  audio_url: string;
  audio_transcript_pinyin: string;
  audio_transcript_chinese: string;
  audio_transcript_translation: string;
  options: { id: string; alt: string; image: string }[];
  explanation: string;
  instruction: string;
  correctAnswer: string;
}

// 5️⃣ Selection (image → text)
export interface QuestionSelectionImageText {
  image: string;
  options: { id: string; text: string }[];
  explanation: string;
  instruction: string;
  correctAnswer: string;
}

// 6️⃣ Matching (text ↔ text)
export interface QuestionMatchingTextText {
  leftColumn: { id: string; text: string; pinyin: string }[];
  rightColumn: { id: string; text: string }[];
  correctMatches: { left: string; right: string }[];
  explanation: string;
  instruction: string;
}

// 7️⃣ Matching (text ↔ image)
export interface QuestionMatchingTextImage {
  leftColumn: { id: string; text: string; pinyin: string }[];
  rightColumn: { id: string; text: string; image: string; alt?: string }[];
  correctMatches: { left: string; right: string }[];
  explanation: string;
  instruction: string;
}

// 8️⃣ Matching (audio ↔ text)
export interface QuestionMatchingAudioText {
  leftColumn: {
    id: string;
    audio: string;
    audio_url: string;
    transcript: string;
    pinyin?: string;
  }[];
  rightColumn: { id: string; text: string; image?: string; alt?: string }[];
  correctMatches: { left: string; right: string }[];
  explanation: string;
  instruction: string;
}

// 9️⃣ Matching (audio ↔ image)
export interface QuestionMatchingAudioImage {
  leftColumn: { id: string; audio: string; audio_url: string; transcript: string }[];
  rightColumn: { id: string; image: string; text?: string; alt?: string }[];
  correctMatches: { left: string; right: string }[];
  explanation: string;
  instruction: string;
}

// 🔟 Boolean (audio → true/false)
export interface QuestionBoolAudioText {
  audio: string;
  pinyin: string;
  english: string;
  transcript: string;
  explanation: string;
  instruction: string;
  correctAnswer: boolean;
}

// 11️⃣ Fill-in-the-blank (text → text)
export interface QuestionFillTextText {
  blanks: { index: number; correct: string[] }[];
  pinyin: string[];
  sentence: string[];
  optionBank: string[];
  vietnamese: string;
  explanation: string;
  instruction: string;
}

export interface ContentItem {
  id: number;
  itemType: "content" | "question";
  orderIndex: number;
  type: string;
  isActive: boolean;
  data: any;
}

export interface LessonWord {
  id: number;
  lessonId: number;
  wordSenseId: number;
  orderIndex: number;
  wordSense: {
    id: number;
    wordId: number;
    senseNumber: number;
    pinyin?: string;
    partOfSpeech?: string;
    hskLevel?: number;
    isPrimary?: boolean;
    imageUrl?: string | null;
    audioUrl?: string | null;
    word: {
      id: number;
      simplified: string;
      traditional?: string;
      createdAt: string;
    };
    translations?: Array<{
      language: string;
      translation: string;
      additionalDetail?: string;
    }>;
  };
}

export interface LessonGrammarPattern {
  id: number;
  lessonId: number;
  grammarPatternId: number;
  orderIndex: number;
  grammarPattern: {
    id: number;
    pattern: string[];
    patternPinyin?: string[];
    patternFormula?: string;
    hskLevel?: number;
    createdAt: string;
    translations?: Array<{
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