import { api } from './api';
import { QuestionType } from '../enums/question-type.enum';
import { Question, QuestionFormValues } from '@/types/questionType';


export const questionApi = {
  // Get questions for a lesson
  getQuestionsByLesson: async (lessonId: number): Promise<Question[]> => {
    console.log(`🔍 QuestionApi: GET /lessons/content/${lessonId}`);

    const response = await api.get(`/lessons/content/${lessonId}`);

    if (!response.data) {
      console.warn('⚠️ QuestionApi: Empty response data');
      return [];
    }

    let questions: Question[] = [];
    const data = response.data as any;

    // Check if response.data is directly an array of questions
    if (Array.isArray(data)) {
      console.log('📋 QuestionApi: Direct array response');
      questions = data;
    }
    // Check if response has a content property (most likely based on API structure)
    else if (data && data.content && Array.isArray(data.content)) {
      console.log('📋 QuestionApi: Found content, filtering for questions');
      questions = data.content.filter((item: any) => item.type === 'question' || item.questionType);
    }
    // Check if response has a questions property
    else if (data && data.questions && Array.isArray(data.questions)) {
      console.log('📋 QuestionApi: Found questions in response.questions');
      questions = data.questions;
    }
    // Check if response has an items property with question-type items
    else if (data && data.items && Array.isArray(data.items)) {
      console.log('📋 QuestionApi: Found items, filtering for questions');
      questions = data.items.filter((item: any) => item.type === 'question' || item.questionType);
    }
    // Check for other possible property names
    else if (data && typeof data === 'object') {
      const keys = Object.keys(data);
      console.log('🔍 QuestionApi: Checking keys for question arrays:', keys);

      for (const key of keys) {
        const value = data[key];
        if (Array.isArray(value)) {
          const items = value;
          // Check if items look like questions
          if (items.length > 0 && (items[0].questionType || items[0].type === 'question')) {
            console.log(`📋 QuestionApi: Found questions in "${key}" property`);
            questions = items;
            break;
          }
        }
      }
    }

    console.log(`✅ QuestionApi: Returning ${questions.length} questions`);
    return questions;
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