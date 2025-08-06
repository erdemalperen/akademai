import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";


const AdminRegisterPage = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [adminType, setAdminType] = useState<"senior" | "junior">("junior");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    
    if (password !== confirmPassword) {
      alert("Şifreler eşleşmiyor!");
      return;
    }
    
    
    
    console.log("Yönetici kaydı yapılıyor:", { firstName, lastName, email, password, adminType });
    
    
    navigate("/login/admin");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Link to="/register" className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm">
          ← Geri
        </Link>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
          Yönetici Kaydı
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
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Ad
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Soyad
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            E-posta
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
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
          />
        </div>
        
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Şifre Tekrar
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <button
          type="submit"
          className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
        >
          Kayıt Ol
        </button>
      </form>
      
      <div className="text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Zaten hesabınız var mı?{" "}
          <Link to="/login/admin" className="text-indigo-600 dark:text-indigo-400 hover:underline">
            Giriş Yap
          </Link>
        </p>
      </div>
    </div>
  );
};

export default AdminRegisterPage;
