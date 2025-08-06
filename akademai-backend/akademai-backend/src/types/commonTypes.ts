export interface Training {
  id: string;
  title: string;
  description: string;
  category: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  learningOutcomes?: string[];
  content?: any[];
  quizzes?: any[];
  createdAt: Date;
  updatedAt: Date;
  duration?: number;
  author?: string;
  published?: boolean;
  isMandatory?: boolean;
  tags?: string[];
  certificateTemplate?: string;
  deadline: string | null;
} 
export interface Quiz {
  id: string;
  title: string;
  description: string;
  passingScore: number;
  questions: Question[];
  timeLimit?: number;
}
export interface Question {
  id: string;
  text: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  options?: string[];
  correctAnswer: string | string[];
  points: number;
}
