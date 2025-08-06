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

export interface Department {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Employee {
  id: number;
  userId: number;
  departmentId: number;
  department?: Department | string;
  position?: string;
}

export interface User {
  id: number;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: UserRole;
  departmentId?: number;
  department?: Department;
  loginType: LoginType;
  createdAt: Date;
  updatedAt: Date;
  employee?: Employee;
  position?: string;
  lastLogin?: string;
}

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
  tags?: string[];
  certificateTemplate?: string;
  deadline: string | null;
} 

export interface ConferenceAttendee {
  userId: number;
  firstName?: string;
  lastName?: string;
  email: string;
  department?: {
    id: number;
    name: string;
  };
  position?: string;
  attended?: boolean;
  notes?: string;
  registrationDate: string;
}

export interface ConferenceTraining {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  startDate: string;
  endDate: string;
  capacity: number;
  author: string;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
  attendees?: ConferenceAttendee[];
}

export interface Bootcamp {
  id: string;
  title: string;
  description: string;
  category: string;
  author: string;
  published: boolean;
  duration: number;
  deadline?: string;
  createdAt?: Date;
  updatedAt?: Date;
  trainings?: Training[];
}

export interface BootcampParticipant {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  departmentId?: number;
  departmentName?: string;
  progress: number;
  assignedAt: string;
  completionDate?: string;
}