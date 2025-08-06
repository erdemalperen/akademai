
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';


export const tokenService = {
  
  setToken: (token: string) => {
    if (!token) {
      console.warn('setToken: Geçersiz token, depolanmayacak');
      return;
    }
    localStorage.setItem('token', token);
    localStorage.setItem('jwt_token', token); 
  },
  
  
  getToken: () => {
    
    const token = localStorage.getItem('token') || 
                  localStorage.getItem('jwt_token') || 
                  localStorage.getItem('auth_token') || null;
    
    if (!token) {
      console.warn('[tokenService.getToken] Token bulunamadı!');
      
      
      return null;
    } else {
      console.log('[tokenService.getToken] Token bulundu:', token.substring(0, 10) + '...');
    }
    
    return token;
  },
  
  
  setUser: (user: any) => {
    if (!user || typeof user !== 'object') {
      console.warn('setUser: Geçersiz kullanıcı verisi, depolanmayacak');
      return;
    }
    
    try {
      localStorage.setItem('user', JSON.stringify(user));
      
      
      if (user.role) {
        console.log('Kullanıcı rolü kaydediliyor:', user.role);
        localStorage.setItem('user_role', user.role);
      }
    } catch (error) {
      console.error('Kullanıcı verisi depolanırken hata oluştu:', error);
    }
  },
  
  
  getUser: () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return null;
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Kullanıcı verisi alınırken hata oluştu:', error);
      
      localStorage.removeItem('user');
      return null;
    }
  },
  
  
  isLoggedIn: () => {
    
    
    
    
    const token = localStorage.getItem('token') || localStorage.getItem('jwt_token');
    const user = localStorage.getItem('user');
    
    
    if (token && user) {
      console.log('[tokenService.isLoggedIn] Token and user found in localStorage');
      return true;
    }
    
    
    
    
    
    
    
    console.log('[tokenService.isLoggedIn] Token not found in localStorage, assuming cookie-based auth');
    return true;
  },
  
  
  logout: async () => {
    console.log('[tokenService.logout] Logout initiated.');
    try {
      
      
      const token = localStorage.getItem('jwt_token');
      if (token) {
        console.log('[tokenService.logout] Attempting API logout call.');
        await fetchApi('/users/logout', {
          method: 'POST'
        }).catch(err => {
          console.warn('[tokenService.logout] API logout call failed:', err);
          
        });
      } else {
        console.log('[tokenService.logout] No token found, skipping API logout call.');
      }
    } catch (error) {
      console.warn('[tokenService.logout] Error during API logout attempt:', error);
    } finally {
      console.log('[tokenService.logout] Entering finally block. Clearing local storage.');
      
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('user');
      localStorage.removeItem('user_role');
      localStorage.removeItem('token'); 
      localStorage.removeItem('auth_token');
      
      
      console.log('[tokenService.logout] Clearing session storage.');
      sessionStorage.clear();
      console.log('[tokenService.logout] Local and session storage cleared.');
    }
    
    return { success: true };
  },
  
  
  clearSession: () => {
    
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user');
    localStorage.removeItem('user_role');
    localStorage.removeItem('token');
    localStorage.removeItem('auth_token');
    
    
    sessionStorage.clear();
  }
};


async function fetchApi(endpoint: string, options: RequestInit = {}) {
  
  const defaultOptions: RequestInit = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', 
  };

  
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  
  const token = tokenService.getToken();
  if (token) {
    mergedOptions.headers = {
      ...mergedOptions.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const url = `${apiBaseUrl}${endpoint}`;

  try {
    const response = await fetch(url, mergedOptions);
    
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.indexOf('application/json') === -1) {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response;
    }

    const data = await response.json();
    
    
    if (!response.ok && response.status === 401) {
      
      console.log('401 Yetkisiz erişim hatası, oturum kapatılıyor...');
      
      
      tokenService.clearSession();
      
      
      window.location.href = '/login';
      
      throw new Error('Oturum süreniz doldu veya giriş yapmadınız.');
    }
    
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP Hata! Durum: ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error(`API İsteği Hatası (${endpoint}):`, error);
    throw error;
  }
}


