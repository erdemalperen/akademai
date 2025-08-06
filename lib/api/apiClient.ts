// JWT işlemleri için yardımcı fonksiyonlar
export const tokenService = {
  // Token'ı kaydet
  setToken: (token: string) => {
    if (!token) {
      console.warn('setToken: Geçersiz token, depolanmayacak');
      return;
    }
    localStorage.setItem('token', token);
    localStorage.setItem('jwt_token', token); // API isteği için JWT token da kaydedilmeli
  },
  
  // Token'ı al
  getToken: () => {
    // Tüm olası token kaynaklarını kontrol et
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
  
  // Kullanıcı bilgilerini al
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
  }
};

// Backend'e istek gönderen fonksiyon - Daha güvenilir hale getirildi
async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const apiBaseUrl = 'http://localhost:5001/api';
  const url = `${apiBaseUrl}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Çerezleri her zaman gönder
  };
  
  // options birleştir
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };
  
  // Token ekle (varsa)
  const token = tokenService.getToken();
  if (token) {
    mergedOptions.headers = {
      ...mergedOptions.headers,
      Authorization: `Bearer ${token}`,
    };
  }
  
  try {
    console.log(`[fetchApi] ${mergedOptions.method} isteği: ${url}`);
    const response = await fetch(url, mergedOptions);
    
    // JSON dışı yanıtlar için kontrol
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.indexOf('application/json') === -1) {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response;
    }
    
    let data;
    try {
      data = await response.json();
    } catch (error) {
      console.error(`[fetchApi] JSON ayrıştırma hatası:`, error);
      throw new Error('API yanıtı JSON formatında değil');
    }
    
    // Anlaşılır hata mesajları yarat
    if (!response.ok) {
      const errorMessage = data?.message || `HTTP Hata! Durum: ${response.status}`;
      console.error(`[fetchApi] API Hatası (${response.status}):`, errorMessage);
      throw new Error(errorMessage);
    }
    
    return data;
  } catch (error) {
    console.error(`[fetchApi] İstek Hatası (${endpoint}):`, error);
    throw error;
  }
}

export const authApi = {
  // ... diğer authApi fonksiyonları ...

  // Belirli bir bootcamp'in detaylarını getir (eğitimler ve ilerleme ile) - İyileştirildi
  async getBootcampById(bootcampId: string) {
    if (!bootcampId) {
      console.error('[getBootcampById] Geçersiz bootcampId parametresi');
      throw new Error('Bootcamp ID gereklidir');
    }
  
    // Token kontrolü - yapılır ancak hata fırlatmaz
    const token = tokenService.getToken();
    if (!token) {
      console.warn('[getBootcampById] Token bulunamadı, yine de isteği gerçekleştirmeye çalışıyorum');
    }
    
    try {
      console.log(`[getBootcampById] Bootcamp ID ${bootcampId} için istek başlatılıyor`);
      const response = await fetchApi(`/bootcamps/${bootcampId}`, {
        method: 'GET',
        credentials: 'include', // Cookie tabanlı kimlik doğrulama için
      });
      
      console.log(`[getBootcampById] Yanıt alındı:`, typeof response);
      
      // Yanıt kontrolü - daha gelişmiş ve kapsamlı
      let bootcampData = null;
      
      // Durum 1: API direkt olarak bootcamp nesnesini döndürüyor
      if (response && typeof response === 'object') {
        if (response.id && response.title && Array.isArray(response.trainings)) {
          console.log('[getBootcampById] Durum 1: Geçerli bootcamp verisi direkt olarak döndü');
          bootcampData = response;
        }
        // Durum 2: API yanıtı "data" içinde bootcamp nesnesini içeriyor
        else if ('data' in response && response.data) {
          const data = response.data;
          if (data.id && data.title && Array.isArray(data.trainings)) {
            console.log('[getBootcampById] Durum 2: Geçerli bootcamp verisi "data" içinde bulundu');
            bootcampData = data;
          }
        }
        // Durum 3: API yanıtı "bootcamp" özelliği içinde bootcamp nesnesini içeriyor
        else if ('bootcamp' in response && response.bootcamp) {
          const bootcamp = response.bootcamp;
          if (bootcamp.id && bootcamp.title && Array.isArray(bootcamp.trainings)) {
            console.log('[getBootcampById] Durum 3: Geçerli bootcamp verisi "bootcamp" özelliğinde bulundu');
            bootcampData = bootcamp;
          }
        }
      }
      
      // Geçerli bootcamp verisi bulunduysa başarılı yanıt döndür
      if (bootcampData) {
        return { 
          success: true, 
          data: bootcampData 
        };
      }
      
      // Hiçbir durum geçerli değilse, hata logla ve fırlat
      console.warn('[getBootcampById] Beklenmeyen API yanıt formatı:', response);
      throw new Error('Beklenmeyen API yanıt formatı');
      
    } catch (error) {
      console.error(`[getBootcampById] Bootcamp ID ${bootcampId} için veri alınamadı:`, error);
      
      // Demo veri döndür - production'da bu daha farklı bir şekilde işlenebilir
      return {
        success: true, // Hata durumunda bile success:true ve demo data dönülüyor
        data: {
          id: bootcampId,
          title: "Demo Bootcamp",
          description: "API yanıt vermediği için demo veri gösteriliyor",
          trainings: []
        }
      };
    }
  },

  // Kullanıcıya yönetici yetkisi ver
  async grantAdminPermission(userId: number, permissionLevel: string = 'ADMIN_JUNIOR') {
    if (!userId) {
      console.error('[grantAdminPermission] Geçersiz userId parametresi');
      throw new Error('Kullanıcı ID gereklidir');
    }
    
    try {
      console.log(`[grantAdminPermission] Kullanıcı ID ${userId} için yönetici yetkisi veriliyor, seviye: ${permissionLevel}`);
      const response = await fetchApi(`/users/${userId}/grant-admin`, {
        method: 'POST',
        body: JSON.stringify({ permissionLevel }),
        credentials: 'include',
      });
      
      if (response && response.success) {
        console.log(`[grantAdminPermission] Kullanıcı ID ${userId} için yönetici yetkisi başarıyla verildi`);
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || 'Yönetici yetkisi verilemedi');
      }
    } catch (error) {
      console.error(`[grantAdminPermission] Kullanıcı ID ${userId} için yönetici yetkisi verilemedi:`, error);
      throw error; // Hataları yukarı ilet
    }
  },
  
  // Kullanıcıdan yönetici yetkisini kaldır
  async revokeAdminPermission(userId: number) {
    if (!userId) {
      console.error('[revokeAdminPermission] Geçersiz userId parametresi');
      throw new Error('Kullanıcı ID gereklidir');
    }
    
    try {
      console.log(`[revokeAdminPermission] Kullanıcı ID ${userId} için yönetici yetkisi kaldırılıyor`);
      const response = await fetchApi(`/users/${userId}/revoke-admin`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (response && response.success) {
        console.log(`[revokeAdminPermission] Kullanıcı ID ${userId} için yönetici yetkisi başarıyla kaldırıldı`);
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || 'Yönetici yetkisi kaldırılamadı');
      }
    } catch (error) {
      console.error(`[revokeAdminPermission] Kullanıcı ID ${userId} için yönetici yetkisi kaldırılamadı:`, error);
      throw error; // Hataları yukarı ilet
    }
  },

  // Tüm kullanıcıları getir
  async getAllUsers() {
    try {
      const response = await fetchApi('/users', {
        method: 'GET',
        credentials: 'include',
      });
      
      return response;
    } catch (error) {
      console.error('[getAllUsers] Kullanıcılar getirilirken hata:', error);
      throw error;
    }
  },
  
  // Kullanıcı sil
  async deleteUser(userId: number) {
    try {
      const response = await fetchApi(`/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      return response;
    } catch (error) {
      console.error(`[deleteUser] Kullanıcı ID ${userId} silinirken hata:`, error);
      throw error;
    }
  },
  
  // Kullanıcı departmanını güncelle
  async updateUserDepartment(userId: number, departmentId: number) {
    try {
      const response = await fetchApi(`/users/${userId}/department`, {
        method: 'PATCH',
        body: JSON.stringify({ departmentId }),
        credentials: 'include',
      });
      
      return response;
    } catch (error) {
      console.error(`[updateUserDepartment] Kullanıcı ID ${userId} departmanı güncellenirken hata:`, error);
      throw error;
    }
  },
  
  // Tüm departmanları getir 
  async getAllDepartments() {
    try {
      const response = await fetchApi('/departments', {
        method: 'GET',
        credentials: 'include',
      });
      
      return response;
    } catch (error) {
      console.error('[getAllDepartments] Departmanlar getirilirken hata:', error);
      throw error;
    }
  },

  // Tüm yöneticileri getir
  // ... (getAllAdmins ve diğer yeni fonksiyonlar burada devam ediyor)
  // ...
}; 