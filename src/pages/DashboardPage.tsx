import React, { useEffect, useState } from 'react';
import DashboardStats from '../components/dashboard/DashboardStats';

const DashboardPage: React.FC = () => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [welcomeTitle, setWelcomeTitle] = useState("Hoş Geldiniz");
  const [welcomeDescription, setWelcomeDescription] = useState("Eğitim platformuna hoş geldiniz.");

  useEffect(() => {
    
    const storedRole = localStorage.getItem('user_role');
    setUserRole(storedRole);

    if (storedRole === 'ADMIN_SENIOR') {
      setWelcomeTitle("Hoş Geldiniz, Ana Yönetici");
      setWelcomeDescription("Platformun genel durumunu ve tüm aktiviteleri buradan yönetebilirsiniz.");
    } else if (storedRole === 'ADMIN_JUNIOR') {
      setWelcomeTitle("Hoş Geldiniz, Ara Yönetici");
      setWelcomeDescription("Size atanmış eğitimleri ve kullanıcı aktivitelerini buradan takip edebilirsiniz.");
    } else if (storedRole === 'EMPLOYEE') {
      setWelcomeTitle("Hoş Geldiniz");
      setWelcomeDescription("Size atanmış eğitimleri ve yaklaşan etkinlikleri buradan görebilirsiniz.");
    } else {
      
      setWelcomeTitle("Hoş Geldiniz");
      setWelcomeDescription("Eğitim platformuna hoş geldiniz.");
    }
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">{welcomeTitle}</h1>
        <p className="text-muted-foreground">
          {welcomeDescription}
        </p>
      </div>
      
      {}
      {(userRole === 'ADMIN_SENIOR' || userRole === 'ADMIN_JUNIOR') && <DashboardStats />}
      
      

    </div>
  );
};

export default DashboardPage;