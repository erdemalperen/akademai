import axios, { InternalAxiosRequestConfig } from 'axios';
import { tokenService } from '../lib/api/apiClient';

const API_URL = import.meta.env.VITE_REACT_APP_API_URL || 'http://localhost:5001/api';

export const employeeApiInstance = axios.create({ 
  baseURL: `${API_URL}/users`,
});
employeeApiInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenService.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
export const getAllEmployees = async (): Promise<any[]> => {
  try {
    const response = await employeeApiInstance.get('/');
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      return response.data.data; 
    } else {

      console.error('Beklenmedik çalışan verisi formatı:', response.data);
      return []; // Boş dizi döndür veya hata fırlat
    }
  } catch (error) {
    console.error('Error fetching employees:', error);
    throw error;
  }
};
export const getEmployeesByDepartment = async (departmentId: number): Promise<any[]> => {
  try {
    const response = await employeeApiInstance.get(`/department/${departmentId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching employees by department:', error);
    throw error;
  }
};
