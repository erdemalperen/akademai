export interface Quiz {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
  passingScore: number;
  timeLimit?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Question {
  id: string;
  text: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  options?: string[];
  correctAnswer: string | string[];
  points: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Training {
  id: string;
  title: string;
  description?: string;
  category?: string;
  duration?: number;
  author?: string;
  published: boolean;
  isMandatory?: boolean;
  deadline?: string;
  createdAt: string;
  updatedAt: string;
  trainings?: Training[]; 
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  loginType: LoginType;
  microsoftId?: string;
  createdAt: string;
  updatedAt: string;
}

export enum UserRole {
  EMPLOYEE = 'EMPLOYEE',
  ADMIN_JUNIOR = 'ADMIN_JUNIOR',
  ADMIN_SENIOR = 'ADMIN_SENIOR'
}

export enum LoginType {
  AKADEMAI_CARD = 'AKADEMAI_CARD',
  MICROSOFT = 'MICROSOFT',
  USERNAME_PASSWORD = 'USERNAME_PASSWORD'
}
