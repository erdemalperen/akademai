import React, { useState, useEffect } from 'react';
import { Menu, LogOut, User, LogIn } from 'lucide-react';
import ThemeToggle from '../ui/ThemeToggle';
import { useNavigate } from 'react-router-dom';
import akademaiLogo from '../../assets/akademai.png';
import { Button } from '../ui/Button';
import { tokenService } from '../../lib/api/apiClient';

interface HeaderProps {
  toggleSidebar: () => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, onLogout }) => {
  const navigate = useNavigate();

  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoggedInState, setIsLoggedInState] = useState(tokenService.isLoggedIn());

  useEffect(() => {
    const checkLoginStatus = () => {
      const loggedIn = tokenService.isLoggedIn();
      setIsLoggedInState(loggedIn);
      if (loggedIn) {
        const role = localStorage.getItem('user_role');
        setUserRole(role);
      } else {
        setUserRole(null);
      }
    };

    checkLoginStatus();

    window.addEventListener('storage', checkLoginStatus);

    return () => {
      window.removeEventListener('storage', checkLoginStatus);
    };
  }, []);


  const handleLogout = () => {
    onLogout();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="relative flex h-20 items-center justify-center w-full px-8">
        <div className="flex items-center absolute left-0 top-1/2 -translate-y-1/2 w-64 pl-4">
          {isLoggedInState && (
            <button 
              className="lg:hidden block p-2 rounded-md hover:bg-muted transition-colors mr-2"
              onClick={toggleSidebar}
              aria-label="Kenar çubuğunu aç/kapat"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          <div 
            className="cursor-pointer flex items-center justify-center flex-1"
            onClick={() => navigate('/')}
          >
            <div className="bg-white dark:bg-white rounded-lg shadow-sm w-56 h-14 flex items-center justify-center">
              <img src={akademaiLogo} alt="Akademai" className="w-56 h-14 object-contain" />
            </div>
          </div>
        </div>
        
        
        <div className="flex items-center space-x-4 absolute right-0 top-1/2 -translate-y-1/2">
          <ThemeToggle />
          
          {isLoggedInState ? (
            <>
              <div className="flex items-center space-x-2">
                <div className="flex flex-col items-end">
                  <span className="text-sm font-medium truncate">
                    {tokenService.getUser()?.firstName} {tokenService.getUser()?.lastName}
                  </span>
                  {userRole && (
                    <span className="text-xs text-muted-foreground">
                      {userRole === 'EMPLOYEE' && 'Çalışan'}
                      {userRole === 'ADMIN_JUNIOR' && 'Ara Yönetici'}
                      {userRole === 'ADMIN_SENIOR' && 'Ana Yönetici'}
                    </span>
                  )}
                </div>
                <User className="w-5 h-5" />
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 rounded-md hover:bg-muted transition-colors text-red-500 hover:text-red-600 flex items-center"
                aria-label="Çıkış yap"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </>
          ) : (
            <Button onClick={() => navigate('/login')} variant="outline">
              <LogIn className="mr-2 h-4 w-4" /> Giriş Yap
            </Button>
          )}
        </div>
      </div>
      
      {}
    </header>
  );
};

export default Header;