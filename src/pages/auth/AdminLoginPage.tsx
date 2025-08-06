import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi, tokenService } from "../../lib/api/apiClient";


const AdminLoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [adminType, setAdminType] = useState<"senior" | "junior">("junior");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState(false);
  
  
  useEffect(() => {
    const loggedIn = tokenService.isLoggedIn();
    const user = tokenService.getUser();
    console.log('[AdminLoginPage useEffect] Check:', { loggedIn, user });

    if (loggedIn) {
      console.log('[AdminLoginPage useEffect] User is logged in. Checking role...');
      if (user && (user.role === "ADMIN_SENIOR" || user.role === "ADMIN_JUNIOR")) {
        console.log('[AdminLoginPage useEffect] User is admin. Attempting redirect (currently commented out).');
        
      } else {
        console.log('[AdminLoginPage useEffect] User is logged in but not an admin.');
        
        
      }
    } else {
      console.log('[AdminLoginPage useEffect] User is not logged in.');
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setLoginSuccess(false);
    
    try {
      
      if (!username || !password) {
        setError("Kullanıcı adı ve şifre gereklidir");
        return;
      }
      
      console.log("Admin girişi deneniyor:", username);
      const response = await authApi.loginAdmin(username, password);
      
      console.log("API yanıtı:", response);
      
      
      if (!response) {
        throw new Error("Sunucudan geçersiz yanıt alındı");
      }
      
      
      if ((response.success === true && response.data) || (response.token)) {
        let userData, userToken;
        
        if (response.data && response.data.token) {
          userData = response.data.user;
          userToken = response.data.token;
        } else if (response.token) {
          userData = response.user;
          userToken = response.token;
        }
        
        
        if (!userData || !userToken) {
          throw new Error("Eksik oturum bilgisi alındı");
        }
        
        
        if (!userData.role) {
          throw new Error("Kullanıcı rolü tanımlı değil");
        }
        
        if (userData.role !== "ADMIN_SENIOR" && userData.role !== "ADMIN_JUNIOR") {
          throw new Error("Yetkisiz erişim girişimi. Sadece yöneticiler giriş yapabilir.");
        }

        console.log("Giriş başarılı, kullanıcı verileri:", userData);
        
        try {
          
          tokenService.setToken(userToken);
          tokenService.setUser({
            id: userData.id,
            email: userData.email || username,
            firstName: userData.firstName || "",
            lastName: userData.lastName || "", 
            role: userData.role,
            loginType: userData.loginType || "USERNAME_PASSWORD"
          });
          
          setLoginSuccess(true);
          navigate("/dashboard");
          return;
        } catch (storageError) {
          console.error("Oturum bilgileri kaydedilemedi:", storageError);
          throw new Error("Oturum bilgileri kaydedilemedi");
        }
      } else if (response.success === false) {
        
        throw new Error(response.message || "Giriş yapılamadı");
      }
      
      throw new Error("Beklenmeyen API yanıt formatı");
    } catch (err) {
      console.error("Yönetici giriş hatası:", err);
      setError(err instanceof Error ? err.message : "Giriş sırasında bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {loginSuccess ? (
        <div className="p-4 bg-green-100 text-green-700 rounded-md flex items-center justify-center flex-col">
          <p className="font-semibold mb-2">Giriş başarılı!</p>
          <p>Yönetici paneline yönlendiriliyorsunuz...</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md"
          >
            Yönetici Paneline Git
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
              ← Geri
            </Link>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              Yönetici Girişi
            </h2>
          </div>
          
          <div className="flex space-x-4 mb-4">
            <button
              type="button"
              onClick={() => setAdminType("junior")}
              className={`flex-1 py-2 rounded-lg ${
                adminType === "junior"
                  ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
              }`}
            >
              Ara Yönetici
            </button>
            <button
              type="button"
              onClick={() => setAdminType("senior")}
              className={`flex-1 py-2 rounded-lg ${
                adminType === "senior"
                  ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
              }`}
            >
              Ana Yönetici
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Kullanıcı Adı
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
                placeholder="Kullanıcı adınız"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Şifre
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
                placeholder="Şifreniz"
              />
            </div>
            {error && (
              <div className="text-red-600 text-sm mb-4 p-3 bg-red-50 rounded-md border border-red-200">
                {error}
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>
          
          <div className="text-center">
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLoginPage;
