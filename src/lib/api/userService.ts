
import axios from 'axios';


const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';


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


interface User {
  id: string;
  email: string;
  username?: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  loginType: LoginType;
}


interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}


const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});


apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


export class UserService {
  
  
  static async login(username: string, password: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.post('/auth/login', {
        username,
        password
      });
      
      if (response.data.success && response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  }

  
  static async adminLogin(username: string, password: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.post('/auth/admin-login', {
        username,
        password
      });
      
      if (response.data.success && response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Admin login failed'
      };
    }
  }

  
  static async register(userData: {
    email: string;
    username: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: UserRole;
  }): Promise<AuthResponse> {
    try {
      const response = await apiClient.post('/auth/register', userData);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  }

  
  static async getCurrentUser(): Promise<User | null> {
    try {
      const response = await apiClient.get('/auth/me');
      return response.data.user;
    } catch (error) {
      return null;
    }
  }

  
  static async logout(): Promise<void> {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  
  static getStoredUser(): User | null {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }

  
  static isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    return !!token;
  }

  
  static async getAllUsers(): Promise<User[]> {
    try {
      const response = await apiClient.get('/users');
      return response.data.users || [];
    } catch (error) {
      console.error('Get users error:', error);
      return [];
    }
  }

  
  static async updateUser(id: string, userData: Partial<User>): Promise<AuthResponse> {
    try {
      const response = await apiClient.put(`/users/${id}`, userData);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Update failed'
      };
    }
  }

  
  static async deleteUser(id: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.delete(`/users/${id}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Delete failed'
      };
    }
  }
}
