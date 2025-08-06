import axios from 'axios';
import { authApi } from '../lib/api/apiClient';


export const getMonthlyCompletedTrainingsCount = async () => {
  try {
    console.log('[statisticsApiService] Aylık tamamlanan eğitim sayısı alınıyor');
    const response = await authApi.makeApiCall('/statistics/monthly-completed-trainings');
    return response;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('[statisticsApiService] Aylık tamamlanan eğitim sayısı alınırken hata:', error.message);
    } else {
      console.error('[statisticsApiService] Aylık tamamlanan eğitim sayısı alınırken bilinmeyen hata:', error);
    }
    throw new Error('Aylık tamamlanan eğitim sayısı alınamadı');
  }
};

export const getAllCompletedTrainings = async () => {
  try {
    console.log('[statisticsApiService] Tüm tamamlanan eğitimler alınıyor');
    const response = await authApi.makeApiCall('/statistics/all-completed-trainings');
    return response;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('[statisticsApiService] Tüm tamamlanan eğitimler alınırken hata:', error.message);
    } else {
      console.error('[statisticsApiService] Tüm tamamlanan eğitimler alınırken bilinmeyen hata:', error);
    }
    throw new Error('Tüm tamamlanan eğitimler alınamadı');
  }
};

export const getTopEmployeesOfMonth = async () => {
  try {
    console.log('[statisticsApiService] Ayın çalışanları alınıyor');
    const allCompletedTrainings = await getAllCompletedTrainings();
    if (!allCompletedTrainings || !allCompletedTrainings.current_month_completed) {
      return [];
    }
    
    const currentMonthTrainings = allCompletedTrainings.current_month_completed;
    
    const userCompletionCounts: Record<string, number> = {};
    const userDepartments: Record<string, string> = {};
    const userNames: Record<string, string> = {};
    
    currentMonthTrainings.forEach((training: any) => {
      const userId = training.user_id.toString();
      if (!userCompletionCounts[userId]) {
        userCompletionCounts[userId] = 0;
        userDepartments[userId] = training.department_name && training.department_name !== "null" ? training.department_name : "Departman Atanmamış";
        userNames[userId] = `${training.first_name} ${training.last_name}`;
      }
      userCompletionCounts[userId]++;
    });
    
    const sortedUsers = Object.keys(userCompletionCounts)
      .map(userId => ({
        id: userId,
        name: userNames[userId],
        departmentName: userDepartments[userId],
        completedTrainingsCount: userCompletionCounts[userId]
      }))
      .sort((a, b) => b.completedTrainingsCount - a.completedTrainingsCount);
    
    return sortedUsers.slice(0, 3);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('[statisticsApiService] Ayın çalışanları alınırken hata:', error.message);
    } else {
      console.error('[statisticsApiService] Ayın çalışanları alınırken bilinmeyen hata:', error);
    }
    return [];
  }
};

export const getCategoryStatistics = async (category: string) => {
  try {
    console.log(`[statisticsApiService] ${category} kategorisi için istatistikler alınıyor`);
    const response = await authApi.makeApiCall(`/statistics/category/${category}`);
    return response;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`[statisticsApiService] ${category} kategorisi için istatistikler alınırken hata:`, error.message);
    } else {
      console.error(`[statisticsApiService] ${category} kategorisi için istatistikler alınırken bilinmeyen hata:`, error);
    }
    throw new Error(`${category} kategorisi için istatistikler alınamadı`);
  }
};

export const getUserTrainingProgressReport = async () => {
  try {
    console.log('[statisticsApiService] Kullanıcı eğitim ilerleme raporu alınıyor');
    const response = await authApi.makeApiCall('/statistics/user-training-progress');
    return response;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('[statisticsApiService] Kullanıcı eğitim ilerleme raporu alınırken hata:', error.message);
    } else {
      console.error('[statisticsApiService] Kullanıcı eğitim ilerleme raporu alınırken bilinmeyen hata:', error);
    }
    throw new Error('Kullanıcı eğitim ilerleme raporu alınamadı');
  }
};

export const getTrainingProgressByTrainingId = async (trainingId: string) => {
  try {
    console.log(`[statisticsApiService] Eğitim bazında ilerleme raporu alınıyor: ${trainingId}`);
    const response = await authApi.makeApiCall(`/statistics/training-progress/${trainingId}`);
    return response;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('[statisticsApiService] Eğitim bazında ilerleme raporu alınırken hata:', error.message);
    } else {
      console.error('[statisticsApiService] Eğitim bazında ilerleme raporu alınırken bilinmeyen hata:', error);
    }
    throw new Error('Eğitim bazında ilerleme raporu alınamadı');
  }
};

export const getAllTrainingsProgress = async () => {
  try {
    console.log('[statisticsApiService] Tüm eğitimlerin ilerleme durumlarını alınıyor');
    const response = await authApi.makeApiCall('/statistics/trainings-progress');
    return response;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('[statisticsApiService] Tüm eğitimlerin ilerleme durumları alınırken hata:', error.message);
    } else {
      console.error('[statisticsApiService] Tüm eğitimlerin ilerleme durumları alınırken bilinmeyen hata:', error);
    }
    throw new Error('Tüm eğitimlerin ilerleme durumları alınamadı');
  }
};

export const getUserConferenceTrainings = async (userId: string) => {
  try {
    console.log(`[statisticsApiService] Kullanıcı konferans eğitimleri alınıyor, userId=${userId}`);
    const response = await authApi.makeApiCall(`/statistics/user-conference-trainings/${userId}`);
    return response;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('[statisticsApiService] Kullanıcı konferans eğitimleri alınırken hata:', error.message);
    } else {
      console.error('[statisticsApiService] Kullanıcı konferans eğitimleri alınırken bilinmeyen hata:', error);
    }
    throw new Error('Kullanıcı konferans eğitimleri alınamadı');
  }
}; 