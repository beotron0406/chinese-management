import { api } from './api';
import { 
  GrammarPattern, 
  GrammarPatternFormData, 
  GrammarPatternListResponse, 
  GrammarPatternsQueryParams 
} from '@/types/grammarTypes';

export const grammarApi = {
  // Get all grammar patterns with pagination and filters
  getAllGrammarPatterns: async (params: GrammarPatternsQueryParams): Promise<GrammarPatternListResponse> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.hskLevel) queryParams.append('hskLevel', params.hskLevel.toString());
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    
    const response = await api.get<GrammarPatternListResponse>(
      `/grammar-patterns?${queryParams.toString()}`
    );
    
    return response.data || (response as any);
  },

  // Get single grammar pattern by ID
  getGrammarPatternById: async (id: number): Promise<GrammarPattern> => {
    const response = await api.get<GrammarPattern>(`/grammar-patterns/${id}`);
    return response.data;
  },

  // Create complete grammar pattern (pattern + translation)
  // OR add translation to existing pattern (when patternId is provided)
  createCompleteGrammarPattern: async (formData: GrammarPatternFormData): Promise<GrammarPattern> => {
    const response = await api.post<GrammarPattern>('/grammar-patterns/complete', formData);
    return response.data;
  },

  // Update grammar pattern and translation by translation ID
  updateGrammarPattern: async (
    translationId: number, 
    formData: Partial<GrammarPatternFormData>
  ): Promise<GrammarPattern> => {
    const response = await api.patch<GrammarPattern>(
      `/grammar-patterns/translations/${translationId}`, 
      formData
    );
    return response.data;
  },

  // Delete grammar pattern (cascade delete all translations)
  deleteGrammarPattern: async (id: number): Promise<void> => {
    await api.delete(`/grammar-patterns/${id}`);
  },

  // Delete specific translation only
  deleteGrammarTranslation: async (translationId: number): Promise<void> => {
    await api.delete(`/grammar-translations/${translationId}`);
  },

  // Legacy endpoints (for backward compatibility)
  
  // Create pattern only (without translation)
  createPatternOnly: async (patternData: {
    pattern: string[];
    patternPinyin?: string[];
    patternFormula?: string;
    hskLevel?: number;
  }): Promise<GrammarPattern> => {
    const response = await api.post<GrammarPattern>('/grammar-patterns', patternData);
    return response.data;
  },

  // Create translation only (for existing pattern)
  createTranslationOnly: async (translationData: {
    grammarPatternId: number;
    language?: string;
    grammarPoint: string;
    explanation: string;
    example?: Array<{
      chinese: string[];
      pinyin?: string[];
      translation: string;
    }>;
  }): Promise<any> => {
    const response = await api.post('/grammar-translations', translationData);
    return response.data;
  },

  // Update pattern only
  updatePatternOnly: async (
    id: number, 
    patternData: Partial<{
      pattern: string[];
      patternPinyin?: string[];
      patternFormula?: string;
      hskLevel?: number;
    }>
  ): Promise<GrammarPattern> => {
    const response = await api.patch<GrammarPattern>(`/grammar-patterns/${id}`, patternData);
    return response.data;
  },

  // Update translation only
  updateTranslationOnly: async (
    id: number,
    translationData: Partial<{
      grammarPoint?: string;
      explanation?: string;
      language?: string;
      example?: Array<{
        chinese: string[];
        pinyin?: string[];
        translation: string;
      }>;
    }>
  ): Promise<any> => {
    const response = await api.patch(`/grammar-translations/${id}`, translationData);
    return response.data;
  },
};

// Export individual functions for backward compatibility
export const fetchGrammarPatterns = grammarApi.getAllGrammarPatterns;
export const fetchGrammarPatternById = grammarApi.getGrammarPatternById;
export const createGrammarPattern = grammarApi.createCompleteGrammarPattern;
export const updateGrammarPattern = grammarApi.updateGrammarPattern;
export const deleteGrammarPattern = grammarApi.deleteGrammarPattern;