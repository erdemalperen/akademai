export enum UserRole {
  EMPLOYEE = 'EMPLOYEE',
  ADMIN_JUNIOR = 'ADMIN_JUNIOR',
  ADMIN_SENIOR = 'ADMIN_SENIOR'
}
export enum LoginType {
  USERNAME_PASSWORD = 'USERNAME_PASSWORD'
}
export interface Department {
  id: number;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
export interface CreateDepartmentDTO {
  name: string;
  description?: string;
}
export interface UpdateDepartmentDTO {
  name: string;
  description?: string;
}
export function convertPrismaUserRole(role: string): UserRole {
  return role as UserRole;
}
export function convertPrismaLoginType(loginType: string): LoginType {
  return loginType as LoginType;
}
export interface TokenUser {
  id: number;
  email: string; 
  role: UserRole;
}
export interface Log {
  id: number;
  action: string;
  description?: string;
  userId?: number;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  user?: User;
}
export interface User {
  id: number;
  email: string;
  password?: string;
  username?: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  loginType: LoginType;
  createdAt: Date;
  updatedAt: Date;
}
export interface Employee extends User {
  department?: string;
  position?: string;
}
export enum TrainingDifficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}
export interface Training {
  id?: string;
  title: string;
  description: string;
  category: string;
  duration: number;
  author: string;
  published: boolean;
  tags?: string[];
  learning_outcomes?: string[];
  learningOutcomes?: string[];
  certificateTemplate?: string;
  difficulty?: TrainingDifficulty;
  createdAt?: Date;
  updatedAt?: Date;
  content?: TrainingContent[];
  quizzes?: Quiz[];
}
export interface TrainingContent {
  id: string;
  trainingId: string;
  type: string;
  title: string;
  content: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}
export interface Quiz {
  id: string;
  trainingId: string;
  title: string;
  description?: string;
  passingScore: number;
  createdAt: Date;
  updatedAt: Date;
  questions?: any[];
}
