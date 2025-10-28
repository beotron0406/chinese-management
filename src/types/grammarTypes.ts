import { HSKLevel } from '@/enums/hsk-level.enum';

// Example structure for grammar pattern examples
export interface GrammarExample {
  chinese: string[];
  pinyin?: string[];
  translation: string;
}

// Grammar Translation entity
export interface GrammarTranslation {
  id: number;
  grammarPatternId: number;
  language: string;
  grammarPoint: string;
  explanation: string;
  example?: GrammarExample[];
}

// Grammar Pattern entity (matches API response)
export interface GrammarPattern {
  id: number;
  pattern: string[];
  patternPinyin?: string[];
  patternFormula?: string;
  hskLevel?: HSKLevel;
  createdAt: string;
  translations?: GrammarTranslation[];
}

// Form data for creating/updating grammar pattern
export interface GrammarPatternFormData {
  patternId?: number; // For adding translation to existing pattern
  pattern?: {
    pattern: string[];
    patternPinyin?: string[];
    patternFormula?: string;
    hskLevel?: HSKLevel;
  };
  translation: {
    language?: string;
    grammarPoint: string;
    explanation: string;
    example?: GrammarExample[];
  };
}

// Query parameters for fetching grammar patterns
export interface GrammarPatternsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  hskLevel?: HSKLevel;
  sortBy?: 'id' | 'hskLevel' | 'createdAt';
  sortOrder?: 'ASC' | 'DESC';
}

// Response for paginated grammar patterns list
export interface GrammarPatternListResponse {
  patterns: GrammarPattern[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Form values for the modal form
export interface GrammarFormValues {
  id?: number;
  translationId?: number;
  pattern: string[];
  patternPinyin?: string[];
  patternFormula?: string;
  hskLevel?: HSKLevel;
  language?: string;
  grammarPoint: string;
  explanation: string;
  examples: Array<{
    chinese: string;
    pinyin?: string;
    translation: string;
  }>;
}

// For backward compatibility
export interface GrammarEntry extends GrammarPattern {}