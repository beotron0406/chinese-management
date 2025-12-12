import { api } from './api';
import { Word, WordFormData, WordListResponse, WordSearchResponse, WordsQueryParams } from '@/types/wordTypes';

const API_BASE = '/words';

export const searchWord = async (simplified: string): Promise<WordSearchResponse> => {
  const response = await api.get<WordSearchResponse>(
    `${API_BASE}/search?simplified=${encodeURIComponent(simplified)}`
  );
  return response.data || response;
};

export const fetchWords = async (params: WordsQueryParams): Promise<WordListResponse> => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.search) queryParams.append('search', params.search);
  if (params.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
  
  const response = await api.get<WordListResponse>(`${API_BASE}?${queryParams.toString()}`);
  return response.data || response;
};

export const fetchWordById = async (id: number): Promise<Word> => {
  const response = await api.get<Word>(`${API_BASE}/${id}`);
  return response.data || response;
};

export const createWord = async (formData: WordFormData): Promise<Word> => {
  const response = await api.post<Word>(API_BASE, formData);
  return response.data || response;
};

export const updateWordSense = async (
  senseId: number, 
  formData: Partial<WordFormData>
): Promise<Word> => {
  const response = await api.patch<Word>(`${API_BASE}/senses/${senseId}`, formData);
  return response.data || response;
};

export const deleteWord = async (id: number): Promise<void> => {
  await api.delete(`${API_BASE}/${id}`);
};

export const deleteWordSense = async (senseId: number): Promise<void> => {
  await api.delete(`${API_BASE}/senses/${senseId}`);
};