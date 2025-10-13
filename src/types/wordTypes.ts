export interface WordTranslation {
  id?: number;
  language: string;
  translation: string;
  additionalDetail?: string;
}

export interface WordSense {
  id?: number;
  senseNumber?: number;
  pinyin: string;
  partOfSpeech?: string;
  hskLevel?: number;
  isPrimary?: boolean;
  imageUrl?: string;
  audioUrl?: string;
  translation?: WordTranslation;
}

export interface Word {
  id: number;
  simplified: string;
  traditional?: string;
  createdAt?: string;
  senses?: WordSense[];
}

// Form data structure
export interface WordFormData {
  wordId?: number;
  word?: {
    simplified: string;
    traditional?: string;
  };
  sense: {
    id?: number;
    pinyin: string;
    partOfSpeech?: string;
    hskLevel?: number;
    isPrimary?: boolean;
    imageUrl?: string;
    audioUrl?: string;
  };
  translation: {
    language?: string;
    translation: string;
    additionalDetail?: string;
  };
}

// API responses
export interface WordSearchResponse {
  exists: boolean;
  wordId: number | null;
  word: Word | null;
}

export interface WordListResponse {
  words: Word[];
  total: number;
  page: number;
  totalPages: number;
}

export interface WordsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}