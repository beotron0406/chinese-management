import { api } from './api';
import { Word, WordFormData, WordListResponse, WordSearchResponse, WordsQueryParams } from '@/types/wordTypes';

export const searchWord = async (simplified: string): Promise<WordSearchResponse> => {
  console.log("🔍 searchWord calling API:", `/words/search?simplified=${encodeURIComponent(simplified)}`);
  const response = await api.get<WordSearchResponse>(`/words/search?simplified=${encodeURIComponent(simplified)}`);
  console.log("🔄 searchWord response:", response);
  return response.data;
};

export const fetchWords = async (params: WordsQueryParams): Promise<WordListResponse> => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.search) queryParams.append('search', params.search);
  if (params.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
  
  const response = await api.get<WordListResponse>(`/words?${queryParams.toString()}`);

  const result = response.data || (response as any);
  
  return result;
};

export const fetchWordById = async (id: number): Promise<Word> => {
  const response = await api.get<Word>(`/words/${id}`);
  return response.data;
};

export const createWord = async (formData: WordFormData): Promise<Word> => {
  const response = await api.post<Word>('/words', formData);
  return response.data;
};

export const updateWordSense = async (senseId: number, formData: WordFormData): Promise<Word> => {
  const response = await api.patch<Word>(`/words/senses/${senseId}`, formData);
  return response.data;
};

export const deleteWord = async (id: number): Promise<void> => {
  await api.delete(`/words/${id}`);
};

export const deleteWordSense = async (senseId: number): Promise<void> => {
  await api.delete(`/words/senses/${senseId}`);
};