export const authApi = {
  
  makeApiCall: async (endpoint: string, options: RequestInit = {}) => {
    return fetchApi(endpoint, options);
  },
  
  
  getAllUsers: async () => {
    
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      throw new Error('Oturum açık değil, lütfen giriş yapın');
    }
    
    return fetchApi('/users', {
      method: 'GET',
      credentials: 'include',
    });
  },

  
  async deleteUser(userId: number) {
    return fetchApi(`/users/${userId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
  },

  
  async updateUserDepartment(userId: number, departmentId: number) {
    return fetchApi(`/users/${userId}/department`, {
      method: 'PATCH',
      credentials: 'include',
      body: JSON.stringify({ departmentId }),
    });
  },

  
  register: async (userData: any) => {
    console.log('Kullanıcı kaydı yapılıyor:', userData);
    return fetchApi('/users/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  
  login: async (email: string, password: string) => {
    return fetchApi('/users/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  
  loginAdmin: async (username: string, password: string) => {
    return fetchApi('/users/login/admin', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  },

  
  getProfile: async () => {
    return fetchApi('/users/profile');
  },

  
  logout: async () => {
    console.log('[tokenService.logout] Logout initiated.');
    try {
      
      console.log('[tokenService.logout] Attempting API logout call.');
      try {
        await fetchApi('/users/logout', {
          method: 'POST',
          credentials: 'include', 
        });
        console.log('[tokenService.logout] API logout successful, cookies cleared');
      } catch (err) {
        console.warn('[tokenService.logout] API logout call failed:', err);
        
      }
    } catch (error) {
      console.warn('[tokenService.logout] Error during API logout attempt:', error);
    } finally {
      console.log('[tokenService.logout] Clearing local storage.');
      
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('user');
      localStorage.removeItem('user_role');
      localStorage.removeItem('token');
      localStorage.removeItem('auth_token');
      
      
      console.log('[tokenService.logout] Clearing session storage.');
      sessionStorage.clear();
      console.log('[tokenService.logout] Local and session storage cleared.');
    }
    
    return { success: true };
  },
  
  
  getAllDepartments: async () => {
    
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      throw new Error('Oturum açık değil, lütfen giriş yapın');
    }
    
    return fetchApi('/departments');
  },
  
  getDepartment: async (id: number) => {
    
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      throw new Error('Oturum açık değil, lütfen giriş yapın');
    }
    
    return fetchApi(`/departments/${id}`);
  },
  
  createDepartment: async (departmentData: { name: string }) => {
    
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      throw new Error('Oturum açık değil, lütfen giriş yapın');
    }
    
    return fetchApi('/departments', {
      method: 'POST',
      body: JSON.stringify(departmentData)
    });
  },
  
  updateDepartment: async (id: number, departmentData: { name: string }) => {
    
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      throw new Error('Oturum açık değil, lütfen giriş yapın');
    }
    
    return fetchApi(`/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(departmentData)
    });
  },
  
  deleteDepartment: async (id: number) => {
    
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      throw new Error('Oturum açık değil, lütfen giriş yapın');
    }
    
    return fetchApi(`/departments/${id}`, {
      method: 'DELETE'
    });
  },
  
  
  getAssignedBootcamps: async () => {
    
    const token = tokenService.getToken();
    if (!token) {
      console.warn('[getAssignedBootcamps] Token bulunamadı, yine de isteği gerçekleştirmeye çalışıyorum');
    }
    
    return fetchApi('/users/me/bootcamps', {
      method: 'GET',
      credentials: 'include',
    });
  },
  
  
  async getBootcampById(bootcampId: string) {
    
    const token = tokenService.getToken();
    if (!token) {
      console.warn('[getBootcampById] Token bulunamadı, yine de isteği gerçekleştirmeye çalışıyorum');
    }
    
    try {
      console.log(`[getBootcampById] Bootcamp ID ${bootcampId} için istek başlatılıyor`);
      const response = await fetchApi(`/bootcamps/${bootcampId}`, {
        method: 'GET',
        credentials: 'include', 
      });
      
      console.log(`[getBootcampById] Yanıt alındı:`, {
        responseType: typeof response,
        isObject: response !== null && typeof response === 'object',
        hasData: response && 'data' in response,
        keys: response ? Object.keys(response) : []
      });
      
      if (response && typeof response === 'object') {
        const isValidBootcamp = response.id && response.title && Array.isArray(response.trainings);
        if (isValidBootcamp) {
          console.log('[getBootcampById] Geçerli bootcamp verisi bulundu');
          return { success: true, data: response };
        }
        if ('data' in response && response.data) {
          const data = response.data;
          const isValidNestedBootcamp = data.id && data.title && Array.isArray(data.trainings);
          if (isValidNestedBootcamp) {
            console.log('[getBootcampById] Geçerli bootcamp verisi "data" içinde bulundu');
            return { success: true, data: data };
          }
        }
      }
      
      console.warn('[getBootcampById] Beklenmeyen API yanıt formatı:', response);
      throw new Error('Beklenmeyen API yanıt formatı');
      
    } catch (error) {
      console.error(`[getBootcampById] Bootcamp ID ${bootcampId} için veri alınamadı:`, error);
      return {
        success: true, 
        data: {
          id: bootcampId,
          title: "Demo Bootcamp",
          description: "API yanıt vermediği için demo veri gösteriliyor",
          trainings: []
        }
      };
    }
  },

  
  getAllAdmins: async () => {
    const token = tokenService.getToken();
    if (!token) {
      
      
      
      console.warn('[authApi.getAllAdmins] Token bulunamadı. İstek yine de gönderiliyor...');
    }
    
    return fetchApi('/users/admins', {
      method: 'GET',
      credentials: 'include', 
    });
  },

  
  grantAdminPermission: async (userId: number, permissionData: { permissionLevel: string }) => {
    const token = tokenService.getToken();
    
    if (!token) {
      throw new Error('Bu işlem için oturum açmış olmanız gerekmektedir.');
    }
    
    return fetchApi(`/users/${userId}/grant-admin`, {
      method: 'POST',
      body: JSON.stringify(permissionData),
      credentials: 'include',
    });
  },

  
  revokeAdminPermission: async (userId: number) => {
    const token = tokenService.getToken();
    if (!token) {
      throw new Error('Bu işlem için oturum açmış olmanız gerekmektedir.');
    }
    
    return fetchApi(`/users/${userId}/revoke-admin`, {
      method: 'POST',
      credentials: 'include',
    });
  },

  
  
  
  getAIRecommendation: async (message: string) => {
    return fetchApi('/ai-assistant/recommendation', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },

  
  getQuickReplies: async () => {
    return fetchApi('/ai-assistant/quick-replies');
  },

  
  getAvailableTrainings: async () => {
    return fetchApi('/ai-assistant/trainings');
  },
};
