import { api } from './api';
import { QuestionType } from '../enums/question-type.enum';
import { Question, QuestionFormValues } from '@/types/questionType';


export const questionApi = {
  // Get questions for a lesson
  getQuestionsByLesson: async (lessonId: number): Promise<Question[]> => {
    const response = await api.get(`/lessons/${lessonId}/questions`);
    return response.data as Question[];
  },

  // Get a specific question by ID
  getQuestion: async (id: number): Promise<Question> => {
    const response = await api.get(`/questions/${id}`);
    return response.data as Question;
  },

  // Create a new question
  createQuestion: async (questionData: QuestionFormValues): Promise<Question> => {
    const response = await api.post('/questions', questionData);
    return response.data as Question;
  },

  // Update an existing question
  updateQuestion: async (id: number, questionData: Partial<QuestionFormValues>): Promise<Question> => {
    const response = await api.put(`/questions/${id}`, questionData);
    return response.data as Question;
  },

  // Delete a question
  deleteQuestion: async (id: number): Promise<any> => {
    const response = await api.delete(`/questions/${id}`);
    return response.data;
  }
};