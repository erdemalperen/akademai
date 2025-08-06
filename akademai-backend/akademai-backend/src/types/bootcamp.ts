import { User } from './index';
export interface Bootcamp {
  id: string;
  title: string;
  description?: string;
  category?: string;
  author?: string;
  published?: boolean;
  duration?: number;
  deadline?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
export interface Training {
  id: string;
  title: string;
  description?: string;
  contentType: 'video' | 'article' | 'quiz' | 'project';
  contentUrl?: string;
  estimatedDuration?: number;
}
export interface BootcampTraining {
  id: string;
  bootcampId: string;
  trainingId: string;
  orderIndex: number;
  required: boolean;
  createdAt?: Date;
  training?: Training;
}
export interface BootcampWithTrainings extends Bootcamp {
  trainings: BootcampTraining[];
}
export interface UserBootcampAssignment {
  id: string;
  userId: number;
  bootcampId: string;
  assignedAt: Date;
  completed: boolean;
  completionDate?: Date;
  progress?: number;
  user?: User;
  bootcamp?: Bootcamp;
}
export interface BootcampProgress {
  id: string;
  userId: number;
  bootcampId: string;
  currentTrainingIndex: number;
  progressPercentage: number;
  lastActivity: Date;
}
export interface UserTrainingProgress {
  user_id: number;
  bootcamp_id: string;
  training_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  started_at?: Date;
  completed_at?: Date;
}
export type TrainingProgress = Training & Pick<UserTrainingProgress, 'status' | 'started_at' | 'completed_at'> & { order: number };
export type BootcampParticipant = Pick<User, 'id' | 'email' | 'firstName' | 'lastName'> & Pick<UserBootcampAssignment, 'assignedAt' | 'completed' | 'completionDate'>;
export type AssignedBootcamp = Bootcamp & Pick<UserBootcampAssignment, 'assignedAt' | 'completed' | 'completionDate'>;
