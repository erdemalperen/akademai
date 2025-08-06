import axios, { InternalAxiosRequestConfig } from 'axios';
import { Department } from '../types'; // Projenizdeki Department tipini import edin
import { tokenService } from '../lib/api/apiClient'; // Token servisi import edildi

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'; // .env dosyanızdan veya varsayılan adresten alın

const departmentApiInstance = axios.create({
  baseURL: `${API_URL}/departments`,
});
departmentApiInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenService.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
export const getAllDepartments = async (): Promise<Department[]> => {
  try {
    const response = await departmentApiInstance.get<{ success: boolean, data: Department[] }>('/'); // Backend'in { success, data } döndürdüğünü varsayıyoruz
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
       return response.data.data;
    } else {
      console.error('Beklenmedik departman verisi formatı:', response.data);
      return []; // Hata durumunda boş dizi dön
    }
  } catch (error: any) {
    console.error('Departmanlar getirilirken hata:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Departmanlar getirilirken bilinmeyen bir hata oluştu.';
    throw new Error(errorMessage);
  }
};

export default departmentApiInstance;
