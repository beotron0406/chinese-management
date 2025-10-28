import { api } from "./api";
import { QuestionType } from "../enums/question-type.enum";
import { Question, QuestionFormValues } from "@/types/questionType";

export const questionApi = {
  getQuestionsByLesson: async (lessonId: number): Promise<Question[]> => {
    const response = await api.get(`/lessons/content/${lessonId}`);

    if (!response.data) {
      return [];
    }

    let questions: Question[] = [];
    const data = response.data as any;

    if (Array.isArray(data)) {
      questions = data;
    }
    // Check if response has a content property (most likely based on API structure)
    else if (data && data.content && Array.isArray(data.content)) {
      questions = data.content.filter(
        (item: any) => item.type === "question" || item.questionType
      );
    }
    // Check if response has a questions property
    else if (data && data.questions && Array.isArray(data.questions)) {
      questions = data.questions;
    } else if (data && data.items && Array.isArray(data.items)) {
      questions = data.items.filter(
        (item: any) => item.type === "question" || item.questionType
      );
    } else if (data && typeof data === "object") {
      const keys = Object.keys(data);

      for (const key of keys) {
        const value = data[key];
        if (Array.isArray(value)) {
          const items = value;
          if (
            items.length > 0 &&
            (items[0].questionType || items[0].type === "question")
          ) {
            questions = items;
            break;
          }
        }
      }
    }

    return questions;
  },

  getQuestion: async (id: number): Promise<Question> => {
    const response = await api.get(`/questions/${id}`);
    return response.data as Question;
  },

  createQuestion: async (
    questionData: QuestionFormValues
  ): Promise<Question> => {
    const response = await api.post("/questions", questionData);
    return response.data as Question;
  },

  updateQuestion: async (
    id: number,
    questionData: Partial<QuestionFormValues>
  ): Promise<Question> => {
    const response = await api.put(`/questions/${id}`, questionData);
    return response.data as Question;
  },

  deleteQuestion: async (id: number): Promise<any> => {
    const response = await api.delete(`/questions/${id}`);
    return response.data;
  },
};
