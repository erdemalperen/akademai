import axios from 'axios';
import { tokenService } from '../lib/api/apiClient';
import { Bootcamp, BootcampParticipant } from '../types';

const API_URL = import.meta.env.VITE_REACT_APP_API_URL || 'http://localhost:5001/api';

const getAuthToken = (): string | null => {
  let token: string | null = tokenService.getToken();

  if (token) {
    console.log(`[BootcampAPI - getAuthToken] Token found via tokenService.getToken(). Snippet: ${token.substring(0, 5)}...`);
    return token;
  }

  console.log('[BootcampAPI - getAuthToken] Token not found via tokenService, trying direct keys.');
  const keysToTry = ['jwt_token', 'token', 'auth_token'];
  let foundKey: string | null = null;

  for (const key of keysToTry) {
    const item = localStorage.getItem(key);
    if (item) {
      token = item;
      foundKey = key;
      break;
    }
  }

  if (token && foundKey) {
    console.log(`[BootcampAPI - getAuthToken] Token found in localStorage with key: '${foundKey}'. Snippet: ${token.substring(0, 5)}...`);
  } else {
    console.warn('[BootcampAPI - getAuthToken] Token could not be found by any method (including tokenService and direct keys).');
  }
  return token;
};

const createAxiosInstance = () => {
  const instance = axios.create({
    baseURL: `${API_URL}/bootcamps`,
    headers: {
      'Content-Type': 'application/json',
    }
  });
  
  const token = getAuthToken();
  if (token) {
    instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.log(`[BootcampAPI - createAxiosInstance] Authorization header set with token: Bearer ${token.substring(0,5)}...`);
  } else {
    console.warn('[BootcampAPI - createAxiosInstance] No token found. Request will be unauthenticated.');
  }
  
  return instance;
};

export const getAllBootcamps = async (category?: string): Promise<Bootcamp[]> => {
  try {
    let url = '/';
    if (category) {
      url += `?category=${encodeURIComponent(category)}`;
    }
    const instance = createAxiosInstance();
    const response = await instance.get<Bootcamp[]>(url);
    return response.data;
  } catch (error) {
    console.error('Bootcampler getirilirken hata:', error);
    throw error;
  }
};

export const getBootcampById = async (id: string): Promise<Bootcamp> => {
  const functionName = '[BootcampAPI - getBootcampById]';
  try {
    console.log(`${functionName} Fetching bootcamp with ID: ${id}`);
    const instance = createAxiosInstance(); // createAxiosInstance kullan

    if (!instance.defaults.headers.common['Authorization']) {
      console.error(`${functionName} No token available after createAxiosInstance. Cannot make authenticated request for bootcamp ID: ${id}.`);
      throw new Error('Authentication token not found or instance not configured correctly.');
    }
    
    const tokenUsed = instance.defaults.headers.common['Authorization'] as string;
    const tokenSnippet = `${tokenUsed.substring(0, 12)}...${tokenUsed.substring(tokenUsed.length - 5)}`;
    console.log(`${functionName} Using token from instance: ${tokenSnippet} for bootcamp ID: ${id}`);

    const response = await instance.get<Bootcamp>(`/${id}`);
    
    console.log(`${functionName} Successfully fetched bootcamp ID: ${id}. Status: ${response.status}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`${functionName} Axios error fetching bootcamp ID ${id}: ${error.message}`);
      if (error.response) {
        console.error(`${functionName} Error response status: ${error.response.status}`);
        console.error(`${functionName} Error response data:`, JSON.stringify(error.response.data, null, 2));
      } else if (error.request) {
        console.error(`${functionName} Error request data (no response received):`, error.request);
      }
    } else {
      console.error(`${functionName} Generic error fetching bootcamp ID ${id}:`, error);
    }
    throw error; 
  }
};

export const getBootcampParticipants = async (bootcampId: string): Promise<BootcampParticipant[]> => {
  const functionName = '[BootcampAPI - getBootcampParticipants]';
  try {
    console.log(`${functionName} Fetching participants for bootcamp ID: ${bootcampId}`);
    const instance = createAxiosInstance();
    const response = await instance.get<BootcampParticipant[]>(`/${bootcampId}/participants`);
    console.log(`${functionName} Successfully fetched participants for bootcamp ID: ${bootcampId}. Count: ${response.data.length}`);
    return response.data;
  } catch (error) {
    console.error(`${functionName} Error fetching participants for bootcamp ID ${bootcampId}:`, error);
    throw error;
  }
};

export const createBootcamp = async (bootcampData: Omit<Bootcamp, 'id' | 'createdAt' | 'updatedAt'>): Promise<Bootcamp> => {
  try {
    const instance = createAxiosInstance();
    const response = await instance.post<Bootcamp>('/', bootcampData);
    return response.data;
  } catch (error) {
    console.error('Bootcamp oluşturulurken hata:', error);
    throw error;
  }
};

export const updateBootcamp = async (id: string, bootcampData: Partial<Omit<Bootcamp, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Bootcamp> => {
  try {
    const instance = createAxiosInstance();
    const response = await instance.put<Bootcamp>(`/${id}`, bootcampData);
    return response.data;
  } catch (error) {
    console.error(`Bootcamp (ID: ${id}) güncellenirken hata:`, error);
    throw error;
  }
};

export const deleteBootcamp = async (id: string): Promise<void> => {
  try {
    const instance = createAxiosInstance();
    await instance.delete(`/${id}`);
  } catch (error) {
    console.error(`Bootcamp (ID: ${id}) silinirken hata:`, error);
    throw error;
  }
};

export const assignBootcampToUser = async (bootcampId: string, userId: number): Promise<any> => {
  try {
    const instance = createAxiosInstance();
    const response = await instance.post(
      `/${bootcampId}/participants`,
      { userId }
    );
    return response.data;
  } catch (error) {
    console.error(`Kullanıcı (ID: ${userId}) bootcamp'e (ID: ${bootcampId}) atanırken hata:`, error);
    throw error;
  }
};

export const removeUserFromBootcamp = async (bootcampId: string, userId: number): Promise<void> => {
  try {
    const instance = createAxiosInstance();
    await instance.delete(
      `/${bootcampId}/participants/${userId}`
    );
  } catch (error) {
    console.error(`Kullanıcı (ID: ${userId}) bootcamp'ten (ID: ${bootcampId}) çıkarılırken hata:`, error);
    throw error;
  }
};

export const getUserBootcamps = async (): Promise<Bootcamp[]> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
    }
    
    const response = await axios.get(`${API_URL}/users/me/bootcamps`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Kullanıcının bootcampleri getirilirken hata:', error);
    throw error;
  }
};

export const addTrainingToBootcamp = async (bootcampId: string, trainingId: string, orderIndex: number = 0): Promise<any> => {
  try {
    const instance = createAxiosInstance();
    const response = await instance.post(`/${bootcampId}/trainings`, {
      trainingId,
      orderIndex
    });
    return response.data;
  } catch (error) {
    console.error(`Eğitim (ID: ${trainingId}) bootcamp'e (ID: ${bootcampId}) eklenirken hata:`, error);
    throw error;
  }
};

export const removeTrainingFromBootcamp = async (bootcampId: string, trainingId: string): Promise<void> => {
  try {
    const instance = createAxiosInstance();
    await instance.delete(`/${bootcampId}/trainings/${trainingId}`);
  } catch (error) {
    console.error(`Eğitim (ID: ${trainingId}) bootcamp'ten (ID: ${bootcampId}) kaldırılırken hata:`, error);
    throw error;
  }
};
