import React, { createContext, useContext, useState, useEffect } from 'react';

interface NavigationContextType {
  currentRoute: string;
  navigate: (route: string) => void;
  goBack: () => void;
  history: string[];
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

interface NavigationProviderProps {
  children: React.ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const [currentRoute, setCurrentRoute] = useState('/dashboard');
  const [history, setHistory] = useState<string[]>(['/dashboard']);

  
  useEffect(() => {
    let title = 'Akademai';
    
    switch (currentRoute) {
      case '/dashboard':
        title = 'Gösterge Paneli | Akademai';
        break;
      case '/trainings':
        title = 'Eğitimler | Akademai';
        break;
      case '/calendar':
        title = 'Takvim | Akademai';
        break;
      case '/profile':
        title = 'Profil | Akademai';
        break;
      case '/admin':
        title = 'Yönetim | Akademai';
        break;
      
    }
    
    document.title = title;
  }, [currentRoute]);

  const navigate = (route: string) => {
    setCurrentRoute(route);
    setHistory(prev => [...prev, route]);
  };

  const goBack = () => {
    if (history.length > 1) {
      const newHistory = [...history];
      newHistory.pop(); 
      const previousRoute = newHistory[newHistory.length - 1];
      setCurrentRoute(previousRoute);
      setHistory(newHistory);
    }
  };

  return (
    <NavigationContext.Provider value={{ currentRoute, navigate, goBack, history }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigate = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigate must be used within a NavigationProvider');
  }
  return context.navigate;
};

export const useGoBack = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useGoBack must be used within a NavigationProvider');
  }
  return context.goBack;
};

export const useCurrentRoute = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useCurrentRoute must be used within a NavigationProvider');
  }
  return context.currentRoute;
};

export const useNavigationHistory = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigationHistory must be used within a NavigationProvider');
  }
  return context.history;
};