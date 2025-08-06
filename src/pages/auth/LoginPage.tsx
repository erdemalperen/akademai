import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi, tokenService } from "../../lib/api/apiClient";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Loader2, Eye, EyeOff } from "lucide-react";
import akademaiLogo from "../../assets/akademai.png";

function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.login(formData.email, formData.password);
      
      if (response.success) {
        tokenService.setToken(response.token);
        tokenService.setUser(response.user);
        localStorage.setItem('jwt_token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        localStorage.setItem('user_role', response.user.role);
        
        
        if (response.user.role === 'EMPLOYEE') {
          navigate('/trainings');
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(response.message || "Giriş başarısız");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      setError(error.response?.data?.message || "Giriş sırasında bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md max-w-md">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Giriş Yap</h2>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Akademai hesabınızla giriş yapın</p>
        </div>
        
        {error && (
          <div className="text-red-600 text-sm mb-4 p-3 bg-red-50 dark:bg-red-900 dark:text-red-200 rounded-md border border-red-200 dark:border-red-700">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              E-posta
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="ornek@akademai.com"
              className="w-full"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Şifre
            </label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Şifrenizi girin"
                className="w-full pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>
          
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md shadow-sm disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Giriş yapılıyor...
              </>
            ) : (
              'Giriş Yap'
            )}
          </Button>
        </form>
        
        <div className="mt-6 text-center text-sm">
          <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
            Hesabınız yok mu? Kayıt olun
          </Link>
        </div>
    </div>
  );
}

export default LoginPage;
