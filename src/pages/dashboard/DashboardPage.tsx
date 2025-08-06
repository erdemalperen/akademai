import { useEffect, useState } from "react";

const DashboardPage = () => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName] = useState("Kullanıcı");

  useEffect(() => {
    const role = localStorage.getItem("user_role");
    setUserRole(role);
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Hoş Geldiniz, {userName}!
        </h1>
        
        <p className="text-gray-600 dark:text-gray-300">
          {userRole === 'EMPLOYEE' && 'Çalışan paneline hoş geldiniz. Buradan eğitimlerinizi takip edebilirsiniz.'}
          {userRole === 'ADMIN_JUNIOR' && 'Ara yönetici paneline hoş geldiniz. Buradan çalışanları ve eğitimleri yönetebilirsiniz.'}
          {userRole === 'ADMIN_SENIOR' && 'Ana yönetici paneline hoş geldiniz. Buradan tüm sistemi yönetebilirsiniz.'}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Aktif Eğitimler
          </h2>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">0</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Tamamlanan Eğitimler
          </h2>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">0</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Yaklaşan Eğitimler
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Yaklaşan eğitim bulunmuyor
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
